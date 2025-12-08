# Test Infrastructure Fix Plan

## Problem

Tests are failing with error: `Cannot find module 'vscode'`

This occurs because `VSCodeAPIs.ts` imports the `Extension` type from the vscode module:

```typescript
import type {
  Disposable,
  ExtensionContext,
  TextEditor,
  TextDocument,
  Uri,
  WebviewPanel,
  Extension,  // <-- This import causes the test failure
} from 'vscode';
```

The test environment uses a mock (`vscode-mock.cjs`) that doesn't properly export all types.

## Analysis

### Current Test Infrastructure

1. **vscode-mock.cjs**: Provides runtime mock for vscode module
2. **test-utils.ts**: Provides mock context and vscode objects for tests
3. **Tests**: Import from actual source files which import from 'vscode'

### Why It's Breaking

The `Extension` type is imported at the top of `VSCodeAPIs.ts`. When tests try to import any module that depends on VSCodeAPIs (which is most of them through the Registry), Node.js tries to resolve the 'vscode' module and fails.

## Solution Options

### ⚠️ DO NOT pursue the vscode mock approach

**Why mocking will not work:**

1. **Mocking complexity**: VS Code's Extension API and markdown renderer are complex runtime dependencies that cannot be properly mocked without the actual VS Code environment
2. **Test accuracy**: Mocked tests would not validate actual behavior - markdown rendering happens through VS Code's extension, not our code
3. **Maintenance burden**: Any changes to VS Code APIs would require updating mocks
4. **False confidence**: Tests would pass but not validate real functionality

### The Right Approach

Tests should run in VS Code test environment using `@vscode/test-electron` or similar:

- ☐ Update test infrastructure to use VS Code's test runner instead of plain Node.js
- ☐ Tests need actual VS Code extension host to test markdown rendering
- ☐ Consider integration tests in VS Code environment rather than unit tests with mocks
- ☐ Research `@vscode/test-electron` or `vscode-test` packages

## Decision

**Defer test infrastructure overhaul to separate task.** Current implementation compiles and can be manually tested in VS Code.

This is a larger architectural change to the test system that should be addressed separately from the markdown feature implementation.
