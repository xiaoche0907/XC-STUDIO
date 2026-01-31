import { generateVideo } from '../gemini';
import { VideoGenSkillParams } from '../../types/skill.types';

export async function videoGenSkill(params: VideoGenSkillParams): Promise<string | null> {
  const result = await generateVideo({
    prompt: params.prompt,
    model: params.model,
    aspectRatio: params.aspectRatio,
    startFrame: params.startFrame,
    endFrame: params.endFrame,
    referenceImages: params.referenceImages
  });

  return result;
}
