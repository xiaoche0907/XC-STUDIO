用户说已经将GitHub仓库公开了，让我开始工作。我需要：

1. 首先访问GitHub仓库，了解现有项目结构
2. 然后结合之前的PRD文档，审阅并优化，确保与现有代码结构匹配
3. 最后输出一份完整、可执行的PRD

让我先访问GitHub仓库。

好的，让我先查看您的 GitHub 仓库结构，然后结合之前的文档为您制定一份准确的集成方案。

{"urls": "https://github.com/xiaoche0907/XC-STUDIO"}

我看到仓库结构了。这是一个基于 **Vite + React + TypeScript** 的项目（从 Google AI Studio 模板生成）。让我进一步查看核心文件来了解现有代码结构。

{"urls": "https://raw.githubusercontent.com/xiaoche0907/XC-STUDIO/main/App.tsx;https://raw.githubusercontent.com/xiaoche0907/XC-STUDIO/main/package.json;https://raw.githubusercontent.com/xiaoche0907/XC-STUDIO/main/types.ts"}

让我再看看 pages 和 services 目录的内容，以便完整了解项目结构。

{"urls": "https://github.com/xiaoche0907/XC-STUDIO/tree/main/pages;https://github.com/xiaoche0907/XC-STUDIO/tree/main/services"}

GitHub 页面加载有问题，让我直接读取原始文件内容。

{"urls": "https://raw.githubusercontent.com/xiaoche0907/XC-STUDIO/main/pages/Workspace.tsx;https://raw.githubusercontent.com/xiaoche0907/XC-STUDIO/main/services/gemini.ts"}

现在我完全理解您的项目结构了。让我为您编写一份**经过调整的、与现有代码完全兼容的 PRD**。

---

# XC-STUDIO AI 多智能体系统集成 PRD

## 产品需求文档 v2.0（修订版）

**文档版本:** v2.0
**最后更新:** 2026-01-31
**项目名称:** XC-STUDIO AI 多智能体设计系统集成
**目标读者:** IDE Agent (Cursor/Windsurf/Copilot) / 开发者

---

## 1. 现有项目分析

### 1.1 技术栈确认

| 项目 | 现有技术 |
|------|----------|
| 框架 | React 19 + Vite 6 + TypeScript |
| 路由 | react-router-dom v7 (HashRouter) |
| 样式 | Tailwind CSS v4 |
| 动画 | framer-motion |
| 图标 | lucide-react |
| AI | @google/genai (Gemini API) |
| 状态管理 | React useState（无全局状态库） |

### 1.2 现有目录结构

XC-STUDIO/
├── pages/
│   ├── Home.tsx          # 首页
│   ├── Workspace.tsx     # 核心工作区（画布+聊天）
│   └── Projects.tsx      # 项目列表
├── services/
│   ├── gemini.ts         # Gemini API 封装
│   └── storage.ts        # 本地存储
├── types.ts              # 类型定义
├── App.tsx               # 路由配置
├── index.tsx             # 入口
└── index.css             # 全局样式

### 1.3 现有功能

- **画布系统**: 支持图片/视频/形状/文字元素拖拽、缩放、编辑
- **AI 聊天**: 已有 ChatMessage 类型，支持文字+附件输入
- **图像生成**: 支持 Nano Banana / Nano Banana Pro 模型
- **视频生成**: 支持 Veo 3.1 / Veo 3.1 Fast 模型
- **标记分析**: 支持 Marker 标记区域并 AI 分析
- **文字提取**: 从图片中提取文字并编辑

---

## 2. 集成目标

将 Lovart 风格的多智能体系统集成到现有 XC-STUDIO 中，**保持现有功能不变**，在此基础上增加：

1. **智能体路由系统**: 根据用户意图自动分配任务给专业智能体
2. **专业设计智能体**: Coco(接待)、Vireo(VI)、Cameron(故事板)、Poster(海报)、Package(包装)、Motion(动效)、Campaign(营销)
3. **共享技能模块**: 统一的图像/视频/文案生成接口
4. **上下文同步**: 项目级别的设计一致性维护
5. **用户记忆**: 偏好学习与个性化

---

## 3. 目录结构规划（增量式）

在现有结构基础上添加以下目录：

XC-STUDIO/
├── pages/
│   ├── Home.tsx
│   ├── Workspace.tsx        # 修改：集成智能体UI
│   └── Projects.tsx
├── services/
│   ├── gemini.ts            # 保留
│   ├── storage.ts           # 保留
│   └── agents/              # 🆕 智能体服务
│       ├── index.ts         # 导出入口
│       ├── orchestrator.ts  # 主调度器
│       ├── coco.agent.ts    # 前台接待
│       ├── vireo.agent.ts   # 品牌VI
│       ├── cameron.agent.ts # 故事板
│       ├── poster.agent.ts  # 海报设计
│       ├── package.agent.ts # 包装设计
│       ├── motion.agent.ts  # 动效设计
│       ├── campaign.agent.ts# 营销活动
│       └── prompts/         # 系统提示词
│           ├── coco.ts
│           ├── vireo.ts
│           ├── cameron.ts
│           ├── poster.ts
│           ├── package.ts
│           ├── motion.ts
│           └── campaign.ts
├── services/
│   └── skills/              # 🆕 共享技能
│       ├── index.ts
│       ├── image-gen.skill.ts
│       ├── video-gen.skill.ts
│       ├── copy-gen.skill.ts
│       ├── smart-edit.skill.ts
│       └── export.skill.ts
├── services/
│   └── context/             # 🆕 上下文管理
│       ├── project-context.ts
│       └── user-memory.ts
├── components/              # 🆕 UI组件
│   ├── AgentAvatar.tsx
│   ├── AgentSelector.tsx
│   ├── TaskProgress.tsx
│   └── AssetGallery.tsx
├── hooks/                   # 🆕 自定义Hooks
│   ├── useAgent.ts
│   ├── useTask.ts
│   └── useProjectContext.ts
├── types.ts                 # 修改：扩展类型
├── types/                   # 🆕 新增类型文件
│   ├── agents.ts
│   └── skills.ts
├── App.tsx
├── index.tsx
└── index.css

---

## 4. 类型定义

### 4.1 扩展 `types.ts`（在现有文件末尾添加）

typescript
// =============================================================================
// AI Agent System Types (新增)
// =============================================================================

/** 智能体类型 */
export type AgentType =
| 'coco'      // 前台接待
| 'vireo'     // 品牌VI
| 'cameron'   // 故事板
| 'poster'    // 海报
| 'package'   // 包装
| 'motion'    // 动效
| 'campaign'; // 营销活动

/** 智能体信息 */
export interface AgentInfo {
id: AgentType;
name: string;
avatar: string;
description: string;
capabilities: string[];
color: string;
}

/** 任务状态 */
export type TaskStatus =
| 'pending'
| 'analyzing'
| 'planning'
| 'executing'
| 'reviewing'
| 'completed'
| 'failed';

/** 任务复杂度 */
export type TaskComplexity = 'simple' | 'complex';

/** 智能体路由决策 */
export interface AgentRoutingDecision {
targetAgent: AgentType;
taskType: string;
complexity: TaskComplexity;
handoffMessage: string;
confidence: number;
}

/** 智能体任务 */
export interface AgentTask {
id: string;
agentId: AgentType;
status: TaskStatus;
input: {
message: string;
attachments?: string[];
context?: ProjectContext;
};
output?: {
message: string;
assets?: GeneratedAsset[];
nextSteps?: string[];
};
createdAt: number;
updatedAt: number;
progress?: number;
}

/** 生成的资产 */
export interface GeneratedAsset {
id: string;
type: 'image' | 'video' | 'text' | 'document';
url: string;
thumbnailUrl?: string;
metadata: {
width?: number;
height?: number;
duration?: number;
prompt?: string;
model?: string;
seed?: number;
};
}

/** 项目上下文 */
export interface ProjectContext {
projectId: string;
projectTitle: string;
brandInfo?: {
name?: string;
colors?: string[];
fonts?: string[];
style?: string;
};
existingAssets: CanvasElement[];
designHistory: string[];
}

/** 用户记忆 */
export interface UserMemory {
userId: string;
preferences: {
favoriteStyles: string[];
preferredModels: string[];
colorPreferences: string[];
industryFocus?: string;
};
recentProjects: string[];
skillLevel: 'beginner' | 'intermediate' | 'professional';
}

/** 扩展 ChatMessage 以支持智能体 */
export interface AgentChatMessage extends ChatMessage {
agentId?: AgentType;
taskId?: string;
assets?: GeneratedAsset[];
isThinking?: boolean;
thinkingSteps?: string[];
}

### 4.2 创建 `types/skills.ts`

typescript
// =============================================================================
// Skills Hub Types
// =============================================================================

/** 图像生成请求 */
export interface ImageGenRequest {
prompt: string;
style?: string;
mood?: string;
aspectRatio: string;
model: 'auto' | 'nano-banana' | 'nano-banana-pro';
referenceImage?: string;
brandContext?: {
colors?: string[];
style?: string;
};
}

