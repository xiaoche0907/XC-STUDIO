import { BaseAgent } from '../base-agent';
import { POSTER_SYSTEM_PROMPT, POSTER_AGENT_INFO } from '../prompts/poster.prompt';

export class PosterAgent extends BaseAgent {
  get agentInfo() {
    return POSTER_AGENT_INFO;
  }

  get systemPrompt() {
    return POSTER_SYSTEM_PROMPT;
  }
}

export const posterAgent = new PosterAgent();
