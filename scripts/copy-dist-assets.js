#!/usr/bin/env node
// Copies runtime-loaded assets from src/ into dist/ so they ship in the .vsix.
// src/** is excluded by .vscodeignore; dist/ is the single deployment artifact dir.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// PDF.js webview libs
fs.mkdirSync(path.join(root, 'dist/lib'), { recursive: true });
for (const f of ['pdf.min.js', 'pdf.worker.min.js']) {
  fs.copyFileSync(path.join(root, 'src/lib', f), path.join(root, 'dist/lib', f));
}

// YAML config files loaded at runtime via fileRead
for (const f of fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.yaml'))) {
  fs.copyFileSync(path.join(root, 'src', f), path.join(root, 'dist', f));
}

console.log('copy-dist-assets: done');
