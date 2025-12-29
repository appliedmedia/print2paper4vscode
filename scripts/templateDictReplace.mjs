#!/usr/bin/env node

/**
 * templateDictReplace: Generic template replacement for build files
 * 
 * Reads configuration from .config/templateDictReplace.yaml and processes
 * all specified files, replacing template placeholders with actual values
 * imported from compiled TypeScript modules OR provided via CLI arguments.
 * 
 * Named to match App.templateDictReplace() - same concept for build process.
 * This allows easy extension - just add entries to the YAML config.
 * 
 * Usage:
 *   node scripts/templateDictReplace.mjs
 *   node scripts/templateDictReplace.mjs --dict key1=value1,key2=value2
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

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dict' && args[i + 1]) {
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

// Load configuration
const configPath = path.join(projectRoot, '.config', 'templateDictReplace.yaml');
const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));

console.log('templateDictReplace: Processing template replacements...');
console.log(`  Config: ${configPath}`);
if (Object.keys(dictOverrides).length > 0) {
  console.log(`  CLI overrides: ${JSON.stringify(dictOverrides)}`);
}
console.log(`  Replacements: ${config.replacements.length}\n`);

let totalReplacements = 0;
let errorCount = 0;

// Process each replacement
for (const replacement of config.replacements) {
  const { file, output, template, source, variable } = replacement;
  
  try {
    console.log(`Processing: ${file}`);
    console.log(`  Template: ${template}`);
    
    // Read source file
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Get value - either from CLI override or from module import
    let value;
    const templateKey = template.replace(/[{}]/g, ''); // Extract key from {{key}}
    
    if (dictOverrides[templateKey]) {
      value = dictOverrides[templateKey];
      console.log(`  Value: ${value} (from CLI override)`);
    } else if (source && variable) {
      // Import variable from compiled module
      const sourcePath = path.join(projectRoot, source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source module not found: ${sourcePath}`);
      }
      const sourceModule = require(sourcePath);
      value = sourceModule[variable];
      
      if (value === undefined) {
        throw new Error(`Variable '${variable}' not found in ${source}`);
      }
      console.log(`  Value: ${value} (from ${source})`);
    } else {
      throw new Error(`No value source specified (need CLI override or source+variable)`);
    }
    
    // Replace template with value
    const regex = new RegExp(template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const beforeCount = (fileContent.match(regex) || []).length;
    const result = fileContent.replace(regex, value);
    const afterCount = (result.match(regex) || []).length;
    
    console.log(`  Replaced: ${beforeCount} occurrences`);
    
    if (afterCount > 0) {
      console.warn(`  WARNING: ${afterCount} templates remain after replacement`);
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
    
    totalReplacements += beforeCount;
    
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
