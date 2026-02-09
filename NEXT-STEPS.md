# 🚀 下一步行动指南

## 当前状态

✅ **基础设施完成度**: 90%  
✅ **Store创建**: 3个专业Store  
✅ **组件示例**: 7个可复用组件  
✅ **文档完善**: 5份完整文档  
✅ **重构示例**: WorkspaceRefactored.example.tsx

---

## 📋 立即行动清单

### 第一步：测试重构示例（30分钟）

1. **查看示例文件**
   ```bash
   # 打开
   pages/Workspace/WorkspaceRefactored.example.tsx
   ```

2. **对比原文件**
   - 原版：`pages/Workspace.tsx` (2000+行, 60+ useState)
   - 新版：`WorkspaceRefactored.example.tsx` (约300行, 0 useState)

3. **理解改进点**
   - Store替代useState
   - 组件化拆分
   - 精准状态订阅

---

### 第二步：渐进式迁移（本周）

#### 方案A：新建测试文件（推荐）

```bash
# 1. 复制示例作为新文件
cp pages/Workspace/WorkspaceRefactored.example.tsx pages/Workspace/WorkspaceNew.tsx

# 2. 在路由中添加测试路径
# App.tsx 中添加：
<Route path="/workspace-new/:id" element={<WorkspaceNew />} />

# 3. 访问测试
http://localhost:3001/workspace-new/test-id
```

#### 方案B：直接修改原文件（谨慎）

```bash
# 1. 备份原文件
cp pages/Workspace.tsx pages/Workspace.backup.tsx

# 2. 逐步迁移
# - 先迁移简单状态（zoom, pan）
# - 再迁移复杂状态（elements, markers）
# - 最后迁移UI状态

# 3. 测试每一步
npm run dev
```

---

### 第三步：具体迁移步骤

#### 步骤1：导入Store（5分钟）

```typescript
// 在 Workspace.tsx 顶部添加
import { useCanvasStore } from '../stores/canvas.store';
import { useUIStore } from '../stores/ui.store';
import { useAgentStore } from '../stores/agent.store';
```

#### 步骤2：替换简单状态（15分钟）

**Before:**
```typescript
const [zoom, setZoom] = useState(50);
const [pan, setPan] = useState({ x: 0, y: 0 });
```

**After:**
```typescript
const zoom = useCanvasStore(state => state.zoom);
const pan = useCanvasStore(state => state.pan);
const { setZoom, setPan } = useCanvasStore(state => state.actions);
```

#### 步骤3：替换复杂状态（30分钟）

**Before:**
```typescript
const [elements, setElements] = useState<CanvasElement[]>([]);
const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
const [markers, setMarkers] = useState<Marker[]>([]);
```

**After:**
```typescript
const elements = useCanvasStore(state => state.elements);
const selectedElementId = useCanvasStore(state => state.selectedElementId);
const markers = useCanvasStore(state => state.markers);
const { setElements, setSelectedElementId, setMarkers } = useCanvasStore(state => state.actions);
```

#### 步骤4：使用新组件（20分钟）

```typescript
// 导入组件
import {
  LayersPanel,
  CanvasToolbar,
  ProjectHeader,
  ToolSelector,
} from './components';

// 在JSX中使用
<ToolSelector />
<ProjectHeader />
<CanvasToolbar />
<LayersPanel />
```

---

## 🎯 本周目标

### Day 1（今天）
- [x] 查看重构示例
- [ ] 理解Store使用方法
- [ ] 测试简单组件

### Day 2-3
- [ ] 创建测试版本
- [ ] 迁移基础状态（zoom, pan）
- [ ] 验证功能正常

### Day 4-5
- [ ] 迁移复杂状态（elements, markers）
- [ ] 集成新组件
- [ ] 功能测试

### Day 6-7
- [ ] 性能对比测试
- [ ] 修复Bug
- [ ] 代码优化

---

## 📊 迁移检查清单

### Canvas Store 迁移
- [ ] zoom / setZoom
- [ ] pan / setPan
- [ ] elements / setElements
- [ ] selectedElementId / setSelectedElementId
- [ ] markers / setMarkers
- [ ] history / undo / redo

### UI Store 迁移
- [ ] activeTool / setActiveTool
- [ ] showAssistant / toggleAssistant
- [ ] showLayersPanel / toggleLayersPanel
- [ ] 菜单状态（12个）

### Agent Store 迁移
- [ ] messages / setMessages / addMessage
- [ ] inputBlocks / setInputBlocks
- [ ] isTyping / setIsTyping
- [ ] modelMode / setModelMode

---

## 🧪 测试方法

### 功能测试
```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问
http://localhost:3001/

# 3. 测试功能
- 缩放控制（Cmd +/-）
- 工具切换（V, H, M）
- 撤销重做（Cmd Z/Y）
- 元素操作
```

### 性能测试
```bash
# 1. 打开 React DevTools
# 2. 切换到 Profiler
# 3. 录制操作
# 4. 查看重渲染次数
# 5. 对比迁移前后
```

---

## 💡 常见问题

### Q: Store中的状态如何初始化？
```typescript
// 在组件的 useEffect 中加载数据
useEffect(() => {
  const loadProject = async () => {
    const project = await getProject(id);
    if (project?.elements) {
      setElements(project.elements);
    }
  };
  loadProject();
}, [id]);
```

### Q: 如何保存状态到本地存储？
```typescript
// Store 内部不处理持久化
// 在组件中监听状态变化并保存
useEffect(() => {
  const saveTimeout = setTimeout(async () => {
    await saveProject({ id, elements, markers });
  }, 1000);
  return () => clearTimeout(saveTimeout);
}, [elements, markers, id]);
```

### Q: 如何处理依赖其他状态的计算？
```typescript
// 使用选择器组合多个状态
const viewportInfo = useCanvasStore(state => ({
  zoom: state.zoom,
  pan: state.pan,
  selectedCount: state.elements.filter(el => 
    el.id === state.selectedElementId
  ).length
}), shallow);
```

---

## 📚 参考资源

### 必读文档
1. **stores/README.md** - Store API 参考
2. **MIGRATION-GUIDE.md** - 详细迁移步骤
3. **WorkspaceRefactored.example.tsx** - 完整示例

### 代码示例
- **ExampleStoreUsage.tsx** - 交互式示例
- **ZoomControls.tsx** - 简单组件示例
- **LayersPanel.tsx** - 复杂组件示例

---

## 🆘 需要帮助？

### 遇到问题时
1. 查看 `stores/README.md` 文档
2. 参考 `WorkspaceRefactored.example.tsx` 示例
3. 检查 `MIGRATION-GUIDE.md` 迁移指南
4. 查看浏览器控制台错误信息

### 调试技巧
```typescript
// 1. 打印 Store 状态
console.log('Canvas State:', useCanvasStore.getState());

// 2. 监听状态变化
useCanvasStore.subscribe(
  state => state.elements,
  (elements) => console.log('Elements changed:', elements)
);

// 3. 使用 React DevTools
// Components 标签可以查看 hook 状态
```

---

## 🎉 完成标志

当你完成以下所有项时，迁移就算完成了：

- [ ] 所有 useState 已替换为 Store
- [ ] 所有组件都在使用新组件
- [ ] 功能测试全部通过
- [ ] 性能有明显提升（减少重渲染）
- [ ] 代码更简洁易读
- [ ] 没有TypeScript错误

---

**准备好了吗？开始迁移吧！** 🚀

参考 `WorkspaceRefactored.example.tsx` 文件，这是一个完整的重构示例。
