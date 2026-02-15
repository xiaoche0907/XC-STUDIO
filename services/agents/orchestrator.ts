import { getClient } from '../gemini';
import { AgentRoutingDecision, ProjectContext } from '../../types/agent.types';
import { COCO_SYSTEM_PROMPT } from './prompts/coco.prompt';

export async function routeToAgent(
  message: string,
  context: ProjectContext
): Promise<AgentRoutingDecision | null> {
  const historyText = context.conversationHistory
    .slice(-5)
    .map(m => `${m.role}: ${m.text}`)
    .join('\n');

  const prompt = `${COCO_SYSTEM_PROMPT}

Current Project: ${context.projectTitle}
Brand Info: ${JSON.stringify(context.brandInfo || {})}
Conversation History:
${historyText}

User Message: ${message}

Analyze and route to appropriate agent. Return JSON with: action, targetAgent, taskType, complexity, handoffMessage, confidence`;

  try {
    console.log('[Orchestrator] Routing message:', message.substring(0, 50));

    const response = await getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    console.log('[Orchestrator] Response received:', response.text?.substring(0, 100));
    const result = JSON.parse(response.text || '{}');

    if (result.action === 'route') {
      console.log('[Orchestrator] Routing to agent:', result.targetAgent);
      return {
        targetAgent: result.targetAgent,
        taskType: result.taskType,
        complexity: result.complexity,
        handoffMessage: result.handoffMessage,
        confidence: result.confidence || 0.8
      };
    }

    console.log('[Orchestrator] No routing decision, action:', result.action);
  } catch (error) {
    console.error('[Orchestrator] Routing failed:', error);
  }

  return null;
}
