import { analyzeImageRegion } from '../gemini';
import { RegionAnalyzeSkillParams } from '../../types/skill.types';

export async function regionAnalyzeSkill(params: RegionAnalyzeSkillParams): Promise<string | null> {
  const result = await analyzeImageRegion(params.imageData);
  return result;
}
