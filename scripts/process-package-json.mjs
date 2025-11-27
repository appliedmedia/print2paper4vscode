#!/usr/bin/env node

/**
 * Process package.json template: Replace {{extId}} with kExtId
 * 
 * This script directly imports kExtId from the compiled TypeScript
 * and replaces all {{extId}} placeholders in package.json.
 * 
 * Single source of truth: kExtId from _entrypoint_extId_t.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Import kExtId from compiled TypeScript (CommonJS)
const { kExtId } = require('../out/src/_entrypoint_extId_t.js');

// Paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const outPackageJsonPath = path.join(__dirname, '..', 'out', 'package.json');

// Process package.json template
function processPackageJson() {
  console.log('Processing package.json template...');
  console.log(`  Extension ID (kExtId): ${kExtId}`);

  // Read source package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Replace {{extId}} with kExtId
  let packageJsonStr = JSON.stringify(packageJson, null, 2);
  const beforeCount = (packageJsonStr.match(/\{\{extId\}\}/g) || []).length;
  packageJsonStr = packageJsonStr.replace(/\{\{extId\}\}/g, kExtId);
  const afterCount = (packageJsonStr.match(/\{\{extId\}\}/g) || []).length;
  
  console.log(`  Replaced ${beforeCount} occurrences of {{extId}}`);
  
  if (afterCount > 0) {
    console.warn(`  WARNING: ${afterCount} {{extId}} templates remain`);
  }

  // Write to output
  fs.writeFileSync(outPackageJsonPath, packageJsonStr, 'utf8');
  console.log(`  Written to: ${outPackageJsonPath}`);
  console.log('✓ package.json processing complete');
}

// Run
try {
  processPackageJson();
} catch (error) {
  console.error('ERROR processing package.json:', error.message);
  process.exit(1);
}
