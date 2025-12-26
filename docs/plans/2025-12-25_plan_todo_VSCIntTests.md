# VS Code Integration Tests Plan

**Status:** TODO  
**Created:** 2025-12-25  
**Priority:** Low - Optional professional polish  
**Estimated Time:** 4-6 hours

## Overview

Add VS Code integration tests to Print2Paper4VSCode extension. Currently, the extension has comprehensive unit tests (357 passing tests, 85% coverage) but no tests running in an actual VS Code environment. This plan adds integration tests using VS Code's test framework.

---

## Current State

| Component | Status | Notes |
| --- | --- | --- |
| Unit tests | ✅ 357 passing | 85% line coverage |
| Test framework | ✅ node:test | Fast, lightweight |
| VS Code tests | ❌ None | No integration tests |
| Extension activation | ⚠️ Untested in VS Code | Works, but no automated test |
| Command registration | ⚠️ Untested in VS Code | Works, but no automated test |
| Webview rendering | ⚠️ Untested in VS Code | Works, but no automated test |

---

## Goals

1. Test extension activation in real VS Code
2. Test command registration and execution
3. Test webview creation and rendering
4. Test full print workflow end-to-end
5. Add integration test CI job (optional)

---

## Why Integration Tests?

**Current unit tests are excellent, but:**
- Don't test VS Code API interactions
- Don't test extension activation
- Don't test webview rendering in real environment
- Don't catch VS Code version compatibility issues

**Integration tests provide:**
- Confidence in VS Code API usage
- Early detection of breaking changes in VS Code updates
- Real environment testing (not mocks)
- End-to-end workflow validation

**Trade-offs:**
- Slower (requires launching VS Code)
- More complex setup
- Harder to debug
- CI requires headless environment

---

## Implementation Plan

### Task 1: Setup Test Infrastructure (1-2 hours)

**Install dependencies:**

```bash
npm install --save-dev @vscode/test-electron
```

**Create test directory structure:**

```
tests/
  integration/
    suite/
      extension.test.ts      # Extension activation tests
      commands.test.ts       # Command registration tests
      workflow.test.ts       # Full workflow tests
      webview.test.ts        # Webview rendering tests
    index.ts                 # Test suite runner
  runTest.ts                 # Test launcher
```

**File:** `tests/runTest.ts`

```typescript
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../');

    // The path to the extension test script
    const extensionTestsPath = path.resolve(__dirname, './integration/suite/index');

    // Download VS Code, unzip it and run the integration test
    await runTests({ 
      extensionDevelopmentPath, 
      extensionTestsPath,
      launchArgs: ['--disable-extensions'] // Disable other extensions for clean test
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
```

**File:** `tests/integration/suite/index.ts`

```typescript
import * as glob from 'glob';
import * as path from 'path';

export async function run(): Promise<void> {
  // Import mocha dynamically (used by @vscode/test-electron)
  const mocha = new (await import('mocha')).default({
    ui: 'tdd',
    color: true,
    timeout: 10000
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob.glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}
```

**Update package.json:**

```json
{
  "scripts": {
    "test:integration": "node ./out/tests/runTest.js",
    "test:all": "npm test && npm run test:integration"
  },
  "devDependencies": {
    "@vscode/test-electron": "^2.4.0",
    "mocha": "^10.0.0",
    "glob": "^10.0.0"
  }
}
```

---

### Task 2: Extension Activation Tests (1 hour)

**File:** `tests/integration/suite/extension.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Test Suite', () => {
  vscode.window.showInformationMessage('Start extension activation tests');

  test('Extension should be present', () => {
    const ext = vscode.extensions.getExtension('acoven.print2paper4vscode');
    assert.ok(ext, 'Extension not found');
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('acoven.print2paper4vscode');
    assert.ok(ext, 'Extension not found');
    
    await ext.activate();
    assert.ok(ext.isActive, 'Extension failed to activate');
  });

  test('Extension should expose expected API', async () => {
    const ext = vscode.extensions.getExtension('acoven.print2paper4vscode');
    await ext?.activate();
    
    const exports = ext?.exports;
    // Add assertions based on your extension's public API
    assert.ok(exports, 'Extension should export API');
  });
});
```

---

### Task 3: Command Registration Tests (1 hour)

**File:** `tests/integration/suite/commands.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Command Registration Test Suite', () => {
  
  test('Print command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const printCommand = commands.find(cmd => cmd === 'p2p4vsc.print2paper');
    
    assert.ok(printCommand, 'Print command not registered');
  });

  test('Print PDF command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const pdfCommand = commands.find(cmd => cmd === 'p2p4vsc.print2paperPDF');
    
    assert.ok(pdfCommand, 'Print PDF command not registered');
  });

  test('Show settings command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const settingsCommand = commands.find(cmd => cmd === 'p2p4vsc.showSettings');
    
    assert.ok(settingsCommand, 'Show settings command not registered');
  });
});
```

---

### Task 4: Workflow Integration Tests (2 hours)

