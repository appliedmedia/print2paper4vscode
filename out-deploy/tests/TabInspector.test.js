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
const TabInspector_js_1 = require("../src/TabInspector.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('TabInspector', () => {
    let app;
    let tabInspector;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        tabInspector = new TabInspector_js_1.TabInspector({ reg: app.reg });
        // Note: TabInspector no longer has init() - initialization happens in constructor
    });
    (0, node_test_1.afterEach)(() => {
        tabInspector.done();
        app.done();
    });
    (0, node_test_1.it)('should initialize', () => {
        assert.ok(tabInspector instanceof TabInspector_js_1.TabInspector);
    });
    (0, node_test_1.it)('should detect active tab category', () => {
        // Mock has a JavaScript file, so should return 'editor-nonmd'
        const category = tabInspector.detectActiveTabCategory();
        assert.strictEqual(category, 'editor-nonmd');
    });
    (0, node_test_1.it)('should get editor selection or all', () => {
        const result = tabInspector.getEditorSelectionOrAll();
        // Mock has empty selection, so should return document text
        assert.ok(result !== null);
        assert.ok(typeof result === 'object');
        assert.ok('text' in result);
        assert.strictEqual(result.text, 'test code');
    });
    (0, node_test_1.it)('should inspect tab', async () => {
        const result = await tabInspector.inspectTab();
        assert.ok('code' in result);
        assert.ok('language' in result);
        assert.ok('fileName' in result);
        assert.ok('filePath' in result);
        // Verify actual values from mock
        assert.strictEqual(result.language, 'javascript');
        assert.strictEqual(result.code, 'test code');
        assert.ok(result.fileName.includes('file.js'));
    });
    (0, node_test_1.it)('should inspect visible editors', async () => {
        const result = await tabInspector.inspectVisibleEditors();
        assert.ok(Array.isArray(result));
        // Should have at least one editor (the active one)
        assert.ok(result.length >= 1);
        assert.ok(result[0].language === 'javascript');
    });
});
//# sourceMappingURL=TabInspector.test.js.map