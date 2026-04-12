# 粤语词典 - Vercel 部署指南

## 项目简介

这是一个纯前端的粤语词典应用，使用 Taro + React + TypeScript 开发。所有词典数据存储在浏览器本地（IndexedDB），无需后端服务器。

## 部署方式

### 方式一：通过 Vercel CLI 部署

1. 安装 Vercel CLI
```bash
npm install -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署
```bash
vercel --prod
```

### 方式二：通过 GitHub 集成部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动检测项目配置并部署

## 环境变量

无需配置任何环境变量！项目默认使用纯前端模式（VITE_USE_LOCAL_API=true）。

## 项目配置

- **构建命令**: `pnpm vercel-build`
- **输出目录**: `dist-web`
- **静态文件**:
  - `/static/data/dictionary.json` - 词典数据（8.53 MB）
  - `/static/images/*` - 图片资源

## 技术栈

- **前端框架**: Taro 4.1.9 + React 18
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据存储**: IndexedDB + JSON
- **词典数据**: 93688 条词条，2208 个音节

## 功能特性

- ✅ 汉字/词语搜索
- ✅ 粤拼音节检字
- ✅ 词条详情展示
- ✅ 查询历史记录
- ✅ 收藏管理
- ✅ 离线优先（IndexedDB 本地存储）
- ✅ 跨端兼容（H5 + 微信小程序）

## 验收标准

- [x] 词典数据完整（93688 条词条）
- [x] 常用词语查询正确（吃饭、喝水、睡觉等）
- [x] 支持普通话-粤语同义词映射
- [x] Vercel 部署后查询功能正常

## 注意事项

1. **首次加载**: 首次访问时，应用会自动下载词典数据（8.53 MB）并存储到 IndexedDB
2. **浏览器兼容性**: 需要支持 IndexedDB 的现代浏览器
3. **网络连接**: 首次加载需要网络连接下载词典数据，之后可离线使用
