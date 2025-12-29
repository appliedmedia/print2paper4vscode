#!/usr/bin/env node

/**
 * templateDictReplace: Generic template replacement for build files
 * 
 * Two modes of operation:
 * 
 * 1. Config-driven (default): Reads .config/templateDictReplace.yaml, imports values 
 *    from compiled TypeScript modules, replaces templates in specified files.
 * 
 * 2. CLI-driven (--dict flag): Applies provided key=value pairs to files in config.
 *    If 'yamlKey' is specified in config, extracts that key's value from YAML file first.
 *    Useful for CI badge generation with runtime values.
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
  const { file, output, template, source, variable, yamlKey, sourceYamlKey } = replacement;
  
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
      
    } else {
      // Config mode: import value from source (JS module or YAML file)
      console.log(`  Template: ${template}`);
      console.log(`  Source: ${source}`);
      
      if (!source) {
        throw new Error(`No value source specified (need source for config mode)`);
      }
      
      const sourcePath = path.join(projectRoot, source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }
      
      let value;
      
      // Determine if source is YAML or JS based on extension
      if (source.endsWith('.yaml') || source.endsWith('.yml')) {
        // Extract value from YAML source file
        const keyToUse = sourceYamlKey || variable; // Allow either sourceYamlKey or variable for backwards compat
        if (!keyToUse) {
          throw new Error(`sourceYamlKey (or variable) required when source is YAML file`);
        }
        console.log(`  Source YAML Key: ${keyToUse}`);
        
        const yamlContent = yaml.parse(fs.readFileSync(sourcePath, 'utf8'));
        if (!yamlContent || yamlContent[keyToUse] === undefined) {
          throw new Error(`YAML key '${keyToUse}' not found in ${source}`);
        }
        value = yamlContent[keyToUse];
        console.log(`  Value: ${value} (from YAML)`);
        
      } else {
        // Extract value from JS module
        if (!variable) {
          throw new Error(`variable required when source is JS module`);
        }
        console.log(`  Variable: ${variable}`);
        
        const sourceModule = require(sourcePath);
        value = sourceModule[variable];
        
        if (value === undefined) {
          throw new Error(`Variable '${variable}' not found in ${source}`);
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
