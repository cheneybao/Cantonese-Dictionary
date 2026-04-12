#!/bin/bash

# Vercel Build Script
# Build H5 version and copy static data

echo "Starting Vercel build..."

# 设置环境变量以绕过 esbuild 版本检查
export ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH:-}

# 安装依赖
echo "Installing dependencies..."
pnpm install --frozen-lockfile

if [ $? -ne 0 ]; then
  echo "Install failed!"
  exit 1
fi

echo "Install successful!"

# 构建 H5 版本
echo "Building H5 version..."
pnpm build:web

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

echo "Build successful!"

# Create static data directory
echo "Creating static data directory..."
mkdir -p dist-web/static/data

# Copy dictionary.json
echo "Copying dictionary.json..."
cp src/static/data/dictionary.json dist-web/static/data/

if [ $? -ne 0 ]; then
  echo "Failed to copy dictionary.json!"
  exit 1
fi

# Verify file was copied
if [ -f "dist-web/static/data/dictionary.json" ]; then
  echo "✓ dictionary.json copied successfully"
  ls -lh dist-web/static/data/dictionary.json
else
  echo "✗ dictionary.json not found after copy!"
  exit 1
fi

echo "Build complete!"
