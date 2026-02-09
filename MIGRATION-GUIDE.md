# 🔄 Workspace.tsx 迁移指南

本文档详细说明如何将 Workspace.tsx 从 useState 迁移到 Zustand Store。

---

## 📋 迁移步骤

### 第一步：识别状态

原 Workspace.tsx 中的状态可以分为三类：

```typescript
// 1. Canvas 相关 -> canvas.store.ts
const [zoom, setZoom] = useState(50);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [elements, setElements] = useState<CanvasElement[]>([]);
const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
const [markers, setMarkers] = useState<Marker[]>([]);
const [history, setHistory] = useState([]);
const [historyStep, setHistoryStep] = useState(0);

// 2. UI 相关 -> ui.store.ts
const [activeTool, setActiveTool] = useState<ToolType>('select');
const [showAssistant, setShowAssistant] = useState(true);
const [showLayersPanel, setShowLayersPanel] = useState(true);
const [contextMenu, setContextMenu] = useState(null);
const [showFontPicker, setShowFontPicker] = useState(false);
// ... 更多 UI 状态

// 3. Agent 相关 -> agent.store.ts
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputBlocks, setInputBlocks] = useState([]);
const [isTyping, setIsTyping] = useState(false);
const [modelMode, setModelMode] = useState<'thinking' | 'fast'>('fast');
// ... 更多 Agent 状态
```

---

## 🔨 迁移实例

### 实例 1：迁移缩放功能

#### Before (useState)
```typescript
const Workspace = () => {
  const [zoom, setZoom] = useState(50);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(500, prev + 10));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(10, prev - 10));
  };
  
  return (
    <div>
      <button onClick={handleZoomOut}>-</button>
      <span>{zoom}%</span>
      <button onClick={handleZoomIn}>+</button>
    </div>
  );
};
```

#### After (Zustand Store)

**步骤1**: 创建独立组件
```typescript
// pages/Workspace/components/ZoomControls.tsx
import { useCanvasStore } from '@/stores/canvas.store';

export const ZoomControls = () => {
  // 只订阅需要的状态
  const zoom = useCanvasStore(state => state.zoom);
  const { setZoom } = useCanvasStore(state => state.actions);
  
  return (
    <div>
      <button onClick={() => setZoom(zoom - 10)}>-</button>
      <span>{zoom}%</span>
      <button onClick={() => setZoom(zoom + 10)}>+</button>
    </div>
  );
};
```

**步骤2**: 在 Workspace 中使用
```typescript
import { ZoomControls } from './components';

const Workspace = () => {
  return (
    <div>
      <ZoomControls />
      {/* 其他组件 */}
    </div>
  );
};
```

---

### 实例 2：迁移工具选择

#### Before (useState)
```typescript
const Workspace = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  return (
    <div>
      <button 
        onClick={() => setActiveTool('select')}
        className={activeTool === 'select' ? 'active' : ''}
      >
        选择
      </button>
      <button 
        onClick={() => setActiveTool('hand')}
        className={activeTool === 'hand' ? 'active' : ''}
      >
        手型
      </button>
    </div>
  );
};
```

#### After (Zustand Store)

```typescript
// pages/Workspace/components/ToolSelector.tsx
import { useUIStore } from '@/stores/ui.store';

export const ToolSelector = () => {
  const activeTool = useUIStore(state => state.activeTool);
  const { setActiveTool } = useUIStore(state => state.actions);
  
  return (
    <div>
      <button 
        onClick={() => setActiveTool('select')}
        className={activeTool === 'select' ? 'active' : ''}
      >
        选择
      </button>
      <button 
        onClick={() => setActiveTool('hand')}
        className={activeTool === 'hand' ? 'active' : ''}
      >
        手型
      </button>
    </div>
  );
};
```

---

### 实例 3：迁移元素操作

#### Before (useState)
```typescript
const Workspace = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const addElement = (element: CanvasElement) => {
    setElements(prev => [...prev, element]);
  };
  
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  };
  
  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };
  
  return (
    <div>
      {elements.map(el => (
        <div key={el.id} onClick={() => setSelectedElementId(el.id)}>
          {/* 渲染元素 */}
        </div>
      ))}
    </div>
  );
};
```

#### After (Zustand Store)

