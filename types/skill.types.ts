export interface ImageGenSkillParams {
  prompt: string;
  model: 'Nano Banana' | 'Nano Banana Pro';
  aspectRatio: string;
  imageSize?: '1K' | '2K' | '4K';
  referenceImage?: string;
  brandContext?: {
    colors?: string[];
    style?: string;
  };
}

export interface VideoGenSkillParams {
  prompt: string;
  model: 'Veo 3.1' | 'Veo 3.1 Fast';
  aspectRatio: string;
  startFrame?: string;
  endFrame?: string;
  referenceImages?: string[];
}

export interface TextExtractSkillParams {
  imageData: string;
}

export interface RegionAnalyzeSkillParams {
  imageData: string;
  regionPrompt: string;
}
