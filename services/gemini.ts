
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content, VideoGenerationReferenceImage, VideoGenerationReferenceType, Type } from "@google/genai";

// Initialize the GenAI client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const PRO_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';
// Image Gen models
const IMAGE_PRO_MODEL = 'gemini-3-pro-image-preview';
const IMAGE_FLASH_MODEL = 'gemini-3-pro-image-preview';
// Video Gen models
const VEO_FAST_MODEL = 'veo-3.1-fast-generate-preview';
const VEO_PRO_MODEL = 'veo-3.1-generate-preview';

// Helper for retry logic
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000,
  factor: number = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isOverloaded = 
      error.status === 503 || 
      error.code === 503 || 
      (error.message && (error.message.includes('overloaded') || error.message.includes('UNAVAILABLE') || error.message.includes('503')));

    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded (503). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * factor, factor);
    }
    throw error;
  }
};

export const createChatSession = (model: string = PRO_MODEL, history: Content[] = [], systemInstruction?: string): Chat => {
  return ai.chats.create({
    model: model,
    history: history,
    config: {
      systemInstruction: systemInstruction || "You are XcAISTUDIO, an expert AI design assistant. You help users create posters, branding, and design elements. You are helpful, creative, and concise.",
      temperature: 0.7
    },
  });
};

export const fileToPart = async (file: File): Promise<Part> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // Determine mime type manually if missing (common for some windows configs)
        let mimeType = file.type;
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (!mimeType) {
             if (ext === 'pdf') mimeType = 'application/pdf';
             else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
             else if (ext === 'doc') mimeType = 'application/msword';
             else if (ext === 'md') mimeType = 'text/markdown';
             else if (ext === 'txt') mimeType = 'text/plain';
             else if (ext === 'png') mimeType = 'image/png';
             else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
             else if (ext === 'webp') mimeType = 'image/webp';
        }

        // Treat markdown and text as text parts
        if (mimeType === 'text/markdown' || mimeType === 'text/plain' || ext === 'md') {
             reader.onloadend = () => {
                resolve({ text: reader.result as string });
             };
             reader.readAsText(file);
        } else {
            // Treat others (images, pdf, docx) as inlineData (base64)
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({
                    inlineData: {
                        data: base64String,
                        mimeType: mimeType || 'application/octet-stream'
                    }
                });
            };
            reader.readAsDataURL(file);
        }
        reader.onerror = reject;
    });
};

export const sendMessage = async (
    chat: Chat, 
    message: string, 
    attachments: File[] = [],
    enableWebSearch: boolean = false
): Promise<string> => {
  try {
    const parts: Part[] = [];
    
    // Add text if present
    if (message.trim()) {
        parts.push({ text: message });
    }

    // Add attachments
    for (const file of attachments) {
        const part = await fileToPart(file);
        parts.push(part);
    }

    if (parts.length === 0) return "";

    const config: any = {};
    if (enableWebSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    const result: GenerateContentResponse = await retryWithBackoff(() => chat.sendMessage({
      message: parts,
      config
    }));

    let text = result.text || "I processed your request.";

    // Handle Grounding Metadata (Sources)
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => {
                if (chunk.web) {
                    return `[${chunk.web.title}](${chunk.web.uri})`;
                }
                return null;
            })
            .filter(Boolean);

        if (sources.length > 0) {
            text += `\n\n**Sources:**\n${sources.map((s: string) => `- ${s}`).join('\n')}`;
        }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request. Please ensure the file types are supported.";
  }
};

export const analyzeImageRegion = async (imageBase64: string): Promise<string> => {
    try {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid base64 image");

        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: FLASH_MODEL,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    },
                    {
                        text: "Analyze this specific cropped area of an image. Describe exactly what is visible in detail (e.g. facial features, object details, texture). Keep it concise."
                    }
                ]
            }
        }));

        return response.text || "Analysis failed.";
    } catch (error) {
        console.error("Analysis Error:", error);
        return "Could not analyze selection.";
    }
};

export const extractTextFromImage = async (imageBase64: string): Promise<string[]> => {
    try {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid base64 image");

        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: FLASH_MODEL,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    },
                    {
                        text: "Identify all the visible text in this image. Return the result as a JSON array of strings. If there is no text, return an empty array."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }));

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (error) {
        console.error("Extract Text Error:", error);
        return [];
    }
};

export interface ImageGenerationConfig {
  prompt: string;
  model: 'Nano Banana' | 'Nano Banana Pro';
  aspectRatio: string;
  imageSize?: '1K' | '2K' | '4K';
  referenceImage?: string; // base64
}

