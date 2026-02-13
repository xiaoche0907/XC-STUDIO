
export type ShapeType = 'square' | 'circle' | 'triangle' | 'star' | 'bubble' | 'arrow-left' | 'arrow-right';

export interface CanvasElement {
  id: string;
  type: 'image' | 'video' | 'shape' | 'text' | 'gen-image' | 'gen-video';
  url?: string;
  shapeType?: ShapeType;
  // Text specific properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  opacity?: number;

  // Shape specific
  cornerRadius?: number;
  aspectRatioLocked?: boolean;

  // Gen Image/Video specific
  genPrompt?: string;
  genModel?: 'Nano Banana' | 'Nano Banana Pro' | 'Veo 3.1' | 'Veo 3.1 Fast';
  genAspectRatio?: string;
  genResolution?: '1K' | '2K' | '4K';

  // Image Gen Reference
  genRefImage?: string;

  // Video Gen Specifics
  genStartFrame?: string;
  genEndFrame?: string;
  genVideoRefs?: string[];
  genDuration?: '5s' | '10s';
  genFirstLastMode?: boolean; // Toggle for "Start/End Frame" mode in Veo 3.1

  isGenerating?: boolean;

  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Marker {
  id: number;
  x: number; // Relative to the element
  y: number; // Relative to the element
  elementId: string;
  cropUrl?: string; // The zoomed-in image data of the marked area
  analysis?: string; // AI analysis result
  width?: number; // Optional width of the marked region
  height?: number; // Optional height of the marked region
}

export interface Project {
  id: string;
  title: string;
  updatedAt: string;
  thumbnail?: string;
  elements?: CanvasElement[];
  markers?: Marker[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: string[]; // Array of base64 images
  relatedMarkerId?: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface InputBlock {
  id: string;
  type: 'text' | 'file';
  text?: string;
  file?: File;
}

// Agent System Types
export interface AgentChatMessage extends ChatMessage {
  agentId?: string;
  taskId?: string;
  skillCalls?: Array<{
    skillName: string;
    params: Record<string, any>;
    result?: any;
    error?: string;
  }>;
}

export interface ProjectContext {
  projectId: string;
  projectTitle: string;
  brandInfo?: {
    name?: string;
    colors?: string[];
    fonts?: string[];
    style?: string;
  };
  existingAssets: CanvasElement[];
  conversationHistory: ChatMessage[];
}
