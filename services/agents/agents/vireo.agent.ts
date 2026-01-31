import { BaseAgent } from '../base-agent';
import { VIREO_SYSTEM_PROMPT, VIREO_AGENT_INFO } from '../prompts/vireo.prompt';

export class VireoAgent extends BaseAgent {
  get agentInfo() {
    return VIREO_AGENT_INFO;
  }

  get systemPrompt() {
    return VIREO_SYSTEM_PROMPT;
  }
}

export const vireoAgent = new VireoAgent();
