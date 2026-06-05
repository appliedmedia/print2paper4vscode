#!/bin/bash

# Publish to VS Code Marketplace and Open VSX Registry in one step.
# Required env vars:
#   VSCE_PAT  — VS Code Marketplace personal access token
#   OVSX_PAT  — Open VSX personal access token

set -e

if [ -z "$VSCE_PAT" ]; then
  echo "ERROR: VSCE_PAT is not set" >&2
  exit 1
fi
if [ -z "$OVSX_PAT" ]; then
  echo "ERROR: OVSX_PAT is not set" >&2
  exit 1
fi

echo "=== Build VSIX ==="
npx @vscode/vsce package \
  --readme-path docs/MARKETPLACE.md \
  --changelog-path docs/MARKETPLACE_CHANGELOG.md

VERSION=$(node -p "require('./package.json').version")
VSIX="print2paper4vscode-${VERSION}.vsix"

echo "=== Publish to VS Code Marketplace (v${VERSION}) ==="
npx @vscode/vsce publish --packagePath "$VSIX"

echo "=== Publish to Open VSX Registry (v${VERSION}) ==="
npx ovsx publish "$VSIX" -p "$OVSX_PAT"

echo "=== Done: v${VERSION} published to both registries ==="
