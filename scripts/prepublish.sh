#!/bin/bash

# Prepublish script for vsce packaging
# 1. Generate package.json from template
# 2. Compile TypeScript
# 3. Bundle with esbuild

set -e

echo "=== Prepublish: Build extension for deployment ==="

# Generate package.json from template
node scripts/generate-package-json.mjs

# Compile TypeScript
npm run compile:deploy

# Bundle with esbuild (produces dist/extension.js)
npm run esbuild

echo "=== Prepublish complete ==="
