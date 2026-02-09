# XC-STUDIO 优化集成指南

## 快速开始

本指南将帮助您将新的优化系统集成到现有的XC-STUDIO代码中。

## 步骤 1: 添加错误边界到应用根组件

### 修改 `App.tsx`

```tsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import Projects from './pages/Projects';

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <Router>
                <div className="min-h-screen bg-gray-50 text-gray-900">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/workspace/:id" element={<Workspace />} />
                    </Routes>
                </div>
            </Router>
        </ErrorBoundary>
    );
};

export default App;
```

## 步骤 2: 更新智能体以使用增强基类

### 示例：更新 Cameron Agent

创建 `services/agents/agents/cameron.agent.enhanced.ts`:

```typescript
import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { AgentInfo } from '../../../types/agent.types';
import { CAMERON_SYSTEM_PROMPT } from '../prompts/cameron.prompt';

export class CameronEnhancedAgent extends EnhancedBaseAgent {
    get agentInfo(): AgentInfo {
        return {
            id: 'cameron',
            name: 'Cameron',
            avatar: '📸',
            description: '专业摄影师，擅长产品摄影和视觉创意',
            capabilities: ['产品摄影', '场景布置', '光影设计', '视觉创意'],
            color: '#10B981'
        };
    }

    get systemPrompt(): string {
        return CAMERON_SYSTEM_PROMPT;
    }

    get preferredSkills(): string[] {
        return [
            'generateImage',
            'analyzeRegion',
            'textExtract',
            'smartEdit'
        ];
    }
}

export const cameronEnhancedAgent = new CameronEnhancedAgent();
```

### 更新智能体注册表

修改 `services/agents/index.ts`:

```typescript
import { AgentType, AgentTask, AgentInfo } from '../../types/agent.types';
import { BaseAgent } from './base-agent';
import { EnhancedBaseAgent } from './enhanced-base-agent';

// 导入增强型智能体
import { cameronEnhancedAgent } from './agents/cameron.agent.enhanced';
// ... 其他增强型智能体

// 临时保留旧版本智能体以便渐进迁移
import { cocoAgent } from './agents/coco.agent';
// ...

export const ENHANCED_AGENT_REGISTRY: Record<AgentType, EnhancedBaseAgent> = {
    cameron: cameronEnhancedAgent,
    // ... 其他增强型智能体
    // 暂时使用旧版本的智能体
    coco: cocoAgent as any, // TODO: 迁移到增强版本
    // ...
};

export const AGENT_REGISTRY = ENHANCED_AGENT_REGISTRY;

export function getAgentInfo(agentId: AgentType): AgentInfo {
    return AGENT_REGISTRY[agentId].agentInfo;
}

export async function executeAgentTask(task: AgentTask): Promise<AgentTask> {
    const agent = AGENT_REGISTRY[task.agentId];
    if (!agent) {
        throw new Error(`Agent ${task.agentId} not found`);
    }
    return agent.execute(task);
}

// 导出增强版本
export { routeToAgent } from './enhanced-orchestrator';
export { EnhancedBaseAgent } from './enhanced-base-agent';
```

## 步骤 3: 在Hooks中使用错误处理

### 更新 `hooks/useAgentOrchestrator.ts`

```typescript
import { useState, useCallback, useRef } from 'react';
import { AgentType, AgentTask, ProjectContext, GeneratedAsset } from '../types/agent.types';
import { routeToAgent, executeAgentTask, getAgentInfo } from '../services/agents';
import { ChatMessage } from '../types';
import { errorHandler, ErrorType } from '../utils/error-handler';

export function useAgentOrchestrator(projectContext: ProjectContext) {
    const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
    const [isAgentMode, setIsAgentMode] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const conversationHistory = useRef<ChatMessage[]>([]);

    const processMessage = useCallback(async (
        message: string,
        attachments?: File[]
    ): Promise<AgentTask | null> => {
        if (!isAgentMode || !message.trim()) return null;

        try {
            setError(null);
            console.log('[useAgentOrchestrator] Processing message:', message.substring(0, 50));

            const updatedContext = {
                ...projectContext,
                conversationHistory: conversationHistory.current
            };

            // 使用增强的路由器（带错误处理和重试）
            const decision = await errorHandler.withRetry(
                () => routeToAgent(message, updatedContext),
                {
                    maxRetries: 2,
                    delay: 1000,
                    context: { function: 'processMessage', message: message.substring(0, 50) }
                }
            );

            if (!decision) {
                throw errorHandler.createError(
                    ErrorType.AGENT,
                    '无法路由到合适的智能体',
                    undefined,
                    { message },
                    false
                );
            }

            console.log('[useAgentOrchestrator] Routed to:', decision.targetAgent);

            const task: AgentTask = {
                id: `task-${Date.now()}`,
                agentId: decision.targetAgent,
                status: 'pending',
                input: {
                    message,
                    attachments,
                    context: updatedContext
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            setCurrentTask({ ...task, status: 'analyzing' });

            // 执行任务（带自动错误处理）
            const result = await executeAgentTask(task);
            
            setCurrentTask(result);

            // 更新对话历史
            conversationHistory.current.push({
                id: `msg-${Date.now()}`,
                role: 'user',
                text: message,
                timestamp: Date.now()
            });

            if (result.output?.message) {
                conversationHistory.current.push({
                    id: `msg-${Date.now() + 1}`,
                    role: 'model',
                    text: result.output.message,
                    timestamp: Date.now()
                });
            }

            return result;
        } catch (error) {
            const appError = errorHandler.handleError(error, {
                function: 'processMessage',
                message: message.substring(0, 50)
            });
            
            console.error('[useAgentOrchestrator] Error:', appError.message);
            setError(appError.message);
            setCurrentTask(null);
            
            return null;
        }
    }, [isAgentMode, projectContext]);

    const resetAgent = useCallback(() => {
        setCurrentTask(null);
        setError(null);
        conversationHistory.current = [];
    }, []);

    return {
        currentTask,
        isAgentMode,
        setIsAgentMode,
        processMessage,
        resetAgent,
        messages,
        error // 新增：错误状态
    };
}
```

