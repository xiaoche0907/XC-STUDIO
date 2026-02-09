# XC-STUDIO (AI Design Workbench)

一个基于 Google Gemini 模型的下一代 AI 辅助设计工作台，提供无限画布、智能体协作和多媒体生成能力。

## 🌟 核心功能

### 1. ♾️ 无限画布 (Infinite Canvas)

- **自由创作**: 支持无限缩放和平移，随心所欲摆放元素。
- **多媒体支持**: 图片、视频、文本、形状（矩形、圆形、箭头等）。
- **图层管理**: 直观的图层面板，轻松调整元素层级和可见性。
- **历史记录**: 完整的撤销/重做 (Undo/Redo) 系统。

### 2. 🤖 AI 智能体编排 (Agentic AI)

- **多模态协作**: 集成 Google Gemini 模型（Thinking/Flash 模式）。
- **角色扮演**: 动态分配 Product Manager, Designer, Coder, Reviewer 等角色进行任务拆解与执行。
- **实时反馈**: 像与真人对话一样与 AI 协作，支持上下文理解。

### 3. 🎯 智能标记系统 (Smart Marker System)

- **精准标注**: 按住 `Ctrl` + 点击图片即可创建精准选区标记。
- **双向同步**: 画布标记与聊天输入框中的 Chip 实时同步。
- **交互增强**:
  - **Hover 预览**: 鼠标悬停在输入框 Chip 上，显示原图及高亮选区。
  - **键盘导航**: 支持使用 `←` `→` 键选中 Chip，`Backspace` / `Delete` 删除。
  - **即时裁剪**: 标记区域自动裁剪并准备发送给 AI 进行局部重绘或分析。

### 4. 🎨 创意工具箱

- **AI 绘图与视频**: 文本生成图片 (Text-to-Image)、图片生成视频 (Image-to-Video)。
- **图像处理**: 一键去背景 (Remove BG)、4K 无损放大 (Upscale)。
- **文本编辑**: 智能文本样式调整，支持多种字体和排版。

## 🛠️ 技术栈

- **前端框架**: React, Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI 模型**: Google Gemini API (Pro/Flash/Thinking)
- **API 支持**: Gemini 原生 / 云雾 API / 自定义代理
- **图标库**: Lucide React

## 🚀 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

2. **配置 API**

   本项目支持三种 API 提供商：

   - **Gemini 原生 API** (Google 官方，需要科学上网)
   - **云雾 API** ⭐ 推荐 (国内可直接访问)
   - **自定义代理** (使用自己的代理服务器)

   **方式一：通过设置界面配置** (推荐)
   
   1. 启动应用后，点击设置按钮（齿轮图标）
   2. 选择 API 提供商
   3. 输入对应的 API Key
   4. 保存配置即可使用

   **方式二：配置环境变量**
   
   在根目录创建 `.env.local` 文件：

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   GEMINI_API_KEY=your_api_key_here
   VITE_YUNWU_API_URL=https://yunwu.ai
   ```

   详细配置说明请参考：[API 配置指南](./API-CONFIGURATION-GUIDE.md)

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🌐 API 配置

### 支持的提供商

| 提供商 | 特点 | 适用场景 | 配置文档 |
|--------|------|----------|----------|
| Gemini 原生 | Google 官方，最稳定 | 海外用户 | [获取 API Key](https://aistudio.google.com/) |
| 云雾 API ⭐ | 国内可访问，无需翻墙 | 国内用户首选 | [访问官网](https://yunwu.ai) |
| 自定义代理 | 完全自主控制 | 高级用户 | 自行配置 |

### 快速配置

1. 点击应用设置图标
2. 选择 "云雾 API"（推荐国内用户）
3. 输入您的 API Key
4. 保存并开始使用

📖 **完整配置指南**: [API-CONFIGURATION-GUIDE.md](./API-CONFIGURATION-GUIDE.md)

## � 快捷键指南

- `Space` + 拖拽: 平移画布
- `Ctrl` + 滚轮: 缩放画布
- `Ctrl` + 点击图片: 创建标记区域
- `Delete` / `Backspace`: 删除选中元素
- `Ctrl` + `Z`: 撤销
- `Ctrl` + `Y`: 重做

## 📝 更新日志

### v1.0.0 (2026-02-09)

- ✨ **新增**: 支持多 API 提供商切换（Gemini 原生 / 云雾 API / 自定义）
- ✨ **新增**: 云雾 API 集成，国内用户可直接访问
- 🔧 **优化**: API 配置界面，支持可视化选择提供商
- 📖 **文档**: 新增详细的 API 配置指南
