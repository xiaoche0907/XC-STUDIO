# 🚀 Vercel 部署指南

## 方式一：通过 Vercel CLI 部署（推荐）

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

在项目根目录运行：

```bash
# 首次部署
vercel

# 部署到生产环境
vercel --prod
```

按照提示操作：
- 确认项目设置
- 选择团队（如果有）
- 确认项目名称

### 4. 配置环境变量

部署后，在 Vercel Dashboard 中设置环境变量：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加以下变量：

```
VITE_GEMINI_API_KEY=你的API密钥
VITE_YUNWU_API_URL=https://yunwu.ai
```

5. 重新部署以应用环境变量

---

## 方式二：通过 GitHub 自动部署

### 1. 连接 GitHub 仓库

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择 `xiaoche0907/XC-STUDIO`
4. 点击 "Import"

### 2. 配置项目

Vercel 会自动检测到 Vite 项目，使用以下配置：

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. 添加环境变量

在部署前添加环境变量：

```
VITE_GEMINI_API_KEY=你的API密钥
VITE_YUNWU_API_URL=https://yunwu.ai
```

### 4. 部署

点击 "Deploy" 开始部署

### 5. 自动部署

配置完成后，每次推送到 `main` 分支都会自动触发部署！

---

## 方式三：一键部署按钮

在 README.md 中添加部署按钮：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xiaoche0907/XC-STUDIO)

---

## 📋 部署检查清单

### 部署前
- [x] vercel.json 配置文件存在
- [x] package.json 中有 build 脚本
- [x] .gitignore 排除了 node_modules 和 dist
- [ ] 准备好 API Key

### 部署后
- [ ] 访问部署的 URL 确认网站正常
- [ ] 在 Vercel Dashboard 设置环境变量
- [ ] 测试 API 功能是否正常
- [ ] 配置自定义域名（可选）

---

## 🔧 Vercel 配置说明

### vercel.json

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

这个配置确保所有路由都指向 index.html，支持客户端路由（React Router）。

### 构建设置

Vercel 会自动检测项目类型并使用以下设置：

- **Node.js 版本**: 18.x（推荐）
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **开发命令**: `npm run dev`

---

## 🌐 环境变量

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_GEMINI_API_KEY` | Gemini API 密钥 | `AIza...` |
| `VITE_YUNWU_API_URL` | 云雾 API 地址 | `https://yunwu.ai` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_PROVIDER` | API 提供商 | `gemini` |

### 设置方法

**方式1：通过 Vercel Dashboard**
1. 项目 → Settings → Environment Variables
2. 添加变量
3. 选择环境（Production / Preview / Development）
4. 保存并重新部署

**方式2：通过 Vercel CLI**
```bash
vercel env add VITE_GEMINI_API_KEY
```

---

## 🔄 更新部署

### 自动更新（推荐）

如果使用 GitHub 集成：
```bash
git add .
git commit -m "update: 更新内容"
git push origin main
```

Vercel 会自动构建和部署！

### 手动更新

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

---

## 📊 监控和日志

### 查看部署状态

```bash
vercel ls
```

### 查看部署日志

```bash
vercel logs [deployment-url]
```

### 访问 Dashboard

https://vercel.com/dashboard

可以查看：
- 部署历史
- 访问统计
- 性能监控
- 错误日志

---

## 🐛 常见问题

### 1. 构建失败

**原因**: 依赖安装失败或构建错误

**解决**:
```bash
# 本地测试构建
npm run build

# 检查构建输出
ls -la dist
```

### 2. 环境变量不生效

**原因**: 环境变量未正确设置

**解决**:
1. 确认变量名以 `VITE_` 开头
2. 在 Vercel Dashboard 重新添加
3. 重新部署项目

### 3. 路由 404 错误

**原因**: vercel.json 配置问题

**解决**: 确认 vercel.json 包含重写规则（已配置）

### 4. API 调用失败

**原因**: CORS 或 API Key 问题

**解决**:
1. 检查 API Key 是否正确
2. 确认 API 提供商配置正确
3. 查看浏览器控制台错误信息

---

## 🎯 性能优化

### 1. 启用 Edge 缓存

在 vercel.json 中添加：

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. 图片优化

使用 Vercel Image Optimization:

```tsx
import Image from 'next/image'

<Image src="/image.png" alt="..." width={500} height={300} />
```

### 3. 分析包大小

```bash
npm run build -- --report
```

---

## 📱 自定义域名

### 添加域名

1. Vercel Dashboard → 项目 → Settings → Domains
2. 输入域名
3. 按照提示配置 DNS 记录

### DNS 配置

添加 CNAME 记录：
```
CNAME  www  cname.vercel-dns.com
```

或 A 记录：
```
A  @  76.76.21.21
```

---

## 🚀 快速命令参考

```bash
# 安装 CLI
npm install -g vercel

# 登录
vercel login

# 首次部署
vercel

# 生产部署
vercel --prod

# 查看部署列表
vercel ls

# 查看日志
vercel logs

# 删除部署
vercel rm [deployment-url]

# 查看域名
vercel domains ls

# 添加环境变量
vercel env add

# 拉取环境变量
vercel env pull
```

---

## 📞 获取帮助

- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Issues](https://github.com/xiaoche0907/XC-STUDIO/issues)

---

**部署愉快！** 🎉
