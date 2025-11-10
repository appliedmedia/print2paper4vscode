#!/usr/bin/env node
/**
 * Setup vscode mock for Node.js testing
 * 
 * This script creates a mock vscode module in node_modules so that tests
 * can run in Node.js without needing the actual VS Code extension host.
 * 
 * The real vscode module only exists when running inside VS Code.
 */

const fs = require('fs');
const path = require('path');

const vscodeDir = path.join(__dirname, '..', 'node_modules', 'vscode');
const packageJson = {
  name: 'vscode',
  version: '1.0.0-mock',
  description: 'Mock vscode module for tests',
  main: 'index.js',
};

const indexJs = `// Mock vscode module for Node.js tests
// This re-exports the test mock when running in Node.js
module.exports = require('../../tests/vscode-mock.cjs');
`;

try {
  // Create vscode directory if it doesn't exist
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }

  // Write package.json
  fs.writeFileSync(
    path.join(vscodeDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Write index.js
  fs.writeFileSync(path.join(vscodeDir, 'index.js'), indexJs);

  console.log('✓ VS Code mock module setup complete');
} catch (error) {
  console.error('✗ Failed to setup VS Code mock:', error.message);
  // Don't fail the install, just warn
  process.exit(0);
}
