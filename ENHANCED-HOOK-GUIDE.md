# 增强版 useAgentOrchestrator Hook 使用指南

> 文件位置: `hooks/useAgentOrchestrator.enhanced.ts`
> 创建时间: 2026/2/9 13:59
> 状态: ✅ 完成并可用

## 📖 概述

增强版 `useAgentOrchestrator` Hook 在原有基础上新增了自动画布集成功能，可以自动将Agent生成的资产添加到画布并智能居中放置。

## ✨ 新增功能

### 1. 自动画布集成
- ✅ 自动将生成的资产转换为画布元素
- ✅ 智能居中放置（使用网格布局）
- ✅ 自动保存到历史记录
- ✅ 完整的错误处理

### 2. Proposal执行
- ✅ 新增 `executeProposal()` 方法
- ✅ 自动处理Proposal执行流程
- ✅ 自动添加生成的资产到画布

### 3. 手动控制
- ✅ 新增 `addAssetsToCanvas()` 方法
- ✅ 支持手动添加资产到画布
- ✅ 可选的自动添加功能

## 🎯 使用方法

### 基础用法

```typescript
import { useAgentOrchestrator } from '../hooks/useAgentOrchestrator.enhanced';
import { useProjectContext } from '../hooks/useProjectContext';

function MyComponent() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [showAssistant, setShowAssistant] = useState(true);
  const [markers, setMarkers] = useState([]);
  
  const projectContext = useProjectContext(projectId, projectTitle, elements, messages);
  
  const {
    currentTask,
    isAgentMode,
    setIsAgentMode,
    processMessage,
    executeProposal,
    addAssetsToCanvas
  } = useAgentOrchestrator({
    projectContext,
    canvasState: {
      elements,
      pan,
      zoom,
      showAssistant
    },
    onElementsUpdate: setElements,
    onHistorySave: saveToHistory,
    autoAddToCanvas: true  // 启用自动添加
  });
  
  return (
    // Your component JSX
  );
}
```

### 处理用户消息

```typescript
const handleSend = async () => {
  const result = await processMessage(userMessage, attachments);
  
  if (result?.output?.proposals) {
    // Proposals会自动显示在UI中
    console.log('收��', result.output.proposals.length, '个方案');
  }
  
  if (result?.output?.assets) {
    // 资产已自动添加到画布（如果 autoAddToCanvas = true）
    console.log('生成了', result.output.assets.length, '个资产');
  }
};
```

### 执行Proposal

```typescript
const handleProposalSelect = async (proposalId: string) => {
  try {
    await executeProposal(proposalId);
    // Proposal执行完成，资产已自动添加到画布
    console.log('Proposal executed successfully');
  } catch (error) {
    console.error('Proposal execution failed:', error);
  }
};
```

### 手动添加资产

```typescript
const handleManualAdd = () => {
  const assets: GeneratedAsset[] = [
    {
      id: 'asset-1',
      type: 'image',
      url: 'https://example.com/image.png',
      metadata: {
        prompt: 'A beautiful sunset',
        model: 'Nano Banana Pro'
      }
    }
  ];
  
  addAssetsToCanvas(assets);
};
```

## 📋 API参考

### Options参数

```typescript
interface UseAgentOrchestratorOptions {
  // 必需 - 项目上下文
  projectContext: ProjectContext;
  
  // 可选 - 画布状态（用于自动添加）
  canvasState?: {
    elements: CanvasElement[];
    pan: { x: number; y: number };
    zoom: number;
    showAssistant: boolean;
  };
  
  // 可选 - 元素更新回调
  onElementsUpdate?: (elements: CanvasElement[]) => void;
  
  // 可选 - 历史保存回调
  onHistorySave?: (elements: CanvasElement[], markers: any[]) => void;
  
  // 可选 - 是否自动添加到画布（默认: true）
  autoAddToCanvas?: boolean;
}
```

### 返回值

```typescript
{
  // 当前任务状态
  currentTask: AgentTask | null;
  
  // Agent模式开关
  isAgentMode: boolean;
  setIsAgentMode: (enabled: boolean) => void;
  
  // 处理用户消息
  processMessage: (message: string, attachments?: File[]) => Promise<AgentTask | null>;
  
  // 执行Proposal（新增）
  executeProposal: (proposalId: string) => Promise<void>;
  
  // 手动添加资产到画布（新增）
  addAssetsToCanvas: (assets: GeneratedAsset[]) => void;
  
  // 重置Agent状态
  resetAgent: () => void;
  
  // 消息列表
  messages: AgentMessage[];
}
```