**File:** `tests/integration/suite/workflow.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Print Workflow Test Suite', () => {
  
  test('Print command executes without error', async function() {
    this.timeout(30000); // Printing may take time
    
    // Create a test document
    const doc = await vscode.workspace.openTextDocument({
      content: 'console.log("Hello, World!");',
      language: 'javascript'
    });
    
    // Show the document
    await vscode.window.showTextDocument(doc);
    
    // Execute print command
    try {
      await vscode.commands.executeCommand('p2p4vsc.print2paper');
      // If we get here, command executed without throwing
      assert.ok(true, 'Print command executed');
    } catch (err) {
      assert.fail(`Print command failed: ${err}`);
    }
  });

  test('PDF generation creates file', async function() {
    this.timeout(30000);
    
    // Create a test document
    const doc = await vscode.workspace.openTextDocument({
      content: 'function test() { return 42; }',
      language: 'javascript'
    });
    
    await vscode.window.showTextDocument(doc);
    
    // Execute PDF command
    await vscode.commands.executeCommand('p2p4vsc.print2paperPDF');
    
    // Wait a bit for PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if PDF was created in temp directory
    // Note: You'll need to expose the PDF path or check known temp location
    // This is a simplified example
    assert.ok(true, 'PDF command completed');
  });

  test('Print with markdown document', async function() {
    this.timeout(30000);
    
    const doc = await vscode.workspace.openTextDocument({
      content: '# Test\n\nThis is **bold** and *italic*.',
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc);
    
    try {
      await vscode.commands.executeCommand('p2p4vsc.print2paper');
      assert.ok(true, 'Markdown print succeeded');
    } catch (err) {
      assert.fail(`Markdown print failed: ${err}`);
    }
  });

  test('Print with empty document', async function() {
    this.timeout(30000);
    
    const doc = await vscode.workspace.openTextDocument({
      content: '',
      language: 'plaintext'
    });
    
    await vscode.window.showTextDocument(doc);
    
    // Should handle empty document gracefully
    try {
      await vscode.commands.executeCommand('p2p4vsc.print2paper');
      assert.ok(true, 'Empty document handled');
    } catch (err) {
      // May throw or handle gracefully - depends on implementation
      assert.ok(err.message.includes('empty') || err.message.includes('no content'));
    }
  });
});
```

---

### Task 5: Webview Tests (Optional - 1 hour)

**File:** `tests/integration/suite/webview.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Webview Test Suite', () => {
  
  test('Webview opens after print command', async function() {
    this.timeout(30000);
    
    const doc = await vscode.workspace.openTextDocument({
      content: 'test content',
      language: 'javascript'
    });
    
    await vscode.window.showTextDocument(doc);
    
    // Track webview creation
    let webviewCreated = false;
    const disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
      // Check if webview appeared (this is simplified)
      if (editor) {
        webviewCreated = true;
      }
    });
    
    await vscode.commands.executeCommand('p2p4vsc.print2paper');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    disposable.dispose();
    assert.ok(webviewCreated, 'Webview should be created');
  });
});
```

---

### Task 6: CI Integration (Optional - 1 hour)

**Update:** `.github/workflows/ci.yml`

```yaml
jobs:
  test:
    # ... existing test job ...

  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Generate package.json
        run: node scripts/generate-package-json.mjs

      - name: Install dependencies
        run: npm ci
      
      - name: Compile TypeScript
        run: npm run compile
      
      - name: Setup X virtual framebuffer (Linux)
        run: |
          sudo apt-get update
          sudo apt-get install -y xvfb
      
      - name: Run integration tests
        run: xvfb-run -a npm run test:integration
```

---

## Testing Strategy

### Local Testing

```bash
# Compile extension
npm run compile

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

### Manual Verification

1. Tests run in real VS Code instance
2. VS Code window appears during test (unless headless)
3. Test output shows pass/fail for each suite
4. No extension crashes or errors

---

## Implementation Order

1. **Phase 1 (2 hours):** Setup infrastructure
   - Install @vscode/test-electron
   - Create test directory structure
   - Add npm scripts
   - Verify test runner works

2. **Phase 2 (1 hour):** Basic tests
   - Extension activation
   - Command registration
   - Run locally and verify

3. **Phase 3 (2 hours):** Workflow tests
   - Print command execution
   - PDF generation
   - Multiple document types
   - Error handling

4. **Phase 4 (1 hour):** CI integration (optional)
   - Add integration-test job
   - Setup xvfb for headless
   - Verify on GitHub Actions

---

## Success Criteria

- [ ] Test infrastructure set up and working
- [ ] Extension activation tests pass
- [ ] Command registration tests pass
- [ ] Print workflow tests pass (at least basic)
- [ ] Tests run locally without errors
- [ ] Tests run in CI (if implemented)
- [ ] No regressions in existing unit tests
- [ ] Documentation updated with integration test instructions

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Slow tests | Medium | Keep test count reasonable, use longer timeouts |
| Flaky tests | High | Proper waits, cleanup between tests |
| CI headless issues | Medium | Use xvfb, test locally first |
| VS Code version compat | Low | Pin @vscode/test-electron version |
| Debug difficulty | Medium | Good logging, run tests with --inspect |

---

## Alternative: Playwright Tests

Instead of @vscode/test-electron, could use Playwright for E2E tests:

**Pros:**
- More control over VS Code instance
- Better debugging tools
- Can test actual UI interactions

**Cons:**
- More complex setup
- Slower
- Less official VS Code support

**Recommendation:** Start with @vscode/test-electron, consider Playwright if needed later.

---

## Related Files

- `tests/runTest.ts` - Test launcher
- `tests/integration/suite/*.test.ts` - Test suites
- `.github/workflows/ci.yml` - CI integration
- `package.json` - Scripts and dependencies

---

## Future Enhancements

1. Visual regression tests for webview rendering
2. Performance tests (print speed, memory usage)
3. Multi-workspace tests
4. Settings/configuration tests
5. Theme compatibility tests

---

## Notes

**Why this is optional:**
- Current unit tests already provide 85% coverage
- Extension works well in production
- Integration tests add complexity
- Main benefit is VS Code API compatibility validation

**When to implement:**
- Before major VS Code API changes
- If seeing unexplained user issues
- For professional polish
- If contributing to VS Code marketplace featured extensions

**Estimated value:**
- Low immediate value (extension works)
- High long-term value (prevents regressions)
- Medium complexity (4-6 hours work)
- **Verdict:** Nice to have, not required