/** 图像生成响应 */
export interface ImageGenResponse {
imageUrl: string;
thumbnailUrl?: string;
seed: number;
model: string;
prompt: string;
}

/** 视频生成请求 */
export interface VideoGenRequest {
prompt: string;
aspectRatio: string;
duration: '5s' | '10s';
model: 'auto' | 'veo-3.1' | 'veo-3.1-fast';
startFrame?: string;
endFrame?: string;
referenceImages?: string[];
}

/** 视频生成响应 */
export interface VideoGenResponse {
videoUrl: string;
thumbnailUrl?: string;
duration: number;
model: string;
}

/** 文案生成请求 */
export interface CopyGenRequest {
copyType: 'headline' | 'tagline' | 'body' | 'slogan' | 'description';
brandName: string;
product: string;
targetAudience: string;
tone: 'professional' | 'casual' | 'playful' | 'luxury' | 'urgent';
keyMessage: string;
maxLength?: number;
variations?: number;
}

/** 文案生成响应 */
export interface CopyGenResponse {
variations: Array<{
text: string;
wordCount: number;
tone: string;
}>;
}

/** 智能编辑请求 */
export interface SmartEditRequest {
sourceUrl: string;
editType: 'background-remove' | 'object-remove' | 'upscale' | 'style-transfer' | 'extend';
parameters?: Record<string, any>;
}

/** 智能编辑响应 */
export interface SmartEditResponse {
editedUrl: string;
originalUrl: string;
editType: string;
}

---

## 5. 智能体实现

### 5.1 创建 `services/agents/prompts/coco.ts`

typescript
// =============================================================================
// Coco - 前台接待智能体系统提示词
// =============================================================================

export const COCO_SYSTEM_PROMPT = `# 角色定义
你是 Coco，XC-STUDIO 的首席接待专家和用户体验大使。你是用户进入 AI 设计世界的第一个接触点。

# 核心职责

1. **需求理解**: 准确把握用户的设计意图
2. **任务路由**: 将任务分配给最合适的专业智能体
3. **状态跟踪**: 监控任务进度并主动汇报
4. **答疑解惑**: 解答用户关于平台功能的疑问

# 性格特点

- 友善、专业、高效
- 善于理解用户真实需求
- 积极引导但不强迫
- 保持温暖的同时确保精准

# 路由规则

根据用户需求，选择最合适的智能体：

| 用户需求关键词 | 目标智能体 |
|---------------|-----------|
| 品牌、VI、Logo、品牌手册、视觉识别 | vireo |
| 故事板、分镜、脚本可视化、剧本 | cameron |
| 海报、Banner、宣传图、广告图 | poster |
| 包装、产品包装、礼盒、瓶身 | package |
| 动效、动画、Motion Graphics、GIF | motion |
| 营销活动、Campaign、多渠道推广 | campaign |

# 输出格式

当需要路由到专业智能体时，返回以下 JSON：
\`\`\`json
{
"action": "route",
"targetAgent": "智能体ID",
"taskType": "任务类型描述",
"complexity": "simple 或 complex",
"handoffMessage": "给专业智能体的交接说明",
"confidence": 0.95
}
\`\`\`

当需要向用户澄清需求时：
\`\`\`json
{
"action": "clarify",
"questions": ["问题1", "问题2"],
"suggestions": ["建议1", "建议2"]
}
\`\`\`

当可以直接回答时：
\`\`\`json
{
"action": "respond",
"message": "你的回复内容"
}
\`\`\`

# 交互原则

1. 首次对话时简短自我介绍
2. 主动确认理解是否正确
3. 复杂需求时拆解成多个步骤
4. 始终保持积极乐观的态度
   `;

export const COCO_AGENT_INFO = {
id: 'coco' as const,
name: 'Coco',
avatar: '👋',
description: '你的专属设计助手，帮你找到最合适的专家',
capabilities: ['需求分析', '任务路由', '进度跟踪', '问题解答'],
color: '#FF6B6B'
};

### 5.2 创建 `services/agents/prompts/vireo.ts`

typescript
// =============================================================================
// Vireo - 品牌VI智能体系统提示词
// =============================================================================

export const VIREO_SYSTEM_PROMPT = `# 角色定义
你是 Vireo，XC-STUDIO 的品牌视觉识别系统专家。你专注于将品牌理念转化为一致、有力的视觉语言。

# 专业领域

- Logo 设计与演变系统
- 色彩系统构建（主色、辅助色、功能色）
- 字体选择与排版规范
- 品牌应用指南
- VI 手册编制

# 设计流程

1. **品牌调研**: 理解品牌定位、目标用户、竞品分析
2. **概念构思**: 提出 3-5 个设计方向
3. **视觉创作**: 生成 Logo、色彩、字体方案
4. **系统延展**: 构建完整 VI 系统
5. **规范输出**: 生成品牌手册

# 可用技能

- \`generateImage\`: 生成 Logo 概念图、色彩灵感板
- \`generateCopy\`: 生成品牌标语、品牌故事
- \`smartEdit\`: 调整颜色、去除背景
- \`export\`: 导出多种格式

# 输出标准

- Logo 必须提供多种形态：主标志、辅助图形、图标版本
- 色彩方案包含：主色(1-2个)、辅助色(2-3个)、功能色(成功/警告/错误)
- 提供正确使用示例和错误示例
- 最小尺寸和安全区域规范

# 回复格式

分析用户需求后，输出：
\`\`\`json
{
"understanding": "我对你需求的理解...",
"approach": "我的设计思路...",
"steps": ["步骤1", "步骤2", "步骤3"],
"skillCalls": [
{
"skill": "generateImage",
"params": { "prompt": "...", "style": "..." }
}
],
"questions": ["如果有需要澄清的问题"]
}
\`\`\`
`;

export const VIREO_AGENT_INFO = {
id: 'vireo' as const,
name: 'Vireo',
avatar: '🎨',
description: '品牌视觉识别专家，打造独特品牌形象',
capabilities: ['Logo设计', '色彩系统', '字体规范', 'VI手册'],
color: '#4ECDC4'
};

### 5.3 创建 `services/agents/prompts/poster.ts`

typescript
// =============================================================================
// Poster - 海报设计智能体系统提示词
// =============================================================================

export const POSTER_SYSTEM_PROMPT = `# 角色定义
你是 Poster，XC-STUDIO 的海报与平面设计专家。你擅长创造视觉冲击力强、信息传达清晰的平面作品。

# 专业领域

- 商业海报设计
- 社交媒体图片
- Banner 广告
- 宣传物料
- 数字广告创意

# 设计能力

1. **构图**: 黄金比例、三分法、对角线、中心对称
2. **色彩**: 互补色、类似色、单色、三色组合
3. **字体**: 标题字体、正文字体、装饰字体搭配
4. **元素**: 图形、图标、纹理、渐变

# 尺寸规范

| 用途 | 尺寸 | 比例 |
|------|------|------|
| Instagram 帖子 | 1080×1080 | 1:1 |
| Instagram 故事 | 1080×1920 | 9:16 |
| 微信朋友圈 | 1080×1440 | 3:4 |
| 横版海报 | 1920×1080 | 16:9 |
| 竖版海报 | 1080×1920 | 9:16 |
| A4 印刷 | 2480×3508 | - |

# 回复格式

\`\`\`json
{
"concept": "创意概念说明",
"visualElements": {
"mainVisual": "主视觉描述",
"colorScheme": ["#color1", "#color2"],
"typography": "字体选择",
"layout": "布局说明"
},
"skillCalls": [
{
"skill": "generateImage",
"params": {
"prompt": "详细的生成提示词",
"aspectRatio": "1:1",
"style": "commercial, modern, vibrant"
}
}
],
"variations": "建议的变体方案"
}
\`\`\`
`;

export const POSTER_AGENT_INFO = {
id: 'poster' as const,
name: 'Poster',
avatar: '🖼️',
description: '海报与平面设计专家，创造视觉冲击',
capabilities: ['海报设计', 'Banner制作', '社媒图片', '广告创意'],
color: '#FF9F43'
};

### 5.4 创建其他智能体提示词

按照同样模式创建以下文件：

- `services/agents/prompts/cameron.ts` - 故事板专家
- `services/agents/prompts/package.ts` - 包装设计专家
- `services/agents/prompts/motion.ts` - 动效设计专家
- `services/agents/prompts/campaign.ts` - 营销活动专家

---

## 6. 核心服务实现

### 6.1 创建 `services/agents/orchestrator.ts`

typescript
// =============================================================================
// Orchestrator - 主调度系统
// =============================================================================

import { GoogleGenAI } from '@google/genai';
import { AgentType, AgentRoutingDecision, AgentTask, ProjectContext } from '../../types';
import { COCO_SYSTEM_PROMPT } from './prompts/coco';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface OrchestratorInput {
message: string;
attachments?: string[];
projectContext?: ProjectContext;
conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}

