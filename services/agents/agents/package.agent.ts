import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { PACKAGE_SYSTEM_PROMPT, PACKAGE_AGENT_INFO } from '../prompts/package.prompt';

export class PackageAgent extends EnhancedBaseAgent {
  get agentInfo() {
    return PACKAGE_AGENT_INFO;
  }

  get systemPrompt() {
    return PACKAGE_SYSTEM_PROMPT;
  }

  get preferredSkills() {
    return [
      'imageGenSkill',
      'smartEditSkill',
      'exportSkill'
    ];
  }
}

export const packageAgent = new PackageAgent();
