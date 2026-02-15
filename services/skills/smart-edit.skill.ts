import { getClient } from '../gemini';

export interface SmartEditParams {
  sourceUrl: string;
  editType: 'background-remove' | 'object-remove' | 'upscale' | 'style-transfer' | 'extend';
  parameters?: Record<string, any>;
}

export async function smartEditSkill(params: SmartEditParams): Promise<string | null> {
  const editPrompts: Record<string, string> = {
    'background-remove': 'Remove the background from this image, keep only the main subject with transparent background',
    'object-remove': `Remove ${params.parameters?.object || 'the specified object'} from this image seamlessly`,
    'upscale': 'Enhance and upscale this image to higher resolution while preserving all details',
    'style-transfer': `Apply ${params.parameters?.style || 'artistic'} style to this image`,
    'extend': `Extend this image ${params.parameters?.direction || 'outward'} naturally`
  };

  const prompt = editPrompts[params.editType] || 'Edit this image';

  try {
    const matches = params.sourceUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    const response = await getClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: matches[1], data: matches[2] } },
          { text: prompt }
        ]
      },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Smart edit error:', error);
    return null;
  }
}
