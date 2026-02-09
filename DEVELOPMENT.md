# 📚 XC-STUDIO 开发文档

> 最后更新: 2026/2/9
> 版本: 1.0.0

## 🎯 项目概述

XC-STUDIO 是一个基于 Google Gemini 的 AI 辅助设计工作台，提供无限画布、智能体协作和多媒体生成能力。

## 📖 目录

1. [快速开始](#快速开始)
2. [架构概览](#架构概览)
3. [状态管理](#状态管理)
4. [智能体系统](#智能体系统)
5. [开发指南](#开发指南)
6. [测试](#测试)

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 配置 API
在应用设置中配置 Gemini API Key，支持：
- Gemini 原生 API
- 云雾 API（国内推荐）
- 自定义代理

详见：[API-CONFIGURATION-GUIDE.md](./API-CONFIGURATION-GUIDE.md)

---

## 🏗️ 架构概览

### 技术栈
- **前端**: React + TypeScript + Vite
- **状态管理**: Zustand + Immer
- **AI**: Google Gemini API
- **样式**: Tailwind CSS

### 目录结构
```
XC-STUDIO/
├── components/          # 通用组件
├── pages/              # 页面组件
│   └── Workspace/      # 工作区（核心功能）
├── stores/             # Zustand 状态管理
├── services/           # 服务层
│   └── agents/         # AI 智能体系统
│   └── skills/         # AI 技能系统
├── hooks/              # 自定义 Hooks
├── utils/              # 工具函数
└── types/              # TypeScript 类型定义
```

---

## 💾 状态管理

### Store 架构

项目使用 Zustand 进行状态管理，分为 4 个专业 Store：

| Store | 文件 | 职责 |
|-------|------|------|
| **Canvas** | `stores/canvas.store.ts` | 画布、元素、历史记录 |
| **UI** | `stores/ui.store.ts` | 工具、面板、菜单 |
| **Agent** | `stores/agent.store.ts` | 智能体、消息、任务 |
| **Project** | `stores/project.store.ts` | 项目信息、品牌、设置 |

### 使用示例

```typescript
import { useCanvasStore } from '@/stores/canvas.store';

function MyComponent() {
  // 只订阅需要的状态
  const zoom = useCanvasStore(state => state.zoom);
  const elements = useCanvasStore(state => state.elements);
  
  // 获取操作方法
  const { setZoom, addElement } = useCanvasStore(state => state.actions);
  
  return (
    <button onClick={() => setZoom(100)}>
      重置缩放 ({zoom}%)
    </button>
  );
}
```

### 详细文档
- [Store 使用指南](./stores/README.md)
- [Workspace 组件示例](./pages/Workspace/components/)

---

## 🤖 智能体系统

### 架构设计

```
用户输入
   ↓
routeToAgent() → 智能路由
   ↓
Agent.analyze() → 分析需求
   ↓
Agent.generateProposals() → 生成方案
   ↓
用户选择
   ↓
Agent.execute() → 执行 Skills
   ↓
自动添加到画布 ✨
```

### 智能体列表

| 智能体 | ID | 专长 | 技能 |
|--------|-------|------|------|
| Coco | `coco` | 图像设计 | imageGen, copyGen, regionAnalyze |
| Vireo | `vireo` | 视频创作 | videoGen, imageGen, smartEdit |
| Cameron | `cameron` | 产品摄影 | imageGen, copyGen, regionAnalyze |
| Poster | `poster` | 海报设计 | imageGen, copyGen, textExtract |
| Package | `package` | 包装设计 | imageGen, smartEdit, export |
| Motion | `motion` | 动态设计 | videoGen, imageGen, smartEdit |
| Campaign | `campaign` | 营销活动 | imageGen, videoGen, copyGen |

### 使用智能体

#### 基础用法
```typescript
import { useAgentOrchestrator } from '@/hooks/useAgentOrchestrator.enhanced';

const {
  currentTask,
  processMessage,
  executeProposal
} = useAgentOrchestrator({
  projectContext,
  canvasState: { elements, pan, zoom, showAssistant },
  onElementsUpdate: setElements,
  onHistorySave: saveToHistory,
  autoAddToCanvas: true  // 自动添加到画布
});

// 处理用户消息
await processMessage("帮我设计一个新年海报");

// 执行方案
await executeProposal(proposalId);
```

#### 增强功能
- ✅ 自动画布集成
- ✅ 智能居中布局
- ✅ 错误处理和重试
- ✅ 执行缓存优化

详见：[hooks/useAgentOrchestrator.enhanced.ts](./hooks/useAgentOrchestrator.enhanced.ts)

### 添加新智能体

```typescript
// 1. 创建 Agent 类
import { EnhancedBaseAgent } from '../enhanced-base-agent';

export class MyAgent extends EnhancedBaseAgent {
  get agentInfo() {
    return {
      id: 'my-agent',
      name: 'My Agent',
      avatar: '🎨',
      description: '我的智能体',
      capabilities: ['能力1', '能力2'],
      color: '#FF6B6B'
    };
  }
  
  get systemPrompt() {
    return 'You are a helpful agent...';
  }
  
  get preferredSkills() {
    return ['imageGen', 'copyGen'];
  }
}

// 2. 注册到系统
// 在 services/agents/index.ts 中添加
export const myAgent = new MyAgent();
```

---

## 🛠️ 开发指南

### 代码规范

#### 状态管理
```typescript
// ✅ 推荐：精准订阅
const zoom = useCanvasStore(state => state.zoom);

// ❌ 避免：订阅整个 store
const store = useCanvasStore();
```

#### 组件拆分
```typescript
// ✅ 推荐：小组件，单一职责
function ZoomControls() {
  const zoom = useCanvasStore(state => state.zoom);
  return <div>{zoom}%</div>;
}

// ❌ 避免：大组件，多个职责
function Workspace() {
  // 2000+ 行代码...
}
```

#### 类型安全
```typescript
// ✅ 推荐：完整类型定义
import type { CanvasElement } from '@/types';

function addElement(element: CanvasElement) {
  // ...
}

// ❌ 避免：any 类型
function addElement(element: any) {
  // ...
}
```

### 性能优化

#### 1. 使用选择器
```typescript
// ✅ 只在 zoom 变化时重渲染
const zoom = useCanvasStore(state => state.zoom);
```

#### 2. 使用 shallow 比较
```typescript
import { shallow } from 'zustand/shallow';

const { zoom, pan } = useCanvasStore(
  state => ({ zoom: state.zoom, pan: state.pan }),
  shallow
);
```

#### 3. 使用 memo
```typescript
export const ZoomControls = memo(() => {
  // 组件逻辑
});
```

### 错误处理

```typescript
import { errorHandler, ErrorType } from '@/utils/error-handler';

try {
  const result = await errorHandler.withRetry(
    () => fetchData(),
    { maxRetries: 3, delay: 1000 }
  );
} catch (error) {
  const appError = errorHandler.handleError(error);
  console.error(appError.message);
}
```

---

## 🧪 测试

### 功能测试清单

#### 基础功能
- [ ] 画布缩放（Cmd +/-）
- [ ] 画布平移（空格 + 拖拽）
- [ ] 工具切换（V/H/M）
- [ ] 撤销/重做（Cmd Z/Y）

#### 元素操作
- [ ] 添加图片/文本/形状
- [ ] 元素选择和拖拽
- [ ] 元素调整大小
- [ ] 图层管理

#### AI 功能
- [ ] AI 对话
- [ ] 方案生成
- [ ] 图像/视频生成
- [ ] 自动添加到画布

### 性能测试

使用 React DevTools Profiler：
1. 打开 DevTools → Profiler
2. 录制操作
3. 查看重渲染次数
4. 优化高频渲染组件

---

## 📊 项目状态

### 已完成功能
- ✅ 无限画布系统
- ✅ Zustand 状态管理
- ✅ 智能体系统架构
- ✅ 7 个专业智能体
- ✅ Skills 技能系统
- ✅ 自动画布集成
- ✅ 错误处理系统

### 进行中
- 🔄 Workspace 组件重构
- 🔄 性能优化
- 🔄 单元测试

### 待完成
- ⏳ Mockup 模板系统
- ⏳ 历史记录持久化
- ⏳ 文件管理系统

---

## 🔗 相关文档

### 核心文档
- [README.md](./README.md) - 项目介绍
- [API-CONFIGURATION-GUIDE.md](./API-CONFIGURATION-GUIDE.md) - API 配置

### 技术文档
- [stores/README.md](./stores/README.md) - Store 使用指南
- [utils/error-handler.ts](./utils/error-handler.ts) - 错误处理
- [utils/canvas-helpers.ts](./utils/canvas-helpers.ts) - 画布工具

### 组件示例
- [pages/Workspace/components/](./pages/Workspace/components/) - 组件库
- [pages/Workspace/WorkspaceRefactored.example.tsx](./pages/Workspace/WorkspaceRefactored.example.tsx) - 重构示例

---

## 🐛 故障排查

### 常见问题

**Q: 资产没有自动添加到画布？**
- 检查 `autoAddToCanvas` 是否为 `true`
- 检查 `canvasState` 是否正确传入
- 查看浏览器控制台错误

**Q: TypeScript 报错？**
```bash
npm run type-check
```

**Q: 性能问题？**
- 使用 React DevTools Profiler 分析
- 检查是否有不必要的重渲染
- 使用 memo 和 useMemo 优化

**Q: 如何调试 Store？**
```typescript
// 在控制台查看 Store 状态
console.log(useCanvasStore.getState());
```

---

## 👥 贡献指南

### 开发流程
1. Fork 项目
2. 创建特性分支
3. 编写代码和测试
4. 提交 PR

### 代码审查
- 确保类型安全
- 添加必要注释
- 遵循代码规范
- 通过所有测试

---

## 📞 获取帮助

- 查看文档目录中的详细指南
- 参考组件示例代码
- 查看源代码注释
- 提交 Issue 反馈问题

---

**Happy Coding! 🎨**
