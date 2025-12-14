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
const Registry_1 = require("../src/Registry");
const Diagnostics_1 = require("../src/Diagnostics");
const App_1 = require("../src/App");
const test_utils_js_1 = require("./test-utils.js");
// Mock VS Code context
const mockContext = {
    subscriptions: [],
    workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => [],
    },
    globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => [],
    },
    extensionPath: process.cwd(),
    globalStorageUri: { fsPath: '/tmp' },
};
(0, node_test_1.describe)('Registry', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_1.App({ context: mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.test)('should create Registry instance', () => {
        const reg = app.reg;
        assert.ok(reg instanceof Registry_1.Registry);
        assert.strictEqual(Registry_1.Registry.id, 'reg');
    });
    (0, node_test_1.test)('should have Diagnostics instance available', () => {
        const reg = app.reg;
        // Should be able to get Diagnostics via use()
        const fn = reg.use('dx.sub', 'dx.out');
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
        assert.ok(typeof fn.dx.out === 'function');
        // Verify Diagnostics works correctly
        const subDx = fn.dx.sub({ name: 'TestComponent' });
        assert.ok(subDx instanceof Diagnostics_1.Diagnostics);
    });
    (0, node_test_1.test)('should register existing instances', () => {
        const reg = app.reg;
        // Verify we can access registered components via use()
        const fn = reg.use('dx.sub');
        assert.ok(fn.dx);
        // Verify UI is registered (can request its methods)
        const uiFn = reg.use('ui.showErrorMessage');
        assert.ok(uiFn.ui);
        assert.ok(typeof uiFn.ui.showErrorMessage === 'function');
    });
    (0, node_test_1.test)('should resolve methods via use()', () => {
        const reg = app.reg;
        // Request methods from registered components
        const fn = reg.use('dx.sub', 'dx.out');
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
        assert.ok(typeof fn.dx.out === 'function');
    });
    (0, node_test_1.test)('should always include dx.sub from always array', () => {
        const reg = app.reg;
        // Request nothing - should still get dx.sub from always array
        const fn = reg.use();
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
    });
    (0, node_test_1.test)('should resolve methods with component prefix', () => {
        const reg = app.reg;
        // Request with explicit component prefix
        const fn = reg.use('dx.sub', 'dx.out');
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
        assert.ok(typeof fn.dx.out === 'function');
    });
    (0, node_test_1.test)('should bind methods correctly', () => {
        const reg = app.reg;
        const fn = reg.use('dx.sub');
        const subDx = fn.dx.sub({ name: 'TestComponent' });
        assert.ok(subDx instanceof Diagnostics_1.Diagnostics);
        assert.ok(subDx.name.includes('TestComponent'));
    });
    (0, node_test_1.test)('should handle multiple component methods', () => {
        const reg = app.reg;
        // Request methods from multiple components
        const fn = reg.use('dx.sub', 'dx.out');
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
        assert.ok(typeof fn.dx.out === 'function');
    });
    (0, node_test_1.test)('should create placeholder structure for intellisense', () => {
        const reg = app.reg;
        // Check that placeholder properties exist (for intellisense)
        assert.ok('dx' in reg);
        assert.ok('ui' in reg);
        assert.ok('pdf' in reg);
    });
    (0, node_test_1.test)('should verify Diagnostics is available via Registry', () => {
        const reg = app.reg;
        // Get Diagnostics methods via Registry
        const fn = reg.use('dx.sub', 'dx.out', 'dx.error');
        // Verify all Diagnostics methods are available
        assert.ok(fn.dx);
        assert.ok(typeof fn.dx.sub === 'function');
        assert.ok(typeof fn.dx.out === 'function');
        assert.ok(typeof fn.dx.error === 'function');
        // Verify Diagnostics works correctly
        const subDx = fn.dx.sub({ name: 'TestComponent' });
        assert.ok(subDx instanceof Diagnostics_1.Diagnostics);
        // Test that methods work
        const result = subDx.out('Test message');
        assert.strictEqual(result, subDx); // Should return this for chaining
    });
    (0, node_test_1.test)('should resolve methods from registered component instances', () => {
        const reg = app.reg;
        // Request methods from components that were registered by App
        const fn = reg.use('ui.showErrorMessage', 'pdf.generatePdf');
        // Verify methods are available
        assert.ok(fn.ui);
        assert.ok(typeof fn.ui.showErrorMessage === 'function');
        assert.ok(fn.pdf);
        assert.ok(typeof fn.pdf.generatePdf === 'function');
    });
});
//# sourceMappingURL=Registry.test.js.map