## 步骤 4: 在UI中显示错误

### 更新 `pages/Workspace.tsx`

在智能体消息区域添加错误显示：

```tsx
// 在Workspace组件中
const { currentTask, processMessage, error } = useAgentOrchestrator(projectContext);

// 在渲染部分添加错误提示
{error && (
    <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
        </div>
    </div>
)}
```

## 步骤 5: 渐进式迁移策略

### 5.1 优先级顺序

1. **高优先级** - 核心智能体（Cameron, Coco, Vireo）
2. **中优先级** - 专业智能体（Poster, Package, Motion）
3. **低优先级** - Campaign等

### 5.2 迁移检查清单

对于每个智能体：

- [ ] 创建增强版本类（继承 `EnhancedBaseAgent`）
- [ ] 定义 `preferredSkills` 列表
- [ ] 测试基本功能
- [ ] 测试错误处理
- [ ] 测试缓存功能
- [ ] 更新注册表
- [ ] 部署到生产

### 5.3 迁移模板

```typescript
// services/agents/agents/[agent-name].agent.enhanced.ts

import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { AgentInfo } from '../../../types/agent.types';
import { [AGENT]_SYSTEM_PROMPT } from '../prompts/[agent].prompt';

export class [AgentName]EnhancedAgent extends EnhancedBaseAgent {
    get agentInfo(): AgentInfo {
        return {
            id: '[agent-id]',
            name: '[Agent Display Name]',
            avatar: '[emoji]',
            description: '[description]',
            capabilities: ['capability1', 'capability2'],
            color: '#HEXCOLOR'
        };
    }

    get systemPrompt(): string {
        return [AGENT]_SYSTEM_PROMPT;
    }

    get preferredSkills(): string[] {
        return [
            // 列出这个智能体常用的技能
            'generateImage',
            'analyzeRegion',
            // ...
        ];
    }
}

export const [agentName]EnhancedAgent = new [AgentName]EnhancedAgent();
```

## 步骤 6: 测试

### 6.1 手动测试

1. 启动开发服务器
2. 测试智能体路由
3. 测试错误场景（断网、超时等）
4. 验证错误边界工作正常
5. 检查控制台日志

### 6.2 测试场景

```typescript
// 测试脚本示例
describe('Enhanced Agent System', () => {
    it('应该正确处理API错误', async () => {
        // 模拟API失败
        // 验证重试机制
        // 验证错误提示
    });

    it('应该正确缓存结果', async () => {
        // 执行相同任务两次
        // 验证第二次使用缓存
    });

    it('应该在超时时降级', async () => {
        // 模拟超时场景
        // 验证降级策略
    });
});
```

## 步骤 7: 性能监控

### 添加性能追踪

```typescript
// utils/performance-monitor.ts
export class PerformanceMonitor {
    private static metrics: Map<string, number[]> = new Map();

    static recordMetric(name: string, value: number) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    static getAverageMetric(name: string): number {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    static logMetrics() {
        console.log('Performance Metrics:');
        this.metrics.forEach((values, name) => {
            console.log(`  ${name}: ${this.getAverageMetric(name).toFixed(2)}ms`);
        });
    }
}
```

## 常见问题

### Q: 如何回滚到旧版本？
A: 只需在 `services/agents/index.ts` 中切换回旧的注册表即可。

### Q: 缓存会占用太多内存吗？
A: 默认缓存是基于内存的Map，可以通过修改 `getCacheKey` 方法添加过期策略。

### Q: 如何调整重试次数？
A: 在调用 `execute` 或 `withRetry` 时传入自定义配置：
```typescript
await agent.execute(task, { maxRetries: 5 });
```

### Q: 错误日志存储在哪里？
A: 当前存储在内存中。生产环境建议集成Sentry等服务。

## 下一步

1. ✅ 完成核心智能体迁移
2. ⚠️ 添加单元测试
3. ⚠️ 集成日志服务（如Sentry）
4. ⚠️ 性能优化（懒加载、代码分割）
5. ⚠️ 添加更多Skills

## 支持

如有问题，请查看：
- `OPTIMIZATION-SUMMARY.md` - 详细优化说明
- 源代码注释
- TypeScript类型定义

---

**最后更新:** 2026/2/9
**版本:** 1.0.0
