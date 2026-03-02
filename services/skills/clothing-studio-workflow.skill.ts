import { z } from 'zod';
import { imageGenSkill } from './image-gen.skill';
import { generateJsonResponse, getBestModelId } from '../gemini';
import type { Requirements, WorkflowUiMessage, ClothingAnalysis } from '../../types/workflow.types';
import type { ImageModel } from '../../types';
import { buildRequirementsText } from '../../utils/clothing-prompt';
import { AMAZON_SHOTS } from '../../knowledge/amazonShots';
import { ensureWhiteBackground } from '../image-postprocess';
import { validateModelIdentity, validateProductConsistency } from '../validators';

const requirementsSchema = z.object({
  platform: z.string().min(1),
  description: z.string().min(1),
  targetLanguage: z.string().min(1),
  aspectRatio: z.string().min(1),
  clarity: z.literal('2K').default('2K'),
  count: z.number().int().min(1).max(10),
  templateId: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
  backgroundTags: z.array(z.string()).optional(),
  cameraTags: z.array(z.string()).optional(),
  focusTags: z.array(z.string()).optional(),
  extraText: z.string().optional(),
});

const requestSchema = z.object({
  productImages: z.array(z.string().url()).min(1).max(6),
  modelImage: z.string().url().optional(),
  modelAnchorSheetUrl: z.string().url().optional(),
  productAnchorUrl: z.string().url().optional(),
  analysis: z.any().optional(),
  requirements: requirementsSchema,
});

const toPlanItems = async (requirements: Requirements, analysis?: ClothingAnalysis | null) => {
  const count = Math.max(1, Math.min(10, requirements.count || 1));
  const pType = analysis?.productType || 'unknown';
  const shotCandidates = AMAZON_SHOTS.filter((s) => s.when.includes(pType as any) || pType === 'unknown')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, Math.max(count, 4));

  const reqText = buildRequirementsText(requirements);

  const planSchema = z.object({
    items: z.array(z.object({
      label: z.string(),
      shotKey: z.string(),
      prompt: z.string(),
      count: z.number().int().min(1).max(3).default(1),
    })).min(1),
  });

  try {
    const planResult = await generateJsonResponse({
      model: getBestModelId('text'),
      operation: 'clothingStudio.plan',
      temperature: 0.3,
      parts: [{
        text: `你是电商服装镜头规划师。请基于镜头库生成 plan。\n` +
          `productType=${analysis?.productType || 'unknown'} isSet=${analysis?.isSet ? 'yes' : 'no'}\n` +
          `shotHints=${(analysis?.shotListHints || []).join(', ')}\n` +
          `requirements:\n${reqText}\n` +
          `镜头库:\n${JSON.stringify(shotCandidates)}\n` +
          `输出 JSON: {"items":[{"label":"...","shotKey":"...","prompt":"...","count":1}]}`,
      }],
    });

    let parsedPlanJson: any = {};
    try {
      parsedPlanJson = JSON.parse(planResult.text || '{}');
    } catch {
      parsedPlanJson = {};
    }
    const parsed = planSchema.safeParse(parsedPlanJson);
    if (parsed.success) {
      const flattened: Array<{ label: string; prompt: string; shotKey: string }> = [];
      parsed.data.items.forEach((item) => {
        const c = Math.max(1, Math.min(3, item.count || 1));
        for (let i = 0; i < c; i += 1) {
          flattened.push({ label: item.label, prompt: item.prompt, shotKey: item.shotKey });
        }
      });
      return flattened.slice(0, count).map((p, idx) => ({ ...p, label: p.label || `组图 ${idx + 1}` }));
    }
  } catch {
  }

  return Array.from({ length: count }).map((_, idx) => {
    const shot = shotCandidates[idx % shotCandidates.length] || AMAZON_SHOTS[0];
    return {
      label: shot?.name || `组图 ${idx + 1}`,
      shotKey: shot?.key || 'hero_full_front',
      prompt: `${shot?.promptHint || 'full body front view'}; ${requirements.description}; ${reqText}`,
    };
  });
};

export type ClothingStudioWorkflowResult = {
  ui: WorkflowUiMessage;
  images?: Array<{ url: string; label?: string }>;
  failedItems?: Array<{ index: number; prompt: string; label?: string }>;
};

