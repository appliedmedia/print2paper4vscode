#!/usr/bin/env node

/**
 * Generate root package.json from template
 * This is a simple first step - just copy the template
 * Template replacement happens later via templateDictReplace.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const templatePath = path.join(projectRoot, '.config', 'template.package.json');
const outputPath = path.join(projectRoot, 'package.json');

if (!fs.existsSync(templatePath)) {
  console.error(`ERROR: Template not found: ${templatePath}`);
  process.exit(1);
}

// Copy template to root
fs.copyFileSync(templatePath, outputPath);
console.log('✓ Generated package.json from template');
