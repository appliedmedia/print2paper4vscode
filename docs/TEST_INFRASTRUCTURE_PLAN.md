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

### Option 1: Fix vscode-mock.cjs (Quick Fix)

**Pros**: Minimal code changes, fixes root cause
**Cons**: May need to keep updating as more types are used

**Steps**:

1. Update `vscode-mock.cjs` to export `Extension` type
2. Verify it's properly exported as both a type and runtime value
3. Run tests to confirm fix

**Implementation**:

```javascript
// In vscode-mock.cjs, add:
exports.Extension = class Extension {
  constructor(id, exports) {
    this.id = id;
    this.exports = exports;
    this.isActive = true;
  }
};
```

### Option 2: Type-Only Imports (Better Fix)

**Pros**: Clean separation, TypeScript best practice
**Cons**: Requires careful review of all type imports

**Steps**:

1. Change VSCodeAPIs imports to use `import type` for types that are only used as types
2. Keep runtime imports for things actually used at runtime
3. This prevents Node.js from trying to load vscode module at runtime

**Implementation**:

```typescript
// VSCodeAPIs.ts
import type {
  Extension,     // Type-only
  Disposable,    // Actually used at runtime
  ExtensionContext,  // Actually used at runtime
  TextEditor,    // Type-only
  TextDocument,  // Type-only
  Uri,           // Type-only
  WebviewPanel,  // Type-only
} from 'vscode';
```

### Option 3: Enhance test-utils.ts (Comprehensive)

**Pros**: Most complete, allows better test isolation
**Cons**: More work, needs maintenance

**Steps**:

1. Add complete mock implementations in test-utils.ts
2. Update all tests to use enhanced mocks
3. Add new mocks for markdown-related functionality

## Recommended Approach

**Hybrid of Option 1 + Option 2**:

1. **Immediate**: Fix vscode-mock.cjs to export missing types
2. **Better**: Convert to type-only imports where appropriate
3. **Best**: Add proper test coverage for new markdown functionality

## New Tests Needed

### PDF Tests

```typescript
// tests/PDF-MarkdownRender.test.ts
describe('PDF Markdown Rendering', () => {
  test('renderFromTokens accepts 2D token array', () => {
    // Test updated signature
  });
  
  test('renderFromHTML parses and renders HTML', () => {
    // Test HTML parsing
  });
  
  test('renderHeading creates proper heading', () => {
    // Test heading rendering
  });
  
  test('renderList handles ordered and unordered lists', () => {
    // Test list rendering
  });
});
```

### VSCodeAPIs Tests

```typescript
// tests/VSCodeAPIs-Markdown.test.ts
describe('VSCodeAPIs Markdown', () => {
  test('getExtension_Markdown returns markdown extension', () => {
    // Test extension lookup
  });
  
  test('renderMarkdownToHtml returns HTML', async () => {
    // Test markdown to HTML conversion
  });
});
```

### Integration Tests

```typescript
// tests/Integration-Markdown.test.ts
describe('Markdown Print Integration', () => {
  test('prints markdown in raw mode', async () => {
    // Test raw mode
  });
  
  test('prints markdown in rendered mode', async () => {
    // Test rendered mode with useRenderedMd flag
  });
});
```

## Implementation Steps

1. ☐ Fix vscode-mock.cjs to export Extension class
2. ☐ Review all VSCodeAPIs imports and convert to type-only where appropriate
3. ☐ Update PDF.test.ts to use new renderFromTokens signature
4. ☐ Create PDF-MarkdownRender.test.ts with new tests
5. ☐ Create VSCodeAPIs-Markdown.test.ts with new tests
6. ☐ Run `npm test` and verify all tests pass
7. ☐ Update test-utils.ts with markdown-specific mocks if needed

## Timeline

- vscode-mock.cjs fix: 30 minutes
- Type-only imports conversion: 1 hour
- New test creation: 2-3 hours
- Debug and fix issues: 1-2 hours

### Total Time Estimate

4.5-6.5 hours
