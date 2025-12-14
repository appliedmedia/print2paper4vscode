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
(0, node_test_1.describe)('System Integration Tests', () => {
    (0, node_test_1.test)('should initialize all components correctly', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Verify all major components are created
        assert.ok(app.vscodeapis, 'Should have VSCodeAPIs');
        assert.ok(app.ui, 'Should have UI');
        assert.ok(app.os, 'Should have OS');
        assert.ok(app.pdf, 'Should have PDF');
        assert.ok(app.paperprinter, 'Should have PaperPrinter');
        assert.ok(app.stylize, 'Should have Stylize');
        assert.ok(app.tabinspector, 'Should have TabInspector');
        assert.ok(app.uimenumgr, 'Should have UIMenuMgr');
        app.done();
    });
    (0, node_test_1.test)('should handle Shiki theme workflow', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Note: Stylize no longer has init() - highlighter initialized lazily when needed
        // Test that Shiki themes are loaded
        const shikiThemes = app.stylize.getShikiThemes();
        assert.ok(shikiThemes.length > 0, 'Should have Shiki themes');
        assert.ok(shikiThemes.some(t => t.id.includes('light')), 'Should have light themes');
        // Test theme filtering
        const lightThemes = app.stylize.getShikiThemes('light|bright|day');
        assert.ok(lightThemes.length > 0, 'Should have filtered themes');
        assert.ok(lightThemes.every(t => /light|bright|day/i.test(t.id)), 'Themes should match filter');
        app.done();
    });
    (0, node_test_1.test)('should validate template system integration', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        const utils = app.reg.getInstance('utils');
        // Test template replacement
        const template = 'Hello {{NAME}}, welcome to {{PRODUCT}}!';
        const result = utils.templateDictReplace(template, {
            NAME: 'Developer',
            PRODUCT: 'VSCode Extension',
        });
        assert.strictEqual(result, 'Hello Developer, welcome to VSCode Extension!', 'Template replacement should work');
        app.done();
    });
    (0, node_test_1.test)('should handle page size and orient functionality', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Test page size menu items
        const pageMenuItems = app.paperprinter.menuItems_Page();
        assert.ok(pageMenuItems.length >= 3, 'Should have page menu items');
        assert.ok(pageMenuItems.every((item) => item.id && item.displayName), 'All items should have id and displayName');
        // Test orient menu items
        const orientMenuItems = app.paperprinter.menuItems_Orient();
        assert.strictEqual(orientMenuItems.length, 2, 'Should have 2 orient options');
        const orientIds = orientMenuItems.map((item) => item.id);
        assert.ok(orientIds.includes('portrait'), 'Should have portrait');
        assert.ok(orientIds.includes('landscape'), 'Should have landscape');
        app.done();
    });
    (0, node_test_1.test)('should handle PDF generation workflow', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Set up document
        app.paperprinter.docInfo().rawCode = 'const x = 42;';
        app.paperprinter.docInfo().languageId = 'javascript';
        app.paperprinter.docInfo().printTitle = 'Test';
        // Create menus
        app.paperprinter.createMenus();
        // Generate PDF
        await app.paperprinter.generatePdf();
        assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF');
        assert.ok(app.pdf.docInfo().pageTotal > 0, 'Should have pages');
        app.done();
    });
    (0, node_test_1.test)('should coordinate between components', async () => {
        const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Test that components can access registry
        assert.strictEqual(app.stylize['reg'], app.reg, 'Stylize should reference registry');
        assert.strictEqual(app.pdf['reg'], app.reg, 'PDF should reference registry');
        assert.strictEqual(app.paperprinter['reg'], app.reg, 'PaperPrinter should reference registry');
        // Test that shared services work
        const typography = app.vscodeapis.getEditorTypography();
        assert.ok(typography.fontSize > 0, 'Should get typography');
        assert.ok(typography.sizeToHeightRatio > 0, 'Should have ratio');
        app.done();
    });
});
//# sourceMappingURL=Integration-Components.test.js.map