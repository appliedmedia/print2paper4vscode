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
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
// Mock VS Code context with state tracking for this test suite
let mockGlobalState = {};
const mockContext = {
    subscriptions: [],
    extensionPath: process.cwd(),
    globalState: {
        get: (key) => mockGlobalState[key],
        update: async (key, value) => {
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
(0, node_test_1.describe)('VSCodeAPIs', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        mockGlobalState = {}; // Reset state before each test
        app = new App_js_1.App({ context: mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should get global storage path', () => {
        const path = app.vscodeapis.getGlobalStoragePath();
        assert.strictEqual(path, '/tmp');
    });
    (0, node_test_1.it)('should update and get global state', () => {
        app.vscodeapis.updateGlobalState({ key: 'testKey', value: 'testValue' });
        const value = app.vscodeapis.getGlobalState('testKey');
        assert.strictEqual(value, 'testValue');
    });
    (0, node_test_1.it)('should get editor typography', () => {
        const typography = app.vscodeapis.getEditorTypography();
        assert.strictEqual(typography.fontSize, 14);
        assert.strictEqual(typography.lineHeight, 1.5);
        assert.strictEqual(typography.fontFamily, 'Monaco');
    });
    (0, node_test_1.it)('should get active text editor', () => {
        const editor = app.vscodeapis.getActiveTextEditor();
        assert.ok(editor !== undefined);
    });
    (0, node_test_1.it)('should get extension path', () => {
        const path = app.vscodeapis.getExtensionPath();
        assert.ok(typeof path === 'string');
    });
    (0, node_test_1.it)('should get active theme ID', () => {
        const themeId = app.vscodeapis.getActiveThemeId();
        assert.ok(typeof themeId === 'string');
    });
    (0, node_test_1.it)('should get or create webview panel', async () => {
        const panelId = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test Panel', html: '<html><body>Test</body></html>' });
        assert.ok(typeof panelId === 'string');
        assert.ok(panelId.length > 0);
    });
    (0, node_test_1.it)('should reuse existing webview panel', async () => {
        const panelId1 = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test', html: '<html></html>' });
        const panelId2 = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test', html: '<html></html>', existingPanelId: panelId1 });
        assert.strictEqual(panelId1, panelId2);
    });
    (0, node_test_1.it)('should get selection or document text', () => {
        const editor = app.vscodeapis.getActiveTextEditor();
        if (editor) {
            const text = app.vscodeapis.getSelectionOrDocumentText(editor);
            assert.ok(typeof text === 'string');
        }
    });
    (0, node_test_1.it)('should get active language ID', () => {
        const languageId = app.vscodeapis.getActiveLanguageId();
        assert.ok(typeof languageId === 'string');
    });
    (0, node_test_1.it)('should check if active selection exists', () => {
        const hasSelection = app.vscodeapis.hasActiveSelection();
        assert.ok(typeof hasSelection === 'boolean');
    });
    (0, node_test_1.it)('should get active tab name', () => {
        const tabName = app.vscodeapis.getActiveTabName();
        assert.ok(typeof tabName === 'string');
    });
    (0, node_test_1.it)('should get descriptive name from document', () => {
        const editor = app.vscodeapis.getActiveTextEditor();
        if (editor) {
            const name = app.vscodeapis.getDescriptiveName(editor.document);
            assert.ok(typeof name === 'string');
        }
    });
    (0, node_test_1.it)('should set status bar message', () => {
        const disposable = app.vscodeapis.setStatusBarMessage('Test message');
        assert.ok(disposable);
        disposable.dispose();
    });
    (0, node_test_1.it)('should set status bar message with timeout', () => {
        const disposable = app.vscodeapis.setStatusBarMessage('Test message', 1000);
        assert.ok(disposable);
        disposable.dispose();
    });
    (0, node_test_1.it)('should get temp directory', () => {
        const tempDir = app.vscodeapis.getDir_Temp();
        assert.ok(typeof tempDir === 'string');
        assert.ok(tempDir.includes('temp'));
    });
    (0, node_test_1.it)('should convert URI from path', () => {
        const uri = app.vscodeapis.uriFromPath('/test/path');
        assert.ok(uri);
        assert.strictEqual(uri.fsPath, '/test/path');
    });
    (0, node_test_1.it)('should convert URI to path', () => {
        const uri = app.vscodeapis.uriFromPath('/test/path');
        const path = app.vscodeapis.uriToPath(uri);
        assert.strictEqual(path, '/test/path');
    });
});
//# sourceMappingURL=VSCodeAPIs.test.js.map