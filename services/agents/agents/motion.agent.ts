import { BaseAgent } from '../base-agent';
import { MOTION_SYSTEM_PROMPT, MOTION_AGENT_INFO } from '../prompts/motion.prompt';

export class MotionAgent extends BaseAgent {
  get agentInfo() {
    return MOTION_AGENT_INFO;
  }

  get systemPrompt() {
    return MOTION_SYSTEM_PROMPT;
  }
}

export const motionAgent = new MotionAgent();
