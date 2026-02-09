import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { MOTION_SYSTEM_PROMPT, MOTION_AGENT_INFO } from '../prompts/motion.prompt';

export class MotionAgent extends EnhancedBaseAgent {
  get agentInfo() {
    return MOTION_AGENT_INFO;
  }

  get systemPrompt() {
    return MOTION_SYSTEM_PROMPT;
  }

  get preferredSkills() {
    return [
      'videoGenSkill',
      'imageGenSkill',
      'smartEditSkill'
    ];
  }
}

export const motionAgent = new MotionAgent();
