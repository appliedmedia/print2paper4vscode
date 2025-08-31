import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Diagnostics } from '../src/Diagnostics.js';

describe('Diagnostics', () => {
  test('should create instance with correct className', () => {
    const dx = new Diagnostics('TestClass');
    assert.strictEqual(dx.getClassName(), 'TestClass');
  });

  test('should create sub-context with method name', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');
    assert.strictEqual(methodDx.getClassName(), 'TestClass > testMethod');
    assert.strictEqual(methodDx.getCurrentMethod(), 'testMethod');
  });

  test('should chain methods correctly', () => {
    const dx = new Diagnostics('TestClass');
    const result = dx.out('message1').out('message2').out('message3');
    assert.strictEqual(result, dx); // Should return this for chaining
  });

  test('should validate required arguments correctly', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    // Test with valid args
    const validArgs = { content: 'test', uri: 'file://test' };
    const validResult = methodDx.require(validArgs, ['content']);
    assert.strictEqual(validResult, true);

    // Test with missing required arg
    const invalidArgs = { content: 'test' };
    const invalidResult = methodDx.require(invalidArgs, ['content', 'uri']);
    assert.strictEqual(invalidResult, false);

    // Test with undefined arg
    const undefinedArgs = { content: 'test', uri: undefined };
    const undefinedResult = methodDx.require(undefinedArgs, ['content', 'uri']);
    assert.strictEqual(undefinedResult, false);
  });

  test('should handle empty required keys array', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { content: 'test' };
    const result = methodDx.require(args, []);
    assert.strictEqual(result, true);
  });

  test('should handle args with null values', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { content: null, uri: 'test' };
    // null should be considered present (not undefined)
    const result = methodDx.require(args, ['content', 'uri']);
    assert.strictEqual(result, true);
  });

  test('should handle args with empty string values', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { content: '', uri: 'test' };
    // Empty string should be considered present
    const result = methodDx.require(args, ['content', 'uri']);
    assert.strictEqual(result, true);
  });

  test('should handle args with zero values', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { count: 0, uri: 'test' };
    // Zero should be considered present
    const result = methodDx.require(args, ['count', 'uri']);
    assert.strictEqual(result, true);
  });

  test('should handle args with false values', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { enabled: false, uri: 'test' };
    // False should be considered present
    const result = methodDx.require(args, ['enabled', 'uri']);
    assert.strictEqual(result, true);
  });

  test('should format error messages correctly', () => {
    const dx = new Diagnostics('TestClass');
    const methodDx = dx.sub('testMethod');

    const args = { content: 'test' };

    // Enable debug mode to see the output
    methodDx.debugOn(true);

    // Capture console.log output to verify message format
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput += msg + '\n';
    };

    methodDx.require(args, ['content', 'missingKey']);

    // Restore console.log
    console.log = originalLog;

    // Should contain method name and missing key
    assert.ok(logOutput.includes('testMethod: missingKey missing!'));
    assert.ok(logOutput.includes('TestClass > testMethod'));
  });

  test('should handle debug state inheritance', () => {
    const parentDx = new Diagnostics('ParentClass', true);
    const childDx = parentDx.sub('childMethod');

    assert.strictEqual(childDx.debugOn(), true);

    const grandchildDx = childDx.sub('grandchildMethod');
    assert.strictEqual(grandchildDx.debugOn(), true);
  });

  test('should handle debug state override', () => {
    const parentDx = new Diagnostics('ParentClass', true);
    const childDx = parentDx.sub('childMethod', false);

    assert.strictEqual(childDx.debugOn(), false);
    assert.strictEqual(parentDx.debugOn(), true);
  });

  test('should handle global debug state', () => {
    // Set global debug state
    Diagnostics.setGlobalDebug(true);
    assert.strictEqual(Diagnostics.debugOn, true);

    // Create instance without explicit debug state
    const dx = new Diagnostics('TestClass');
    assert.strictEqual(dx.debugOn(), true);

    // Reset global debug state
    Diagnostics.setGlobalDebug(false);
    assert.strictEqual(Diagnostics.debugOn, false);
  });
});
