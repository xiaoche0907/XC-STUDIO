import { getClient } from '../gemini';
import { AgentRoutingDecision, ProjectContext } from '../../types/agent.types';
import { COCO_SYSTEM_PROMPT } from './prompts/coco.prompt';
import { localPreRoute, isChatMessage } from './local-router';

export async function routeToAgent(
  message: string,
  context: ProjectContext
): Promise<AgentRoutingDecision | null> {
  // 快速路径：本地关键词预路由（0延迟，不依赖API）
  const localAgent = localPreRoute(message);
  if (localAgent) {
    console.log('[Orchestrator] Local pre-route hit:', localAgent);
    return {
      targetAgent: localAgent,
      taskType: 'local-routed',
      complexity: 'simple',
      handoffMessage: `用户请求: ${message}`,
      confidence: 0.7
    };
  }

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
    console.log('[Orchestrator] Routing message via API:', message.substring(0, 50));

    const response = await getClient().models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // 处理 clarify 和 respond action — 也返回路由决策（路由到 coco 自身处理）
    if (result.action === 'clarify' || result.action === 'respond') {
      console.log('[Orchestrator] Non-route action:', result.action);
      return {
        targetAgent: 'poster',
        taskType: result.action,
        complexity: 'simple',
        handoffMessage: result.message || result.questions?.join('\n') || message,
        confidence: 0.7
      };
    }

    console.log('[Orchestrator] No routing decision, action:', result.action);
  } catch (error) {
    console.error('[Orchestrator] Routing failed:', error);
  }

  // 兜底：API失败且本地预路由已在顶部尝试过，返回 null
  return null;
}