interface OrchestratorOutput {
decision: AgentRoutingDecision | null;
directResponse: string | null;
clarifyQuestions: string[] | null;
}

/**

* 主调度器 - 分析用户意图并路由到合适的智能体
  */
  export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const { message, attachments, projectContext, conversationHistory } = input;

// 构建上下文信息
const contextInfo = projectContext ? `当前项目: ${projectContext.projectTitle} 品牌信息: ${JSON.stringify(projectContext.brandInfo || {})} 已有素材数量: ${projectContext.existingAssets.length}` : '';

// 构建对话历史
const historyText = conversationHistory?.map(h =>
`${h.role === 'user' ? '用户' : '助手'}: ${h.text}`
).join('\n') || '';

const prompt = `
${COCO_SYSTEM_PROMPT}

---

# 当前上下文

${contextInfo}

# 对话历史

${historyText}

# 用户最新消息

${message}

# 附件

${attachments?.length ? `用户上传了 ${attachments.length} 个文件` : '无附件'}

---

请分析用户意图并决定下一步行动。严格按照 JSON 格式输出。
`;

try {
const response = await ai.models.generateContent({
model: 'gemini-3-pro-preview',
contents: { parts: [{ text: prompt }] },
config: {
temperature: 0.3,
responseMimeType: 'application/json'
}
});

```
const result = JSON.parse(response.text || '{}');

if (result.action === 'route') {
  return {
    decision: {
      targetAgent: result.targetAgent as AgentType,
      taskType: result.taskType,
      complexity: result.complexity,
      handoffMessage: result.handoffMessage,
      confidence: result.confidence || 0.9
    },
    directResponse: null,
    clarifyQuestions: null
  };
} else if (result.action === 'clarify') {
  return {
    decision: null,
    directResponse: null,
    clarifyQuestions: result.questions
  };
} else {
  return {
    decision: null,
    directResponse: result.message,
    clarifyQuestions: null
  };
}
```

} catch (error) {
console.error('Orchestrator error:', error);
return {
decision: null,
directResponse: '抱歉，我遇到了一些问题。请稍后重试或换种方式描述你的需求。',
clarifyQuestions: null
};
}
}

/**

* 获取智能体信息
  */
  export function getAgentInfo(agentId: AgentType) {
  const agents = {
  coco: { id: 'coco', name: 'Coco', avatar: '👋', color: '#FF6B6B' },
  vireo: { id: 'vireo', name: 'Vireo', avatar: '🎨', color: '#4ECDC4' },
  cameron: { id: 'cameron', name: 'Cameron', avatar: '🎬', color: '#A55EEA' },
  poster: { id: 'poster', name: 'Poster', avatar: '🖼️', color: '#FF9F43' },
  package: { id: 'package', name: 'Package', avatar: '📦', color: '#26DE81' },
  motion: { id: 'motion', name: 'Motion', avatar: '✨', color: '#FD79A8' },
  campaign: { id: 'campaign', name: 'Campaign', avatar: '📢', color: '#74B9FF' }
  };
  return agents[agentId];
  }

### 6.2 创建 `services/agents/base.agent.ts`

typescript
// =============================================================================
// BaseAgent - 智能体基类
// =============================================================================

import { GoogleGenAI, Chat, Content } from '@google/genai';
import { AgentType, AgentTask, ProjectContext, GeneratedAsset } from '../../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AgentConfig {
id: AgentType;
name: string;
systemPrompt: string;
model?: string;
temperature?: number;
}

export interface AgentInput {
message: string;
attachments?: string[];
projectContext?: ProjectContext;
handoffMessage?: string;
}

export interface AgentOutput {
message: string;
assets?: GeneratedAsset[];
nextSteps?: string[];
skillCalls?: Array<{
skill: string;
params: Record<string, any>;
result?: any;
}>;
}

export abstract class BaseAgent {
protected config: AgentConfig;
protected chat: Chat | null = null;

constructor(config: AgentConfig) {
this.config = config;
}

/**

* 初始化聊天会话
  */
  protected initChat(history: Content[] = []): Chat {
  return ai.chats.create({
  model: this.config.model || 'gemini-3-pro-preview',
  history,
  config: {
  systemInstruction: this.config.systemPrompt,
  temperature: this.config.temperature || 0.7,
  }
  });
  }

/**

* 处理任务 - 子类可覆盖
  */
  async process(input: AgentInput): Promise<AgentOutput> {
  if (!this.chat) {
  this.chat = this.initChat();
  }

```
const contextPart = input.projectContext ? `
```

[项目上下文]
项目名称: ${input.projectContext.projectTitle}
品牌信息: ${JSON.stringify(input.projectContext.brandInfo || {})}
` : '';

```
const handoffPart = input.handoffMessage ? `
```

[Coco 的交接说明]
${input.handoffMessage}
` : '';

```
const fullMessage = `${contextPart}${handoffPart}
```

[用户消息]
${input.message}`;

```
try {
  const response = await this.chat.sendMessage({ 
    message: [{ text: fullMessage }] 
  });

  // 解析响应
  const text = response.text || '';
  
  // 尝试解析 JSON 格式的响应
  try {
    const parsed = JSON.parse(text);
    return this.handleStructuredResponse(parsed, input);
  } catch {
    // 如果不是 JSON，返回纯文本
    return {
      message: text,
      nextSteps: []
    };
  }
} catch (error) {
  console.error(`${this.config.name} agent error:`, error);
  return {
    message: '抱歉，处理过程中出现了问题。请稍后重试。',
    nextSteps: []
  };
}
```

}

/**

* 处理结构化响应 - 子类可覆盖
  */
  protected async handleStructuredResponse(
  parsed: any,
  input: AgentInput
  ): Promise<AgentOutput> {
  return {
  message: parsed.understanding || parsed.message || '处理完成',
  nextSteps: parsed.steps || [],
  skillCalls: parsed.skillCalls || []
  };
  }

/**

* 重置会话
  */
  reset(): void {
  this.chat = null;
  }
  }

### 6.3 创建 `services/agents/poster.agent.ts`

typescript
// =============================================================================
// PosterAgent - 海报设计智能体
// =============================================================================

import { BaseAgent, AgentInput, AgentOutput } from './base.agent';
import { POSTER_SYSTEM_PROMPT, POSTER_AGENT_INFO } from './prompts/poster';
import { generateImage as geminiGenerateImage } from '../gemini';
import { GeneratedAsset } from '../../types';

export class PosterAgent extends BaseAgent {
constructor() {
super({
id: 'poster',
name: 'Poster',
systemPrompt: POSTER_SYSTEM_PROMPT,
temperature: 0.8
});
}

protected async handleStructuredResponse(
parsed: any,
input: AgentInput
): Promise<AgentOutput> {
const assets: GeneratedAsset[] = [];
const skillResults: any[] = [];

```
// 执行技能调用
if (parsed.skillCalls && Array.isArray(parsed.skillCalls)) {
  for (const call of parsed.skillCalls) {
    if (call.skill === 'generateImage') {
      try {
        const imageUrl = await geminiGenerateImage({
          prompt: call.params.prompt,
          model: call.params.model || 'Nano Banana Pro',
          aspectRatio: call.params.aspectRatio || '1:1',
          imageSize: call.params.imageSize || '2K',
          referenceImage: call.params.referenceImage
        });

        if (imageUrl) {
          assets.push({
            id: `asset-${Date.now()}`,
            type: 'image',
            url: imageUrl,
            metadata: {
              prompt: call.params.prompt,
              model: call.params.model || 'Nano Banana Pro'
            }
          });
          skillResults.push({ skill: call.skill, success: true, url: imageUrl });
        }
      } catch (error) {
        console.error('Image generation failed:', error);
        skillResults.push({ skill: call.skill, success: false, error: String(error) });
      }
    }
  }
}

// 构建响应消息
let message = parsed.concept || parsed.understanding || '设计方案已生成';

if (assets.length > 0) {
  message += `\n\n✅ 已为你生成 ${assets.length} 张设计图`;
}

if (parsed.variations) {
  message += `\n\n💡 建议: ${parsed.variations}`;
}

return {
  message,
  assets,
  nextSteps: parsed.nextSteps || [
    '调整颜色或风格',
    '生成更多变体',
    '修改文案内容',
    '导出高清版本'
  ],
  skillCalls: skillResults
};
```

}
}

// 单例导出
export const posterAgent = new PosterAgent();

### 6.4 创建 `services/agents/index.ts`

typescript
// =============================================================================
// Agents Index - 智能体统一导出
// =============================================================================

import { AgentType } from '../../types';
import { BaseAgent } from './base.agent';
import { posterAgent, PosterAgent } from './poster.agent';
// 按需导入其他智能体
// import { vireoAgent } from './vireo.agent';
// import { cameronAgent } from './cameron.agent';
// ...

// 智能体注册表
const agentRegistry: Map<AgentType, BaseAgent> = new Map();

