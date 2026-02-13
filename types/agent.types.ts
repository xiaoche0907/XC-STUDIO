import { ProjectContext } from './common';
export type { ProjectContext };

export type AgentType = 'coco' | 'vireo' | 'cameron' | 'poster' | 'package' | 'motion' | 'campaign';

export interface AgentInfo {
  id: AgentType;
  name: string;
  avatar: string;
  description: string;
  capabilities: string[];
  color: string;
}

export interface AgentRoutingDecision {
  targetAgent: AgentType;
  taskType: string;
  complexity: 'simple' | 'complex';
  handoffMessage: string;
  confidence: number;
}

export type TaskStatus = 'pending' | 'analyzing' | 'executing' | 'completed' | 'failed';

export interface AgentProposal {
  id: string;
  title: string;
  description: string;
  preview?: string;
  skillCalls: SkillCall[];
}

export interface AgentTask {
  id: string;
  agentId: AgentType;
  status: TaskStatus;
  input: {
    message: string;
    attachments?: File[];
    context: ProjectContext;
    metadata?: Record<string, any>; // Support arbitrary metadata like marker info
  };
  output?: {
    message: string;
    analysis?: string;
    proposals?: AgentProposal[];
    assets?: GeneratedAsset[];
    skillCalls?: SkillCall[];
    error?: any; // 添加错误字段支持
  };
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'text';
  url: string;
  metadata: {
    prompt?: string;
    model?: string;
    agentId: AgentType;
  };
}



export interface SkillCall {
  skillName: string;
  params: Record<string, any>;
  result?: any;
  error?: string;
}
