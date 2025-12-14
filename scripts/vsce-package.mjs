#!/usr/bin/env node
/**
 * Stage-and-package wrapper for vsce that:
 * - preserves templated root package.json ({{extId}})
 * - generates a resolved staging manifest via templateDictReplace.mjs
 * - packages from a clean staging directory
 *
 * This wires the existing template replacement system into packaging, without
 * mutating source files.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(srcRel, dstRel) {
  const src = path.join(projectRoot, srcRel);
  const dst = path.join(projectRoot, dstRel);
  mkdirp(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyDir(srcRel, dstRel) {
  const src = path.join(projectRoot, srcRel);
  const dst = path.join(projectRoot, dstRel);
  mkdirp(path.dirname(dst));
  fs.cpSync(src, dst, { recursive: true });
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd ?? projectRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env
  });
  if (res.error) {
    console.error(`✗ Failed to run ${cmd}: ${res.error.message}`);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relPath), 'utf8'));
}

// 1) Clean staging
const stageDirRel = '.tmp/vsce';
const stageDir = path.join(projectRoot, stageDirRel);
rmrf(stageDir);
mkdirp(stageDir);

// 2) Build deploy output + generate resolved staging package.json (via YAML config)
run('npm', ['run', 'compile:deploy'], { cwd: projectRoot });

// 3) Stage minimal packaging inputs
copyFile('README.md', `${stageDirRel}/README.md`);
copyFile('CHANGELOG.md', `${stageDirRel}/CHANGELOG.md`);
copyFile('LICENSE', `${stageDirRel}/LICENSE`);
copyFile('package-lock.json', `${stageDirRel}/package-lock.json`);

// Optional: reuse ignore rules to ensure stage stays minimal
if (fs.existsSync(path.join(projectRoot, '.vscodeignore'))) {
  copyFile('.vscodeignore', `${stageDirRel}/.vscodeignore`);
}

// Copy only runtime output (not compiled tests)
copyDir('out/src', `${stageDirRel}/out/src`);
copyFile('out/package.json', `${stageDirRel}/out/package.json`);

// 4) Ensure staging manifest exists and is resolved
const stagePkgPath = path.join(projectRoot, stageDirRel, 'package.json');
if (!fs.existsSync(stagePkgPath)) {
  console.error(`✗ Expected staging manifest missing: ${stagePkgPath}`);
  process.exit(1);
}

const stagePkgStr = fs.readFileSync(stagePkgPath, 'utf8');
const templateMatches = stagePkgStr.match(/\{\{[^}]+\}\}/g);
if (templateMatches) {
  const uniq = [...new Set(templateMatches)].sort();
  console.error(`✗ Staging manifest still contains unresolved {{...}} templates: ${uniq.join(', ')}`);
  process.exit(1);
}

// 4b) Prevent vsce from invoking build scripts inside staging.
// The staging directory intentionally does not contain build config.
try {
  const stagePkg = JSON.parse(stagePkgStr);
  // Avoid running lifecycle scripts in staging; also keep the staging root minimal.
  delete stagePkg.scripts;
  delete stagePkg.devDependencies;
  fs.writeFileSync(stagePkgPath, JSON.stringify(stagePkg, null, 2) + '\n', 'utf8');
} catch (e) {
  console.error(`✗ Failed to sanitize staging package.json scripts: ${e?.message ?? e}`);
  process.exit(1);
}

// 4c) Install production dependencies into staging, so VSIX includes runtime node_modules.
run('npm', ['ci', '--omit=dev', '--ignore-scripts'], { cwd: stageDir });

// 5) Package from staging, writing VSIX to project root
const rootPkg = readJson('package.json');
const outName = `${rootPkg.name}-${rootPkg.version}.vsix`;
run('npx', ['--yes', '@vscode/vsce', 'package', '--dependencies', '--out', path.join(projectRoot, outName)], {
  cwd: stageDir
});

console.log(`✓ Packaged: ${outName}`);
