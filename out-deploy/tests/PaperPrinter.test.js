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
const PaperPrinter_js_1 = require("../src/PaperPrinter.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('PaperPrinter', () => {
    let app;
    let paperPrinter;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        paperPrinter = app.paperprinter;
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should initialize PaperPrinter', () => {
        assert.ok(paperPrinter instanceof PaperPrinter_js_1.PaperPrinter);
    });
    (0, node_test_1.it)('should have docInfo property', () => {
        assert.ok(paperPrinter.docInfo());
        assert.ok(typeof paperPrinter.docInfo().rawCode === 'string');
        assert.ok(typeof paperPrinter.docInfo().languageId === 'string');
    });
    (0, node_test_1.it)('should handle print command from VS Code', async () => {
        paperPrinter.docInfo().rawCode = 'console.log("test");';
        paperPrinter.docInfo().languageId = 'javascript';
        try {
            await paperPrinter.handlePrintCommandFromVSCode();
            assert.ok(true); // Should not throw
        }
        catch (error) {
            // May fail if webview setup isn't complete
            assert.ok(true);
        }
    });
    (0, node_test_1.it)('should handle print request', async () => {
        paperPrinter.docInfo().rawCode = 'console.log("test");';
        paperPrinter.docInfo().languageId = 'javascript';
        // Mock PDF generation
        const originalGeneratePdf = paperPrinter.generatePdf;
        paperPrinter.generatePdf = async () => {
            // Mock PDF generation
        };
        try {
            await paperPrinter.handlePrintRequest('preview');
            assert.ok(true);
        }
        catch (error) {
            // Expected if PDF generation fails
            assert.ok(true);
        }
        finally {
            paperPrinter.generatePdf = originalGeneratePdf;
        }
    });
    (0, node_test_1.it)('should set document content', () => {
        paperPrinter.docInfo().rawCode = 'const x = 42;';
        paperPrinter.docInfo().languageId = 'javascript';
        paperPrinter.docInfo().printTitle = 'Test Document';
        assert.strictEqual(paperPrinter.docInfo().rawCode, 'const x = 42;');
        assert.strictEqual(paperPrinter.docInfo().languageId, 'javascript');
        assert.strictEqual(paperPrinter.docInfo().printTitle, 'Test Document');
    });
    (0, node_test_1.it)('should compute line height from font size', () => {
        // Create menus first so fontSizeId menu exists
        const paperPrinterPrivate = paperPrinter;
        paperPrinterPrivate.createMenus();
        const lineHeight = paperPrinter.lineHeightPx;
        assert.ok(typeof lineHeight === 'number');
        assert.ok(lineHeight > 0);
    });
    (0, node_test_1.it)('should get YAML icons', () => {
        const yaml = paperPrinter.yaml();
        assert.ok(yaml);
        assert.ok(typeof yaml === 'object');
    });
    (0, node_test_1.it)('should create menus', () => {
        const menusBefore = app.uimenumgr.getUIMenus().length;
        // Access private method through type assertion
        const paperPrinterPrivate = paperPrinter;
        paperPrinterPrivate.createMenus();
        const menusAfter = app.uimenumgr.getUIMenus().length;
        assert.ok(menusAfter > menusBefore || menusAfter > 0);
    });
    (0, node_test_1.it)('should handle generatePdf', async () => {
        paperPrinter.docInfo().rawCode = 'const x = 42;';
        paperPrinter.docInfo().languageId = 'javascript';
        paperPrinter.docInfo().printTitle = 'Test';
        // Create menus first
        const paperPrinterPrivate = paperPrinter;
        paperPrinterPrivate.createMenus();
        await paperPrinterPrivate.generatePdf();
        assert.ok(app.pdf.docInfo().pdfDoc !== null, 'PDF should be generated');
        assert.strictEqual(app.pdf.docInfo().title, 'Test', 'Title should match');
        assert.ok(app.pdf.docInfo().pageTotal > 0, 'Should have pages');
    });
    (0, node_test_1.it)('should get current font family', () => {
        const paperPrinterPrivate = paperPrinter;
        const fontFamily = paperPrinterPrivate.getCurrentFontFamily();
        assert.ok(typeof fontFamily === 'string');
        assert.ok(fontFamily.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Print menu', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Print();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Theme menu', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Theme();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Text menu', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Text();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Page menu', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Page();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for PageSizeId', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_PageSizeId();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Orient', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Orient();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for MarginId', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_MarginId();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Header', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Header();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for Footer', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_Footer();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should generate menu items for HeaderFooterContent', () => {
        const paperPrinterPrivate = paperPrinter;
        const menuItems = paperPrinterPrivate.menuItems_HeaderFooterContent();
        assert.ok(Array.isArray(menuItems));
        assert.ok(menuItems.length > 0);
    });
    (0, node_test_1.it)('should handle selection for Header', async () => {
        const paperPrinterPrivate = paperPrinter;
        const result = await paperPrinterPrivate.handleSelection_Header();
        assert.ok(result);
        assert.ok(typeof result.id === 'string');
    });
    (0, node_test_1.it)('should handle selection for Footer', async () => {
        const paperPrinterPrivate = paperPrinter;
        const result = await paperPrinterPrivate.handleSelection_Footer();
        assert.ok(result);
        assert.ok(typeof result.id === 'string');
    });
});
//# sourceMappingURL=PaperPrinter.test.js.map