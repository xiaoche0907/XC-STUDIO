import { BaseAgent } from '../base-agent';
import { CAMERON_SYSTEM_PROMPT, CAMERON_AGENT_INFO } from '../prompts/cameron.prompt';

export class CameronAgent extends BaseAgent {
  get agentInfo() {
    return CAMERON_AGENT_INFO;
  }

  get systemPrompt() {
    return CAMERON_SYSTEM_PROMPT;
  }
}

export const cameronAgent = new CameronAgent();