// 注册智能体
agentRegistry.set('poster', posterAgent);
// agentRegistry.set('vireo', vireoAgent);
// ...

/**

* 获取智能体实例
  */
  export function getAgent(agentId: AgentType): BaseAgent | undefined {
  return agentRegistry.get(agentId);
  }

/**

* 执行智能体任务
  */
  export async function executeAgentTask(
  agentId: AgentType,
  input: {
  message: string;
  attachments?: string[];
  projectContext?: any;
  handoffMessage?: string;
  }
  ) {
  const agent = getAgent(agentId);
  if (!agent) {
  throw new Error(`Agent ${agentId} not found`);
  }
  return agent.process(input);
  }

// 导出所有
export { orchestrate, getAgentInfo } from './orchestrator';
export { BaseAgent } from './base.agent';
export { posterAgent } from './poster.agent';

---

## 7. 共享技能模块

### 7.1 创建 `services/skills/image-gen.skill.ts`

typescript
// =============================================================================
// Image Generation Skill - 统一图像生成接口
// =============================================================================

import { generateImage as geminiGenerateImage, ImageGenerationConfig } from '../gemini';
import { ImageGenRequest, ImageGenResponse } from '../../types/skills';

/**

* 图像生成技能
* 封装底层 API，提供统一接口给所有智能体使用
  */
  export async function generateImage(request: ImageGenRequest): Promise<ImageGenResponse | null> {
  // 构建完整的提示词
  let fullPrompt = request.prompt;

if (request.style) {
fullPrompt += `, ${request.style} style`;
}

if (request.mood) {
fullPrompt += `, ${request.mood} mood`;
}

if (request.brandContext?.colors) {
fullPrompt += `, using colors: ${request.brandContext.colors.join(', ')}`;
}

if (request.brandContext?.style) {
fullPrompt += `, brand style: ${request.brandContext.style}`;
}

// 映射模型
const modelMap: Record<string, ImageGenerationConfig['model']> = {
'auto': 'Nano Banana Pro',
'nano-banana': 'Nano Banana',
'nano-banana-pro': 'Nano Banana Pro'
};

const config: ImageGenerationConfig = {
prompt: fullPrompt,
model: modelMap[request.model] || 'Nano Banana Pro',
aspectRatio: request.aspectRatio,
imageSize: '2K',
referenceImage: request.referenceImage
};

try {
const imageUrl = await geminiGenerateImage(config);

```
if (imageUrl) {
  return {
    imageUrl,
    seed: Date.now(), // Gemini 不返回 seed，用时间戳代替
    model: config.model,
    prompt: fullPrompt
  };
}
return null;
```

} catch (error) {
console.error('Image generation skill error:', error);
throw error;
}
}

### 7.2 创建 `services/skills/video-gen.skill.ts`

typescript
// =============================================================================
// Video Generation Skill - 统一视频生成接口
// =============================================================================

import { generateVideo as geminiGenerateVideo, VideoGenerationConfig } from '../gemini';
import { VideoGenRequest, VideoGenResponse } from '../../types/skills';

/**

* 视频生成技能
  */
  export async function generateVideo(request: VideoGenRequest): Promise<VideoGenResponse | null> {
  // 映射模型
  const modelMap: Record<string, VideoGenerationConfig['model']> = {
  'auto': 'Veo 3.1',
  'veo-3.1': 'Veo 3.1',
  'veo-3.1-fast': 'Veo 3.1 Fast'
  };

const config: VideoGenerationConfig = {
prompt: request.prompt,
model: modelMap[request.model] || 'Veo 3.1',
aspectRatio: request.aspectRatio,
startFrame: request.startFrame,
endFrame: request.endFrame,
referenceImages: request.referenceImages
};

try {
const videoUrl = await geminiGenerateVideo(config);

```
if (videoUrl) {
  return {
    videoUrl,
    duration: request.duration === '5s' ? 5 : 10,
    model: config.model
  };
}
return null;
```

} catch (error) {
console.error('Video generation skill error:', error);
throw error;
}
}

### 7.3 创建 `services/skills/copy-gen.skill.ts`

typescript
// =============================================================================
// Copy Generation Skill - 文案生成
// =============================================================================

import { GoogleGenAI } from '@google/genai';
import { CopyGenRequest, CopyGenResponse } from '../../types/skills';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**

* 文案生成技能
  */
  export async function generateCopy(request: CopyGenRequest): Promise<CopyGenResponse> {
  const prompt = `
  你是一位资深文案专家。请根据以下信息生成${request.variations || 3}个文案变体：

品牌名称: ${request.brandName}
产品/服务: ${request.product}
目标受众: ${request.targetAudience}
核心信息: ${request.keyMessage}
文案类型: ${request.copyType}
语调风格: ${request.tone}
${request.maxLength ? `最大字数: ${request.maxLength}` : ''}

请以 JSON 格式返回，格式如下：
{
"variations": [
{ "text": "文案内容", "wordCount": 字数, "tone": "语调" }
]
}
`;

try {
const response = await ai.models.generateContent({
model: 'gemini-3-flash-preview',
contents: { parts: [{ text: prompt }] },
config: {
temperature: 0.9,
responseMimeType: 'application/json'
}
});

```
return JSON.parse(response.text || '{"variations":[]}');
```

} catch (error) {
console.error('Copy generation error:', error);
return { variations: [] };
}
}

### 7.4 创建 `services/skills/index.ts`

typescript
// =============================================================================
// Skills Index - 技能模块统一导出
// =============================================================================

export { generateImage } from './image-gen.skill';
export { generateVideo } from './video-gen.skill';
export { generateCopy } from './copy-gen.skill';

// 技能注册表（供智能体动态调用）
export const skillRegistry = {
generateImage: () => import('./image-gen.skill').then(m => m.generateImage),
generateVideo: () => import('./video-gen.skill').then(m => m.generateVideo),
generateCopy: () => import('./copy-gen.skill').then(m => m.generateCopy),
};

/**

* 动态执行技能
  */
  export async function executeSkill(
  skillName: string,
  params: Record<string, any>
  ): Promise<any> {
  const skillLoader = skillRegistry[skillName as keyof typeof skillRegistry];
  if (!skillLoader) {
  throw new Error(`Skill ${skillName} not found`);
  }
  const skillFn = await skillLoader();
  return skillFn(params);
  }

---

## 8. React Hooks

### 8.1 创建 `hooks/useAgent.ts`

typescript
// =============================================================================
// useAgent Hook - 智能体交互管理
// =============================================================================

import { useState, useCallback, useRef } from 'react';
import { AgentType, AgentTask, AgentChatMessage, ProjectContext } from '../types';
import { orchestrate, executeAgentTask, getAgentInfo } from '../services/agents';

interface UseAgentReturn {
currentAgent: AgentType;
messages: AgentChatMessage[];
isProcessing: boolean;
sendMessage: (message: string, attachments?: string[]) => Promise<void>;
switchAgent: (agentId: AgentType) => void;
clearHistory: () => void;
}

