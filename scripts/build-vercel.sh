#!/bin/bash

# 设置环境变量
export NODE_OPTIONS="--max-old-space-size=4096"

# 清理之前的构建
rm -rf dist-web

# 执行构建
pnpm build:web