export const generateImage = async (config: ImageGenerationConfig): Promise<string | null> => {
  try {
    const modelToUse = config.model === 'Nano Banana Pro' ? IMAGE_PRO_MODEL : IMAGE_FLASH_MODEL;
    
    let validAspectRatio = config.aspectRatio;
    const supported = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    if (!supported.includes(validAspectRatio)) {
        if (validAspectRatio === '21:9') validAspectRatio = '16:9'; 
        else if (validAspectRatio === '3:2') validAspectRatio = '16:9'; 
        else if (validAspectRatio === '2:3') validAspectRatio = '9:16';
        else if (validAspectRatio === '5:4') validAspectRatio = '4:3';
        else if (validAspectRatio === '4:5') validAspectRatio = '3:4';
        else validAspectRatio = '1:1';
    }

    const parts: any[] = [{ text: config.prompt }];
    
    if (config.referenceImage) {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            parts.unshift({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            });
        }
    }

    // Special handling for high resolution requests
    const imageConfig: any = {
        aspectRatio: validAspectRatio,
    };
    
    if (config.model === 'Nano Banana Pro' && config.imageSize) {
        imageConfig.imageSize = config.imageSize;
    }

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config: {
        imageConfig
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export interface VideoGenerationConfig {
    prompt: string;
    model: 'Veo 3.1' | 'Veo 3.1 Fast';
    aspectRatio: string;
    startFrame?: string; // base64
    endFrame?: string; // base64
    referenceImages?: string[]; // array of base64
}

export const generateVideo = async (config: VideoGenerationConfig): Promise<string | null> => {
    try {
        // API Key Selection for Veo
        const win = window as any;
        if (win.aistudio) {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await win.aistudio.openSelectKey();
            }
        }

        // New instance for Veo requests
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let validAspectRatio = config.aspectRatio;
        // Veo models usually strictly support 16:9 or 9:16. 
        if (validAspectRatio !== '16:9' && validAspectRatio !== '9:16') {
             // Default to 16:9 if invalid for video (or map 1:1 to 16:9 for now as 1:1 is not strictly supported in standard Veo preview yet)
             validAspectRatio = '16:9'; 
        }

        let operation;
        const modelId = config.model === 'Veo 3.1' ? VEO_PRO_MODEL : VEO_FAST_MODEL;

        const commonConfig = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: validAspectRatio
        };

        if (config.model === 'Veo 3.1 Fast') {
            // Fast Model: Supports prompt, image (start), lastFrame
            const request: any = {
                model: modelId,
                prompt: config.prompt,
                config: commonConfig
            };

            if (config.startFrame) {
                const matches = config.startFrame.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    request.image = {
                        mimeType: matches[1],
                        imageBytes: matches[2]
                    };
                }
            }
            // Fast model doesn't officially document lastFrame in standard public docs yet but system rules say so.
            // If provided, we add it.
            if (config.endFrame) {
                 const matches = config.endFrame.match(/^data:(.+);base64,(.+)$/);
                 if (matches) {
                     request.config.lastFrame = {
                         mimeType: matches[1],
                         imageBytes: matches[2]
                     };
                 }
            }
            operation = await retryWithBackoff(() => genAI.models.generateVideos(request));

        } else {
            // Veo 3.1 (Pro): Supports referenceImages, and usually start/end frames too.
            // Prioritize start/end if explicitly provided (First/Last mode).
            // Otherwise use referenceImages.
            
            const request: any = {
                model: modelId,
                prompt: config.prompt,
                config: commonConfig
            };

            if (config.startFrame || config.endFrame) {
                // Assuming Veo 3.1 supports image/lastFrame similar to Fast or better
                if (config.startFrame) {
                    const matches = config.startFrame.match(/^data:(.+);base64,(.+)$/);
                    if (matches) request.image = { mimeType: matches[1], imageBytes: matches[2] };
                }
                if (config.endFrame) {
                    const matches = config.endFrame.match(/^data:(.+);base64,(.+)$/);
                    if (matches) request.config.lastFrame = { mimeType: matches[1], imageBytes: matches[2] };
                }
            } else if (config.referenceImages && config.referenceImages.length > 0) {
                // Use Reference Images
                const refPayload: VideoGenerationReferenceImage[] = [];
                for (const imgStr of config.referenceImages) {
                    const matches = imgStr.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        refPayload.push({
                            image: {
                                mimeType: matches[1],
                                imageBytes: matches[2]
                            },
                            referenceType: 'ASSET' as any // Using ASSET as default reference type (or STYLE/CHARACTER if applicable)
                        });
                    }
                }
                request.config.referenceImages = refPayload;
            }

            operation = await retryWithBackoff(() => genAI.models.generateVideos(request));
        }

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await retryWithBackoff(() => genAI.operations.getVideosOperation({operation: operation}));
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
            return `${uri}&key=${process.env.API_KEY}`;
        }
        return null;

    } catch (error: any) {
        console.error("Video Generation Error:", error);
        if (error.message && error.message.includes('Requested entity was not found')) {
             const win = window as any;
             if (win.aistudio) {
                // Reset key and prompt again if entity not found (key issue)
                await win.aistudio.openSelectKey();
                throw new Error("Please select a valid API key and try again.");
             }
        }
        throw error;
    }
}
