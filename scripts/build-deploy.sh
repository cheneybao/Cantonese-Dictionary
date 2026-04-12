#!/bin/bash

# 构建脚本 - 纯前端版本
# 1. 构建 H5
# 2. 复制静态资源（包括词典数据）

echo "🔨 开始构建..."

# 构建 H5
pnpm build:web

# 复制词典数据到构建目录
echo "📦 复制词典数据..."
mkdir -p dist-web/static/data
cp src/static/data/dictionary.json dist-web/static/data/dictionary.json

echo "✅ 构建完成！"
echo "📁 输出目录: dist-web"
