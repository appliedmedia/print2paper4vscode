import { Diagnostics } from '../src/Diagnostics';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Diagnostics Class', () => {
    beforeEach(() => {
        // Reset global debug state before each test
        Diagnostics.debugOn(false);
    });

    describe('Basic functionality and global debug state', () => {
        it('should have default global debug state as false', () => {
            assert.strictEqual(Diagnostics.debugOn(), false);
        });

        it('should set and get global debug state', () => {
            Diagnostics.debugOn(true);
            assert.strictEqual(Diagnostics.debugOn(), true);
        });
    });

    describe('Instance creation and inheritance', () => {
        it('should create instance with correct className', () => {
            const dx = new Diagnostics('TestClass');
            assert.strictEqual(dx.getClassName(), 'TestClass');
        });

        it('should inherit debug state from global when not specified', () => {
            Diagnostics.debugOn(true);
            const dx = new Diagnostics('TestClass');
            assert.strictEqual(dx.debugOn(), true);
        });

        it('should override debug state when explicitly provided', () => {
            Diagnostics.debugOn(true);
            const dx = new Diagnostics('TestClass', false);
            assert.strictEqual(dx.debugOn(), false);
        });
    });

    describe('Sub-context creation and inheritance', () => {
        it('should create sub-context with correct className', () => {
            const dx = new Diagnostics('TestClass');
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.getClassName(), 'TestClass > testMethod');
        });

        it('should inherit debug state from parent in sub-context', () => {
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.debugOn(), true);
        });

        it('should override debug state in sub-context when specified', () => {
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', false);
            assert.strictEqual(methodDx.debugOn(), false);
        });
    });

    describe('Null/undefined handling in sub-contexts', () => {
        it('should inherit from parent when debugOverride is null', () => {
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', null);
            assert.strictEqual(methodDx.debugOn(), true);
        });

        it('should inherit from parent when debugOverride is undefined', () => {
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod', undefined);
            assert.strictEqual(methodDx.debugOn(), true);
        });
    });

    describe('Debug state management', () => {
        it('should allow changing debug state at runtime', () => {
            const dx = new Diagnostics('TestClass', false);
            assert.strictEqual(dx.debugOn(), false);
            
            dx.debugOn(true);
            assert.strictEqual(dx.debugOn(), true);
        });

        it('should maintain separate debug states for different instances', () => {
            const dx1 = new Diagnostics('TestClass1', true);
            const dx2 = new Diagnostics('TestClass2', false);
            
            assert.strictEqual(dx1.debugOn(), true);
            assert.strictEqual(dx2.debugOn(), false);
        });
    });

    describe('Method context tracking', () => {
        it('should track current method in sub-context', () => {
            const dx = new Diagnostics('TestClass', true);
            const methodDx = dx.sub('testMethod');
            assert.strictEqual(methodDx.getCurrentMethod(), 'testMethod');
        });

        it('should reset method context after done() is called', () => {
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
            const dx = new Diagnostics('TestClass', true);
            const level1 = dx.sub('level1');
            const level2 = level1.sub('level2');
            const level3 = level2.sub('level3');

            expect(level1.getClassName()).toBe('TestClass > level1');
            expect(level2.getClassName()).toBe('TestClass > level1 > level2');
            expect(level3.getClassName()).toBe('TestClass > level1 > level2 > level3');
        });

        it('should maintain debug inheritance through multiple levels', () => {
            const dx = new Diagnostics('TestClass', true);
            const level1 = dx.sub('level1');
            const level2 = level1.sub('level2');
            const level3 = level2.sub('level3');

            expect(level3.debugOn()).toBe(true);
        });
    });

    describe('Timing functionality', () => {
        it('should track timing from sub() to done()', () => {
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
            const dx = new Diagnostics('TestClass', false);
            const methodDx = dx.sub('testMethod');
            
            // Mock console.log to capture output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args: any[]) => logs.push(args.join(' '));
            
            methodDx.out('This should not show');
            expect(logs).toHaveLength(0);
            
            console.log = originalLog;
        });

        it('should always output for print() method regardless of debug state', () => {
            const dx = new Diagnostics('TestClass', false);
            const methodDx = dx.sub('testMethod');
            
            // Mock console.log to capture output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args: any[]) => logs.push(args.join(' '));
            
            methodDx.print('This should always show');
            expect(logs).toHaveLength(1);
            expect(logs[0]).toContain('This should always show');
            
            console.log = originalLog;
        });
    });

    describe('Async method isolation', () => {
        it('should maintain separate contexts for concurrent methods', () => {
            const dx = new Diagnostics('TestClass', true);
            const method1 = dx.sub('method1');
            const method2 = dx.sub('method2');

            expect(method1.getClassName()).toBe('TestClass > method1');
            expect(method2.getClassName()).toBe('TestClass > method2');
            expect(method1).not.toBe(method2);
        });
    });
});