export function useAgent(projectContext?: ProjectContext): UseAgentReturn {
const [currentAgent, setCurrentAgent] = useState<AgentType>('coco');
const [messages, setMessages] = useState<AgentChatMessage[]>([]);
const [isProcessing, setIsProcessing] = useState(false);

const conversationHistory = useRef<Array<{ role: 'user' | 'model'; text: string }>>([]);

const addMessage = useCallback((message: Omit<AgentChatMessage, 'id' | 'timestamp'>) => {
const newMessage: AgentChatMessage = {
...message,
id: `msg-${Date.now()}`,
timestamp: Date.now()
};
setMessages(prev => [...prev, newMessage]);
return newMessage;
}, []);

const sendMessage = useCallback(async (message: string, attachments?: string[]) => {
if (!message.trim() && !attachments?.length) return;

```
setIsProcessing(true);

// 添加用户消息
addMessage({
  role: 'user',
  text: message,
  attachments
});

conversationHistory.current.push({ role: 'user', text: message });

try {
  // 如果当前是 Coco（调度器），先进行路由分析
  if (currentAgent === 'coco') {
    const routeResult = await orchestrate({
      message,
      attachments,
      projectContext,
      conversationHistory: conversationHistory.current
    });

    if (routeResult.decision) {
      // 需要路由到专业智能体
      const agentInfo = getAgentInfo(routeResult.decision.targetAgent);
      
      // 添加 Coco 的路由消息
      addMessage({
        role: 'model',
        text: `我帮你找到了最合适的专家 ${agentInfo?.name}(${agentInfo?.avatar})！\n\n${routeResult.decision.handoffMessage}`,
        agentId: 'coco'
      });

      // 切换到目标智能体
      setCurrentAgent(routeResult.decision.targetAgent);

      // 调用专业智能体处理
      const agentResponse = await executeAgentTask(routeResult.decision.targetAgent, {
        message,
        attachments,
        projectContext,
        handoffMessage: routeResult.decision.handoffMessage
      });

      // 添加智能体响应
      addMessage({
        role: 'model',
        text: agentResponse.message,
        agentId: routeResult.decision.targetAgent,
        assets: agentResponse.assets
      });

      conversationHistory.current.push({ role: 'model', text: agentResponse.message });

    } else if (routeResult.clarifyQuestions) {
      // 需要澄清
      addMessage({
        role: 'model',
        text: `为了更好地帮助你，我想确认几个问题：\n\n${routeResult.clarifyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
        agentId: 'coco'
      });
    } else if (routeResult.directResponse) {
      // 直接回复
      addMessage({
        role: 'model',
        text: routeResult.directResponse,
        agentId: 'coco'
      });
      conversationHistory.current.push({ role: 'model', text: routeResult.directResponse });
    }
  } else {
    // 当前已经在专业智能体，直接处理
    const agentResponse = await executeAgentTask(currentAgent, {
      message,
      attachments,
      projectContext
    });

    addMessage({
      role: 'model',
      text: agentResponse.message,
      agentId: currentAgent,
      assets: agentResponse.assets
    });

    conversationHistory.current.push({ role: 'model', text: agentResponse.message });
  }
} catch (error) {
  console.error('Agent error:', error);
  addMessage({
    role: 'model',
    text: '抱歉，处理过程中出现了问题。请稍后重试。',
    agentId: currentAgent
  });
} finally {
  setIsProcessing(false);
}
```

}, [currentAgent, projectContext, addMessage]);

const switchAgent = useCallback((agentId: AgentType) => {
setCurrentAgent(agentId);
const info = getAgentInfo(agentId);
addMessage({
role: 'model',
text: `你好！我是 ${info?.name} ${info?.avatar}，很高兴为你服务！有什么我可以帮助你的吗？`,
agentId
});
}, [addMessage]);

const clearHistory = useCallback(() => {
setMessages([]);
conversationHistory.current = [];
setCurrentAgent('coco');
}, []);

return {
currentAgent,
messages,
isProcessing,
sendMessage,
switchAgent,
clearHistory
};
}

---

## 9. UI 组件

### 9.1 创建 `components/AgentAvatar.tsx`

typescript
import React from 'react';
import { AgentType } from '../types';
import { getAgentInfo } from '../services/agents';

interface AgentAvatarProps {
agentId: AgentType;
size?: 'sm' | 'md' | 'lg';
showName?: boolean;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
agentId,
size = 'md',
showName = false
}) => {
const info = getAgentInfo(agentId);

const sizeClasses = {
sm: 'w-6 h-6 text-sm',
md: 'w-8 h-8 text-base',
lg: 'w-12 h-12 text-xl'
};

return (
<div className="flex items-center gap-2">
<div
className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
style={{ backgroundColor: info?.color + '20' }}
>
<span>{info?.avatar}</span>
</div>
{showName && (
<span className="text-sm font-medium" style={{ color: info?.color }}>
{info?.name}
</span>
)}
</div>
);
};

### 9.2 创建 `components/AgentSelector.tsx`

typescript
import React from 'react';
import { motion } from 'framer-motion';
import { AgentType } from '../types';
import { getAgentInfo } from '../services/agents';

interface AgentSelectorProps {
currentAgent: AgentType;
onSelect: (agentId: AgentType) => void;
}

const AGENTS: AgentType[] = ['coco', 'vireo', 'poster', 'cameron', 'package', 'motion', 'campaign'];

export const AgentSelector: React.FC<AgentSelectorProps> = ({ currentAgent, onSelect }) => {
return (
<div className="flex gap-2 p-2 bg-white/5 rounded-lg">
{AGENTS.map(agentId => {
const info = getAgentInfo(agentId);
const isActive = currentAgent === agentId;

```
return (
      <motion.button
        key={agentId}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(agentId)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
          ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
        `}
        style={{
          borderColor: isActive ? info?.color : 'transparent',
          borderWidth: 1
        }}
      >
        <span>{info?.avatar}</span>
        <span className="text-sm" style={{ color: isActive ? info?.color : '#888' }}>
          {info?.name}
        </span>
      </motion.button>
    );
  })}
</div>
```

);
};

---

## 10. Workspace 集成

### 10.1 修改 `pages/Workspace.tsx`

在现有 Workspace.tsx 中添加智能体支持。以下是需要修改的关键部分：

typescript
// 在文件顶部添加导入
import { useAgent } from '../hooks/useAgent';
import { AgentAvatar } from '../components/AgentAvatar';
import { AgentSelector } from '../components/AgentSelector';
import { AgentChatMessage, ProjectContext } from '../types';

// 在 Workspace 组件内部添加
const Workspace: React.FC = () => {
// ... 现有状态 ...

// 构建项目上下文
const projectContext: ProjectContext = {
projectId: id || 'temp',
projectTitle: projectTitle,
existingAssets: elements,
designHistory: []
};

// 使用智能体 Hook
const {
currentAgent,
messages: agentMessages,
isProcessing: isAgentProcessing,
sendMessage: sendAgentMessage,
switchAgent,
clearHistory
} = useAgent(projectContext);

// 修改 handleSend 函数，集成智能体
const handleSend = async () => {
// 收集输入内容
const textContent = inputBlocks
.filter(b => b.type === 'text' && b.text?.trim())
.map(b => b.text)
.join('\n');

```
const fileBlocks = inputBlocks.filter(b => b.type === 'file' && b.file);
const attachments: string[] = [];

for (const block of fileBlocks) {
  if (block.file) {
    const base64 = await fileToBase64(block.file);
    attachments.push(base64);
  }
}

if (!textContent && attachments.length === 0) return;

// 使用智能体系统发送消息
await sendAgentMessage(textContent, attachments);

// 清空输入
setInputBlocks([{ id: 'init', type: 'text', text: '' }]);
```

};

// 修改消息渲染部分，显示智能体头像
const renderMessage = (message: AgentChatMessage) => (
<div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
{message.role === 'model' && message.agentId && (
<AgentAvatar agentId={message.agentId} size="sm" />
)}
<div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10'}`}>
<p className="whitespace-pre-wrap">{message.text}</p>

```
{/* 渲染生成的资产 */}
    {message.assets && message.assets.length > 0 && (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {message.assets.map(asset => (
          <img
            key={asset.id}
            src={asset.url}
            alt="Generated"
            className="rounded cursor-pointer hover:opacity-80"
            onClick={() => {
              // 添加到画布
              addElement('gen-image', asset.url, {
                width: 400,
                height: 400,
                genPrompt: asset.metadata.prompt
              });
            }}
          />
        ))}
      </div>
    )}
  </div>
</div>
```

);

// ... 其余代码保持不变 ...
};

// 辅助函数
async function fileToBase64(file: File): Promise<string> {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve(reader.result as string);
reader.onerror = reject;
reader.readAsDataURL(file);
});
}

---

## 11. 实施计划

### Phase 1: 基础架构（第1周）

- [ ] 创建目录结构
- [ ] 添加类型定义到 `types.ts`
- [ ] 创建 `types/skills.ts`
- [ ] 实现 `services/agents/orchestrator.ts`
- [ ] 实现 `services/agents/base.agent.ts`

### Phase 2: 核心智能体（第2周）

- [ ] 创建所有智能体提示词 (`prompts/*.ts`)
- [ ] 实现 `poster.agent.ts`（作为模板）
- [ ] 实现其他智能体（按优先级）
- [ ] 创建 `services/agents/index.ts`

### Phase 3: 技能模块（第3周）

- [ ] 实现 `services/skills/image-gen.skill.ts`
- [ ] 实现 `services/skills/video-gen.skill.ts`
- [ ] 实现 `services/skills/copy-gen.skill.ts`
- [ ] 创建 `services/skills/index.ts`

### Phase 4: UI 集成（第4周）

- [ ] 创建 `hooks/useAgent.ts`
- [ ] 创建 `components/AgentAvatar.tsx`
- [ ] 创建 `components/AgentSelector.tsx`
- [ ] 修改 `Workspace.tsx` 集成智能体

### Phase 5: 测试与优化（第5周）

- [ ] 端到端测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 文档编写

---

## 12. 注意事项

1. **保持现有功能**: 所有修改都是增量式的，不要删除或破坏现有代码
2. **API Key 管理**: 继续使用现有的 `process.env.API_KEY`
3. **错误处理**: 使用现有 `retryWithBackoff` 函数处理 API 重试
4. **类型安全**: 所有新代码必须完整类型标注
5. **渐进式开发**: 先实现一个智能体（Poster），测试通过后再扩展其他

---

**这份 PRD 已根据您的实际项目结构进行了调整。请问是否需要我对某个部分进行更详细的说明，或者开始实现某个特定模块？**

用户想让我写一份PRD/文档，让Claude Code能够使用这些现有的skills文件夹中的内容。从截图来看，用户本地有以下文件夹：

- api-design-patterns
- deployment-pipeline-design
- docker-containerization
- frontend-design
- typescript

