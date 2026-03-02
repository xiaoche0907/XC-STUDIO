import { z } from 'zod';
import { imageGenSkill } from './image-gen.skill';
import type { ModelGenOptions } from '../../types/workflow.types';
import { loadProviderSettings } from '../provider-settings';
import { buildModelConstraintsText } from '../../utils/clothing-prompt';

const schema = z.object({
  options: z.object({
    gender: z.string().optional(),
    ageRange: z.string().optional(),
    skinTone: z.string().optional(),
    extra: z.string().optional(),
    count: z.number().int().min(1).max(4).default(1),
  }),
});

export async function generateModelSkill(params: { options: ModelGenOptions }): Promise<Array<{ url: string }>> {
  const parsed = schema.parse(params);
  const count = parsed.options.count || 1;
  const providerSettings = loadProviderSettings();
  const activeProvider = providerSettings.providers.find(p => p.id === providerSettings.activeProviderId);
  const hasKey = !!activeProvider?.apiKey?.trim();

  if (!hasKey) {
    throw new Error(`当前提供商(${activeProvider?.name || providerSettings.activeProviderId || '未知'})未配置 API Key，请在设置中填写中转或 Gemini Key`);
  }

  const gender = parsed.options.gender?.trim() || 'adult';
  const ageRange = parsed.options.ageRange?.trim() || '20-30';
  const skinTone = parsed.options.skinTone?.trim() || 'natural skin tone';
  const extra = parsed.options.extra?.trim() || 'clean studio fashion model photo, full body';
  const modelConstraints = buildModelConstraintsText(parsed.options);

  const outputs: Array<{ url: string }> = [];

  for (let i = 0; i < count; i += 1) {
    const prompt = `Fashion model portrait for clothing try-on reference. gender: ${gender}; age: ${ageRange}; skin tone: ${skinTone}; ${extra}. neutral expression, clean background, full body, high-detail textile-friendly lighting.\n${modelConstraints}`;
    const url = await imageGenSkill({
      prompt,
      model: 'Nano Banana Pro',
      aspectRatio: '3:4',
      imageSize: '2K',
    });
    if (url) outputs.push({ url });
  }

  return outputs;
}