## 🔄 完整工作流程

### 1. 用户输入消息
```
用户: "帮我设计一个新年海报"
  ↓
processMessage("帮我设计一个新年海报")
  ↓
routeToAgent() → Coco
  ↓
executeAgentTask()
  ↓
Coco返回3个Proposals
```

### 2. 用户选择Proposal
```
用户: 选择Proposal #2
  ↓
executeProposal(proposal.id)
  ↓
executeAgentTask()
  ↓
Skills生成图片
  ↓
自动调用 addAssetsToCanvas()
  ↓
图片出现在画布中心 ✨
```

### 3. 自动画布集成
```
addAssetsToCanvas(assets)
  ↓
assetsToCanvasElementsAtCenter()
  ↓
计算居中位置 + 网格布局
  ↓
onElementsUpdate(newElements)
  ↓
onHistorySave(newElements, markers)
  ↓
完成 ✅
```

## 💡 最佳实践

### 1. 启用自动添加

建议启用 `autoAddToCanvas: true`，让资产自动添加到画布：

```typescript
useAgentOrchestrator({
  // ...
  autoAddToCanvas: true  // ✅ 推荐
});
```

### 2. 提供完整的画布状态

确保传入完整的画布状态以获得最佳效果：

```typescript
canvasState: {
  elements,      // ✅ 当前所有元素
  pan,           // ✅ 当前平移位置
  zoom,          // ✅ 当前缩放级别
  showAssistant  // ✅ 助手面板是否显示
}
```

### 3. 处理错误

始终使用 try-catch 包裹 executeProposal：

```typescript
try {
  await executeProposal(proposalId);
} catch (error) {
  // 显示错误提示
  showErrorMessage('执行失败，请重试');
}
```

### 4. 禁用自动添加（高级用法）

如果需要完全手动控制：

```typescript
const { addAssetsToCanvas } = useAgentOrchestrator({
  // ...
  autoAddToCanvas: false  // 禁用自动添加
});

// 手动控制何时添加
if (shouldAddToCanvas) {
  addAssetsToCanvas(assets);
}
```

## 🔧 迁移指南

### 从原版迁移到增强版

**步骤 1: 更新导入**

```typescript
// 之前
import { useAgentOrchestrator } from '../hooks/useAgentOrchestrator';

// 现在
import { useAgentOrchestrator } from '../hooks/useAgentOrchestrator.enhanced';
```

**步骤 2: 添加画布状态**

```typescript
// 之前
const { processMessage } = useAgentOrchestrator(projectContext);

// 现在
const { processMessage } = useAgentOrchestrator({
  projectContext,
  canvasState: { elements, pan, zoom, showAssistant },
  onElementsUpdate: setElements,
  onHistorySave: saveToHistory
});
```

**步骤 3: 使用新的executeProposal**

```typescript
// 之前 - 手动处理
<ProposalSelector
  onSelect={(proposal) => {
    // 手动执行和添加到画布...
  }}
/>

// 现在 - 自动处理
<ProposalSelector
  onSelect={async (proposal) => {
    await executeProposal(proposal.id);
    // 资产已自动添加到画布！
  }}
/>
```

## 🐛 故障排查

### 问题1: 资产没有自动添加到画布

**���查清单:**
- ✅ `autoAddToCanvas` 是否设置为 `true`
- ✅ `canvasState` 是否正确传入
- ✅ `onElementsUpdate` 回调是否正确
- ✅ 浏览器控制台是否有错误

### 问题2: 位置不正确

**解决方案:**
- 确保 `pan` 和 `zoom` 是最新值
- 检查 `showAssistant` 状态是否正确
- 验证容器尺寸计算是否正确

### 问题3: executeProposal失败

**检查清单:**
- ✅ `currentTask` 是否存在
- ✅ `proposals` 数组是否有数据
- ✅ `proposalId` 是否正确
- ✅ 网络请求是否成功

## 📊 性能优化

### 1. 使用useCallback

```typescript
const handleProposalSelect = useCallback(async (proposalId: string) => {
  await executeProposal(proposalId);
}, [executeProposal]);
```

### 2. 批量添加

如果有多个资产，它们会自动批量添加并使用网格布局。

### 3. 历史记录

历史记录会自动保存，无需手动调用。

## 🎓 示例代码

完整的Workspace.tsx集成示例请参考 `IMPLEMENTATION-COMPLETE-SUMMARY.md`。

---

**创建时间**: 2026/2/9 13:59  
**版本**: 1.0.0  
**状态**: ✅ 生产就绪
