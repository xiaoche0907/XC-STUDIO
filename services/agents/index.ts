import { AgentType, AgentTask, AgentInfo } from '../../types/agent.types';
import { BaseAgent } from './base-agent';
import { EnhancedBaseAgent } from './enhanced-base-agent';
import { cocoAgent } from './agents/coco.agent';
import { vireoAgent } from './agents/vireo.agent';
import { cameronAgent } from './agents/cameron.agent';
import { posterAgent } from './agents/poster.agent';
import { packageAgent } from './agents/package.agent';
import { motionAgent } from './agents/motion.agent';
import { campaignAgent } from './agents/campaign.agent';

export const AGENT_REGISTRY: Record<AgentType, BaseAgent | EnhancedBaseAgent> = {
  coco: cocoAgent,
  vireo: vireoAgent,
  cameron: cameronAgent,
  poster: posterAgent,
  package: packageAgent,
  motion: motionAgent,
  campaign: campaignAgent
};

export function getAgentInfo(agentId: AgentType): AgentInfo {
  return AGENT_REGISTRY[agentId].agentInfo;
}

export async function executeAgentTask(task: AgentTask): Promise<AgentTask> {
  const agent = AGENT_REGISTRY[task.agentId];
  if (!agent) {
    throw new Error(`Agent ${task.agentId} not found`);
  }
  return agent.execute(task);
}

// 导出基础版本（向后兼容）
export { BaseAgent } from './base-agent';
export { routeToAgent as routeToAgentBasic } from './orchestrator';

// 导出增强版本（推荐使用）
export { EnhancedBaseAgent } from './enhanced-base-agent';
export {
  routeToAgent,
  executeAgentTaskWithSkills,
  collaborativeExecution
} from './enhanced-orchestrator';
