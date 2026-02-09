import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { COCO_SYSTEM_PROMPT, COCO_AGENT_INFO } from '../prompts/coco.prompt';

export class CocoAgent extends EnhancedBaseAgent {
  get agentInfo() {
    return COCO_AGENT_INFO;
  }

  get systemPrompt() {
    return COCO_SYSTEM_PROMPT;
  }

  get preferredSkills() {
    return [
      'imageGenSkill',
      'copyGenSkill',
      'regionAnalyzeSkill',
      'videoGenSkill'
    ];
  }
}

export const cocoAgent = new CocoAgent();
