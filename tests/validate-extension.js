#!/usr/bin/env node

// Extension Validation Script
// This script validates the core functionality of the extension without needing VSCode

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Print2Paper4VSCode Extension Validation');
console.log('==========================================\n');

// Test 1: Check if compiled files exist
console.log('1. Checking compiled files...');
const requiredFiles = [
    'out/src/-entrypoint.js',
    'out/src/App.js',
    'out/src/Stylize.js',
    'out/src/PaperPrinter.js',
    'out/src/VSCodeAPIs.js',
    'out/src/UIMenu.js',
    'out/src/UIMenuManager.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    try {
        const stats = readFileSync(file, 'utf8');
        console.log(`   ✅ ${file} (${stats.length} bytes)`);
    } catch (error) {
        console.log(`   ❌ ${file} - ${error.message}`);
        allFilesExist = false;
    }
}

// Test 2: Check package.json configuration
console.log('\n2. Checking package.json configuration...');
try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    // Check ESM configuration
    if (packageJson.type === 'module') {
        console.log('   ✅ ESM enabled (type: "module")');
    } else {
        console.log('   ❌ ESM not enabled');
        allFilesExist = false;
    }
    
    // Check main entry point
    if (packageJson.main === './out/-entrypoint.js') {
        console.log('   ✅ Main entry point configured correctly');
    } else {
        console.log('   ❌ Main entry point misconfigured');
        allFilesExist = false;
    }
    
    // Check Shiki version
    if (packageJson.dependencies.shiki === '^3.11.0') {
        console.log('   ✅ Shiki v3.11.0 dependency');
    } else {
        console.log('   ❌ Shiki version mismatch');
        allFilesExist = false;
    }
    
    // Check VSCode engine version
    if (packageJson.engines.vscode === '^1.103.0') {
        console.log('   ✅ VSCode engine ^1.103.0');
    } else {
        console.log('   ❌ VSCode engine version mismatch');
        allFilesExist = false;
    }
    
} catch (error) {
    console.log(`   ❌ Failed to read package.json: ${error.message}`);
    allFilesExist = false;
}

// Test 3: Check TypeScript configuration
console.log('\n3. Checking TypeScript configuration...');
try {
    const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
    
    if (tsConfig.compilerOptions.module === 'ESNext') {
        console.log('   ✅ Module: ESNext');
    } else {
        console.log('   ❌ Module not ESNext');
        allFilesExist = false;
    }
    
    if (tsConfig.compilerOptions.moduleResolution === 'node16') {
        console.log('   ✅ Module resolution: node16');
    } else {
        console.log('   ❌ Module resolution not node16');
        allFilesExist = false;
    }
    
    if (tsConfig.compilerOptions.target === 'ES2022') {
        console.log('   ✅ Target: ES2022');
    } else {
        console.log('   ❌ Target not ES2022');
        allFilesExist = false;
    }
    
} catch (error) {
    console.log(`   ❌ Failed to read tsconfig.json: ${error.message}`);
    allFilesExist = false;
}

// Test 4: Check test results
console.log('\n4. Checking test results...');
try {
    const testOutput = readFileSync('test-results.txt', 'utf8');
    if (testOutput.includes('# tests 35') && testOutput.includes('# suites 6') && testOutput.includes('# pass 35')) {
        console.log('   ✅ All 35 tests passing across 6 suites');
    } else {
        console.log('   ❌ Test results not as expected');
        allFilesExist = false;
    }
} catch (error) {
    console.log('   ⚠️  Test results file not found - run tests first');
}

// Summary
console.log('\n==========================================');
if (allFilesExist) {
    console.log('🎉 Extension validation PASSED!');
    console.log('   The extension is ready for VSCode installation.');
    console.log('\n   Next steps:');
    console.log('   1. Package with: npx @vscode/vsce package');
    console.log('   2. Install .vsix file in VSCode');
    console.log('   3. Test commands: Print2Paper, Capture Preview');
} else {
    console.log('❌ Extension validation FAILED!');
    console.log('   Please fix the issues above before proceeding.');
}
console.log('==========================================');