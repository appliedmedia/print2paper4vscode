#!/usr/bin/env node
// Verifies every file loaded at runtime via fileRead/filePath/as_uri exists in dist/.
// Greps src/ to find all paths rather than maintaining a manual list.
// Exit 1 on any missing file so CI and prepublish can gate on it.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

// Collect all runtime-loaded paths by grepping src/**/*.{ts,yaml}
const runtimePaths = new Set();

function grepDir(dir, extensions) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      grepDir(full, extensions);
    } else if (extensions.some(e => entry.name.endsWith(e))) {
      const content = fs.readFileSync(full, 'utf8');

      // filePath: 'dist/...' and path: 'dist/...' in .ts files
      for (const m of content.matchAll(/(?:filePath|path):\s*'(dist\/[^']+)'/g)) {
        runtimePaths.add(m[1]);
      }

      // {{as_uri:dist/...}} in .yaml files
      for (const m of content.matchAll(/\{\{as_uri:(dist\/[^}]+)\}\}/gi)) {
        runtimePaths.add(m[1].trim());
      }
    }
  }
}

grepDir(srcDir, ['.ts', '.yaml']);

// Always require the bundle itself
runtimePaths.add('dist/extension.js');

let failed = false;
const sorted = [...runtimePaths].sort();
for (const rel of sorted) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    console.log(`  ✓  ${rel}`);
  } else {
    console.error(`  ✗  MISSING: ${rel}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nsmoke-dist-assets: FAILED — run `npm run build` first');
  process.exit(1);
} else {
  console.log(`\nsmoke-dist-assets: all ${sorted.length} assets present`);
}
