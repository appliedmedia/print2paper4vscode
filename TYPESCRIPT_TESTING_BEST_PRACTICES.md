# TypeScript Testing Best Practices

## Overview
This document summarizes best practices for testing TypeScript code, particularly when using Node.js's built-in test runner (`node:test`).

## Current Project Setup
- **Test Framework**: Node.js built-in test runner (`node:test`)
- **Test Location**: `tests/` directory
- **Test Pattern**: `*.test.ts` files compiled to `out/tests/**/*.test.js`
- **Assertion Library**: Node.js `assert` module (`node:assert`)

## Best Practices

### 1. Test Structure and Organization

#### Use `describe` blocks for grouping
```typescript
import { test, describe } from 'node:test';
import * as assert from 'node:assert';

describe('ClassName', () => {
  test('should do something specific', () => {
    // Test implementation
  });
});
```

#### Keep tests focused and atomic
- Each test should verify one specific behavior
- Tests should be independent and not rely on execution order
- Use descriptive test names that explain what is being tested

### 2. Assertions

#### Use appropriate assertion methods
```typescript
// Equality checks
assert.strictEqual(actual, expected);  // Uses ===
assert.deepStrictEqual(actual, expected);  // Deep equality

// Truthiness
assert.ok(value);  // Assert value is truthy
assert.strictEqual(value, true);  // Explicit boolean check

// Error handling
assert.throws(() => {
  // Code that should throw
}, /Error message pattern/);
```

#### Prefer `strictEqual` over `equal`
- `strictEqual` uses `===` (strict equality)
- `equal` uses `==` (loose equality) - avoid unless necessary

### 3. Error Testing

#### Test error scenarios explicitly
```typescript
test('should throw when required parameter is missing', () => {
  const dx = new Diagnostics({ name: 'Test' });
  assert.throws(
    () => dx.require({}, ['requiredKey']),
    /Missing required parameters/
  );
});
```

#### Use regex patterns for error messages
- Makes tests more resilient to minor message changes
- Focuses on the essential error information

### 4. Async Testing

#### Handle async operations properly
```typescript
test('should handle async operations', async () => {
  const result = await someAsyncFunction();
  assert.strictEqual(result, expectedValue);
});
```

#### Test promise rejections
```typescript
test('should reject promise on error', async () => {
  await assert.rejects(
    async () => {
      await someAsyncFunction();
    },
    /Error message pattern/
  );
});
```

### 5. Test Data and Fixtures

#### Use descriptive test data
- Avoid magic numbers and strings
- Use constants for repeated test values
- Make test data self-documenting

#### Keep test setup minimal
- Only set up what's necessary for the test
- Use `beforeEach`/`afterEach` hooks when needed (Node.js test runner supports these)

### 6. Mocking and Isolation

#### Mock external dependencies
- Mock VS Code APIs (as done in this project)
- Mock file system operations
- Mock network requests

#### Keep tests isolated
- Each test should be able to run independently
- Avoid shared state between tests
- Clean up resources in `afterEach` if needed

### 7. Type Safety

#### Leverage TypeScript's type system
- Use proper types in test code
- Let TypeScript catch type errors at compile time
- Use type assertions sparingly and only when necessary

### 8. Test Coverage

#### Aim for meaningful coverage
- Focus on testing critical paths and edge cases
- Don't aim for 100% coverage blindly
- Use coverage tools (like `c8`) to identify untested code

### 9. Test Naming Conventions

#### Use descriptive test names
```typescript
// Good
test('should throw error when required parameter is missing', () => {});
test('should return correct value for valid input', () => {});

// Avoid
test('test1', () => {});
test('works', () => {});
```

#### Follow a consistent pattern
- Use "should [expected behavior]" format
- Include context when relevant
- Be specific about what is being tested

### 10. Performance Considerations

#### Keep tests fast
- Avoid unnecessary async operations
- Mock slow operations (file I/O, network)
- Run tests in parallel when possible (Node.js test runner does this by default)

### 11. Debugging Tests

#### Use meaningful error messages
```typescript
assert.strictEqual(actual, expected, 'Custom error message');
```

#### Use test-only logging when needed
- Use `console.log` sparingly in tests
- Consider using test framework's built-in debugging features

### 12. Integration with CI/CD

#### Ensure tests are deterministic
- Avoid time-dependent tests without mocking
- Avoid random data unless seeded
- Ensure tests can run in any environment

## Project-Specific Patterns

### VS Code API Mocking
The project uses custom mocks for VS Code APIs:
- `setup-vscode-mock.js` sets up mocks before tests run
- Tests can safely use VS Code APIs without requiring VS Code runtime

### Diagnostics Testing
Example from `Diagnostics.test.ts`:
```typescript
test('should validate required arguments correctly', () => {
  const dx = new Diagnostics({ name: 'TestClass' });
  const methodDx = dx.sub({ name: 'testMethod' });
  
  // Test with valid args - should not throw
  const validArgs = { content: 'test', uri: 'file://test' };
  methodDx.require(validArgs, ['content']); // Should not throw
  
  // Test with missing required arg - should throw
  const invalidArgs = { content: 'test' };
  assert.throws(
    () => methodDx.require(invalidArgs, ['content', 'uri']),
    /Missing required parameters/
  );
});
```

## Resources

- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [Node.js Assert Module](https://nodejs.org/api/assert.html)
- [TypeScript Handbook - Testing](https://www.typescriptlang.org/docs/handbook/testing.html)
- [Testing Best Practices (General)](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Notes

- The project uses Node.js's built-in test runner, which is available in Node.js 18+
- Tests are compiled from TypeScript to JavaScript before running
- The test command runs all compiled tests: `node --test out/tests/**/*.test.js`
- Individual test files can be run directly: `node --test out/tests/Diagnostics.test.js`
