#!/usr/bin/env node

/**
 * templateDictReplace: Generic template replacement for build files
 * 
 * Two modes of operation:
 * 
 * 1. Config-driven (default): Reads .config/templateDictReplace.yaml, imports values 
 *    from compiled TypeScript modules, replaces templates in specified files.
 * 
 * 2. CLI-driven (--dict flag): Applies provided JSON object to files in config.
 *    If 'yamlKey' is specified in config, extracts that key's value from YAML file first.
 *    Useful for CI badge generation with runtime values.
 * 
 * Usage:
 *   node scripts/templateDictReplace.mjs
 *   node scripts/templateDictReplace.mjs --dict '{"coverage":"84.83","colorHex":"97ca00"}'
 * 
 * Note: --dict requires valid JSON object (use single quotes in bash to avoid escaping)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Determine project root
// Check if we're in badges4readmes/ subdirectory
let projectRoot;
if (fs.existsSync(path.join(__dirname, 'templateDictReplace.yaml'))) {
  // We're in badges4readmes/ with config in same directory
  projectRoot = __dirname;
} else if (fs.existsSync(path.join(__dirname, '../..'))) {
  // We're in scripts/ subdirectory, go up to project root
  projectRoot = path.join(__dirname, '../..');
} else {
  projectRoot = path.join(__dirname, '..');
}

// Parse CLI arguments
const args = process.argv.slice(2);
const dictOverrides = {};
let useDictMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dict' && args[i + 1]) {
    useDictMode = true;
    const dictArg = args[i + 1];
    
    try {
      const parsed = JSON.parse(dictArg);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        console.error('Error: --dict must be a JSON object');
        console.error('Example: --dict \'{"coverage":"95.0","colorHex":"97ca00"}\'');
        process.exit(1);
      }
      Object.assign(dictOverrides, parsed);
    } catch (err) {
      console.error(`Error: --dict requires valid JSON object`);
      console.error(`  ${err.message}`);
      console.error('');
      console.error('Example: --dict \'{"coverage":"95.0","colorHex":"97ca00"}\'');
      console.error('Note: Use single quotes in bash to avoid escaping');
      process.exit(1);
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
// Try local directory first (badges4readmes/), then .config/
let configPath = path.join(projectRoot, 'templateDictReplace.yaml');
if (!fs.existsSync(configPath)) {
  configPath = path.join(projectRoot, '.config', 'templateDictReplace.yaml');
}

let config;
try {
  config = yaml.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error(`Error: Failed to load configuration file: ${configPath}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

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
  const { file, output, template, source, key, yamlKey } = replacement;
  
  try {
    console.log(`Processing: ${file}`);
    
    // Skip entries in config mode if they don't have source
    // (These entries are intended for --dict mode only)
    if (!useDictMode && !source) {
      console.log(`  Skipped: Requires --dict mode (no source)\n`);
      continue;
    }
    
    // Read input file
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // If yamlKey specified for INPUT file, extract that key's value
    // (Used in CLI mode for badge generation from svgs.yaml)
    if (yamlKey) {
      try {
        const yamlContent = yaml.parse(fileContent);
        if (!yamlContent || !yamlContent[yamlKey]) {
          throw new Error(`YAML key '${yamlKey}' not found in ${file}`);
        }
        fileContent = yamlContent[yamlKey];
        console.log(`  Extracted input YAML key: ${yamlKey}`);
      } catch (err) {
        throw new Error(`Failed to parse YAML or extract key '${yamlKey}': ${err.message}`);
      }
    }
    
    let result;
    
    if (useDictMode) {
      // CLI mode: apply all dictionary replacements to the file
      console.log(`  Applying ${Object.keys(dictOverrides).length} replacements from --dict`);
      result = templateDictReplace(fileContent, dictOverrides);
      const count = Object.keys(dictOverrides).length;
      console.log(`  Replaced: ${count} templates`);
      totalReplacements += count;
      
      // Check for remaining placeholders
      const remaining = (result.match(/\{\{[^}]+\}\}/g) || []);
      if (remaining.length > 0) {
        console.warn(`  WARNING: ${remaining.length} placeholders remain after replacement: ${remaining.join(', ')}`);
      }
      
    } else {
      // Config mode: import value from source (JS module or YAML file)
      console.log(`  Template: ${template}`);
      console.log(`  Source: ${source}`);
      
      const sourcePath = path.join(projectRoot, source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }
      
      let value;
      
      // Determine if source is YAML or JS based on extension
      if (source.endsWith('.yaml') || source.endsWith('.yml')) {
        // Extract value from YAML source file
        if (!key) {
          throw new Error(`key required when source is YAML file (specifies which YAML key to extract)`);
        }
        console.log(`  Source YAML Key: ${key}`);
        
        const yamlContent = yaml.parse(fs.readFileSync(sourcePath, 'utf8'));
        if (!yamlContent || yamlContent[key] === undefined) {
          throw new Error(`YAML key '${key}' not found in ${source}`);
        }
        value = yamlContent[key];
        console.log(`  Value: ${value} (from YAML)`);
        
      } else {
        // Extract value from JS module
        if (!key) {
          throw new Error(`key required when source is JS module`);
        }
        console.log(`  Key: ${key}`);
        
        const sourceModule = require(sourcePath);
        value = sourceModule[key];
        
        if (value === undefined) {
          throw new Error(`Key '${key}' not found in ${source}`);
        }
        console.log(`  Value: ${value} (from JS module)`);
      }
      
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
