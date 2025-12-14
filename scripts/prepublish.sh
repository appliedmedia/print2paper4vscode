#!/bin/bash

# Prepublish script for vsce packaging
# 1. Compile TypeScript
# 2. Replace templates in package.json IN-PLACE (backed up)
# 3. vsce will package with processed package.json
# 4. Caller should run postpublish.sh to restore

set -e

echo "=== Prepublish: Compile and process templates ==="

# Compile TypeScript (no bundling, just include node_modules)
npm run compile:deploy

# Backup original package.json
cp package.json package.json.template.bak

# Process templates in root package.json (in-place)
node scripts/templateDictReplace.mjs

echo "=== Prepublish complete. Run postpublish.sh after packaging to restore. ==="
