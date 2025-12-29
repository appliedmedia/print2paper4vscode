#!/usr/bin/env node

/**
 * badgeReplace.mjs - Generate badge SVGs from YAML templates
 * 
 * Usage:
 *   node scripts/badgeReplace.mjs coverage 84.83 97ca00
 *   node scripts/badgeReplace.mjs ci
 * 
 * Reads templates from images/badges.yaml and replaces {{placeholders}}
 * with values passed as command-line arguments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Simple template replacement (matches Utils.templateDictReplace logic)
function templateDictReplace(source, dictionary) {
  let result = source;
  for (const [key, value] of Object.entries(dictionary)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

// Parse command line arguments
const [,, badgeType, ...args] = process.argv;

if (!badgeType) {
  console.error('Usage: node badgeReplace.mjs <badge-type> [args...]');
  console.error('');
  console.error('Examples:');
  console.error('  node badgeReplace.mjs coverage 84.83 97ca00');
  console.error('  node badgeReplace.mjs ci');
  process.exit(1);
}

// Load badge templates
const badgesYamlPath = path.join(projectRoot, 'images', 'badges.yaml');
const badgesYaml = yaml.parse(fs.readFileSync(badgesYamlPath, 'utf8'));

// Generate badge based on type
let template, outputFile, replacements;

if (badgeType === 'coverage') {
  const [coverage, colorHex] = args;
  if (!coverage || !colorHex) {
    console.error('Error: coverage badge requires 2 arguments: coverage colorHex');
    process.exit(1);
  }
  
  template = badgesYaml.coverage_badge;
  outputFile = path.join(projectRoot, 'images', 'coverage.svg');
  replacements = { coverage, colorHex };
  
} else if (badgeType === 'ci') {
  template = badgesYaml.ci_passing_badge;
  outputFile = path.join(projectRoot, 'images', 'ci.svg');
  replacements = {};
  
} else {
  console.error(`Error: Unknown badge type '${badgeType}'`);
  console.error('Valid types: coverage, ci');
  process.exit(1);
}

// Generate badge
const result = templateDictReplace(template, replacements);

// Write output
fs.writeFileSync(outputFile, result, 'utf8');
console.log(`✓ Generated ${badgeType} badge: ${outputFile}`);
