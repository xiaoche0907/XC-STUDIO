import { extractTextFromImage } from '../gemini';
import { TextExtractSkillParams } from '../../types/skill.types';

export async function textExtractSkill(params: TextExtractSkillParams): Promise<string | null> {
  const result = await extractTextFromImage(params.imageData);
  return result.length > 0 ? result.join('\n') : null;
}