用户希望我写一份文档，让Claude Code（Anthropic的AI编程助手）能够直接使用这些skills来完成XC-STUDIO的智能体系统集成。

我需要写一份清晰的指令文档/PRD，让Claude Code能够：

1. 理解项目背景
2. 知道要参考哪些本地文件
3. 明确要实现的功能
4. 按照步骤执行

这应该是一份给Claude Code使用的指令文档。

好的，我来写一份供 Claude Code 直接使用的指令文档：

---

# XC-STUDIO AI 智能体系统集成指令

## 给 Claude Code 的执行指令

---

### 项目背景

你正在为 XC-STUDIO 项目集成 AI 多智能体系统。这是一个基于 **React 19 + Vite + TypeScript** 的 AI 设计工作室应用。

**GitHub 仓库**: https://github.com/xiaoche0907/XC-STUDIO

**现有技术栈**:

- React 19 + Vite 6 + TypeScript
- react-router-dom v7 (HashRouter)
- Tailwind CSS v4
- framer-motion
- @google/genai (Gemini API)

---

### 参考文档

在开始之前，请先阅读以下本地文件夹中的设计规范：

请读取以下文件夹内容作为设计参考：

- ./api-design-patterns/     → API接口设计规范
- ./frontend-design/         → 前端架构设计规范
- ./typescript/              → TypeScript类型规范

---

### 任务目标

在现有 XC-STUDIO 项目基础上，**增量式**添加以下功能：

1. **智能体调度系统** - 根据用户意图自动分配任务
2. **7个专业智能体** - Coco/Vireo/Cameron/Poster/Package/Motion/Campaign
3. **共享技能模块** - 图像生成/视频生成/文案生成/智能编辑/导出
4. **上下文管理** - 项目级设计一致性
5. **用户记忆** - 偏好学习

---

### 目录结构

请在项目中创建以下新目录和文件：

XC-STUDIO/
├── services/
│   ├── agents/                    # 🆕 智能体服务
│   │   ├── index.ts               # 统一导出
│   │   ├── orchestrator.ts        # 主调度器
│   │   ├── base.agent.ts          # 智能体基类
│   │   ├── coco.agent.ts          # 前台接待
│   │   ├── vireo.agent.ts         # 品牌VI
│   │   ├── cameron.agent.ts       # 故事板
│   │   ├── poster.agent.ts        # 海报
│   │   ├── package.agent.ts       # 包装
│   │   ├── motion.agent.ts        # 动效
│   │   ├── campaign.agent.ts      # 营销活动
│   │   └── prompts/               # 系统提示词
│   │       ├── coco.ts
│   │       ├── vireo.ts
│   │       ├── cameron.ts
│   │       ├── poster.ts
│   │       ├── package.ts
│   │       ├── motion.ts
│   │       └── campaign.ts
│   │
│   ├── skills/                    # 🆕 共享技能
│   │   ├── index.ts
│   │   ├── image-gen.skill.ts
│   │   ├── video-gen.skill.ts
│   │   ├── copy-gen.skill.ts
│   │   ├── smart-edit.skill.ts
│   │   └── export.skill.ts
│   │
│   └── context/                   # 🆕 上下文管理
│       ├── project-context.ts
│       └── user-memory.ts
│
├── components/                    # 🆕 UI组件
│   └── agents/
│       ├── AgentAvatar.tsx
│       ├── AgentSelector.tsx
│       └── TaskProgress.tsx
│
├── hooks/                         # 🆕 Hooks
│   ├── useAgent.ts
│   └── useProjectContext.ts
│
└── types/                         # 🆕 扩展类型
├── agents.ts
└── skills.ts

---

### 第一步：创建类型定义

**创建 `types/agents.ts`**:

typescript
export type AgentType =
| 'coco' | 'vireo' | 'cameron' | 'poster'
| 'package' | 'motion' | 'campaign';

export interface AgentInfo {
id: AgentType;
name: string;
avatar: string;
description: string;
capabilities: string[];
color: string;
}

export type TaskStatus =
| 'pending' | 'analyzing' | 'planning'
| 'executing' | 'reviewing' | 'completed' | 'failed';

export interface AgentRoutingDecision {
targetAgent: AgentType;
taskType: string;
complexity: 'simple' | 'complex';
handoffMessage: string;
confidence: number;
}

export interface GeneratedAsset {
id: string;
type: 'image' | 'video' | 'text' | 'document';
url: string;
thumbnailUrl?: string;
metadata: {
width?: number;
height?: number;
duration?: number;
prompt?: string;
model?: string;
};
}

export interface AgentTask {
id: string;
agentId: AgentType;
status: TaskStatus;
input: { message: string; attachments?: string[] };
output?: { message: string; assets?: GeneratedAsset[] };
createdAt: number;
updatedAt: number;
}

**创建 `types/skills.ts`**:

typescript
export interface ImageGenRequest {
prompt: string;
style?: string;
aspectRatio: string;
model: 'auto' | 'nano-banana' | 'nano-banana-pro';
referenceImage?: string;
brandContext?: { colors?: string[]; style?: string };
}

export interface ImageGenResponse {
imageUrl: string;
seed: number;
model: string;
prompt: string;
}

export interface VideoGenRequest {
prompt: string;
aspectRatio: string;
duration: '5s' | '10s';
model: 'auto' | 'veo-3.1' | 'veo-3.1-fast';
startFrame?: string;
endFrame?: string;
}

export interface VideoGenResponse {
videoUrl: string;
duration: number;
model: string;
}

export interface CopyGenRequest {
copyType: 'headline' | 'tagline' | 'body' | 'slogan';
brandName: string;
product: string;
targetAudience: string;
tone: 'professional' | 'casual' | 'playful' | 'luxury';
keyMessage: string;
variations?: number;
}

export interface CopyGenResponse {
variations: Array<{ text: string; wordCount: number; tone: string }>;
}

export interface SmartEditRequest {
sourceUrl: string;
editType: 'background-remove' | 'object-remove' | 'upscale' | 'style-transfer';
parameters?: Record<string, any>;
}

export interface SmartEditResponse {
editedUrl: string;
editType: string;
}

---

### 第二步：创建共享技能模块

**创建 `services/skills/image-gen.skill.ts`**:

typescript
import { generateImage as geminiGenerateImage, ImageGenerationConfig } from '../gemini';
import { ImageGenRequest, ImageGenResponse } from '../../types/skills';

export async function generateImage(request: ImageGenRequest): Promise<ImageGenResponse | null> {
let fullPrompt = request.prompt;
if (request.style) fullPrompt += `, ${request.style} style`;
if (request.brandContext?.colors) {
fullPrompt += `, using colors: ${request.brandContext.colors.join(', ')}`;
}

const modelMap: Record<string, ImageGenerationConfig['model']> = {
'auto': 'Nano Banana Pro',
'nano-banana': 'Nano Banana',
'nano-banana-pro': 'Nano Banana Pro'
};

const config: ImageGenerationConfig = {
prompt: fullPrompt,
model: modelMap[request.model] || 'Nano Banana Pro',
aspectRatio: request.aspectRatio,
imageSize: '2K',
referenceImage: request.referenceImage
};

const imageUrl = await geminiGenerateImage(config);
if (imageUrl) {
return { imageUrl, seed: Date.now(), model: config.model, prompt: fullPrompt };
}
return null;
}

**创建 `services/skills/video-gen.skill.ts`**:

typescript
import { generateVideo as geminiGenerateVideo, VideoGenerationConfig } from '../gemini';
import { VideoGenRequest, VideoGenResponse } from '../../types/skills';

export async function generateVideo(request: VideoGenRequest): Promise<VideoGenResponse | null> {
const modelMap: Record<string, VideoGenerationConfig['model']> = {
'auto': 'Veo 3.1',
'veo-3.1': 'Veo 3.1',
'veo-3.1-fast': 'Veo 3.1 Fast'
};

const config: VideoGenerationConfig = {
prompt: request.prompt,
model: modelMap[request.model] || 'Veo 3.1',
aspectRatio: request.aspectRatio,
startFrame: request.startFrame,
endFrame: request.endFrame
};

const videoUrl = await geminiGenerateVideo(config);
if (videoUrl) {
return {
videoUrl,
duration: request.duration === '5s' ? 5 : 10,
model: config.model
};
}
return null;
}

**创建 `services/skills/copy-gen.skill.ts`**:

typescript
import { GoogleGenAI } from '@google/genai';
import { CopyGenRequest, CopyGenResponse } from '../../types/skills';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateCopy(request: CopyGenRequest): Promise<CopyGenResponse> {
const prompt = `
你是资深文案专家。根据以下信息生成${request.variations || 3}个文案变体：

- 品牌: ${request.brandName}
- 产品: ${request.product}
- 受众: ${request.targetAudience}
- 核心信息: ${request.keyMessage}
- 类型: ${request.copyType}
- 语调: ${request.tone}

返回JSON格式: {"variations":[{"text":"","wordCount":0,"tone":""}]}
`;

const response = await ai.models.generateContent({
model: 'gemini-3-flash-preview',
contents: { parts: [{ text: prompt }] },
config: { temperature: 0.9, responseMimeType: 'application/json' }
});

return JSON.parse(response.text || '{"variations":[]}');
}

