import { Chat } from '@google/genai';
import { createChatSession } from '../gemini';
import { AgentTask, AgentInfo, ProjectContext, GeneratedAsset } from '../../types/agent.types';
import { executeSkill } from '../skills';

export abstract class BaseAgent {
  protected chat: Chat | null = null;

  abstract get agentInfo(): AgentInfo;
  abstract get systemPrompt(): string;

  async initialize(context: ProjectContext): Promise<void> {
    this.chat = createChatSession('gemini-3-pro-preview', [], this.systemPrompt);
  }

  async execute(task: AgentTask): Promise<AgentTask> {
    const prompt = this.buildPrompt(task);

    try {
      // Use direct API call with JSON mode instead of chat session
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: `${this.systemPrompt}\n\n${prompt}` }] },
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      console.log('[Agent] Raw response:', responseText.substring(0, 500));

      const parsed = this.parseResponse(responseText);
      console.log('[Agent] Parsed response:', JSON.stringify(parsed, null, 2).substring(0, 500));

      if (parsed.proposals && Array.isArray(parsed.proposals)) {
        console.log('[Agent] Found proposals:', parsed.proposals.length);
        return {
          ...task,
          status: 'completed',
          output: {
            message: parsed.analysis || '我为您准备了以下设计方案，请选择一个',
            analysis: parsed.analysis,
            proposals: parsed.proposals
          },
          updatedAt: Date.now()
        };
      }

      const executedSkills = await this.executeSkills(parsed.skillCalls || []);
      const assets = this.extractAssets(executedSkills);

      return {
        ...task,
        status: 'completed',
        output: {
          message: parsed.message || parsed.concept || responseText,
          assets
        },
        updatedAt: Date.now()
      };
    } catch (error) {
      return {
        ...task,
        status: 'failed',
        output: {
          message: `Error: ${error instanceof Error ? error.message : String(error)}`
        },
        updatedAt: Date.now()
      };
    }
  }

  protected buildPrompt(task: AgentTask): string {
    const { message, context } = task.input;
    return `${this.systemPrompt}

Project Context:
- Title: ${context.projectTitle}
- Brand: ${JSON.stringify(context.brandInfo || {})}
- Existing Assets: ${context.existingAssets.length}

User Request: ${message}

CRITICAL INSTRUCTION: You MUST respond with ONLY a valid JSON object. Do NOT include any explanatory text, markdown formatting, or code blocks. Start your response with { and end with }. The JSON must follow the exact format specified in the "Response Format" section above.`;
  }

  protected parseResponse(response: string): any {
    console.log('[parseResponse] Raw response:', response.substring(0, 200));

    let cleaned = response.trim();

    // Remove markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
      console.log('[parseResponse] Extracted from code block');
    }

    // Try direct parse
    try {
      const result = JSON.parse(cleaned);
      console.log('[parseResponse] Parse success, has proposals:', !!result.proposals);
      return result;
    } catch (e) {
      console.log('[parseResponse] Direct parse failed:', e);
    }

    // Try to find the first complete JSON object
    let braceCount = 0;
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') {
        if (braceCount === 0) startIndex = i;
        braceCount++;
      } else if (cleaned[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          endIndex = i;
          break;
        }
      }
    }

    if (startIndex !== -1 && endIndex !== -1) {
      const jsonStr = cleaned.substring(startIndex, endIndex + 1);
      try {
        const result = JSON.parse(jsonStr);
        console.log('[parseResponse] Extracted JSON parse success, has proposals:', !!result.proposals);
        return result;
      } catch (e) {
        console.error('[parseResponse] Extracted JSON parse failed:', e);
      }
    }

    console.log('[parseResponse] All parsing failed, returning fallback');
    return { message: response, skillCalls: [] };
  }

  protected async executeSkills(skillCalls: any[]): Promise<any[]> {
    const results: any[] = [];
    for (const call of skillCalls) {
      try {
        const result = await executeSkill(call.skillName, call.params);
        results.push({ ...call, result });
      } catch (error) {
        results.push({ ...call, error: String(error) });
      }
    }
    return results;
  }

  protected extractAssets(skillCalls: any[]): GeneratedAsset[] {
    return skillCalls
      .filter(s => s.result && (s.skillName === 'generateImage' || s.skillName === 'generateVideo'))
      .map(s => ({
        id: `asset-${Date.now()}-${Math.random()}`,
        type: s.skillName === 'generateImage' ? 'image' as const : 'video' as const,
        url: s.result,
        metadata: {
          prompt: s.params.prompt,
          model: s.params.model,
          agentId: this.agentInfo.id
        }
      }));
  }

  reset(): void {
    this.chat = null;
  }
}
