import { Diagnostics } from '../src/Diagnostics';
import { describe, it } from 'node:test';
import * as assert from 'node:assert';

describe('Diagnostics Class', () => {
    // Reset global debug state before each test
    const resetDebugState = () => {
        Diagnostics.debugOn(false);
    };

    describe('Basic functionality and global debug state', () => {
        it('should have default global debug state as false', () => {
            resetDebugState();
            assert.strictEqual(Diagnostics.debugOn(), false);
        });

        it('should set and get global debug state', () => {
            resetDebugState();
            Diagnostics.debugOn(true);
            assert.strictEqual(Diagnostics.debugOn(), true);
        });
    });

    describe('Instance creation and inheritance', () => {
        it('should create instance with correct className', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass');
            assert.strictEqual(dx.getClassName(), 'TestClass');
        });

        it('should inherit debug state from global when not specified', () => {
            resetDebugState();
            Diagnostics.debugOn(true);
            const dx = new Diagnostics('TestClass');
            assert.strictEqual(dx.debugOn(), true);
        });

        it('should override debug state when explicitly provided', () => {
            resetDebugState();
            Diagnostics.debugOn(true);
            const dx = new Diagnostics('TestClass', false);
            assert.strictEqual(dx.debugOn(), false);
        });
    });

    describe('Sub-context creation and inheritance', () => {
        it('should create sub-context with correct className', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass');
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.getClassName(), 'TestClass > testMethod');
        });

        it('should inherit debug state from parent in sub-context', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.debugOn(), true);
        });

        it('should override debug state in sub-context when specified', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', false);
            assert.strictEqual(methodDx.debugOn(), false);
        });
    });

    describe('Null/undefined handling in sub-contexts', () => {
        it('should inherit from parent when debugOverride is null', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', null);
            assert.strictEqual(methodDx.debugOn(), true);
        });

        it('should inherit from parent when debugOverride is undefined', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', undefined);
            assert.strictEqual(methodDx.debugOn(), true);
        });
    });

    describe('Debug state management', () => {
        it('should allow changing debug state at runtime', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', false);
            assert.strictEqual(dx.debugOn(), false);
            
            dx.debugOn(true);
            assert.strictEqual(dx.debugOn(), true);
        });

        it('should maintain separate debug states for different instances', () => {
            resetDebugState();
            const dx1 = new Diagnostics('TestClass1', true);
            const dx2 = new Diagnostics('TestClass2', false);
            
            assert.strictEqual(dx1.debugOn(), true);
            assert.strictEqual(dx2.debugOn(), false);
        });
    });

    describe('Method context tracking', () => {
        it('should track current method in sub-context', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.getCurrentMethod(), 'testMethod');
        });

        it('should reset method context after done() is called', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            methodDx.done();
            assert.strictEqual(methodDx.getCurrentMethod(), null);
        });
    });

    describe('Static properties', () => {
        it('should have correct separator', () => {
            assert.strictEqual(Diagnostics.separator, ' > ');
        });
    });

    describe('Complex inheritance chain', () => {
        it('should handle multiple levels of sub-contexts', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const level1 = dx.sub('level1');
            const level2 = level1.sub('level2');
            const level3 = level2.sub('level3');

            assert.strictEqual(level1.getClassName(), 'TestClass > level1');
            assert.strictEqual(level2.getClassName(), 'TestClass > level1 > level2');
            assert.strictEqual(level3.getClassName(), 'TestClass > level1 > level2 > level3');
        });

        it('should maintain debug inheritance through multiple levels', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const level1 = dx.sub('level1');
            const level2 = level1.sub('level2');
            const level3 = level2.sub('level3');

            assert.strictEqual(level3.debugOn(), true);
        });
    });

    describe('Timing functionality', () => {
        it('should track timing from sub() to done()', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            
            // Mock performance.now to control timing
            const originalPerformanceNow = performance.now;
            let mockTime = 1000;
            performance.now = () => mockTime;
            
            methodDx.out('Starting...');
            mockTime = 1100; // 100ms later
            methodDx.done('Completed');
            
            // Restore original
            performance.now = originalPerformanceNow;
        });
    });

    describe('Output methods', () => {
        it('should respect debug state for out() method', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', false);
            const methodDx = dx.sub('testMethod');
            
            // Mock console.log to capture output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args: any[]) => logs.push(args.join(' '));
            
            methodDx.out('This should not show');
            assert.strictEqual(logs.length, 0);
            
            console.log = originalLog;
        });

        it('should always output for print() method regardless of debug state', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', false);
            const methodDx = dx.sub('testMethod');
            
            // Mock console.log to capture output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args: any[]) => logs.push(args.join(' '));
            
            methodDx.print('This should always show');
            assert.strictEqual(logs.length, 1);
            assert(logs[0].includes('This should always show'));
            
            console.log = originalLog;
        });
    });

    describe('Async method isolation', () => {
        it('should maintain separate contexts for concurrent methods', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const method1 = dx.sub('method1');
            const method2 = dx.sub('method2');

            assert.strictEqual(method1.getClassName(), 'TestClass > method1');
            assert.strictEqual(method2.getClassName(), 'TestClass > method2');
            assert.notStrictEqual(method1, method2);
        });
    });

    describe('Method chaining', () => {
        it('should support method chaining for fluent API', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('chainedMethod');
            
            // Test chaining out() methods
            const result1 = methodDx.out('First message').out('Second message');
            assert.strictEqual(result1, methodDx);
            
            // Test chaining print() methods
            const result2 = methodDx.print('Always show 1').print('Always show 2');
            assert.strictEqual(result2, methodDx);
            
            // Test chaining debugOn() setter
            const result3 = methodDx.debugOn(false);
            assert.strictEqual(result3, methodDx);
            
            // Test chaining done() method
            const result4 = methodDx.done('Chaining test completed');
            assert.strictEqual(result4, methodDx);
        });

        it('should maintain method context during chaining', () => {
            resetDebugState();
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('chainedMethod');
            
            // Chain multiple operations
            methodDx
                .out('Starting chained operations')
                .out('Processing step 1')
                .out('Processing step 2')
                .print('Important status update')
                .out('Processing step 3')
                .done('All chained operations completed');
            
            // Verify the method context was properly tracked
            assert.strictEqual(methodDx.getCurrentMethod(), null); // Should be reset after done()
        });
    });
});