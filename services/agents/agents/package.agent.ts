import { BaseAgent } from '../base-agent';
import { PACKAGE_SYSTEM_PROMPT, PACKAGE_AGENT_INFO } from '../prompts/package.prompt';

export class PackageAgent extends BaseAgent {
  get agentInfo() {
    return PACKAGE_AGENT_INFO;
  }

  get systemPrompt() {
    return PACKAGE_SYSTEM_PROMPT;
  }
}

export const packageAgent = new PackageAgent();
