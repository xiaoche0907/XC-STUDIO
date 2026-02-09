# 🔍 Vercel白屏问题诊断清单

## 立即检查项

### 1. 检查Vercel部署日志
```
Vercel Dashboard → xc-studio → Deployments → 点击最新部署 → Build Logs
```
查找：
- ❌ 构建失败信息
- ❌ 依赖安装错误
- ❌ TypeScript编译错误

### 2. 检查Runtime Logs
```
Vercel Dashboard → xc-studio → Runtime Logs
```
查找：
- ❌ 运行时错误
- ❌ API调用失败

### 3. 检查环境变量设置
确认以下内容：
- ✅ 变量名：`VITE_GEMINI_API_KEY`（不是 `GEMINI_API_KEY`）
- ✅ 变量名：`VITE_YUNWU_API_URL`
- ✅ 环境选择：Production ✓ Preview ✓ Development ✓
- ✅ 点击了Save后重新Redeploy

### 4. 检查浏览器控制台（F12）
查找以下错误：
- `Failed to fetch`
- `Module not found`
- `Unexpected token`
- `Cannot read properties of undefined`
- CSP (Content Security Policy) 错误

---

## 常见白屏原因及解决方案

### 原因1：环境变量未生效
**症状：** 控制台显示 "API Key must be set"

**解决：**
1. 确认变量名是 `VITE_` 开头
2. 在 Vercel Dashboard 删除旧变量，重新添加
3. 必须点击 "Redeploy"

### 原因2：构建产物路径问题
**症状：** 404错误，资源加载失败

**解决：**
检查 `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/',  // 确保是 '/'
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
```

### 原因3：路由配置问题
**症状：** 页面刷新后404

**解决：**
确认 `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 原因4：依赖问题
**症状：** Module not found错误

**解决：**
```bash
# 本地测试
npm run build
npm run preview

# 如果失败，清理重装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 原因5：React Router配置
**症状：** 白屏，无错误信息

**解决：**
确认使用 `BrowserRouter`（已修复）

### 原因6：Zustand导入问题
**症状：** 控制台警告 "export 'default' deprecated"

**解决：**
检查所有 store 文件，使用：
```typescript
import { create } from 'zustand'
// 不要用：import create from 'zustand'
```

---

## 诊断步骤

### Step 1: 本地验证
```bash
# 清理构建
rm -rf dist

# 重新构建
npm run build

# 本地预览（模拟生产环境）
npm run preview

# 访问 http://localhost:4173
# 如果本地正常，问题在Vercel配置
# 如果本地也白屏，问题在代码
```

### Step 2: 检查构建产物
```bash
# 查看dist目录
ls -la dist
ls -la dist/assets

# 应该包含：
# - index.html
# - assets/*.js
# - assets/*.css
```

### Step 3: Vercel配置检查
确认以下文件存在且正确：
- ✅ `vercel.json` - 路由重写配置
- ✅ `vite.config.ts` - 构建配置
- ✅ `package.json` - 构建脚本

### Step 4: 强制重新部署
```bash
# 方式1：从命令行
vercel --prod --force

# 方式2：从Dashboard
Deployments → ... → Redeploy
```

---

## 临时解决方案

如果Vercel一直有问题，可以临时使用其他部署方式：

### 方案A：Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 方案B：GitHub Pages
```bash
# 修改 vite.config.ts
base: '/XC-STUDIO/'

# 构建
npm run build

# 推送到gh-pages分支
```

### 方案C：本地运行
```bash
npm run build
npm run preview
# 访问 http://localhost:4173
```

---

## 需要提供的信息

如果问题仍未解决，请提供：

1. **浏览器控制台截图**（F12 → Console）
2. **Vercel Build Logs截图**
3. **Vercel Runtime Logs截图**
4. **环境变量设置截图**
5. **本地 `npm run preview` 是否正常？**

---

## 联系支持

如果以上都无法解决：
- Vercel Support: https://vercel.com/help
- GitHub Issues: https://github.com/xiaoche0907/XC-STUDIO/issues

---

**创建时间**: 2026/2/9
**用途**: Vercel白屏问题排查
