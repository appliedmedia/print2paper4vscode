#!/usr/bin/env node

/**
 * templateDictReplace: Generic template replacement for build files
 * 
 * Reads configuration from .config/templateDictReplace.yaml and processes
 * all specified files, replacing template placeholders with actual values
 * imported from compiled TypeScript modules.
 * 
 * Named to match App.templateDictReplace() - same concept for build process.
 * This allows easy extension - just add entries to the YAML config.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const projectRoot = path.join(__dirname, '..');

// Load configuration
const configPath = path.join(projectRoot, '.config', 'templateDictReplace.yaml');
const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));

console.log('templateDictReplace: Processing template replacements...');
console.log(`  Config: ${configPath}`);
console.log(`  Replacements: ${config.replacements.length}\n`);

let totalReplacements = 0;
let errorCount = 0;

// Process each replacement
for (const replacement of config.replacements) {
  const { file, output, template, source, variable } = replacement;
  
  try {
    console.log(`Processing: ${file}`);
    console.log(`  Template: ${template}`);
    console.log(`  Source: ${source}`);
    console.log(`  Variable: ${variable}`);
    
    // Read source file
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Determine whether this template is present before importing anything.
    let fileStr = JSON.stringify(fileContent, null, 2);
    const regex = new RegExp(template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const beforeCount = (fileStr.match(regex) || []).length;

    if (beforeCount === 0) {
      console.log('  Replaced: 0 occurrences (template not present, skipping import)');
    } else {
      // Import variable from compiled module only when needed.
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
      fileStr = fileStr.replace(regex, () => String(value));
      const afterCount = (fileStr.match(regex) || []).length;

      console.log(`  Replaced: ${beforeCount} occurrences`);

      if (afterCount > 0) {
        console.warn(`  WARNING: ${afterCount} templates remain after replacement`);
      }
    }
    
    // Write output
    const outputPath = path.join(projectRoot, output);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, fileStr, 'utf8');
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
