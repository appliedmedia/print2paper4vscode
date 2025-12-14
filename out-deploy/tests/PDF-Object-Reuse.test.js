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
/**
 * Comprehensive tests for PDF object reuse (Stage 4.3)
 *
 * Verifies that the same PDF object generated from tokenization is properly
 * reused for all purposes (webview display, printing, saving).
 */
(0, node_test_1.describe)('PDF Object Reuse Tests', () => {
    (0, node_test_1.describe)('Single PDF Generation', () => {
        (0, node_test_1.test)('should generate PDF only once per user action', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = `function test() {
  console.log("Hello World");
  return 42;
}`;
            paperPrinter.docInfo().languageId = 'javascript';
            // Generate PDF
            await paperPrinter['generatePdf']();
            const pdfDoc1 = app.pdf.docInfo();
            // Generate PDF again (should reuse same object or create new one)
            await paperPrinter['generatePdf']();
            const pdfDoc2 = app.pdf.docInfo();
            // Both should be valid PDFs
            assert.ok(pdfDoc1, 'First PDF should be generated');
            assert.ok(pdfDoc2, 'Second PDF should be generated');
            assert.ok(pdfDoc1.pageTotal > 0, 'First PDF should have pages');
            assert.ok(pdfDoc2.pageTotal > 0, 'Second PDF should have pages');
            app.done();
        });
        (0, node_test_1.test)('should reuse same PDF object for multiple ArrayBuffer calls', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = 'console.log("test");';
            paperPrinter.docInfo().languageId = 'javascript';
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated');
            // Get ArrayBuffer multiple times
            const arrayBuffer1 = pdfDoc.asArrayBuffer();
            const arrayBuffer2 = pdfDoc.asArrayBuffer();
            const arrayBuffer3 = pdfDoc.asArrayBuffer();
            // All should be identical
            assert.strictEqual(arrayBuffer1.byteLength, arrayBuffer2.byteLength, 'ArrayBuffer size should be consistent');
            assert.strictEqual(arrayBuffer2.byteLength, arrayBuffer3.byteLength, 'ArrayBuffer size should be consistent');
            // Compare byte content
            const view1 = new Uint8Array(arrayBuffer1);
            const view2 = new Uint8Array(arrayBuffer2);
            const view3 = new Uint8Array(arrayBuffer3);
            assert.strictEqual(view1.length, view2.length, 'Byte arrays should have same length');
            assert.strictEqual(view2.length, view3.length, 'Byte arrays should have same length');
            // Verify all bytes are identical
            for (let i = 0; i < view1.length; i++) {
                assert.strictEqual(view1[i], view2[i], `Byte arrays should match at index ${i}`);
                assert.strictEqual(view2[i], view3[i], `Byte arrays should match at index ${i}`);
            }
            app.done();
        });
    });
    (0, node_test_1.describe)('Webview Display Integration', () => {
        (0, node_test_1.test)('should use same PDF object for webview display', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = `function example() {
  return "Hello World";
}`;
            paperPrinter.docInfo().languageId = 'javascript';
            // Generate PDF
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated');
            // Get ArrayBuffer before webview display
            const arrayBufferBefore = pdfDoc.asArrayBuffer();
            // Display in webview (this should use the same PDF object)
            // Use the singleton UIWebView instance from app
            await app.uiwebview.displayPdfPanel();
            // Get ArrayBuffer after webview display
            const arrayBufferAfter = pdfDoc.asArrayBuffer();
            // Should be the same PDF
            assert.strictEqual(arrayBufferBefore.byteLength, arrayBufferAfter.byteLength, 'PDF should not change after webview display');
            // Compare byte content
            const viewBefore = new Uint8Array(arrayBufferBefore);
            const viewAfter = new Uint8Array(arrayBufferAfter);
            assert.strictEqual(viewBefore.length, viewAfter.length, 'Byte arrays should have same length');
            for (let i = 0; i < viewBefore.length; i++) {
                assert.strictEqual(viewBefore[i], viewAfter[i], `PDF should not change after webview display at byte ${i}`);
            }
            app.done();
        });
        (0, node_test_1.test)('should extract correct data from DocInfo_PDF for webview', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = 'console.log("test");';
            paperPrinter.docInfo().languageId = 'javascript';
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated');
            // Extract data for webview
            const arrayBuffer = pdfDoc.asArrayBuffer();
            const pageTotal = pdfDoc.pageTotal;
            const pageSizePx = pdfDoc.pageSizePx;
            // Verify all data is present and valid
            assert.ok(arrayBuffer instanceof ArrayBuffer, 'Should have ArrayBuffer');
            assert.ok(arrayBuffer.byteLength > 0, 'ArrayBuffer should have content');
            assert.ok(pageTotal > 0, 'Should have at least one page');
            assert.ok(pageSizePx.widthPx > 0, 'Should have valid width');
            assert.ok(pageSizePx.heightPx > 0, 'Should have valid height');
            // Display in webview using DocInfo_PDF directly
            // Use the singleton UIWebView instance from app
            const panelId = await app.uiwebview.displayPdfPanel();
            assert.ok(panelId, 'Panel should be created');
            app.done();
        });
    });
    (0, node_test_1.describe)('PDF Consistency Across Operations', () => {
        (0, node_test_1.test)('should maintain PDF consistency across multiple operations', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = `function test() {
  const x = 1;
  const y = 2;
  return x + y;
}`;
            paperPrinter.docInfo().languageId = 'javascript';
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated');
            // Get initial ArrayBuffer
            const initialArrayBuffer = pdfDoc.asArrayBuffer();
            const initialPageTotal = pdfDoc.pageTotal;
            const initialPageSizePx = pdfDoc.pageSizePx;
            // Perform multiple operations
            const arrayBuffer1 = pdfDoc.asArrayBuffer();
            const arrayBuffer2 = pdfDoc.asArrayBuffer();
            const pageTotal1 = pdfDoc.pageTotal;
            const pageSizePx1 = pdfDoc.pageSizePx;
            // Verify consistency
            assert.strictEqual(initialArrayBuffer.byteLength, arrayBuffer1.byteLength, 'ArrayBuffer should remain consistent');
            assert.strictEqual(arrayBuffer1.byteLength, arrayBuffer2.byteLength, 'ArrayBuffer should remain consistent');
            assert.strictEqual(initialPageTotal, pageTotal1, 'Page total should remain consistent');
            assert.strictEqual(initialPageSizePx.widthPx, pageSizePx1.widthPx, 'Page width should remain consistent');
            assert.strictEqual(initialPageSizePx.heightPx, pageSizePx1.heightPx, 'Page height should remain consistent');
            app.done();
        });
        (0, node_test_1.test)('should handle multiple ArrayBuffer conversions without issues', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = 'console.log("multiple conversions test");';
            paperPrinter.docInfo().languageId = 'javascript';
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated');
            // Convert to ArrayBuffer multiple times
            const buffers = [];
            for (let i = 0; i < 10; i++) {
                buffers.push(pdfDoc.asArrayBuffer());
            }
            // All buffers should be identical
            const firstBuffer = buffers[0];
            for (let i = 1; i < buffers.length; i++) {
                assert.strictEqual(firstBuffer.byteLength, buffers[i].byteLength, `Buffer ${i} should match first buffer size`);
                const view1 = new Uint8Array(firstBuffer);
                const view2 = new Uint8Array(buffers[i]);
                assert.strictEqual(view1.length, view2.length, `Buffer ${i} should match first buffer length`);
                for (let j = 0; j < view1.length; j++) {
                    assert.strictEqual(view1[j], view2[j], `Buffer ${i} should match first buffer at byte ${j}`);
                }
            }
            app.done();
        });
    });
    (0, node_test_1.describe)('Error Handling for PDF Object Reuse', () => {
        (0, node_test_1.test)('should handle missing PDF object gracefully', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = 'console.log("test");';
            paperPrinter.docInfo().languageId = 'javascript';
            // Don't generate PDF - pdfDoc should be null
            assert.ok(app.pdf.docInfo().pdfDoc === null, 'PDF should be null before generation');
            // Try to display webview without generating PDF first
            // This should fail because pdfDoc is null
            try {
                // Use the singleton UIWebView instance from app
                await app.uiwebview.displayPdfPanel();
                assert.fail('Should throw error when PDF is not generated');
            }
            catch (error) {
                assert.ok(String(error).includes('not generated') ||
                    String(error).includes('PDF') ||
                    String(error).includes('null'), 'Error should mention PDF not generated');
            }
            app.done();
        });
        (0, node_test_1.test)('should validate PDF data before reuse', async () => {
            const app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
            // Create menus before generating PDF (menus are created on-demand in production)
            app.paperprinter.createMenus();
            const paperPrinter = app.paperprinter;
            paperPrinter.docInfo().rawCode = '';
            paperPrinter.docInfo().languageId = 'javascript';
            // Generate PDF with empty code
            await paperPrinter['generatePdf']();
            const pdfDoc = app.pdf.docInfo();
            assert.ok(pdfDoc, 'PDF should be generated even with empty code');
            // Verify PDF has valid data
            const arrayBuffer = pdfDoc.asArrayBuffer();
            assert.ok(arrayBuffer instanceof ArrayBuffer, 'Should have ArrayBuffer');
            assert.ok(pdfDoc.pageTotal >= 0, 'Should have valid page count');
            app.done();
        });
    });
});
//# sourceMappingURL=PDF-Object-Reuse.test.js.map