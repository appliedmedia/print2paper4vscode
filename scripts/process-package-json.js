#!/usr/bin/env node

/**
 * Process package.json template: Replace {{ns}} with actual namespace from kExtensionId
 * 
 * This script:
 * 1. Reads the source package.json (with {{ns}} templates)
 * 2. Extracts the namespace from compiled _entrypoint_extId_t.js
 * 3. Replaces all {{ns}} occurrences with the actual value
 * 4. Writes the processed package.json to the output directory
 * 
 * This ensures kExtensionId (from _entrypoint_extId_t.ts) is the single source of truth
 * for the namespace, including VS Code command registrations in package.json.
 */

const fs = require('fs');
const path = require('path');

// Paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const extensionIdPath = path.join(__dirname, '..', 'out', 'src', '_entrypoint_extId_t.js');
const outPackageJsonPath = path.join(__dirname, '..', 'out', 'package.json');

// Extract kExtensionId from compiled _entrypoint_extId_t.js
function extractNamespace() {
  if (!fs.existsSync(extensionIdPath)) {
    console.error('ERROR: _entrypoint_extId_t.js not found. Run `npm run compile` first.');
    process.exit(1);
  }

  const content = fs.readFileSync(extensionIdPath, 'utf8');
  
  // Look for: exports.kExtensionId = 'p2p4vsc';
  const match = content.match(/kExtensionId\s*=\s*['"]([^'"]+)['"]/);
  
  if (!match) {
    console.error('ERROR: Could not find kExtensionId in _entrypoint_extId_t.js');
    process.exit(1);
  }

  return match[1];
}

// Process package.json template
function processPackageJson() {
  console.log('Processing package.json template...');

  // Read source package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Extract namespace
  const namespace = extractNamespace();
  console.log(`  Namespace: ${namespace}`);

  // Replace {{ns}} in the entire JSON structure
  let packageJsonStr = JSON.stringify(packageJson, null, 2);
  const beforeCount = (packageJsonStr.match(/\{\{ns\}\}/g) || []).length;
  packageJsonStr = packageJsonStr.replace(/\{\{ns\}\}/g, namespace);
  const afterCount = (packageJsonStr.match(/\{\{ns\}\}/g) || []).length;
  
  console.log(`  Replaced ${beforeCount} occurrences of {{ns}}`);
  
  if (afterCount > 0) {
    console.warn(`  WARNING: ${afterCount} {{ns}} templates remain after replacement`);
  }

  // Write to output directory
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
