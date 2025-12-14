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
const DocInfo_PDF_js_1 = require("../src/DocInfo_PDF.js");
const App_js_1 = require("../src/App.js");
const jspdf_1 = __importDefault(require("jspdf"));
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('DocInfo_PDF', () => {
    let app;
    let docInfo;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        docInfo = DocInfo_PDF_js_1.DocInfo_PDF.create({ reg: app.reg });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should set page on PDF document', () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Page 1', 10, 10);
        pdfDoc.addPage();
        pdfDoc.text('Page 2', 10, 10);
        docInfo.pdfDoc = pdfDoc;
        docInfo.setPage(1);
        const info = docInfo.getCurrentPageInfo();
        assert.strictEqual(info.pageNumber, 1);
        assert.strictEqual(info.pageTotal, 2);
        docInfo.setPage(2);
        const info2 = docInfo.getCurrentPageInfo();
        assert.strictEqual(info2.pageNumber, 2);
    });
    (0, node_test_1.it)('should handle setPage when PDF doc is null', () => {
        docInfo.pdfDoc = null;
        // Should not throw
        docInfo.setPage(1);
        assert.ok(true);
    });
    (0, node_test_1.it)('should get current page info', () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Test', 10, 10);
        docInfo.pdfDoc = pdfDoc;
        const info = docInfo.getCurrentPageInfo();
        assert.strictEqual(info.pageNumber, 1);
        assert.strictEqual(info.pageTotal, 1);
    });
    (0, node_test_1.it)('should return zero page info when PDF doc is null', () => {
        docInfo.pdfDoc = null;
        const info = docInfo.getCurrentPageInfo();
        assert.strictEqual(info.pageNumber, 0);
        assert.strictEqual(info.pageTotal, 0);
    });
    (0, node_test_1.it)('should get page size in pixels', () => {
        const pdfDoc = new jspdf_1.default();
        docInfo.pdfDoc = pdfDoc;
        const pageSize = docInfo.pageSizePx;
        assert.ok(typeof pageSize.widthPx === 'number');
        assert.ok(typeof pageSize.heightPx === 'number');
        assert.ok(pageSize.widthPx > 0);
        assert.ok(pageSize.heightPx > 0);
    });
    (0, node_test_1.it)('should return zero page size when PDF doc is null', () => {
        docInfo.pdfDoc = null;
        const pageSize = docInfo.pageSizePx;
        assert.strictEqual(pageSize.widthPx, 0);
        assert.strictEqual(pageSize.heightPx, 0);
    });
    (0, node_test_1.it)('should get PDF as data URL', () => {
        const pdfDoc = new jspdf_1.default();
        pdfDoc.text('Test', 10, 10);
        docInfo.pdfDoc = pdfDoc;
        const dataUrl = docInfo.asDataUrl();
        assert.ok(typeof dataUrl === 'string');
        // jsPDF returns: data:application/pdf;filename=generated.pdf;base64,...
        assert.ok(dataUrl.startsWith('data:application/pdf'));
        assert.ok(dataUrl.includes('base64,'));
    });
    (0, node_test_1.it)('should return empty string when PDF doc is null', () => {
        docInfo.pdfDoc = null;
        const dataUrl = docInfo.asDataUrl();
        assert.strictEqual(dataUrl, '');
    });
});
//# sourceMappingURL=DocInfo_PDF.test.js.map