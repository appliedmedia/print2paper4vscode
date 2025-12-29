#!/usr/bin/env node

/**
 * templateDictReplace: Generic template replacement for build files
 * 
 * Two modes of operation:
 * 
 * 1. Config-driven (default): Reads .config/templateDictReplace.yaml, imports values 
 *    from compiled TypeScript modules, replaces templates in specified files.
 * 
 * 2. CLI-driven (--dict flag): Applies provided key=value pairs to all files in config,
 *    skipping the module import step. Useful for CI badge generation with runtime values.
 * 
 * Usage:
 *   node scripts/templateDictReplace.mjs
 *   node scripts/templateDictReplace.mjs --dict coverage=84.83,colorHex=97ca00
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const projectRoot = path.join(__dirname, '..');

// Parse CLI arguments
const args = process.argv.slice(2);
const dictOverrides = {};
let useDictMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dict' && args[i + 1]) {
    useDictMode = true;
    // Parse key=value,key=value format
    const pairs = args[i + 1].split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        dictOverrides[key] = value;
      }
    }
    i++; // Skip next arg since we consumed it
  }
}

// Simple template replacement (matches Utils.templateDictReplace logic)
function templateDictReplace(source, dictionary) {
  let result = source;
  for (const [key, value] of Object.entries(dictionary)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

// Load configuration
const configPath = path.join(projectRoot, '.config', 'templateDictReplace.yaml');
const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));

console.log('templateDictReplace: Processing template replacements...');
console.log(`  Config: ${configPath}`);
if (useDictMode) {
  console.log(`  Mode: CLI dictionary`);
  console.log(`  Dictionary: ${JSON.stringify(dictOverrides)}`);
} else {
  console.log(`  Mode: Module imports`);
}
console.log(`  Replacements: ${config.replacements.length}\n`);

let totalReplacements = 0;
let errorCount = 0;

// Process each replacement
for (const replacement of config.replacements) {
  const { file, output, template, source, variable } = replacement;
  
  try {
    console.log(`Processing: ${file}`);
    
    // Skip entries in config mode if they don't have source/variable
    // (These entries are intended for --dict mode only)
    if (!useDictMode && (!source || !variable)) {
      console.log(`  Skipped: Requires --dict mode (no source/variable)\n`);
      continue;
    }
    
    // Read source file
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    let result;
    
    if (useDictMode) {
      // CLI mode: apply all dictionary replacements to the file
      console.log(`  Applying ${Object.keys(dictOverrides).length} replacements from --dict`);
      result = templateDictReplace(fileContent, dictOverrides);
      const count = Object.keys(dictOverrides).length;
      console.log(`  Replaced: ${count} templates`);
      totalReplacements += count;
      
    } else {
      // Config mode: import value from module and replace specific template
      console.log(`  Template: ${template}`);
      console.log(`  Source: ${source}`);
      console.log(`  Variable: ${variable}`);
      
      if (!source || !variable) {
        throw new Error(`No value source specified (need source+variable for config mode)`);
      }
      
      // Import variable from compiled module
      const sourcePath = path.join(projectRoot, source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source module not found: ${sourcePath}`);
      }
      const sourceModule = require(sourcePath);
      const value = sourceModule[variable];
      
      if (value === undefined) {
        throw new Error(`Variable '${variable}' not found in ${source}`);
      }
      
      console.log(`  Value: ${value}`);
      
      // Replace template with value
      const escapedTemplate = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedTemplate, 'g');
      const beforeCount = (fileContent.match(regex) || []).length;
      result = fileContent.replace(regex, value);
      const afterCount = (result.match(regex) || []).length;
      
      console.log(`  Replaced: ${beforeCount} occurrences`);
      
      if (afterCount > 0) {
        console.warn(`  WARNING: ${afterCount} templates remain after replacement`);
      }
      
      totalReplacements += beforeCount;
    }
    
    // Write output
    const outputPath = path.join(projectRoot, output);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, result, 'utf8');
    console.log(`  Output: ${output}`);
    console.log(`  ✓ Success\n`);
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}\n`);
    errorCount++;
  }
}

// Summary
console.log('─'.repeat(60));
console.log(`Total replacements: ${totalReplacements}`);
console.log(`Successful: ${config.replacements.length - errorCount}`);
console.log(`Failed: ${errorCount}`);

if (errorCount > 0) {
  console.error('\n✗ templateDictReplace completed with errors');
  process.exit(1);
} else {
  console.log('\n✓ templateDictReplace completed successfully');
}
