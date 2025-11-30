import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Diagnostics } from '../src/Diagnostics';

describe('Diagnostics', () => {
  test('should create instance with correct name', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    // Test that the instance was created (can't access private name property)
    assert.ok(dx instanceof Diagnostics);
  });

  test('should create sub-context with method name', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });
    // Test that the sub-context was created
    assert.ok(methodDx instanceof Diagnostics);
  });

  test('should chain methods correctly', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const result = dx.out('message1').out('message2').out('message3');
    assert.strictEqual(result, dx); // Should return this for chaining
  });

  test('should validate required arguments correctly', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    // Test with valid args - should not throw
    const validArgs = { content: 'test', uri: 'file://test' };
    methodDx.require(validArgs, ['content']); // Should not throw

    // Test with missing required arg - should throw
    const invalidArgs = { content: 'test' };
    assert.throws(() => methodDx.require(invalidArgs, ['content', 'uri']), /Missing required parameters/);

    // Test with undefined arg - should throw
    const undefinedArgs = { content: 'test', uri: undefined };
    assert.throws(() => methodDx.require(undefinedArgs, ['content', 'uri']), /Missing required parameters/);
  });

  test('should handle empty required keys array', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    const args = { content: 'test' };
    // Empty required keys should not throw
    methodDx.require(args, []); // Should not throw
  });

  test('should handle args with null values', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    const args = { content: null, uri: 'test' };
    // null should be considered present (not undefined) - should not throw
    methodDx.require(args, ['content', 'uri']); // Should not throw
  });

  test('should handle args with empty string values', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    const args = { content: '', uri: 'test' };
    // Empty string should be considered present - should not throw
    methodDx.require(args, ['content', 'uri']); // Should not throw
  });

  test('should handle args with zero values', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    const args = { count: 0, uri: 'test' };
    // Zero should be considered present - should not throw
    methodDx.require(args, ['count', 'uri']); // Should not throw
  });

  test('should handle args with false values', () => {
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    const args = { enabled: false, uri: 'test' };
    // False should be considered present - should not throw
    methodDx.require(args, ['enabled', 'uri']); // Should not throw
  });

  test('should format error messages correctly', () => {
    // Reset static state to ensure clean test
    Diagnostics.reset();

    const args = { content: 'test' };

    // Create Diagnostics instance
    const dx = new Diagnostics({ name: 'TestClass' });
    const methodDx = dx.sub({ name: 'testMethod' });

    // Should throw with proper error message
    assert.throws(
      () => methodDx.require(args, ['content', 'missingKey']),
      (error: Error) => {
        const errorMsg = String(error);
        return (
          error instanceof Error &&
          errorMsg.includes('Missing required parameters') &&
          errorMsg.includes('missingKey') &&
          errorMsg.includes('TestClass > testMethod')
        );
      },
      'Should throw error with missing key information'
    );
  });

  test('should handle debug state inheritance', () => {
    const parentDx = new Diagnostics({ name: 'ParentClass', debugOn: true });
    console.log('Parent debugOn:', parentDx.debugOn());

    const childDx = parentDx.sub({ name: 'childMethod' });
    console.log('Child debugOn:', childDx.debugOn());

    assert.strictEqual(childDx.debugOn(), true);

    const grandchildDx = childDx.sub({ name: 'grandchildMethod' });
    console.log('Grandchild debugOn:', grandchildDx.debugOn());
    assert.strictEqual(grandchildDx.debugOn(), true);
  });

  test('should handle debug state override', () => {
    const parentDx = new Diagnostics({ name: 'ParentClass', debugOn: true });
    const childDx = parentDx.sub({ name: 'childMethod', debugOn: false });

    assert.strictEqual(childDx.debugOn(), false);
    assert.strictEqual(parentDx.debugOn(), true);
  });

  test('should handle global debug state', () => {
    // Set global debug state
    Diagnostics.debugOn(true);
    assert.strictEqual(Diagnostics.debugOn(), true);

    // Create instance without explicit debug state
    const dx = new Diagnostics({ name: 'TestClass' });
    assert.strictEqual(dx.debugOn(), true);

    // Reset global debug state
    Diagnostics.debugOn(false);
    assert.strictEqual(Diagnostics.debugOn(), false);
  });

  test('should output messages with print method', () => {
    // Reset Diagnostics state to ensure clean test
    Diagnostics.reset();
    
    const originalLog = console.log;
    let capturedOutput = '';
    console.log = (message: string) => {
      capturedOutput += message;
    };

    const dx = new Diagnostics({ name: 'TestClass' });
    dx.print('Test message');

    assert.ok(capturedOutput.includes('Test message'), 'print() should output the message');
    assert.ok(capturedOutput.includes('TestClass'), 'print() should include class name');
    assert.strictEqual(dx.print('Another message'), dx); // Should return this for chaining

    console.log = originalLog;
  });

  test('should handle done with message', () => {
    // Reset Diagnostics state to ensure clean test
    Diagnostics.reset();
    
    const originalLog = console.log;
    let capturedOutput = '';
    console.log = (message: string) => {
      capturedOutput += message;
    };

    const dx = new Diagnostics({ name: 'TestClass', debugOn: true });
    const subDx = dx.sub({ name: 'testMethod' });
    subDx.done('completed');

    assert.ok(capturedOutput.includes('Done'), 'done() should output completion message');
    assert.ok(capturedOutput.includes('completed'), 'done() should include the provided message');
    assert.strictEqual(subDx.done('completed'), subDx); // Should return this for chaining

    console.log = originalLog;
  });

  test('should handle done without message', () => {
    // Reset Diagnostics state to ensure clean test
    Diagnostics.reset();
    
    const originalLog = console.log;
    let capturedOutput = '';
    console.log = (message: string) => {
      capturedOutput += message;
    };

    const dx = new Diagnostics({ name: 'TestClass', debugOn: true });
    const subDx = dx.sub({ name: 'testMethod' });
    subDx.done();

    assert.ok(capturedOutput.includes('Done'), 'done() should output completion message');
    assert.strictEqual(subDx.done(), subDx); // Should return this for chaining

    console.log = originalLog;
  });

  test('should handle error method', () => {
    // Reset Diagnostics state to ensure clean test
    Diagnostics.reset();
    
    const originalLog = console.log;
    let capturedOutput = '';
    console.log = (message: string) => {
      capturedOutput += message;
    };

    const dx = new Diagnostics({ name: 'TestClass' });
    dx.error('Error message');

    assert.ok(capturedOutput.includes('ERROR'), 'error() should include ERROR prefix');
    assert.ok(capturedOutput.includes('Error message'), 'error() should output the error message');
    assert.ok(capturedOutput.includes('TestClass'), 'error() should include class name');
    assert.strictEqual(dx.error('Another error'), dx); // Should return this for chaining

    console.log = originalLog;
  });

  test('should handle duplicate messages with warning bookends without App instance', () => {
    // Reset Diagnostics state to ensure clean test
    Diagnostics.reset();

    const originalLog = console.log;
    let capturedOutput = '';
    console.log = (message: string) => {
      capturedOutput += message;
    };

    // Create Diagnostics instance WITHOUT App (null parent and app)
    const dx = new Diagnostics({ name: 'TestClass', debugOn: true, parent: null, app: null });
    const subDx = dx.sub({ name: 'testMethod' });

    // Output the same message 15 times to trigger duplicate warning (threshold is 10)
    const repeatedMessage = 'Duplicate message test';
    for (let i = 0; i < 15; i++) {
      subDx.out(repeatedMessage);
    }

    // Force flush of duplicates by outputting a different message
    subDx.out('Different message');

    console.log = originalLog;

    // Should contain duplicate indicator with warning bookends (⚠️)
    assert.ok(capturedOutput.includes('↑ x'), 'Should show duplicate indicator');
    assert.ok(capturedOutput.includes('⚠️'), 'Should show warning bookends for >10 duplicates');
    
    // Verify it didn't crash (if we got this far, it succeeded)
    assert.ok(true, 'Should handle duplicates without App instance');
  });
});
