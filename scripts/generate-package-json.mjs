#!/usr/bin/env node

/**
 * Generate root package.json from template
 * Copies the template and resolves {{extId}} placeholders using the
 * single source of truth in src/types/_entrypoint_extId_t.ts.
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

// Extract kExtId from the source of truth
const extIdPath = path.join(projectRoot, 'src', 'types', '_entrypoint_extId_t.ts');
let extId = 'p2p4vsc'; // fallback
if (fs.existsSync(extIdPath)) {
  const content = fs.readFileSync(extIdPath, 'utf8');
  const match = content.match(/export const kExtId\s*=\s*'([^']+)'/);
  if (match) {
    extId = match[1];
  } else {
    console.warn(
      `WARNING: Could not extract kExtId from ${extIdPath}. ` +
      `Expected a line matching: export const kExtId = '<value>'. ` +
      `Falling back to '${extId}'.`
    );
  }
}

// Read template, replace {{extId}}, and write to root
let templateContent = fs.readFileSync(templatePath, 'utf8');
const count = (templateContent.match(/\{\{extId\}\}/g) || []).length;
templateContent = templateContent.replace(/\{\{extId\}\}/g, extId);
fs.writeFileSync(outputPath, templateContent, 'utf8');
console.log(`✓ Generated package.json from template (replaced ${count} {{extId}} → ${extId})`);