**创建 `services/skills/smart-edit.skill.ts`**:

typescript
import { GoogleGenAI } from '@google/genai';
import { SmartEditRequest, SmartEditResponse } from '../../types/skills';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function smartEdit(request: SmartEditRequest): Promise<SmartEditResponse | null> {
// 根据编辑类型构建不同的处理逻辑
const editPrompts: Record<string, string> = {
'background-remove': 'Remove the background from this image, keep only the main subject',
'upscale': 'Enhance and upscale this image while preserving details',
'style-transfer': `Apply ${request.parameters?.style || 'artistic'} style to this image`
};

const prompt = editPrompts[request.editType] || 'Edit this image';

// 提取base64数据
const matches = request.sourceUrl.match(/^data:(.+);base64,(.+)$/);
if (!matches) return null;

const response = await ai.models.generateContent({
model: 'gemini-3-pro-image-preview',
contents: {
parts: [
{ inlineData: { mimeType: matches[1], data: matches[2] } },
{ text: prompt }
]
},
config: { imageConfig: { aspectRatio: '1:1' } }
});

for (const part of response.candidates?.[0]?.content?.parts || []) {
if (part.inlineData) {
return {
editedUrl: `data:image/png;base64,${part.inlineData.data}`,
editType: request.editType
};
}
}
return null;
}

**创建 `services/skills/index.ts`**:

typescript
export { generateImage } from './image-gen.skill';
export { generateVideo } from './video-gen.skill';
export { generateCopy } from './copy-gen.skill';
export { smartEdit } from './smart-edit.skill';

export const skillRegistry = {
generateImage: () => import('./image-gen.skill').then(m => m.generateImage),
generateVideo: () => import('./video-gen.skill').then(m => m.generateVideo),
generateCopy: () => import('./copy-gen.skill').then(m => m.generateCopy),
smartEdit: () => import('./smart-edit.skill').then(m => m.smartEdit),
};

export async function executeSkill(skillName: string, params: any): Promise<any> {
const loader = skillRegistry[skillName as keyof typeof skillRegistry];
if (!loader) throw new Error(`Skill ${skillName} not found`);
const fn = await loader();
return fn(params);
}

---

### 第三步：创建智能体系统

**创建 `services/agents/prompts/coco.ts`**:

typescript
export const COCO_SYSTEM_PROMPT = `# 角色
你是 Coco，XC-STUDIO 的首席接待专家。

# 职责

1. 理解用户设计需求
2. 路由到合适的专业智能体
3. 跟踪任务进度

# 路由规则

| 关键词 | 智能体 |
|--------|--------|
| 品牌/VI/Logo | vireo |
| 故事板/分镜 | cameron |
| 海报/Banner | poster |
| 包装设计 | package |
| 动效/动画 | motion |
| 营销活动 | campaign |

# 输出格式

路由时返回:
\`\`\`json
{"action":"route","targetAgent":"ID","taskType":"描述","complexity":"simple|complex","handoffMessage":"交接说明","confidence":0.95}
\`\`\`

澄清时返回:
\`\`\`json
{"action":"clarify","questions":["问题1","问题2"]}
\`\`\`

直接回复:
\`\`\`json
{"action":"respond","message":"回复内容"}
\`\`\`
`;

export const COCO_INFO = {
id: 'coco' as const,
name: 'Coco',
avatar: '👋',
description: '你的专属设计助手',
capabilities: ['需求分析', '任务路由', '进度跟踪'],
color: '#FF6B6B'
};

**创建 `services/agents/prompts/poster.ts`**:

typescript
export const POSTER_SYSTEM_PROMPT = `# 角色
你是 Poster，海报与平面设计专家。

# 专长

- 商业海报、社交媒体图片、Banner广告

# 尺寸规范

| 用途 | 尺寸 | 比例 |
|------|------|------|
| Instagram帖子 | 1080×1080 | 1:1 |
| Instagram故事 | 1080×1920 | 9:16 |
| 横版海报 | 1920×1080 | 16:9 |

# 可用技能

- generateImage: 生成设计图
- generateCopy: 生成文案
- smartEdit: 图片编辑

# 输出格式

\`\`\`json
{
"concept": "创意概念",
"skillCalls": [
{"skill": "generateImage", "params": {"prompt": "...", "aspectRatio": "1:1"}}
],
"nextSteps": ["建议1", "建议2"]
}
\`\`\`
`;

export const POSTER_INFO = {
id: 'poster' as const,
name: 'Poster',
avatar: '🖼️',
description: '海报与平面设计专家',
capabilities: ['海报设计', 'Banner制作', '社媒图片'],
color: '#FF9F43'
};

**按同样模式创建其他智能体提示词**:

