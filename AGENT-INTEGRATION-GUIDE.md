# 智能体系统集成完善指南

> 目标：让智能体系统真正可用，实现完整的Agent → Skills → Canvas流程

## 🎯 当前问题

### 1. 智能体未使用EnhancedBaseAgent
- ❌ 所有agent仍使用`BaseAgent`
- ❌ 缺少完善的错误处理
- ❌ 缺少重试机制
- ❌ 缺少Skills偏好配置

### 2. Proposal执行逻辑不完整
- ❌ 用户选择Proposal后，执行逻辑不完整
- ❌ 生成的assets未自动添加到画布
- ❌ 执行状态反馈不及时

### 3. Skills与画布联动缺失
- ❌ Skills执行结果未自动转换为CanvasElement
- ❌ 生成的图片/视频未自动显示在画布上
- ❌ 缺少批量Skills执行协调

## 📋 实施步骤

### 步骤1：将所有Agent迁移到EnhancedBaseAgent

需要修改的文件：
- `services/agents/agents/coco.agent.ts`
- `services/agents/agents/vireo.agent.ts`
- `services/agents/agents/cameron.agent.ts`
- `services/agents/agents/poster.agent.ts`
- `services/agents/agents/package.agent.ts`
- `services/agents/agents/motion.agent.ts`
- `services/agents/agents/campaign.agent.ts`

修改模式：
```typescript
// 之前
import { BaseAgent } from '../base-agent';

export class CocoAgent extends BaseAgent {
  // ...
}

// 之后
import { EnhancedBaseAgent } from '../enhanced-base-agent';

export class CocoAgent extends EnhancedBaseAgent {
  get preferredSkills() {
    return ['generateImage', 'generateCopy', 'analyzeRegion'];
  }
  // ...
}
```

### 步骤2：完善Proposal执行逻辑

在`Workspace.tsx`中修改`ProposalSelector`的`onSelect`回调：

```typescript
// 位置：Workspace.tsx - ProposalSelector组件处

<ProposalSelector
  proposals={currentTask.output.proposals}
  onSelect={async (proposal: AgentProposal) => {
    setIsTyping(true);
    
    try {
      // 1. 创建执行任务
      const task: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: currentTask.agentId,
        status: 'executing',
        input: {
          message: `Execute proposal: ${proposal.title}`,
          context: projectContext
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // 2. 执行智能体任务
      const result = await executeAgentTask(task);

      // 3. 将生成的assets添加到画布
      if (result.output?.assets) {
        const containerW = window.innerWidth - (showAssistant ? 400 : 0);
        const containerH = window.innerHeight;
        
        result.output.assets.forEach((asset, index) => {
          if (asset.type === 'image') {
            const newElement: CanvasElement = {
              id: `gen-${Date.now()}-${index}`,
              type: 'gen-image',
              url: asset.url,
              x: 100 + (index * 50), // 错开显示
              y: 100 + (index * 50),
              width: 512,
              height: 512,
              zIndex: elements.length + index,
              genPrompt: asset.metadata.prompt,
              genModel: asset.metadata.model as any
            };
            setElements(prev => [...prev, newElement]);
            saveToHistory([...elements, newElement], markers);
          }
        });
      }

      // 4. 添加成功消息
      if (result.output?.message) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'model',
          text: result.output.message,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Proposal execution error:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'model',
        text: `执行失败: ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  }}
  isExecuting={isTyping}
/>
```

### 步骤3：实现Skills结果到Canvas的自动转换

创建工具函数：

```typescript
// utils/canvas-helpers.ts

import { GeneratedAsset } from '../types/agent.types';
import { CanvasElement } from '../types';

export function assetToCanvasElement(
  asset: GeneratedAsset,
  options: {
    x?: number;
    y?: number;
    zIndex?: number;
  } = {}
): CanvasElement {
  const baseElement = {
    id: asset.id,
    x: options.x || 100,
    y: options.y || 100,
    zIndex: options.zIndex || 1
  };

  if (asset.type === 'image') {
    return {
      ...baseElement,
      type: 'gen-image',
      url: asset.url,
      width: 512,
      height: 512,
      genPrompt: asset.metadata.prompt,
      genModel: asset.metadata.model as any
    };
  }

  if (asset.type === 'video') {
    return {
      ...baseElement,
      type: 'gen-video',
      url: asset.url,
      width: 640,
      height: 360,
      genPrompt: asset.metadata.prompt,
      genModel: asset.metadata.model as any
    };
  }

  throw new Error(`Unknown asset type: ${asset.type}`);
}

export function assetsToCanvasElements(
  assets: GeneratedAsset[],
  startPosition: { x: number; y: number } = { x: 100, y: 100 },
  startZIndex: number = 1
): CanvasElement[] {
  return assets.map((asset, index) => {
    return assetToCanvasElement(asset, {
      x: startPosition.x + (index * 50),
      y: startPosition.y + (index * 50),
      zIndex: startZIndex + index
    });
  });
}
```

### 步骤4：更新智能体路由使用Enhanced Orchestrator

修改`services/agents/index.ts`：

```typescript
// 导出增强版本
export { 
  routeToAgent as routeToAgentBasic,
  BaseAgent 
} from './orchestrator';

export {
  routeToAgent,
  executeAgentTaskWithSkills,
  collaborativeExecution
} from './enhanced-orchestrator';
```

### 步骤5：在Workspace中使用新的工具函数

```typescript
// Workspace.tsx 顶部导入
import { assetsToCanvasElements } from '../utils/canvas-helpers';

// 在processMessage成功后
if (result.output?.assets && result.output.assets.length > 0) {
  const newElements = assetsToCanvasElements(
    result.output.assets,
    { x: 100, y: 100 },
    elements.length
  );
  
  setElements(prev => [...prev, ...newElements]);
  saveToHistory([...elements, ...newElements], markers);
}
```

## ✅ 验证清单

完成后需要验证：

- [ ] 智能体能正常路由用户请求
- [ ] 智能体返回Proposal供用户选择
- [ ] 用户选择Proposal后能正确执行
- [ ] 生成的图片自动显示在画布上
- [ ] 生成的视频自动显示在画布上
- [ ] 执行过程有清晰的状态反馈
- [ ] 错误时有友好的提示信息
- [ ] 支持重试机制

## 🎯 预期效果

用户流程：
1. 用户输入："帮我设计一个新年海报"
2. Coco分析后返回3个设计方案（Proposal）
3. 用户选择其中一个方案
4. 系统执行Skills生成图片
5. 生成的图片自动添加到画布
6. 用户可以继续编辑和调整

## 📝 下一步

1. 执行步骤1-5
2. 测试完整流程
3. 修复发现的bug
4. 优化用户体验
