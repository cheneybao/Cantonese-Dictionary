#!/bin/bash

# 本地测试构建后的文件

echo "Starting local test server for dist-web..."

cd "$(dirname "$0")/dist-web"

# 检查是否安装了 http-server
if ! command -v http-server &> /dev/null; then
    echo "http-server not found. Installing..."
    npm install -g http-server
fi

# 启动服务器
echo "Starting server at http://localhost:8080"
echo "Press Ctrl+C to stop"

http-server -p 8080 -c-1
