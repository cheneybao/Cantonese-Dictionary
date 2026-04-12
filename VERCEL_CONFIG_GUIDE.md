# Vercel 部署配置指南

## 🚀 快速部署步骤

### 1. 提交代码更改

```bash
git add package.json vercel.json
git commit -m "fix: 添加 vercel-build 脚本，简化配置"
git push
```

### 2. 在 Vercel 中配置项目

#### 方式一：通过 Vercel 控制台配置（推荐）

1. 访问 https://vercel.com/dashboard
2. 点击 `cantonese-dictionary` 项目
3. 进入 **Settings** → **General**
4. 滚动到 **Build & Development Settings**
5. 配置以下内容：

```
Framework Preset: Other
Build Command: pnpm build:web
Output Directory: dist-web
Install Command: pnpm install
```

6. 点击 **Save**
7. 进入 **Deployments** 标签
8. 点击最新的部署右侧的 **...** 菜单
9. 选择 **Redeploy**

#### 方式二：使用环境变量

如果控制台配置不生效，可以在 **Settings** → **Environment Variables** 中添加：

```
BUILD_COMMAND: pnpm build:web
OUTPUT_DIRECTORY: dist-web
```

### 3. 清除 Vercel 缓存

如果配置后仍然失败，清除缓存：

1. 进入项目 **Settings** → **Git**
2. 找到 **Ignored Build Step** 部分
3. 点击 **Reset Cache**

## 🔍 验证配置

### 本地测试构建

在本地执行构建命令，确保能正常生成 `dist-web` 目录：

```bash
pnpm build:web
ls -la dist-web/
```

应该看到以下文件：
```
index.html
css/
js/
static/
```

### 检查 package.json

确认 `vercel-build` 脚本已添加：

```json
{
  "scripts": {
    "build:web": "taro build --type h5",
    "vercel-build": "pnpm build:web"
  }
}
```

## ⚠️ 常见问题

### 问题 1：No Output Directory named "public" found

**原因**：Vercel 使用默认配置，未正确读取输出目录

**解决方案**：
1. 在 Vercel 控制台手动配置 Output Directory 为 `dist-web`
2. 确认 `vercel.json` 中已删除 `outputDirectory` 字段（避免冲突）
3. 使用 `vercel-build` 脚本，Vercel 会自动检测

### 问题 2：pnpm command not found

**原因**：Vercel 默认使用 npm

**解决方案**：
1. 在项目根目录创建 `.npmrc` 文件：
```bash
echo "package-manager=pnpm@9.0.0" > .npmrc
```

2. 或者在 Vercel Settings 中设置：
```
Install Command: pnpm install
```

### 问题 3：构建超时

**原因**：首次构建或依赖安装时间过长

**解决方案**：
1. 确保使用了 `vercel-build` 脚本
2. 检查 `package.json` 中的依赖是否过多
3. 在 Vercel 控制台查看具体超时的步骤

## ✅ 成功标志

部署成功后，您会看到：
- 🌟 绿色的部署状态
- 📦 `dist-web` 目录被正确识别
- 🌐 可以通过 `.vercel.app` 域名访问
- 📄 静态资源正常加载

## 📞 获取帮助

如果仍然遇到问题：
1. 复制 Vercel 的完整 Build Logs
2. 提供本地构建成功的截图
3. 提供项目 Settings 的截图