- `prompts/vireo.ts` - 品牌VI (avatar: 🎨, color: #4ECDC4)
- `prompts/cameron.ts` - 故事板 (avatar: 🎬, color: #A55EEA)
- `prompts/package.ts` - 包装 (avatar: 📦, color: #26DE81)
- `prompts/motion.ts` - 动效 (avatar: ✨, color: #FD79A8)
- `prompts/campaign.ts` - 营销 (avatar: 📢, color: #74B9FF)

---

**创建 `services/agents/orchestrator.ts`**:

typescript
import { GoogleGenAI } from '@google/genai';
import { AgentType, AgentRoutingDecision } from '../../types/agents';
import { COCO_SYSTEM_PROMPT } from './prompts/coco';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface OrchestratorInput {
message: string;
attachments?: string[];
conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}

interface OrchestratorOutput {
decision: AgentRoutingDecision | null;
directResponse: string | null;
clarifyQuestions: string[] | null;
}

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
const historyText = input.conversationHistory?.map(h =>
`${h.role === 'user' ? '用户' : '助手'}: ${h.text}`
).join('\n') || '';

const prompt = `${COCO_SYSTEM_PROMPT}

# 对话历史

${historyText}

# 用户消息

${input.message}

请分析并返回JSON。`;

const response = await ai.models.generateContent({
model: 'gemini-3-pro-preview',
contents: { parts: [{ text: prompt }] },
config: { temperature: 0.3, responseMimeType: 'application/json' }
});

const result = JSON.parse(response.text || '{}');

if (result.action === 'route') {
return {
decision: {
targetAgent: result.targetAgent as AgentType,
taskType: result.taskType,
complexity: result.complexity,
handoffMessage: result.handoffMessage,
confidence: result.confidence || 0.9
},
directResponse: null,
clarifyQuestions: null
};
} else if (result.action === 'clarify') {
return { decision: null, directResponse: null, clarifyQuestions: result.questions };
} else {
return { decision: null, directResponse: result.message, clarifyQuestions: null };
}
}

export function getAgentInfo(agentId: AgentType) {
const agents = {
coco: { id: 'coco', name: 'Coco', avatar: '👋', color: '#FF6B6B' },
vireo: { id: 'vireo', name: 'Vireo', avatar: '🎨', color: '#4ECDC4' },
cameron: { id: 'cameron', name: 'Cameron', avatar: '🎬', color: '#A55EEA' },
poster: { id: 'poster', name: 'Poster', avatar: '🖼️', color: '#FF9F43' },
package: { id: 'package', name: 'Package', avatar: '📦', color: '#26DE81' },
motion: { id: 'motion', name: 'Motion', avatar: '✨', color: '#FD79A8' },
campaign: { id: 'campaign', name: 'Campaign', avatar: '📢', color: '#74B9FF' }
};
return agents[agentId];
}

---

**创建 `services/agents/base.agent.ts`**:

typescript
import { GoogleGenAI, Chat } from '@google/genai';
import { AgentType, GeneratedAsset } from '../../types/agents';
import { executeSkill } from '../skills';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AgentConfig {
id: AgentType;
name: string;
systemPrompt: string;
}

export interface AgentInput {
message: string;
attachments?: string[];
handoffMessage?: string;
}

export interface AgentOutput {
message: string;
assets?: GeneratedAsset[];
nextSteps?: string[];
}

export class BaseAgent {
protected config: AgentConfig;
protected chat: Chat | null = null;

constructor(config: AgentConfig) {
this.config = config;
}

async process(input: AgentInput): Promise<AgentOutput> {
if (!this.chat) {
this.chat = ai.chats.create({
model: 'gemini-3-pro-preview',
config: { systemInstruction: this.config.systemPrompt, temperature: 0.7 }
});
}

```
const fullMessage = input.handoffMessage 
  ? `[交接说明] ${input.handoffMessage}\n\n[用户消息] ${input.message}`
  : input.message;

const response = await this.chat.sendMessage({ message: [{ text: fullMessage }] });
const text = response.text || '';

try {
  const parsed = JSON.parse(text);
  return this.handleResponse(parsed);
} catch {
  return { message: text, nextSteps: [] };
}
```

}

protected async handleResponse(parsed: any): Promise<AgentOutput> {
const assets: GeneratedAsset[] = [];

```
if (parsed.skillCalls) {
  for (const call of parsed.skillCalls) {
    try {
      const result = await executeSkill(call.skill, call.params);
      if (result?.imageUrl) {
        assets.push({
          id: `asset-${Date.now()}`,
          type: 'image',
          url: result.imageUrl,
          metadata: { prompt: call.params.prompt, model: result.model }
        });
      }
      if (result?.videoUrl) {
        assets.push({
          id: `asset-${Date.now()}`,
          type: 'video',
          url: result.videoUrl,
          metadata: { model: result.model }
        });
      }
    } catch (e) {
      console.error(`Skill ${call.skill} failed:`, e);
    }
  }
}

let message = parsed.concept || parsed.message || '处理完成';
if (assets.length > 0) {
  message += `\n\n✅ 已生成 ${assets.length} 个素材`;
}

return { message, assets, nextSteps: parsed.nextSteps || [] };
```

}

reset() { this.chat = null; }
}

---

**创建 `services/agents/poster.agent.ts`**:

typescript
import { BaseAgent } from './base.agent';
import { POSTER_SYSTEM_PROMPT, POSTER_INFO } from './prompts/poster';

class PosterAgent extends BaseAgent {
constructor() {
super({
id: 'poster',
name: 'Poster',
systemPrompt: POSTER_SYSTEM_PROMPT
});
}
}

export const posterAgent = new PosterAgent();
export { POSTER_INFO };

**按同样模式创建其他智能体**:

- `vireo.agent.ts`
- `cameron.agent.ts`
- `package.agent.ts`
- `motion.agent.ts`
- `campaign.agent.ts`

---

**创建 `services/agents/index.ts`**:

typescript
import { AgentType } from '../../types/agents';
import { BaseAgent } from './base.agent';
import { posterAgent } from './poster.agent';
// 导入其他智能体...

const agentRegistry = new Map<AgentType, BaseAgent>();
agentRegistry.set('poster', posterAgent);
// 注册其他智能体...

export function getAgent(agentId: AgentType): BaseAgent | undefined {
return agentRegistry.get(agentId);
}

export async function executeAgentTask(agentId: AgentType, input: any) {
const agent = getAgent(agentId);
if (!agent) throw new Error(`Agent ${agentId} not found`);
return agent.process(input);
}

export { orchestrate, getAgentInfo } from './orchestrator';
export { BaseAgent } from './base.agent';

---

### 第四步：创建 React Hook

**创建 `hooks/useAgent.ts`**:

typescript
import { useState, useCallback, useRef } from 'react';
import { AgentType, GeneratedAsset } from '../types/agents';
import { orchestrate, executeAgentTask, getAgentInfo } from '../services/agents';

interface AgentMessage {
id: string;
role: 'user' | 'model';
text: string;
agentId?: AgentType;
assets?: GeneratedAsset[];
timestamp: number;
}

export function useAgent() {
const [currentAgent, setCurrentAgent] = useState<AgentType>('coco');
const [messages, setMessages] = useState<AgentMessage[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const history = useRef<Array<{ role: 'user' | 'model'; text: string }>>([]);

const addMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
const newMsg = { ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() };
setMessages(prev => [...prev, newMsg]);
return newMsg;
}, []);

const sendMessage = useCallback(async (message: string, attachments?: string[]) => {
if (!message.trim()) return;
setIsProcessing(true);

```
addMessage({ role: 'user', text: message });
history.current.push({ role: 'user', text: message });

try {
  if (currentAgent === 'coco') {
    const result = await orchestrate({ message, attachments, conversationHistory: history.current });

    if (result.decision) {
      const info = getAgentInfo(result.decision.targetAgent);
      addMessage({
        role: 'model',
        text: `找到专家 ${info?.name} ${info?.avatar}！\n${result.decision.handoffMessage}`,
        agentId: 'coco'
      });

      setCurrentAgent(result.decision.targetAgent);

      const response = await executeAgentTask(result.decision.targetAgent, {
        message,
        attachments,
        handoffMessage: result.decision.handoffMessage
      });

      addMessage({
        role: 'model',
        text: response.message,
        agentId: result.decision.targetAgent,
        assets: response.assets
      });
      history.current.push({ role: 'model', text: response.message });
    } else if (result.clarifyQuestions) {
      addMessage({
        role: 'model',
        text: `我想确认：\n${result.clarifyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
        agentId: 'coco'
      });
    } else if (result.directResponse) {
      addMessage({ role: 'model', text: result.directResponse, agentId: 'coco' });
      history.current.push({ role: 'model', text: result.directResponse });
    }
  } else {
    const response = await executeAgentTask(currentAgent, { message, attachments });
    addMessage({
      role: 'model',
      text: response.message,
      agentId: currentAgent,
      assets: response.assets
    });
    history.current.push({ role: 'model', text: response.message });
  }
} catch (error) {
  addMessage({ role: 'model', text: '抱歉，出现了问题。请重试。', agentId: currentAgent });
} finally {
  setIsProcessing(false);
}
```

}, [currentAgent, addMessage]);

const switchAgent = useCallback((agentId: AgentType) => {
setCurrentAgent(agentId);
const info = getAgentInfo(agentId);
addMessage({
role: 'model',
text: `你好！我是 ${info?.name} ${info?.avatar}，有什么可以帮你？`,
agentId
});
}, [addMessage]);

const clearHistory = useCallback(() => {
setMessages([]);
history.current = [];
setCurrentAgent('coco');
}, []);

return { currentAgent, messages, isProcessing, sendMessage, switchAgent, clearHistory };
}

---

### 第五步：创建UI组件

**创建 `components/agents/AgentAvatar.tsx`**:

typescript
import React from 'react';
import { AgentType } from '../../types/agents';
import { getAgentInfo } from '../../services/agents';

export const AgentAvatar: React.FC<{ agentId: AgentType; size?: 'sm' | 'md' | 'lg' }> = ({
agentId, size = 'md'
}) => {
const info = getAgentInfo(agentId);
const sizes = { sm: 'w-6 h-6 text-sm', md: 'w-8 h-8 text-base', lg: 'w-12 h-12 text-xl' };

return (
<div
className={`${sizes[size]} rounded-full flex items-center justify-center`}
style={{ backgroundColor: info?.color + '20' }}
>
{info?.avatar}
</div>
);
};

**创建 `components/agents/AgentSelector.tsx`**:

typescript
import React from 'react';
import { motion } from 'framer-motion';
import { AgentType } from '../../types/agents';
import { getAgentInfo } from '../../services/agents';

const AGENTS: AgentType[] = ['coco', 'vireo', 'poster', 'cameron', 'package', 'motion', 'campaign'];

export const AgentSelector: React.FC<{
currentAgent: AgentType;
onSelect: (id: AgentType) => void;
}> = ({ currentAgent, onSelect }) => (

<div className="flex gap-2 p-2 bg-white/5 rounded-lg overflow-x-auto">
    {AGENTS.map(id => {
      const info = getAgentInfo(id);
      const isActive = currentAgent === id;
      return (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
          style={{ borderColor: isActive ? info?.color : 'transparent', borderWidth: 1 }}
        >
          <span>{info?.avatar}</span>
          <span className="text-sm" style={{ color: isActive ? info?.color : '#888' }}>{info?.name}</span>
        </motion.button>
      );
    })}
  </div>
);

---

### 第六步：集成到 Workspace

**修改 `pages/Workspace.tsx`**:

在文件顶部添加导入：
typescript
import { useAgent } from '../hooks/useAgent';
import { AgentAvatar } from '../components/agents/AgentAvatar';
import { AgentSelector } from '../components/agents/AgentSelector';

在组件内部添加：
typescript
const { currentAgent, messages: agentMessages, isProcessing, sendMessage: sendAgentMessage, switchAgent } = useAgent();

修改聊天消息渲染，添加智能体头像和生成的资产显示。

---

### 执行顺序

1. 先读取本地 `./api-design-patterns/`、`./frontend-design/`、`./typescript/` 中的规范文档
2. 创建 `types/` 目录下的类型定义
3. 创建 `services/skills/` 下的技能模块
4. 创建 `services/agents/prompts/` 下的提示词
5. 创建 `services/agents/` 下的智能体服务
6. 创建 `hooks/useAgent.ts`
7. 创建 `components/agents/` 下的UI组件
8. 修改 `pages/Workspace.tsx` 集成智能体

---

### 注意事项

- **不要删除现有代码**，只做增量添加
- **复用现有的** `services/gemini.ts` 中的函数
- **保持类型安全**，所有新代码必须有完整类型标注
- **错误处理**要完善，参考现有代码的 `retryWithBackoff` 模式

---

**开始执行吧！**

