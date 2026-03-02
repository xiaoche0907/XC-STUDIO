import { z } from 'zod';
import { imageGenSkill } from './image-gen.skill';
import type { Requirements, WorkflowUiMessage } from '../../types/workflow.types';
import { buildRequirementsText } from '../../utils/clothing-prompt';

const requirementsSchema = z.object({
  platform: z.string().min(1),
  description: z.string().min(1),
  targetLanguage: z.string().min(1),
  aspectRatio: z.string().min(1),
  clarity: z.enum(['1K', '2K', '4K']).default('2K'),
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
  modelImage: z.string().url(),
  requirements: requirementsSchema,
});

const toPlanItems = (requirements: Requirements) => {
  const count = Math.max(1, Math.min(10, requirements.count || 1));
  const labels = [
    '主图上身',
    '侧面穿着',
    '背面轮廓',
    '细节特写',
    '动态姿态',
    '场景氛围',
    '局部面料',
    '穿搭组合',
    '平台封面',
    '收尾展示',
  ];

  const reqText = buildRequirementsText(requirements);

  return Array.from({ length: count }).map((_, idx) => ({
    label: labels[idx] || `组图 ${idx + 1}`,
    prompt: `Create fashion composite image ${idx + 1}/${count} for ${requirements.platform}. ${requirements.description}. Language: ${requirements.targetLanguage}. Keep garment details accurate to product references, keep model face and body proportion coherent, commercial catalog style.\nSTRICT PRODUCT ANCHORING:\n- Preserve exact garment silhouette, neckline, sleeve shape, length, structure, logo placement, print, color blocks, fabric texture from product references\n- Do not invent new trims/patterns/materials\n- Keep product identity and SKU look consistent across all generated images\nSTRICT MODEL ANCHORING:\n- Preserve selected model's face identity, body proportion, skin tone, and hair characteristics across outputs\n- Keep expression and pose family consistent unless explicitly changed\n${reqText}`,
  }));
};

export type ClothingStudioWorkflowResult = {
  ui: WorkflowUiMessage;
  images?: Array<{ url: string; label?: string }>;
  failedItems?: Array<{ index: number; prompt: string; label?: string }>;
};

export async function clothingStudioWorkflowSkill(params: {
  productImages: string[];
  modelImage?: string;
  requirements?: Requirements;
  retryFailedItems?: Array<{ index: number; prompt: string; label?: string }>;
  onProgress?: (done: number, total: number, text?: string) => void;
  signal?: AbortSignal;
}): Promise<ClothingStudioWorkflowResult> {
  const productImages = params.productImages || [];
  if (productImages.length < 1) {
    return { ui: { type: 'clothingStudio.product', productCount: 0, max: 6 } };
  }

  if (!params.modelImage) {
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
    requirements: params.requirements,
  });

  const planItems = params.retryFailedItems && params.retryFailedItems.length > 0
    ? params.retryFailedItems
    : toPlanItems(parsed.requirements);

  const anchorPrefix = `Use reference[0] as the MODEL identity anchor. Use reference[1..] as PRODUCT anchors. Product must match the referenced garment exactly, and model identity must stay consistent.`;

  const results: Array<{ url: string; label?: string }> = [];
  const failedItems: Array<{ index: number; prompt: string; label?: string }> = [];
  const total = planItems.length;

  for (let i = 0; i < total; i += 1) {
    if (params.signal?.aborted) {
      break;
    }

    const item = planItems[i];
    params.onProgress?.(i, total, `正在生成第 ${i + 1}/${total} 张：${item.label || ''}`);

    try {
      const url = await imageGenSkill({
        prompt: `${anchorPrefix}\n${item.prompt}`,
        model: 'Nano Banana Pro',
        aspectRatio: parsed.requirements.aspectRatio || '3:4',
        imageSize: parsed.requirements.clarity || '2K',
        referenceImages: [parsed.modelImage, ...parsed.productImages],
      });

      if (!url) {
        failedItems.push({ index: i, prompt: item.prompt, label: item.label });
      } else {
        results.push({ url, label: item.label });
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
