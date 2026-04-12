# Vercel 部署完整指南

## 🎯 核心问题

您的项目是一个 **monorepo**（包含前端和后端），Vercel 错误地构建了后端 `server/` 目录，而不是前端 H5。

## 🚀 解决方案：在 Vercel 控制台手动配置

### 步骤 1：推送最新代码

```bash
git push
```

### 步骤 2：在 Vercel 中配置（必须手动操作）

1. **访问项目设置**
   - 打开：https://vercel.com/dashboard
   - 点击 `cantonese-dictionary` 项目
   - 点击顶部的 **Settings** 标签

2. **配置构建设置（关键！）**
   - 点击左侧菜单的 **General**
   - 向下滚动到 **Build & Development Settings**
   - 按照以下内容填写：

   ```
   Framework Preset: Other
   Build Command: pnpm build:web
   Output Directory: dist-web
   Install Command: pnpm install
   ```

3. **配置 Node.js 版本**
   - 继续向下滚动到 **Node.js Version**
   - 选择 **20**（或 "20.x"）

4. **保存配置**
   - 滚动到底部，点击 **Save**

5. **重新部署**
   - 点击顶部的 **Deployments** 标签
   - 找到最新的部署记录
   - 点击右侧的 **...** 菜单
   - 选择 **Redeploy**

### 步骤 3：验证构建日志

部署后，在构建日志中应该看到：

```
Running build command: pnpm build:web
...
👽 Taro v4.1.9
vite v4.5.14 building for production...
✓ 713 modules transformed.
✓ built in XX.Xs
```

**不应该看到**：
```
Running "pnpm run build"
> server@1.0.0 build
```

## 🌐 部署成功后访问

```
https://cantonese-dictionary.vercel.app
```

## ⚠️ 如果仍然失败

### 检查 1：验证配置是否保存

回到 **Settings > General**，确认：
- Build Command 是否为 `pnpm build:web`
- Output Directory 是否为 `dist-web`

如果配置被重置了，重新填写并保存。

### 检查 2：清除缓存并重新部署

1. 删除项目（删除时选择不删除仓库）
2. 重新从 GitHub 导入项目
3. 导入时直接配置构建命令

### 检查 3：使用不同方式导入

如果上述方法都失败，尝试：

1. 删除 Vercel 中的项目
2. 访问：https://vercel.com/new
3. 点击 "Import Git Repository"
4. 选择您的仓库
5. 在导入页面直接配置：
   - Framework Preset: Other
   - Build Command: pnpm build:web
   - Output Directory: dist-web
   - Install Command: pnpm install

## 📊 成功标志

✅ 构建日志显示 `pnpm build:web`
✅ 生成 `dist-web` 目录
✅ 可以正常访问 `.vercel.app` 域名
✅ 页面正常加载

## 💡 为什么会出现这个问题？

您的项目结构：
```
├── pnpm-workspace.yaml  (声明了 server 是工作区)
├── package.json         (根包)
├── server/              (NestJS 后端)
└── src/                 (Taro 前端)
```

Vercel 检测到 monorepo 结构后，可能：
1. 优先构建工作区包（server）
2. 忽略 `vercel.json` 中的配置
3. 执行错误的构建命令

在 Vercel 控制台手动配置是**最可靠**的解决方案。

## 📞 获取帮助

如果按照上述步骤仍然无法部署，请提供：
1. Settings > General 的截图
2. 完整的构建日志
3. 部署后的访问 URL
