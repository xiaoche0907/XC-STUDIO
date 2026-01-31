import { BaseAgent } from '../base-agent';
import { CAMPAIGN_SYSTEM_PROMPT, CAMPAIGN_AGENT_INFO } from '../prompts/campaign.prompt';

export class CampaignAgent extends BaseAgent {
  get agentInfo() {
    return CAMPAIGN_AGENT_INFO;
  }

  get systemPrompt() {
    return CAMPAIGN_SYSTEM_PROMPT;
  }
}

export const campaignAgent = new CampaignAgent();
