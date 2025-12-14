"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const Diagnostics_1 = require("../src/Diagnostics");
(0, node_test_1.describe)('Diagnostics', () => {
    (0, node_test_1.test)('should create instance with correct name', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        // Test that the instance was created (can't access private name property)
        assert.ok(dx instanceof Diagnostics_1.Diagnostics);
    });
    (0, node_test_1.test)('should create sub-context with method name', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        // Test that the sub-context was created
        assert.ok(methodDx instanceof Diagnostics_1.Diagnostics);
    });
    (0, node_test_1.test)('should chain methods correctly', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const result = dx.out('message1').out('message2').out('message3');
        assert.strictEqual(result, dx); // Should return this for chaining
    });
    (0, node_test_1.test)('should validate required arguments correctly', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
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
    (0, node_test_1.test)('should handle empty required keys array', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        const args = { content: 'test' };
        const result = methodDx.require(args, []);
        assert.strictEqual(result, true);
    });
    (0, node_test_1.test)('should handle args with null values', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        const args = { content: null, uri: 'test' };
        // null should be considered present (not undefined)
        const result = methodDx.require(args, ['content', 'uri']);
        assert.strictEqual(result, true);
    });
    (0, node_test_1.test)('should handle args with empty string values', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        const args = { content: '', uri: 'test' };
        // Empty string should be considered present
        const result = methodDx.require(args, ['content', 'uri']);
        assert.strictEqual(result, true);
    });
    (0, node_test_1.test)('should handle args with zero values', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        const args = { count: 0, uri: 'test' };
        // Zero should be considered present
        const result = methodDx.require(args, ['count', 'uri']);
        assert.strictEqual(result, true);
    });
    (0, node_test_1.test)('should handle args with false values', () => {
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        const args = { enabled: false, uri: 'test' };
        // False should be considered present
        const result = methodDx.require(args, ['enabled', 'uri']);
        assert.strictEqual(result, true);
    });
    (0, node_test_1.test)('should format error messages correctly', () => {
        // Reset static state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const args = { content: 'test' };
        // Capture console.log output to verify message format
        const originalLog = console.log;
        let logOutput = '';
        console.log = (...args) => {
            logOutput += args.map(a => String(a)).join(' ') + '\n';
        };
        // Create Diagnostics instance after capturing console.log
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        const methodDx = dx.sub({ name: 'testMethod' });
        // Enable debug mode to see the output
        methodDx.debugOn(true);
        methodDx.require(args, ['content', 'missingKey']);
        // Restore console.log
        console.log = originalLog;
        // Should contain missing key
        assert.ok(logOutput.includes('❌ missing: "missingKey"'));
        assert.ok(logOutput.includes('TestClass > testMethod'));
    });
    (0, node_test_1.test)('should handle debug state inheritance', () => {
        const parentDx = new Diagnostics_1.Diagnostics({ name: 'ParentClass', debugOn: true });
        console.log('Parent debugOn:', parentDx.debugOn());
        const childDx = parentDx.sub({ name: 'childMethod' });
        console.log('Child debugOn:', childDx.debugOn());
        assert.strictEqual(childDx.debugOn(), true);
        const grandchildDx = childDx.sub({ name: 'grandchildMethod' });
        console.log('Grandchild debugOn:', grandchildDx.debugOn());
        assert.strictEqual(grandchildDx.debugOn(), true);
    });
    (0, node_test_1.test)('should handle debug state override', () => {
        const parentDx = new Diagnostics_1.Diagnostics({ name: 'ParentClass', debugOn: true });
        const childDx = parentDx.sub({ name: 'childMethod', debugOn: false });
        assert.strictEqual(childDx.debugOn(), false);
        assert.strictEqual(parentDx.debugOn(), true);
    });
    (0, node_test_1.test)('should handle global debug state', () => {
        // Set global debug state
        Diagnostics_1.Diagnostics.debugOn(true);
        assert.strictEqual(Diagnostics_1.Diagnostics.debugOn(), true);
        // Create instance without explicit debug state
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        assert.strictEqual(dx.debugOn(), true);
        // Reset global debug state
        Diagnostics_1.Diagnostics.debugOn(false);
        assert.strictEqual(Diagnostics_1.Diagnostics.debugOn(), false);
    });
    (0, node_test_1.test)('should output messages with print method', () => {
        // Reset Diagnostics state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const originalLog = console.log;
        let capturedOutput = '';
        console.log = (message) => {
            capturedOutput += message;
        };
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        dx.print('Test message');
        assert.ok(capturedOutput.includes('Test message'), 'print() should output the message');
        assert.ok(capturedOutput.includes('TestClass'), 'print() should include class name');
        assert.strictEqual(dx.print('Another message'), dx); // Should return this for chaining
        console.log = originalLog;
    });
    (0, node_test_1.test)('should handle done with message', () => {
        // Reset Diagnostics state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const originalLog = console.log;
        let capturedOutput = '';
        console.log = (message) => {
            capturedOutput += message;
        };
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass', debugOn: true });
        const subDx = dx.sub({ name: 'testMethod' });
        subDx.done('completed');
        assert.ok(capturedOutput.includes('Done'), 'done() should output completion message');
        assert.ok(capturedOutput.includes('completed'), 'done() should include the provided message');
        assert.strictEqual(subDx.done('completed'), subDx); // Should return this for chaining
        console.log = originalLog;
    });
    (0, node_test_1.test)('should handle done without message', () => {
        // Reset Diagnostics state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const originalLog = console.log;
        let capturedOutput = '';
        console.log = (message) => {
            capturedOutput += message;
        };
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass', debugOn: true });
        const subDx = dx.sub({ name: 'testMethod' });
        subDx.done();
        assert.ok(capturedOutput.includes('Done'), 'done() should output completion message');
        assert.strictEqual(subDx.done(), subDx); // Should return this for chaining
        console.log = originalLog;
    });
    (0, node_test_1.test)('should handle error method', () => {
        // Reset Diagnostics state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const originalLog = console.log;
        let capturedOutput = '';
        console.log = (message) => {
            capturedOutput += message;
        };
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass' });
        dx.error('Error message');
        assert.ok(capturedOutput.includes('ERROR'), 'error() should include ERROR prefix');
        assert.ok(capturedOutput.includes('Error message'), 'error() should output the error message');
        assert.ok(capturedOutput.includes('TestClass'), 'error() should include class name');
        assert.strictEqual(dx.error('Another error'), dx); // Should return this for chaining
        console.log = originalLog;
    });
    (0, node_test_1.test)('should handle duplicate messages with warning bookends without App instance', () => {
        // Reset Diagnostics state to ensure clean test
        Diagnostics_1.Diagnostics.reset();
        const originalLog = console.log;
        let capturedOutput = '';
        console.log = (message) => {
            capturedOutput += message;
        };
        // Create Diagnostics instance WITHOUT App (null parent and app)
        const dx = new Diagnostics_1.Diagnostics({ name: 'TestClass', debugOn: true, parent: null, app: null });
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
//# sourceMappingURL=Diagnostics.test.js.map