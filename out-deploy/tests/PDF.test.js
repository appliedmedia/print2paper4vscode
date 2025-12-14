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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const PDF_js_1 = require("../src/PDF.js");
const DocInfo_PDF_js_1 = require("../src/DocInfo_PDF.js");
const App_js_1 = require("../src/App.js");
const jspdf_1 = __importDefault(require("jspdf"));
const test_utils_js_1 = require("./test-utils.js");
const test_helpers_js_1 = require("./test-helpers.js");
(0, node_test_1.describe)('PDF', () => {
    let app;
    let pdf;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        (0, test_helpers_js_1.installHeaderFooterMenuStubs)(app);
        pdf = new PDF_js_1.PDF({ reg: app.reg });
        // Set up paperprinter docInfo for tests
        app.paperprinter.docInfo().printTitle = 'Test Document';
    });
    (0, node_test_1.afterEach)(() => {
        pdf.done();
        app.done();
    });
    (0, node_test_1.it)('should initialize PDF document', () => {
        assert.ok(pdf instanceof PDF_js_1.PDF);
    });
    (0, node_test_1.it)('should print with preview', async () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Test', 10, 10);
        pdf.docInfo().pdfDoc = pdfDoc;
        // Mock fileOpenPrintDialog to avoid actual OS calls
        const originalOpenPrintDialog = app.os.fileOpenPrintDialog;
        app.os.fileOpenPrintDialog = async () => { };
        await pdf.printWithPreview('test');
        // If we get here without throwing, it worked
        assert.ok(true);
        app.os.fileOpenPrintDialog = originalOpenPrintDialog;
    });
    (0, node_test_1.it)('should print directly', async () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Test', 10, 10);
        pdf.docInfo().pdfDoc = pdfDoc;
        // Mock filePrint to avoid actual OS calls
        const originalFilePrint = app.os.filePrint;
        app.os.filePrint = async () => { };
        await pdf.printDirectly('test');
        // If we get here without throwing, it worked
        assert.ok(true);
        app.os.filePrint = originalFilePrint;
    });
    (0, node_test_1.it)('should save as PDF', async () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Test', 10, 10);
        pdf.docInfo().pdfDoc = pdfDoc;
        // Mock chooseSaveLocation to return null (user cancelled)
        const originalChooseSaveLocation = app.ui.chooseSaveLocation;
        app.ui.chooseSaveLocation = async () => null;
        await pdf.saveAsPDF('test');
        // Should handle cancellation gracefully without throwing
        app.ui.chooseSaveLocation = originalChooseSaveLocation;
    });
    (0, node_test_1.it)('should handle done cleanup', () => {
        pdf.done();
        assert.ok(true); // Should not throw
    });
    (0, node_test_1.it)('should get total page count', async () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Page 1', 10, 10);
        pdf.docInfo().pdfDoc = pdfDoc;
        const pageCount = await pdf.getPageTotal();
        assert.strictEqual(pageCount, 1);
    });
    (0, node_test_1.it)('should reset caches', () => {
        pdf.resetCaches();
        assert.ok(true); // Should not throw
    });
    (0, node_test_1.it)('should have docInfo property', () => {
        assert.ok(pdf.docInfo());
        assert.ok(pdf.docInfo() instanceof DocInfo_PDF_js_1.DocInfo_PDF);
    });
    (0, node_test_1.it)('should get page size in pixels', async () => {
        const pdfDoc = new jspdf_1.default();
        pdf.docInfo().pdfDoc = pdfDoc;
        const pageSize = await pdf.getPageSizePx();
        assert.ok(typeof pageSize.widthPx === 'number');
        assert.ok(typeof pageSize.heightPx === 'number');
        assert.ok(pageSize.widthPx > 0);
        assert.ok(pageSize.heightPx > 0);
    });
    (0, node_test_1.it)('should generate complete PDF document', async () => {
        // Set up PDF document properties
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.docInfo().code = 'console.log("test");';
        pdf.docInfo().languageId = 'javascript';
        // Generate PDF using the unified approach (sets pdf.docInfo().pdfDoc)
        await pdf.generatePdf();
        assert.ok(pdf.docInfo().pdfDoc);
        assert.ok(pdf.docInfo().pageTotal > 0);
        assert.ok(pdf.docInfo().asArrayBuffer() instanceof ArrayBuffer);
        assert.ok(pdf.docInfo().asArrayBuffer().byteLength > 0);
    });
    (0, node_test_1.it)('should setup PDF document', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        assert.ok(pdf.docInfo().pdfDoc !== null);
    });
    (0, node_test_1.it)('should render tokenized line', () => {
        // Setup PDF first
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const tokens = [
            { content: 'const', color: '#0000ff', offset: 0 },
            { content: ' x', color: '#000000', offset: 5 },
            { content: ' =', color: '#000000', offset: 7 },
            { content: ' 42', color: '#008000', offset: 9 },
        ];
        // renderFromTokens now takes 2D array of all lines
        pdf.renderFromTokens([tokens]);
        // Should not throw
        assert.ok(true);
    });
    (0, node_test_1.it)('should handle invalid hex color', () => {
        // Setup PDF first
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        // Should handle invalid color gracefully without throwing
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'invalid');
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'not-a-color');
        assert.ok(true);
    });
    (0, node_test_1.it)('should get page dimensions', () => {
        const pdfPrivate = pdf;
        const dims = pdfPrivate.getPageDimensions('a4', 'portrait');
        assert.ok(dims.width > 0);
        assert.ok(dims.height > 0);
        const dimsLandscape = pdfPrivate.getPageDimensions('a4', 'landscape');
        assert.strictEqual(dimsLandscape.width, dims.height);
        assert.strictEqual(dimsLandscape.height, dims.width);
    });
    (0, node_test_1.it)('should get unit for page size', () => {
        const pdfPrivate = pdf;
        const unit = pdfPrivate.getUnitForPageSize('a4');
        assert.ok(['mm', 'in'].includes(unit));
    });
    (0, node_test_1.it)('should map font family to jsPDF font', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        const font = pdfPrivate.mapFontFamilyToJsPDF('Courier', pdf.docInfo().pdfDoc);
        assert.ok(typeof font === 'string');
        assert.ok(font.length > 0);
    });
    (0, node_test_1.it)('should set text color from web color (hex)', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        // Should not throw
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#FF0000');
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#00FF00');
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#0000FF');
        assert.ok(true);
    });
    (0, node_test_1.it)('should set text color from web color (named colors)', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'red');
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'black');
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'blue');
        assert.ok(true);
    });
    (0, node_test_1.it)('should handle 3-digit hex colors', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#F00'); // 3-digit hex
        assert.ok(true);
    });
    (0, node_test_1.it)('should handle hex colors with alpha channel', () => {
        pdf.docInfo().pageSizeId = 'a4';
        pdf.docInfo().orient = 'portrait';
        pdf.docInfo().fontSizePx = 12;
        pdf.docInfo().lineHeightPx = 18;
        pdf.docInfo().fontFamily = 'Courier';
        pdf.docInfo().theme = 'github-light';
        pdf.setupPdf();
        const pdfPrivate = pdf;
        pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#FF00005C'); // With alpha
        assert.ok(true);
    });
    (0, node_test_1.it)('should convert page size to points', () => {
        const pdfPrivate = pdf;
        const pts = pdfPrivate.pageSizeToPts(8.5, 11, 'in');
        assert.strictEqual(pts.widthPts, 8.5 * 72);
        assert.strictEqual(pts.heightPts, 11 * 72);
        const ptsMm = pdfPrivate.pageSizeToPts(210, 297, 'mm');
        assert.ok(ptsMm.widthPts > 0);
        assert.ok(ptsMm.heightPts > 0);
    });
});
//# sourceMappingURL=PDF.test.js.map