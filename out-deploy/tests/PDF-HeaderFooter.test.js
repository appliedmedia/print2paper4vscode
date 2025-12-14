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
const test_helpers_js_1 = require("./test-helpers.js");
(0, node_test_1.describe)('PDF Header and Footer', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        (0, test_helpers_js_1.installHeaderFooterMenuStubs)(app);
        app.paperprinter.docInfo().printTitle = 'Test Document';
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should generate PDF without headers/footers when set to none', async () => {
        app.pdf.docInfo().pageSizeId = 'a4';
        app.pdf.docInfo().orient = 'portrait';
        app.pdf.docInfo().fontSizePx = 12;
        app.pdf.docInfo().lineHeightPx = 18;
        app.pdf.docInfo().fontFamily = 'Courier';
        app.pdf.docInfo().theme = 'github-light';
        app.pdf.docInfo().code = 'console.log("test");';
        app.pdf.docInfo().languageId = 'javascript';
        await app.pdf.generatePdf();
        assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF');
        assert.ok(app.pdf.docInfo().pageTotal > 0, 'Should have pages');
    });
    (0, node_test_1.it)('should handle multi-page PDF generation', async () => {
        app.pdf.docInfo().pageSizeId = 'a4';
        app.pdf.docInfo().orient = 'portrait';
        app.pdf.docInfo().fontSizePx = 12;
        app.pdf.docInfo().lineHeightPx = 18;
        app.pdf.docInfo().fontFamily = 'Courier';
        app.pdf.docInfo().theme = 'github-light';
        // Generate long code to trigger multi-page
        const longCode = Array(100).fill('console.log("This is a test line");').join('\n');
        app.pdf.docInfo().code = longCode;
        app.pdf.docInfo().languageId = 'javascript';
        await app.pdf.generatePdf();
        assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF');
        const pageCount = app.pdf.docInfo().pageTotal;
        assert.ok(pageCount > 1, `Should have multiple pages, got ${pageCount}`);
    });
    (0, node_test_1.it)('should handle different margin settings', async () => {
        const marginIds = ['none', 'minimal', 'normal', 'wide'];
        for (const marginId of marginIds) {
            app.pdf.resetCaches();
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'const x = 42;';
            app.pdf.docInfo().languageId = 'javascript';
            app.pdf.docInfo().marginId = marginId;
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, `Should generate PDF with ${marginId} margins`);
            assert.ok(app.pdf.docInfo().pageTotal > 0, `Should have pages with ${marginId} margins`);
        }
    });
    (0, node_test_1.it)('should handle different orientations', async () => {
        const orientations = ['portrait', 'landscape'];
        for (const orient of orientations) {
            app.pdf.resetCaches();
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = orient;
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'const x = 42;';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, `Should generate PDF in ${orient} orientation`);
            const pageSizePx = await app.pdf.getPageSizePx();
            if (orient === 'portrait') {
                assert.ok(pageSizePx.heightPx > pageSizePx.widthPx, 'Portrait should be taller than wide');
            }
            else {
                assert.ok(pageSizePx.widthPx > pageSizePx.heightPx, 'Landscape should be wider than tall');
            }
        }
    });
    (0, node_test_1.it)('should handle different page sizes', async () => {
        const pageSizes = ['a4', 'letter', 'legal'];
        for (const pageSize of pageSizes) {
            app.pdf.resetCaches();
            app.pdf.docInfo().pageSizeId = pageSize;
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'const x = 42;';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, `Should generate PDF with ${pageSize} size`);
            const pageSizePx = await app.pdf.getPageSizePx();
            assert.ok(pageSizePx.widthPx > 0, `${pageSize} should have width`);
            assert.ok(pageSizePx.heightPx > 0, `${pageSize} should have height`);
        }
    });
});
//# sourceMappingURL=PDF-HeaderFooter.test.js.map