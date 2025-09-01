# Diagnostics.require() Usage Examples

## Overview

This document demonstrates how the `Diagnostics.require()` method will be used throughout the refactored codebase to validate named parameters.

## Basic Usage Pattern

### Before (Traditional Parameters)

```typescript
function createDocument(content: string, uri?: Uri): Promise<TextDocument> {
  if (!content) {
    throw new Error('content is required');
  }
  // ... implementation
}

// Usage - prone to parameter order errors
createDocument('some content', someUri);
createDocument(someUri, 'some content'); // WRONG ORDER!
```

### After (Named Parameters + Diagnostics)

```typescript
interface CreateDocumentArgs {
  content: string;
  uri?: Uri;
}

function createDocument(args: CreateDocumentArgs): Promise<TextDocument> {
  // Validate required arguments
  if (!this.dx.sub('createDocument').require(args, ['content'])) {
    return; // Early exit if validation fails
  }

  const { content, uri } = args;
  // ... implementation with confidence that content exists
}

// Usage - no parameter order issues
createDocument({ content: 'some content', uri: someUri });
createDocument({ uri: someUri, content: 'some content' }); // Same result!
```

## Real-World Examples

### 1. App Constructor

```typescript
interface AppConstructorArgs {
  context: ExtensionContext;
  vscode: any;
}

constructor(args: AppConstructorArgs) {
  if (!this.dx.sub("constructor").require(args, ["context", "vscode"])) {
    throw new Error("App constructor requires context and vscode");
  }

  const { context, vscode } = args;
  // ... implementation
}

// Usage
new App({ context, vscode });
```

### 2. PDF Print Methods

```typescript
interface PrintWithPreviewArgs {
  renderedHtmlContent: string;
  descriptiveName?: string;
}

async printWithPreview(args: PrintWithPreviewArgs): Promise<void> {
  if (!this.dx.sub("printWithPreview").require(args, ["renderedHtmlContent"])) {
    return;
  }

  const { renderedHtmlContent, descriptiveName } = args;
  // ... implementation
}

// Usage
await pdf.printWithPreview({
  renderedHtmlContent: html,
  descriptiveName: "My Document"
});
```

### 3. UI Debug Methods

```typescript
interface DebugOutArgs {
  message: unknown;
  level?: 'debug' | 'info' | 'warn' | 'error';
  context?: string;
  data?: unknown;
}

debugOut(args: DebugOutArgs): void {
  if (!this.dx.sub("debugOut").require(args, ["message"])) {
    return;
  }

  const { message, level = 'info', context, data } = args;
  // ... implementation
}

// Usage
ui.debugOut({
  message: "Operation completed",
  level: "info",
  context: "PDF"
});
```

## Benefits of This Approach

### 1. **Parameter Order Safety**

- No more `foo(param2, param1)` mistakes
- All parameters are explicitly named

### 2. **Runtime Validation**

- `require()` catches missing parameters at runtime
- Clear error messages: `"createDocument: content missing!"`
- Automatic method name detection for debugging

### 3. **Easy to Extend**

- Add new optional parameters without breaking existing code
- Existing calls continue to work unchanged

### 4. **Self-Documenting**

- `createDocument({ content: "foo", uri: "bar" })` is clear
- No need to look up parameter order in documentation

### 5. **Consistent Pattern**

- Every method follows the same `args` + `require()` pattern
- Easy to teach new developers

## Error Handling Flow

```typescript
function someMethod(args: SomeMethodArgs): ReturnType {
  // 1. Validate required arguments
  if (!this.dx.sub('someMethod').require(args, ['requiredParam'])) {
    return; // Early exit - validation failed
  }

  // 2. Extract parameters with confidence
  const { requiredParam, optionalParam } = args;

  // 3. Proceed with implementation
  // ... method logic
}
```

## Integration with Existing Code

The `Diagnostics.require()` method integrates seamlessly with the existing Diagnostics class:

- **Chaining**: `this.dx.sub("methodName").require(args, keys)`
- **Debug Output**: Automatic error logging with method context
- **Performance**: Minimal overhead for validation
- **Type Safety**: Works with TypeScript interfaces

## Next Steps

With the Diagnostics infrastructure in place, the refactoring can proceed systematically:

1. **Phase 1.3**: Refactor App.ts to use named parameters
2. **Phase 1.4**: Refactor VSCodeAPIs.ts to use named parameters
3. **Continue through all phases** using the same pattern

Each refactored method will be more maintainable, safer, and easier to use.
