import { Chat, Type } from '@google/genai';
import { createChatSession, getClient } from '../gemini';
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
    try {
      const ai = getClient();

      const { message, attachments, context } = task.input;
      const fullPrompt = `${this.systemPrompt}

Project Context:
- Title: ${context.projectTitle}
- Brand: ${JSON.stringify(context.brandInfo || {})}
- Existing Assets: ${context.existingAssets.length}

User Request: ${message}

IMPORTANT: You are a design AI agent. When the user asks to generate, edit, or adjust an image, you MUST return skillCalls with generateImage skill. Each proposal MUST include a "prompt" field with a detailed English image generation prompt following Imagen best practices (50-150 words, specific subject + style + lighting + quality).

If the user selected an image and wants modifications, analyze what they want and create new generation prompts that incorporate the changes.

Always return at least 1 proposal with a generation prompt. Return your response as JSON.`;

      // Build content parts - text + optional image attachments
      const parts: any[] = [{ text: fullPrompt }];

      // Add image attachments if present
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          try {
            const buffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            parts.push({
              inlineData: {
                mimeType: file.type || 'image/png',
                data: base64
              }
            });
          } catch (e) {
            console.warn('[Agent] Failed to attach file:', e);
          }
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              proposals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    aspectRatio: { type: Type.STRING },
                    model: { type: Type.STRING }
                  }
                }
              },
              skillCalls: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skillName: { type: Type.STRING },
                    params: {
                      type: Type.OBJECT,
                      properties: {
                        prompt: { type: Type.STRING },
                        model: { type: Type.STRING },
                        aspectRatio: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              message: { type: Type.STRING },
              concept: { type: Type.STRING },
              adjustments: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const responseText = response.text || '';
      console.log('[Agent] Raw response:', responseText.substring(0, 500));

      const parsed = this.parseResponse(responseText);
      console.log('[Agent] Parsed response:', JSON.stringify(parsed, null, 2).substring(0, 500));

      if (parsed.proposals && Array.isArray(parsed.proposals)) {
        console.log('[Agent] Found proposals:', parsed.proposals.length);

        // Auto-execute image generation for proposals that have prompts
        const generatedAssets: GeneratedAsset[] = [];
        for (const proposal of parsed.proposals) {
          if (proposal.prompt) {
            try {
              const url = await executeSkill('generateImage', {
                prompt: proposal.prompt,
                model: proposal.model || 'Nano Banana',
                aspectRatio: proposal.aspectRatio || '1:1'
              });
              if (url) {
                generatedAssets.push({
                  id: `asset-${Date.now()}-${Math.random()}`,
                  type: 'image',
                  url,
                  metadata: { prompt: proposal.prompt, model: proposal.model || 'Nano Banana', agentId: this.agentInfo.id }
                });
                proposal.generatedUrl = url;
              }
            } catch (e) {
              console.warn('[Agent] Skill execution failed for proposal:', proposal.title, e);
            }
          }
        }

        return {
          ...task,
          status: 'completed',
          output: {
            message: parsed.analysis || parsed.message || '已为您生成设计方案',
            analysis: parsed.analysis,
            proposals: parsed.proposals,
            assets: generatedAssets,
            adjustments: parsed.adjustments || ['调整构图', '更换风格', '修改配色', '添加文字', '放大画质']
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
