/**
 * Cross-platform test runner for `node --test`.
 *
 * Shell glob expansion (e.g. `out/tests/*.test.js`) works on macOS/Linux but
 * NOT on Windows cmd.exe or PowerShell.  This tiny wrapper resolves the glob
 * in JavaScript and then spawns `node --test <files…>` with any extra flags
 * passed through from the npm script (--watch, --reporter, etc.).
 */
'use strict';

const { existsSync, readdirSync, statSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

/**
 * Recursively walk `dir`, collecting all files that end with `.test.js`.
 */
function collectTestFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTestFiles(full));
    } else if (entry.endsWith('.test.js')) {
      results.push(full);
    }
  }
  return results;
}

const TEST_DIR = join(__dirname, '..', 'out', 'tests');

if (!existsSync(TEST_DIR) || !statSync(TEST_DIR).isDirectory()) {
  console.error('TEST_DIR does not exist or is not a directory:', TEST_DIR);
  console.error('Run `npm run compile` first to generate the test output.');
  process.exit(1);
}

const files = collectTestFiles(TEST_DIR).sort();

if (files.length === 0) {
  console.error('No .test.js files found in', TEST_DIR);
  process.exit(1);
}

// Forward extra CLI flags (e.g. --watch, --reporter spec)
const extraArgs = process.argv.slice(2).map((arg) => {
  // Node's test runner uses --test-reporter, not --reporter.
  // Normalize so npm scripts can use the shorter form.
  if (arg === '--reporter') {
    return '--test-reporter';
  }
  if (arg.startsWith('--reporter=')) {
    return arg.replace('--reporter=', '--test-reporter=');
  }
  return arg;
});

try {
  execFileSync(
    process.execPath,
    ['--test', ...extraArgs, ...files],
    { stdio: 'inherit' }
  );
} catch (err) {
  // execFileSync throws on non-zero exit; the output was already
  // streamed to the terminal via stdio: 'inherit'.
  process.exit(err.status || 1);
}
