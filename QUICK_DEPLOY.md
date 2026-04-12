# 快速部署指南（解决 Vercel 后端 API 问题）

## 问题说明

Vercel 只部署了前端，后端 API 没有部署，导致词典查询失败。

## 5分钟快速解决方案

### 步骤 1：部署后端到 Render（3分钟）

1. 访问 https://render.com 并创建免费账户
2. 点击 "New +"
3. 选择 "Web Service"
4. 连接 GitHub 仓库
5. 配置：
   - **Name**: cantonese-dictionary-api
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/main`
   - **Instance Type**: Free
6. 点击 "Create Web Service"

等待部署完成（约 2-3 分钟），会得到一个 URL，例如：
```
https://cantonese-dictionary-api.onrender.com
```

### 步骤 2：配置前端 API 地址（1分钟）

1. 在项目根目录创建 `.env.production` 文件：

```bash
VITE_API_BASE_URL=https://cantonese-dictionary-api.onrender.com/api
```

2. 将 `cantonese-dictionary-api` 替换为你的实际服务名称

### 步骤 3：重新部署 Vercel（1分钟）

1. 推送代码到 GitHub
2. Vercel 会自动重新部署
3. 部署完成后测试查询功能

## 验证部署

### 测试后端 API

```bash
# 替换为你的 Render URL
curl -X POST https://your-app.onrender.com/api/dictionary/detail \
  -H "Content-Type: application/json" \
  -d '{"word":"记得"}'
```

应该返回：
```json
{
  "code": 200,
  "data": {
    "word": "記得",
    "jyutping": "gei3 dak1",
    "definition": "来自 Rime Cantonese 词典"
  }
}
```

### 测试前端

在 Vercel 部署的页面中：
1. 输入 "记得" 并搜索
2. 点击词条查看详情
3. 应该显示正确的粤语词条

## 常见问题

### Q: Render 部署失败
A: 检查以下几点：
- GitHub 仓库是否公开
- server/package.json 配置是否正确
- 构建日志中的错误信息

### Q: API 请求超时
A: Render 免费版有冷启动问题，首次请求可能较慢（10-30秒）

### Q: 数据库未初始化
A: 后端会在首次启动时自动导入数据，等待 1-2 分钟即可

## 后续优化

### 1. 添加健康检查端点

在 `server/src/app.controller.ts` 添加：

```typescript
@Get('health')
getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    wordCount: this.dictionaryService.getWordCount()
  };
}
```

### 2. 配置自动休眠

在 `render.yaml` 中添加：

```yaml
healthCheckPath: /api/health
```

### 3. 使用 Supabase（长期方案）

参见 `VERCEL_DEPLOYMENT.md` 了解完整迁移方案。

## 支持资源

- Render 文档: https://render.com/docs
- Vercel 文档: https://vercel.com/docs
- 项目文档: `VERCEL_DEPLOYMENT.md`

## 需要帮助？

如果遇到问题，请提供：
1. Render 部署日志
2. Vercel 部署日志
3. 浏览器控制台错误信息
4. API 请求响应内容
