# GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建GitHub仓库

1. 在GitHub上创建一个新仓库
2. 将本地项目推送到GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 2. 启用GitHub Pages

1. 进入仓库的 **Settings** 页面
2. 在左侧菜单中找到 **Pages**
3. 在 **Build and deployment** 下：
   - **Source**: 选择 **GitHub Actions**
   - （不要选择 Deploy from a branch）

### 3. 自动部署

项目已配置好GitHub Actions工作流，当你推送代码到 `main` 分支时，会自动：

1. 安装依赖
2. 构建项目
3. 部署到GitHub Pages

### 4. 访问你的网站

部署完成后，你的网站将可以通过以下地址访问：

```
https://你的用户名.github.io/你的仓库名/
```

## 手动部署（可选）

如果你想手动触发部署：

1. 进入仓库的 **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 按钮
4. 选择 `main` 分支并点击运行

## 配置说明

### Vite配置

项目已配置为支持GitHub Pages部署：

```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // 使用相对路径，确保在GitHub Pages上正常工作
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  }
})
```

### GitHub Actions工作流

工作流文件位于 `.github/workflows/deploy.yml`，包含以下步骤：

1. 检出代码
2. 设置Node.js环境
3. 安装依赖
4. 构建项目
5. 上传构建产物
6. 部署到GitHub Pages

## 常见问题

### Q: 部署后页面显示空白？

A: 检查浏览器控制台是否有错误。通常是因为：
- 构建失败 - 查看Actions日志
- 资源路径错误 - 确认 `vite.config.ts` 中 `base: './'`

### Q: 如何自定义域名？

A: 在仓库Settings → Pages → Custom domain中设置你的域名。

### Q: 如何查看部署状态？

A: 进入仓库的Actions标签页，可以看到所有工作流的运行状态。

### Q: 部署需要多长时间？

A: 通常需要2-5分钟，取决于项目大小和GitHub的负载。

## 本地测试

在部署前，你可以本地测试构建结果：

```bash
npm run build
npm install -g http-server
cd dist
http-server -p 8000
```

然后访问 `http://localhost:8000/` 查看效果。

## 更新部署

每次推送代码到 `main` 分支都会触发自动部署：

```bash
git add .
git commit -m "Update game"
git push
```

## 环境变量（可选）

如果需要配置环境变量：

1. 进入仓库Settings → Secrets and variables → Actions
2. 点击 **New repository secret**
3. 添加你的环境变量

## 性能优化建议

1. **启用CDN**: 可以将静态资源托管到CDN
2. **压缩图片**: 如果添加图片资源，确保已压缩
3. **启用缓存**: GitHub Pages会自动缓存静态资源
4. **使用sourcemap**: 项目已启用sourcemap，便于调试

## 安全建议

1. **定期更新依赖**: `npm audit fix`
2. **使用HTTPS**: GitHub Pages默认提供HTTPS
3. **限制访问**: 如果需要，可以设置访问限制

## 备份建议

建议定期备份：
- 源代码（Git仓库）
- 游戏进度数据（LocalStorage数据）

## 更多资源

- [GitHub Pages官方文档](https://docs.github.com/en/pages)
- [Vite部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions文档](https://docs.github.com/en/actions)