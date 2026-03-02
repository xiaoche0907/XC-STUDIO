export type ClothingStep =
  | 'WAIT_PRODUCT'
  | 'WAIT_MODEL_OPTIONAL'
  | 'NEED_MODEL'
  | 'MODEL_GENERATING'
  | 'WAIT_REQUIREMENTS'
  | 'GENERATING'
  | 'DONE';

export type Requirements = {
  platform: string;
  description: string;
  targetLanguage: string;
  aspectRatio: string;
  clarity: '1K' | '2K' | '4K';
  count: number;
  templateId?: string;
  styleTags?: string[];
  backgroundTags?: string[];
  cameraTags?: string[];
  focusTags?: string[];
  extraText?: string;
};

export type ModelGenOptions = {
  gender?: string;
  ageRange?: string;
  skinTone?: string;
  pose?: string;
  expression?: string;
  hairstyle?: string;
  makeup?: string;
  extra?: string;
  count: number;
};

export type WorkflowUiMessage =
  | { type: 'clothingStudio.product'; productCount: number; max: 6 }
  | { type: 'clothingStudio.needModel' }
  | { type: 'clothingStudio.generateModelForm'; defaults: ModelGenOptions }
  | { type: 'clothingStudio.modelCandidates'; images: Array<{ url: string }> }
  | { type: 'clothingStudio.requirementsForm'; defaults: Requirements }
  | { type: 'clothingStudio.progress'; done: number; total: number; text?: string }
  | { type: 'clothingStudio.results'; images: Array<{ url: string; label?: string }> };
