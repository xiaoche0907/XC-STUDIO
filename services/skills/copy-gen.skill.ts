import { GoogleGenAI } from '@google/genai';



export interface CopyGenSkillParams {
  copyType: 'headline' | 'tagline' | 'body' | 'slogan' | 'description';
  brandName: string;
  product: string;
  targetAudience: string;
  tone: 'professional' | 'casual' | 'playful' | 'luxury' | 'urgent';
  keyMessage: string;
  maxLength?: number;
  variations?: number;
}

export async function copyGenSkill(params: CopyGenSkillParams): Promise<string[]> {
  const prompt = `Generate ${params.variations || 3} ${params.copyType} variations for:
Brand: ${params.brandName}
Product: ${params.product}
Audience: ${params.targetAudience}
Tone: ${params.tone}
Key Message: ${params.keyMessage}
${params.maxLength ? `Max Length: ${params.maxLength} characters` : ''}

Return only the text variations as a JSON array of strings.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.warn('Skipping copy generation: No API Key provided');
      return [];
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error('Copy generation error:', error);
    return [];
  }
}
