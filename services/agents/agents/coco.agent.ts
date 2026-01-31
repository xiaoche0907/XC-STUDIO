import { BaseAgent } from '../base-agent';
import { COCO_SYSTEM_PROMPT, COCO_AGENT_INFO } from '../prompts/coco.prompt';

export class CocoAgent extends BaseAgent {
  get agentInfo() {
    return COCO_AGENT_INFO;
  }

  get systemPrompt() {
    return COCO_SYSTEM_PROMPT;
  }
}

export const cocoAgent = new CocoAgent();
