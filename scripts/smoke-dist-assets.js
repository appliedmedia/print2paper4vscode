#!/usr/bin/env node
// Verifies every file loaded at runtime via fileRead/filePath/as_uri exists in dist/.
// Greps src/ to find all paths rather than maintaining a manual list.
// Exit 1 on any missing file so CI and prepublish can gate on it.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

// kPath values from src/types/OS_t.ts — must stay in sync
const kPath = { lib: 'dist/lib', yaml: 'dist' };

// Collect all runtime-loaded paths by grepping src/**/*.{ts,yaml}
const runtimePaths = new Set();

function grepDir(dir, extensions) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      grepDir(full, extensions);
    } else if (extensions.some(e => entry.name.endsWith(e))) {
      const content = fs.readFileSync(full, 'utf8');

      // filePath: `${kPath.yaml}/...` and path: `${kPath.lib}/...` in .ts files
      for (const m of content.matchAll(/(?:filePath|path):\s*`\$\{kPath\.\w+\}\/([^`]+)`/g)) {
        const prefix = content.slice(m.index).match(/kPath\.(\w+)/)?.[1];
        if (prefix && kPath[prefix]) runtimePaths.add(`${kPath[prefix]}/${m[1]}`);
      }

      // {{as_uri:{{path_lib}}/...}} and {{as_uri:{{path_yaml}}/...}} in .yaml files
      for (const m of content.matchAll(/\{\{as_uri:\{\{(path_\w+)\}\}\/([^}]+)\}\}/gi)) {
        const prefix = m[1] === 'path_lib' ? kPath.lib : kPath.yaml;
        runtimePaths.add(`${prefix}/${m[2]}`);
      }

      // Legacy literal dist/ paths (fallback, should be empty after migration)
      for (const m of content.matchAll(/(?:filePath|path):\s*'(dist\/[^']+)'/g)) {
        runtimePaths.add(m[1]);
      }
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
