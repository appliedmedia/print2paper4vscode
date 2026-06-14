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

// DejaVu fonts embedded into generated PDFs for Unicode coverage
const fontSrc = path.join(root, 'assets/fonts/dejavu');
const fontDest = path.join(root, 'dist/fonts');
fs.mkdirSync(fontDest, { recursive: true });
for (const f of fs.readdirSync(fontSrc).filter(f => f.endsWith('.ttf'))) {
  fs.copyFileSync(path.join(fontSrc, f), path.join(fontDest, f));
}

// Toolbar/menu command icon. VS Code does NOT theme file-path icons, so we ship
// two color variants. The assets source is the bright (#c5c5c5) art used in dark
// themes; the dark-stroke (#424242) variant for light themes is derived.
const iconSrc = fs.readFileSync(path.join(root, 'assets/icon-p2p4vsc-bright.svg'), 'utf8');
fs.writeFileSync(path.join(root, 'dist/icon-p2p4vsc-bright.svg'), iconSrc);
fs.writeFileSync(
  path.join(root, 'dist/icon-p2p4vsc-dark.svg'),
  iconSrc.replace(/#c5c5c5/g, '#424242')
);

console.log('copy-dist-assets: done');
