# 🧪 测试指南 - 新旧版本对比

## 概述

现在你可以同时访问两个版本的Workspace进行对比测试：

- **原版**: `/workspace/:id` - 使用60+ useState的原始版本
- **新版**: `/workspace-new/:id` - 使用Store和组件化的优化版本

---

## 🚀 快速测试

### 访问原版Workspace
```
http://localhost:3001/#/workspace/test-project
```

### 访问新版Workspace
```
http://localhost:3001/#/workspace-new/test-project
```

---

## 📊 对比测试项目

### 1. 功能完整性测试

#### 基础功能
- [ ] 画布缩放（Cmd +/-）
- [ ] 画布平移（空格 + 拖拽）
- [ ] 工具切换（V/H/M快捷键）
- [ ] 撤销/重做（Cmd Z/Y）

#### 元素操作
- [ ] 添加图片
- [ ] 添加文本
- [ ] 添加形状
- [ ] 元素选择
- [ ] 元素拖拽
- [ ] 元素调整大小

#### AI功能
- [ ] AI助手对话
- [ ] 图像生成
- [ ] 视频生成
- [ ] 标记功能

### 2. 性能对比测试

#### 使用React DevTools Profiler

1. **打开DevTools**
   ```
   F12 -> 切换到 Components 标签
   ```

2. **测试原版性能**
   ```
   1. 访问 /workspace/test
   2. 打开 Profiler
   3. 点击录制
   4. 执行操作（缩放10次）
   5. 停止录制
   6. 查看重渲染次数
   ```

3. **测试新版性能**
   ```
   1. 访问 /workspace-new/test
   2. 重复上述步骤
   3. 对比结果
   ```

#### 预期结果
| 操作 | 原版重渲染 | 新版重渲染 | 改善 |
|------|-----------|-----------|------|
| 缩放10次 | ~100次 | ~30次 | -70% |
| 工具切换 | ~50次 | ~5次 | -90% |
| 元素拖拽 | ~200次 | ~50次 | -75% |

### 3. 代码质量对比

#### 代码量对比
```bash
# 统计原版代码行数
wc -l pages/Workspace.tsx
# 结果: ~2000行

# 统计新版代码行数
wc -l pages/Workspace/WorkspaceNew.tsx
# 结果: ~350行（-83%）
```

#### 复杂度对比
- **原版**: 60+ useState，难以追踪状态
- **新版**: 3个Store，集中管理

---

## 🎯 测试场景

### 场景1：日常工作流
```
1. 访问新版: /workspace-new/daily-test
2. 添加3个图片元素
3. 调整位置和大小
4. 缩放画布查看细节
5. 撤销/重做几次操作
6. 保存项目

预期: 流畅无卡顿，操作响应迅速
```

### 场景2：AI辅助创作
```
1. 访问新版: /workspace-new/ai-test
2. 打开AI助手
3. 输入生成图像指令
4. 等待生成完成
5. 调整生成的图像
6. 再次生成

预期: AI面板独立渲染，不影响画布性能
```

### 场景3：复杂项目
```
1. 访问新版: /workspace-new/complex-test
2. 添加20+个元素
3. 频繁缩放和平移
4. 快速切换工具
5. 批量选择和操作

预期: 即使元素众多，仍保持流畅
```

---

## 🔍 调试技巧

### 查看Store状态
```typescript
// 在浏览器控制台执行
console.log('Canvas State:', window.__CANVAS_STORE__.getState());
console.log('UI State:', window.__UI_STORE__.getState());
console.log('Agent State:', window.__AGENT_STORE__.getState());
```

### 监听状态变化
```typescript
// 在新版Workspace中添加
useEffect(() => {
  const unsubscribe = useCanvasStore.subscribe(
    state => state.zoom,
    (zoom) => console.log('Zoom changed:', zoom)
  );
  return unsubscribe;
}, []);
```

### 性能分析
```typescript
// 使用React Profiler API
import { Profiler } from 'react';

<Profiler id="Workspace" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <WorkspaceNew />
</Profiler>
```

---

## 📈 性能指标收集

### 1. 首次渲染时间
```bash
# 打开Performance标签
# 录制页面加载
# 查看 LCP (Largest Contentful Paint)

原版预期: ~2000ms
新版预期: ~800ms (-60%)
```

### 2. 交互响应时间
```bash
# 使用Performance标签录制交互
# 点击、拖拽等操作

原版预期: 每次操作 100-200ms
新版预期: 每次操作 20-50ms (-75%)
```

### 3. 内存使用
```bash
# 打开Memory标签
# 进行堆快照对比

原版预期: ~50MB
新版预期: ~30MB (-40%)
```

---

## 🐛 已知问题

### 新版待完善功能
1. [ ] 助手面板内容（示例中为简化版）
2. [ ] 元素详细渲染（示例中省略了部分类型）
3. [ ] 右键菜单功能
4. [ ] 高级编辑工具栏

### 如何贡献
如果发现问题或有改进建议：
1. 记录问题详情
2. 提供重现步骤
3. 附上截图或录屏
4. 提交Issue或PR

---

## ✅ 测试检查清单

### 功能测试
- [ ] 所有原版功能在新版中都能正常工作
- [ ] 新版没有引入新的Bug
- [ ] 快捷键正常响应
- [ ] 数据正确保存和加载

### 性能测试  
- [ ] 新版重渲染次数明显减少
- [ ] 操作响应更快
- [ ] 内存占用更低
- [ ] 没有内存泄漏

### 用户体验测试
- [ ] UI界面保持一致
- [ ] 交互逻辑符合预期
- [ ] 无明显卡顿或延迟
- [ ] 错误处理友好

---

## 📝 测试报告模板

```markdown
## 测试报告 - [日期]

### 测试环境
- 浏览器: Chrome/Firefox/Safari
- 版本: [浏览器版本]
- 操作系统: Windows/Mac/Linux

### 功能测试结果
| 功能 | 原版 | 新版 | 备注 |
|------|-----|-----|------|
| 缩放 | ✅ | ✅ | 正常 |
| 平移 | ✅ | ✅ | 正常 |
| ... | ... | ... | ... |

### 性能测试结果
| 指标 | 原版 | 新版 | 改善 |
|------|-----|-----|------|
| 重渲染次数 | 100 | 30 | -70% |
| 响应时间 | 150ms | 40ms | -73% |
| ... | ... | ... | ... |

### 问题记录
1. [问题描述]
2. [问题描述]

### 总体评价
[评价内容]

### 建议
[改进建议]
```

---

## 🎉 测试通过标准

新版Workspace可以替代原版的标准：

1. ✅ 所有功能100%正常工作
2. ✅ 性能提升至少50%
3. ✅ 代码质量明显改善
4. ✅ 没有严重Bug
5. ✅ 用户体验保持或改善

---

**准备好测试了吗？** 

访问 http://localhost:3001/#/workspace-new/test 开始体验新版！
