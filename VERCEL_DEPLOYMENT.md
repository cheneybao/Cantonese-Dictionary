# Vercel 部署问题分析与解决方案

## 问题根源

当前 Vercel 部署配置只部署了前端静态文件，后端 NestJS API 没有部署，导致：
- 前端请求 `/api/...` 失败
- 无法查询词典数据
- 显示"未找到词条"

## 当前架构

```
coze-mini-program/
├── src/              # 前端代码（Taro）
├── server/           # 后端代码（NestJS）
│   └── src/
│       ├── database/ # SQLite 数据库
│       └── dictionary/
└── data/
    └── word.csv      # 词典数据（128,000+ 条）
```

## Vercel 当前配置

```json
{
  "version": 2,
  "buildCommand": "pnpm build:web",
  "outputDirectory": "dist-web"
}
```

**问题**：只部署前端静态文件，后端未部署

## 解决方案（推荐）：使用 Render 部署后端

### 步骤 1：准备后端部署

在 `server` 目录下创建 `render.yaml`：

```yaml
services:
  - type: web
    name: cantonese-dictionary-api
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start:prod
    envVars:
      - key: NODE_ENV
        value: production
```

### 步骤 2：添加启动脚本

在 `server/package.json` 中添加：

```json
{
  "scripts": {
    "postinstall": "npx nest build"
  }
}
```

### 步骤 3：部署到 Render

1. 访问 https://render.com
2. 连接 GitHub 仓库
3. 创建新的 Web Service
4. 选择 `server` 目录作为 Root Directory
5. 配置环境变量（如果有）

### 步骤 4：配置前端 API 地址

在 `.env.production` 中配置：

```bash
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

### 步骤 5：修改前端请求配置

更新 `src/network/index.ts`：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const Network = {
  request: (options: RequestOptions) => {
    const url = options.url.startsWith('http')
      ? options.url
      : `${API_BASE_URL}${options.url}`
    // ...
  }
}
```

## 备选方案：使用 Supabase（长期方案）

### 优势
- 无需单独部署后端
- 数据持久化在云端
- 项目已有 Supabase 依赖

### 迁移步骤

1. 创建 Supabase 项目
2. 创建词典表
3. 导入数据到 PostgreSQL
4. 使用 Supabase Edge Functions 替代 NestJS API

## 临时方案：使用本地数据库

如果只是测试，可以：

1. 在本地运行后端服务
2. 使用 ngrok 暴露本地端口
3. 配置前端指向 ngrok URL

```bash
# 1. 启动本地后端
pnpm dev:server

# 2. 暴露端口
npx ngrok http 3000

# 3. 配置前端
VITE_API_BASE_URL=https://xxxx.ngrok.io
```

## 推荐部署方案对比

| 方案 | 优势 | 劣势 | 成本 |
|------|------|------|------|
| Render | 简单快速，免费层可用 | 需要单独管理 | 免费 |
| Railway | 简单快速，免费层可用 | 需要单独管理 | 免费 |
| Supabase | 全栈托管，数据持久化 | 迁移工作量大 | 免费 |
| Vercel Functions | 一体化部署 | 需要改造 NestJS | 付费 |

## 快速行动指南

**今天（10分钟）**：
1. 在 Render 创建免费账户
2. 部署后端服务
3. 配置前端 API 地址
4. 重新部署 Vercel

**本周（2小时）**：
1. 优化 Supabase 数据结构
2. 迁移数据到 PostgreSQL
3. 实现基于 Supabase 的 API
4. 完全移除 SQLite 依赖

## 联系支持

如需帮助，请提供：
1. Render 部署链接
2. Vercel 部署链接
3. 错误日志截图
