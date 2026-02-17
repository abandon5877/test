# GitHub Pages 部署指南

## ⚠️ 重要：配置仓库名称

在部署前，**必须**根据你的GitHub仓库名称配置 `vite.config.ts` 中的 `base` 路径：

### 当前配置
```typescript
// vite.config.ts
export default defineConfig({
  base: '/test/',  // ← 仓库名称
  // ...
})
```

### 如何修改仓库名称

如果你的仓库名不是 `test`，需要修改 `vite.config.ts`：

```typescript
// 如果仓库名是 my-game
base: '/my-game/',

// 如果仓库名是 magic-adventure
base: '/magic-adventure/',

// 如果是用户主页（仓库名是 username.github.io）
base: '/',
```

## 快速部署步骤

### 1. 配置仓库名称

1. 打开 `vite.config.ts`
2. 修改 `base` 为你的仓库名称
3. 重新构建：`npm run build`

### 2. 推送到GitHub

```bash
git add .
git commit -m "Update base path for GitHub Pages"
git push
```

### 3. 启用GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存

### 4. 访问网站

```
https://你的用户名.github.io/你的仓库名/
```

## 常见仓库名配置示例

### 示例1：仓库名为 `test`
```typescript
base: '/test/',
```
访问：`https://username.github.io/test/`

### 示例2：仓库名为 `magic-game`
```typescript
base: '/magic-game/',
```
访问：`https://username.github.io/magic-game/`

### 示例3：用户主页（仓库名为 `username.github.io`）
```typescript
base: '/',
```
访问：`https://username.github.io/`

## 为什么需要配置base路径？

GitHub Pages将项目部署到子目录时，资源路径需要包含仓库名称：

- ❌ 错误：`./assets/style.css`（相对路径在某些情况下不工作）
- ✅ 正确：`/仓库名/assets/style.css`（绝对路径）

## 完整配置示例

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // 根据你的仓库名修改这里
  base: '/test/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  },

  server: {
    port: 3000,
    open: true
  },

  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**', 'src/types/**']
    }
  }
})
```

## 验证部署

部署完成后，检查以下内容：

1. **页面样式是否正常** - 背景应该是深蓝色
2. **按钮是否可点击** - 点击符文应该能添加到卡槽
3. **控制台无错误** - 打开浏览器开发者工具检查

## 本地测试

在部署前，可以本地测试：

```bash
# 构建项目
npm run build

# 安装http-server
npm install -g http-server

# 启动服务器（模拟GitHub Pages）
cd dist
http-server -p 8000

# 访问
# http://localhost:8000/
```

## 故障排除

### 问题：页面显示空白或样式未加载

**原因**：`base` 路径配置错误

**解决**：
1. 检查 `vite.config.ts` 中的 `base` 是否与仓库名一致
2. 重新构建：`npm run build`
3. 推送代码触发重新部署

### 问题：点击按钮没反应

**原因**：JavaScript文件加载失败

**解决**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误信息
3. 确认 `base` 路径配置正确

### 问题：资源404错误

**原因**：资源路径不正确

**解决**：
1. 检查 `dist/index.html` 中的资源路径
2. 应该是 `/你的仓库名/assets/...`
3. 如果不是，修改 `vite.config.ts` 的 `base` 并重新构建

## 自动化部署

项目已配置GitHub Actions，每次推送到 `main` 分支会自动部署：

```bash
git add .
git commit -m "Update game"
git push
```

## 更多资源

- [GitHub Pages官方文档](https://docs.github.com/en/pages)
- [Vite部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions文档](https://docs.github.com/en/actions)