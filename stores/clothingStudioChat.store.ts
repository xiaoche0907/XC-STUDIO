import { create } from 'zustand';
import type { ClothingStep, Requirements, ModelGenOptions, ClothingAnalysis } from '../types/workflow.types';

export type WorkflowImageItem = {
  id: string;
  url: string;
  name?: string;
};

type ProgressState = {
  done: number;
  total: number;
  text?: string;
};

interface ClothingStudioChatState {
  step: ClothingStep;
  productImages: WorkflowImageItem[];
  productAnchorUrl: string | null;
  analysis: ClothingAnalysis | null;
  modelImage: WorkflowImageItem | null;
  modelViews: WorkflowImageItem[];
  modelAnchorSheetUrl: string | null;
  modelCandidates: WorkflowImageItem[];
  requirements: Requirements;
  modelOptions: ModelGenOptions;
  results: Array<{ url: string; label?: string }>;
  failedItems: Array<{ index: number; prompt: string; label?: string }>;
  progress: ProgressState;
  isGenerating: boolean;
  abortController: AbortController | null;

  actions: {
    reset: () => void;
    setStep: (step: ClothingStep) => void;
    addProductImages: (images: WorkflowImageItem[]) => void;
    setProductAnchorUrl: (url: string | null) => void;
    setAnalysis: (analysis: ClothingAnalysis | null) => void;
    setModelImage: (image: WorkflowImageItem | null) => void;
    setModelViews: (images: WorkflowImageItem[]) => void;
    setModelAnchorSheetUrl: (url: string | null) => void;
    setModelCandidates: (images: WorkflowImageItem[]) => void;
    setRequirements: (next: Partial<Requirements>) => void;
    setModelOptions: (next: Partial<ModelGenOptions>) => void;
    setProgress: (next: ProgressState) => void;
    setGenerating: (v: boolean) => void;
    setResults: (images: Array<{ url: string; label?: string }>) => void;
    setFailedItems: (items: Array<{ index: number; prompt: string; label?: string }>) => void;
    startAbortSession: () => AbortController;
    clearAbortSession: () => void;
    cancelGenerating: () => void;
  };
}

const DEFAULT_REQUIREMENTS: Requirements = {
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
};

const DEFAULT_MODEL_OPTIONS: ModelGenOptions = {
  gender: '不限',
  ageRange: '18-25岁',
  skinTone: '亚洲人',
  pose: '站立正面',
  expression: '自然微笑',
  hairstyle: '披肩直发',
  makeup: '日常淡妆',
  extra: '',
  count: 1,
};

const toId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useClothingStudioChatStore = create<ClothingStudioChatState>((set, get) => ({
  step: 'WAIT_PRODUCT',
  productImages: [],
  productAnchorUrl: null,
  analysis: null,
  modelImage: null,
  modelViews: [],
  modelAnchorSheetUrl: null,
  modelCandidates: [],
  requirements: DEFAULT_REQUIREMENTS,
  modelOptions: DEFAULT_MODEL_OPTIONS,
  results: [],
  failedItems: [],
  progress: { done: 0, total: 0, text: '' },
  isGenerating: false,
  abortController: null,

  actions: {
    reset: () => set({
      step: 'WAIT_PRODUCT',
      productImages: [],
      productAnchorUrl: null,
      analysis: null,
      modelImage: null,
      modelViews: [],
      modelAnchorSheetUrl: null,
      modelCandidates: [],
      requirements: { ...DEFAULT_REQUIREMENTS },
      modelOptions: { ...DEFAULT_MODEL_OPTIONS },
      results: [],
      failedItems: [],
      progress: { done: 0, total: 0, text: '' },
      isGenerating: false,
      abortController: null,
    }),

    setStep: (step) => set({ step }),

    addProductImages: (images) => set((state) => {
      const merged = [...state.productImages];
      for (const img of images) {
        if (merged.length >= 6) break;
        if (merged.some((p) => p.url === img.url)) continue;
        merged.push({ id: img.id || toId('product'), url: img.url, name: img.name });
      }
      return { productImages: merged };
    }),

    setProductAnchorUrl: (productAnchorUrl) => set({ productAnchorUrl }),
    setAnalysis: (analysis) => set({ analysis }),

    setModelImage: (image) => set({ modelImage: image ? { ...image, id: image.id || toId('model') } : null }),
    setModelViews: (images) => set({ modelViews: images }),
    setModelAnchorSheetUrl: (modelAnchorSheetUrl) => set({ modelAnchorSheetUrl }),
    setModelCandidates: (images) => set({ modelCandidates: images }),
    setRequirements: (next) => set((state) => ({ requirements: { ...state.requirements, ...next } })),
    setModelOptions: (next) => set((state) => ({ modelOptions: { ...state.modelOptions, ...next } })),
    setProgress: (next) => set({ progress: next }),
    setGenerating: (v) => set({ isGenerating: v }),
    setResults: (images) => set({ results: images }),
    setFailedItems: (items) => set({ failedItems: items }),

    startAbortSession: () => {
      const prev = get().abortController;
      if (prev) prev.abort();
      const ctrl = new AbortController();
      set({ abortController: ctrl });
      return ctrl;
    },
    clearAbortSession: () => set({ abortController: null }),
    cancelGenerating: () => {
      const ctrl = get().abortController;
      if (ctrl) ctrl.abort();
      set({ isGenerating: false, abortController: null });
    },
  },
}));
