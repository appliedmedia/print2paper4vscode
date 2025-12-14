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
const Persist_js_1 = require("../src/Persist.js");
const App_js_1 = require("../src/App.js");
// Mock VS Code context and APIs with state tracking
let mockGlobalState = {};
let mockUpdateCallCount = 0;
const mockContext = {
    subscriptions: [],
    globalState: {
        get: (key) => mockGlobalState[key],
        update: async (key, value) => {
            mockUpdateCallCount++;
            if (value === undefined) {
                delete mockGlobalState[key];
            }
            else {
                mockGlobalState[key] = value;
            }
        },
    },
    globalStorageUri: { fsPath: '/tmp' },
};
const mockVSCode = {
    commands: { registerCommand: () => ({}) },
    window: {
        showErrorMessage: () => { },
        showInformationMessage: () => { },
        showWarningMessage: () => { },
    },
    workspace: {
        getConfiguration: () => ({
            get: () => undefined,
        }),
    },
    Uri: { file: (path) => ({ fsPath: path }) },
    Range: class Range {
    },
};
(0, node_test_1.describe)('Persist', () => {
    let app;
    let persist;
    (0, node_test_1.beforeEach)(() => {
        mockGlobalState = {}; // Reset state before each test
        mockUpdateCallCount = 0; // Reset call count before each test
        app = new App_js_1.App({ context: mockContext, vscode: mockVSCode });
        persist = app.reg.getInstance('persist');
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should register and retrieve a property', () => {
        persist.set('testKey', 'testValue');
        assert.strictEqual(persist.get('testKey'), 'testValue');
    });
    (0, node_test_1.it)('should use default value when no value is set', async () => {
        await persist.validateDefault({ name: 'theme', computeFn: async () => 'github-light' });
        assert.strictEqual(persist.get('theme'), 'github-light');
    });
    (0, node_test_1.it)('should persist values to global state', () => {
        persist.set('testKey', 'persistedValue');
        assert.strictEqual(mockGlobalState['testKey'], 'persistedValue');
    });
    (0, node_test_1.it)('should retrieve from global state on second access', () => {
        // Set value in global state directly
        mockGlobalState['existingKey'] = 'existingValue';
        const value = persist.get('existingKey');
        assert.strictEqual(value, 'existingValue');
    });
    (0, node_test_1.it)('should use default when value is not in global state or cache', async () => {
        await persist.validateDefault({ name: 'newKey', computeFn: async () => 'defaultValue' });
        assert.strictEqual(persist.get('newKey'), 'defaultValue');
        // Should also be persisted to global state
        assert.strictEqual(mockGlobalState['newKey'], 'defaultValue');
    });
    (0, node_test_1.it)('should not update global state for empty string values', () => {
        persist.set('emptyKey', '');
        // Empty string should not persist to global state
        assert.strictEqual(mockGlobalState['emptyKey'], undefined);
        // But should be in memory cache
        assert.strictEqual(persist.get('emptyKey'), '');
    });
    (0, node_test_1.it)('should return same default on multiple validateDefault calls', async () => {
        const default1 = await persist.validateDefault({ name: 'key', computeFn: async () => 'default' });
        const default2 = await persist.validateDefault({ name: 'key', computeFn: async () => 'different' });
        assert.strictEqual(default1, 'default');
        assert.strictEqual(default2, 'default'); // Should return cached default
    });
    (0, node_test_1.it)('should handle multiple registered properties', () => {
        persist.set('key1', 'value1');
        persist.set('key2', 'value2');
        assert.strictEqual(persist.get('key1'), 'value1');
        assert.strictEqual(persist.get('key2'), 'value2');
    });
    (0, node_test_1.it)('should update global state when value changes', () => {
        persist.set('changeable', 'value1');
        assert.strictEqual(mockGlobalState['changeable'], 'value1');
        persist.set('changeable', 'value2');
        assert.strictEqual(mockGlobalState['changeable'], 'value2');
    });
    (0, node_test_1.it)('should not update global state when value does not change', () => {
        persist.set('unchanged', 'same');
        const callCountBefore = mockUpdateCallCount;
        persist.set('unchanged', 'same'); // Set same value again
        // Global state update should not be called again (redundant update suppressed)
        const callCountAfter = mockUpdateCallCount;
        assert.strictEqual(callCountBefore, callCountAfter, 'update() should not be called for unchanged values');
    });
    (0, node_test_1.it)('should handle different value types', () => {
        persist.set('stringKey', 'string');
        persist.set('numberKey', 42);
        assert.strictEqual(persist.get('stringKey'), 'string');
        assert.strictEqual(persist.get('numberKey'), 42);
    });
    (0, node_test_1.it)('should clear persist state', async () => {
        // Import kMenuId to know what keys clear() actually clears
        const { kMenuId } = await Promise.resolve().then(() => __importStar(require('../src/UIMenu.js')));
        // Set actual menu keys that clear() will remove
        const menuKey1 = kMenuId[0];
        const menuKey2 = kMenuId.length > 1 ? kMenuId[1] : 'toolbar_pos';
        persist.set(menuKey1, 'value1');
        persist.set(menuKey2, 'value2');
        assert.strictEqual(mockGlobalState[menuKey1], 'value1');
        await Persist_js_1.Persist.clear({ reg: app.reg });
        // State should be cleared from memory for menu keys
        assert.strictEqual(persist.get(menuKey1), undefined);
        assert.strictEqual(persist.get(menuKey2), undefined);
    });
});
//# sourceMappingURL=Persist.test.js.map