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
const UI_js_1 = require("../src/UI.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('UI', () => {
    let app;
    let ui;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        ui = new UI_js_1.UI({ reg: app.reg });
        // UI no longer has init() method (migrated to Registry pattern)
    });
    (0, node_test_1.afterEach)(() => {
        ui.done();
        app.done();
    });
    (0, node_test_1.it)('should initialize UI', () => {
        assert.ok(ui instanceof UI_js_1.UI);
    });
    (0, node_test_1.it)('should get base CSS', () => {
        const css = ui.getBaseCSS();
        assert.ok(typeof css === 'string');
    });
    (0, node_test_1.it)('should replace template dictionary', () => {
        const result = ui.templateDictReplace('Hello {{NAME}}', { NAME: 'World' });
        assert.strictEqual(result, 'Hello World');
    });
    (0, node_test_1.it)('should choose save location', async () => {
        // Mock showSaveDialog to return a URI
        const originalShowSaveDialog = app.vscodeapis.showSaveDialog;
        const mockUri = {
            fsPath: '/test/save.pdf',
            path: '/test/save.pdf',
            toString: () => 'file:///test/save.pdf'
        };
        app.vscodeapis.showSaveDialog = async (options) => mockUri;
        // Recreate UI instance after mocking so it picks up the mocked method
        const testUi = new UI_js_1.UI({ reg: app.reg });
        const path = await testUi.chooseSaveLocation('test.pdf');
        assert.ok(path !== null, `Expected path to not be null, got: ${path}`);
        assert.strictEqual(path, '/test/save.pdf');
        testUi.done();
        app.vscodeapis.showSaveDialog = originalShowSaveDialog;
    });
    (0, node_test_1.it)('should return null when save dialog is cancelled', async () => {
        const originalShowSaveDialog = app.vscodeapis.showSaveDialog;
        app.vscodeapis.showSaveDialog = async () => undefined;
        try {
            const path = await ui.chooseSaveLocation('test.pdf');
            assert.strictEqual(path, null);
        }
        finally {
            app.vscodeapis.showSaveDialog = originalShowSaveDialog;
        }
    });
    (0, node_test_1.it)('should add toolbar to HTML', async () => {
        const html = '<html><body>{{toolbar}}</body></html>';
        const result = await ui.addToolbar(html);
        assert.ok(typeof result === 'string');
        assert.ok(result.includes('toolbar') || result.length > 0);
    });
    (0, node_test_1.it)('should have static out method', () => {
        const originalLog = console.log;
        let logged = '';
        console.log = (msg) => {
            logged = msg;
        };
        UI_js_1.UI.out('Test message');
        assert.strictEqual(logged, 'Test message');
        console.log = originalLog;
    });
});
//# sourceMappingURL=UI.test.js.map