#!/bin/bash

# Vercel Build Script
# Build H5 version and copy static data

echo "Starting Vercel build..."

# Build H5 version
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