```typescript
// Workspace.tsx (简化版)
import { useCanvasStore } from '@/stores/canvas.store';

const Workspace = () => {
  const elements = useCanvasStore(state => state.elements);
  const selectedElementId = useCanvasStore(state => state.selectedElementId);
  const { setSelectedElementId } = useCanvasStore(state => state.actions);
  
  return (
    <div>
      {elements.map(el => (
        <div key={el.id} onClick={() => setSelectedElementId(el.id)}>
          {/* 渲染元素 */}
        </div>
      ))}
    </div>
  );
};

// 元素操作函数可以在任何地方调用
import { useCanvasStore } from '@/stores/canvas.store';

export function addRectangle() {
  const { addElement } = useCanvasStore.getState().actions;
  
  addElement({
    id: `rect-${Date.now()}`,
    type: 'shape',
    shapeType: 'square',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    zIndex: 1
  });
}
```

---

## 📊 迁移检查清单

### Canvas Store 迁移
- [ ] zoom / setZoom
- [ ] pan / setPan
- [ ] elements / setElements
- [ ] selectedElementId / setSelectedElementId
- [ ] editingTextId / setEditingTextId
- [ ] markers / setMarkers
- [ ] history / historyStep
- [ ] isDraggingElement
- [ ] isPanning
- [ ] isResizing

### UI Store 迁移
- [ ] activeTool / setActiveTool
- [ ] creationMode / setCreationMode
- [ ] showAssistant / setShowAssistant
- [ ] showLayersPanel / setShowLayersPanel
- [ ] showToolMenu / setShowToolMenu
- [ ] showInsertMenu / setShowInsertMenu
- [ ] showShapeMenu / setShowShapeMenu
- [ ] showFontPicker / setShowFontPicker
- [ ] contextMenu / setContextMenu
- [ ] previewUrl / setPreviewUrl
- [ ] isSpacePressed / setIsSpacePressed

### Agent Store 迁移
- [ ] messages / setMessages
- [ ] inputBlocks / setInputBlocks
- [ ] isTyping / setIsTyping
- [ ] modelMode / setModelMode
- [ ] webEnabled / setWebEnabled
- [ ] imageModelEnabled / setImageModelEnabled
- [ ] currentTask / setCurrentTask
- [ ] isAgentMode / setIsAgentMode

---

## 🎯 迁移策略

### 方案A：渐进式迁移（推荐）

1. **第一周**：迁移简单状态
   - 缩放控制（zoom, pan）
   - 工具选择（activeTool）
   - 面板显示（showAssistant, showLayersPanel）

2. **第二周**：迁移核心功能
   - 元素管理（elements, selectedElementId）
   - 历史记录（history, undo/redo）

3. **第三周**：迁移复杂功能
   - 智能体系统（messages, tasks）
   - 输入系统（inputBlocks）

### 方案B：组件拆分法

1. 识别可独立的功能模块
2. 为每个模块创建独立组件
3. 在组件中使用 Store
4. 逐步替换 Workspace.tsx 中的代码

---

## ⚠️ 注意事项

### 1. 避免直接修改 State

**❌ 错误**
```typescript
const elements = useCanvasStore(state => state.elements);
elements.push(newElement); // 不要这样做！
```

**✅ 正确**
```typescript
const { addElement } = useCanvasStore(state => state.actions);
addElement(newElement);
```

### 2. 使用选择器避免重渲染

**❌ 低效**
```typescript
const store = useCanvasStore(); // 整个 store 变化都会重渲染
return <div>{store.zoom}</div>;
```

**✅ 高效**
```typescript
const zoom = useCanvasStore(state => state.zoom); // 只在 zoom 变化时重渲染
return <div>{zoom}</div>;
```

### 3. 组合多个状态使用 shallow

```typescript
import { shallow } from 'zustand/shallow';

const { zoom, pan } = useCanvasStore(
  state => ({ zoom: state.zoom, pan: state.pan }),
  shallow
);
```

---

## 🧪 测试迁移

### 测试清单

1. **功能测试**
   - [ ] 所有按钮点击正常
   - [ ] 状态更新正确
   - [ ] UI 响应及时

2. **性能测试**
   - [ ] 打开 React DevTools Profiler
   - [ ] 对比迁移前后的渲染次数
   - [ ] 确认减少了不必要的重渲染

3. **兼容性测试**
   - [ ] 所有快捷键正常工作
   - [ ] 撤销/重做功能正常
   - [ ] 状态持久化正常

---

## 📚 参考资源

- **Store 使用指南**: `stores/README.md`
- **示例组件**: `pages/Workspace/components/ExampleStoreUsage.tsx`
- **官方文档**: [Zustand GitHub](https://github.com/pmndrs/zustand)

---

## 💡 最佳实践总结

1. **小步快跑**：每次迁移一小部分功能
2. **充分测试**：迁移后立即测试
3. **保持简单**：不要过度优化
4. **参考示例**：多看 ExampleStoreUsage.tsx
5. **增量提交**：每完成一个功能就提交代码

---

**祝迁移顺利！** 🚀
