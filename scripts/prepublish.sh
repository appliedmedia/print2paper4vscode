#!/bin/bash

# Prepublish script for vsce packaging
# 1. Generate package.json from template
# 2. Compile TypeScript
# 3. Replace templates in generated package.json
# 4. Bundle with esbuild (if using bundling)

set -e

echo "=== Prepublish: Build extension for deployment ==="

# Generate package.json from template
node scripts/generate-package-json.mjs

# Compile TypeScript
npm run compile:deploy

# Replace templates (template.package.json → package.json with {{extId}} → p2p4vsc)
node scripts/templateDictReplace/templateDictReplace.mjs

# Bundle with esbuild (produces dist/extension.js)
npm run esbuild

echo "=== Prepublish complete ==="
