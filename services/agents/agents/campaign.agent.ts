import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { CAMPAIGN_SYSTEM_PROMPT, CAMPAIGN_AGENT_INFO } from '../prompts/campaign.prompt';

export class CampaignAgent extends EnhancedBaseAgent {
  get agentInfo() {
    return CAMPAIGN_AGENT_INFO;
  }

  get systemPrompt() {
    return CAMPAIGN_SYSTEM_PROMPT;
  }

  get preferredSkills() {
    return [
      'imageGenSkill',
      'videoGenSkill',
      'copyGenSkill',
      'exportSkill'
    ];
  }
}

export const campaignAgent = new CampaignAgent();