export async function clothingStudioWorkflowSkill(params: {
  productImages: string[];
  modelImage?: string;
  preferredImageModel?: ImageModel;
  modelAnchorSheetUrl?: string;
  productAnchorUrl?: string;
  analysis?: ClothingAnalysis | null;
  requirements?: Requirements;
  retryFailedItems?: Array<{ index: number; prompt: string; label?: string }>;
  onProgress?: (done: number, total: number, text?: string) => void;
  signal?: AbortSignal;
}): Promise<ClothingStudioWorkflowResult> {
  const productImages = params.productImages || [];
  if (productImages.length < 1) {
    return { ui: { type: 'clothingStudio.product', productCount: 0, max: 6 } };
  }

  if (!params.modelAnchorSheetUrl && !params.modelImage) {
    return { ui: { type: 'clothingStudio.needModel' } };
  }

  if (!params.requirements) {
    return {
      ui: {
        type: 'clothingStudio.requirementsForm',
        defaults: {
          platform: 'taobao',
          description: '标准电商棚拍风格：主体清晰、颜色准确、背景干净，突出面料与版型细节。',
          targetLanguage: 'visual-only',
          aspectRatio: '3:4',
          clarity: '2K',
          count: 1,
          templateId: 'ecom_clean',
          styleTags: [],
          backgroundTags: [],
          cameraTags: [],
          focusTags: [],
          extraText: '',
        },
      },
    };
  }

  const parsed = requestSchema.parse({
    productImages,
    modelImage: params.modelImage,
    modelAnchorSheetUrl: params.modelAnchorSheetUrl,
    productAnchorUrl: params.productAnchorUrl,
    analysis: params.analysis,
    requirements: params.requirements,
  });

  const ratio = parsed.requirements.aspectRatio || '3:4';
  const clarity: '2K' = '2K';
  const planItems = params.retryFailedItems && params.retryFailedItems.length > 0
    ? params.retryFailedItems
    : await toPlanItems(parsed.requirements as Requirements, parsed.analysis as ClothingAnalysis | null);

  const anchorPrefix = `Use reference[0] as MODEL identity anchor sheet and reference[1] as PRODUCT anchor. Keep model identity and product details consistent across all outputs.`;
  const productAnchorUrl = parsed.productAnchorUrl || parsed.productImages[0];
  const modelAnchorUrl = parsed.modelAnchorSheetUrl || parsed.modelImage || '';

  const results: Array<{ url: string; label?: string }> = [];
  const failedItems: Array<{ index: number; prompt: string; label?: string }> = [];
  const total = planItems.length;

  for (let i = 0; i < total; i += 1) {
    if (params.signal?.aborted) {
      break;
    }

    const item: any = planItems[i];
    params.onProgress?.(i, total, `正在生成第 ${i + 1}/${total} 张：${item.label || ''}`);

    try {
      let passUrl: string | null = null;
      let finalPrompt = `${anchorPrefix}\n${item.prompt}\n纯白背景 (#FFFFFF)，无道具，无场景，无纹理，无渐变背景，电商棚拍，高亮干净，边缘清晰。`;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const url = await imageGenSkill({
          prompt: finalPrompt,
          model: params.preferredImageModel || 'Nano Banana Pro',
          aspectRatio: ratio,
          imageSize: clarity,
          referenceImages: [modelAnchorUrl, productAnchorUrl, ...parsed.productImages].filter(Boolean),
        });

        if (!url) continue;

        const whiteBgUrl = await ensureWhiteBackground(url);
        const identityCheck = await validateModelIdentity(modelAnchorUrl, whiteBgUrl);
        const productCheck = await validateProductConsistency(
          productAnchorUrl,
          whiteBgUrl,
          parsed.analysis?.anchorDescription || '保持服装结构与颜色一致',
          parsed.analysis?.forbiddenChanges || ['不要改变版型和颜色'],
        );

        if (identityCheck.pass && productCheck.pass) {
          passUrl = whiteBgUrl;
          break;
        }

        const fixes = [identityCheck.suggestedFix, productCheck.suggestedFix].filter(Boolean).join('; ');
        finalPrompt = `${finalPrompt}\nFix consistency issues: ${fixes}`;
      }

      if (!passUrl) {
        failedItems.push({ index: i, prompt: item.prompt, label: item.label });
      } else {
        results.push({ url: passUrl, label: item.label });
      }
    } catch {
      failedItems.push({ index: i, prompt: item.prompt, label: item.label });
    }
  }

  params.onProgress?.(total, total, '生成完成');

  return {
    ui: { type: 'clothingStudio.results', images: results },
    images: results,
    failedItems,
  };
}
