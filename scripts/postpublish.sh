#!/bin/bash

# Postpublish script - restore template package.json after vsce packaging

set -e

echo "=== Postpublish: Restoring template package.json ==="

if [ -f package.json.template.bak ]; then
  mv package.json.template.bak package.json
  echo "✓ Restored package.json with templates"
else
  echo "⚠ WARNING: No backup found (package.json.template.bak)"
fi

echo "=== Postpublish complete ==="
