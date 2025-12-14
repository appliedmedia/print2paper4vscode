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
(0, node_test_1.describe)('Edge Cases and Error Handling', () => {
    let app;
    let utils;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        utils = app.reg.getInstance('utils');
        (0, test_helpers_js_1.installHeaderFooterMenuStubs)(app);
        app.paperprinter.docInfo().printTitle = 'Test Document';
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.describe)('Empty and Invalid Input', () => {
        (0, node_test_1.it)('should handle empty source code', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = '';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF for empty code');
            assert.ok(app.pdf.docInfo().pageTotal > 0, 'Should have at least one page');
        });
        (0, node_test_1.it)('should handle whitespace-only source code', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = '   \n\n   \t\t   \n   ';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF for whitespace-only code');
        });
        (0, node_test_1.it)('should handle single character code', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'x';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF for single character');
        });
    });
    (0, node_test_1.describe)('Special Characters and Unicode', () => {
        (0, node_test_1.it)('should handle unicode characters', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = '// 你好世界\n// こんにちは世界\n// Привет мир\nconst emoji = "🎉🚀";';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF with unicode');
        });
        (0, node_test_1.it)('should handle special characters', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'const str = "\\n\\t\\r\\f\\b\\\\\\\'\\\"";';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF with special chars');
        });
        (0, node_test_1.it)('should handle very long lines', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            // Create a very long line
            app.pdf.docInfo().code = `const longString = "${'x'.repeat(500)}";`;
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF with very long lines');
        });
    });
    (0, node_test_1.describe)('Language Support', () => {
        (0, node_test_1.it)('should handle markdown language', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 12;
            app.pdf.docInfo().lineHeightPx = 18;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = '# Heading\n\n**Bold text**\n\n*Italic*';
            app.pdf.docInfo().languageId = 'markdown';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF for markdown');
        });
    });
    (0, node_test_1.describe)('Boundary Conditions', () => {
        (0, node_test_1.it)('should handle minimum font size', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 1;
            app.pdf.docInfo().lineHeightPx = 2;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'const x = 42;';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF with very small font');
        });
        (0, node_test_1.it)('should handle large font size', async () => {
            app.pdf.docInfo().pageSizeId = 'a4';
            app.pdf.docInfo().orient = 'portrait';
            app.pdf.docInfo().fontSizePx = 72;
            app.pdf.docInfo().lineHeightPx = 100;
            app.pdf.docInfo().fontFamily = 'Courier';
            app.pdf.docInfo().theme = 'github-light';
            app.pdf.docInfo().code = 'X';
            app.pdf.docInfo().languageId = 'javascript';
            await app.pdf.generatePdf();
            assert.ok(app.pdf.docInfo().pdfDoc, 'Should generate PDF with very large font');
        });
        (0, node_test_1.it)('should handle different zoom levels in PDF generation', async () => {
            // Test that PDFs can be generated at different zoom levels
            const zoomLevels = [0.5, 1.0, 2.0];
            for (const zoom of zoomLevels) {
                app.pdf.resetCaches();
                app.pdf.docInfo().pageSizeId = 'a4';
                app.pdf.docInfo().orient = 'portrait';
                app.pdf.docInfo().fontSizePx = 12;
                app.pdf.docInfo().lineHeightPx = 18;
                app.pdf.docInfo().fontFamily = 'Courier';
                app.pdf.docInfo().theme = 'github-light';
                app.pdf.docInfo().code = 'const x = 42;';
                app.pdf.docInfo().languageId = 'javascript';
                // Set zoom via docInfo
                app.pdf.docInfo().zoomLevel = zoom;
                await app.pdf.generatePdf();
                assert.ok(app.pdf.docInfo().pdfDoc, `Should generate PDF at zoom ${zoom}`);
            }
        });
    });
    (0, node_test_1.describe)('Template Replacement Edge Cases', () => {
        (0, node_test_1.it)('should handle nested template variables', () => {
            const source = '{{OUTER}}';
            const dictionary = {
                OUTER: '{{INNER}}',
                INNER: 'final value',
            };
            const result = utils.templateDictReplace(source, dictionary);
            assert.strictEqual(result, 'final value', 'Should resolve nested templates');
        });
        (0, node_test_1.it)('should handle circular template references', () => {
            const source = '{{A}}';
            const dictionary = {
                A: '{{B}}',
                B: '{{A}}',
            };
            // Should not hang - will stop after max iterations
            const result = utils.templateDictReplace(source, dictionary);
            assert.ok(result, 'Should handle circular references gracefully');
        });
        (0, node_test_1.it)('should handle template with special regex characters', () => {
            const source = 'Value: {{KEY.WITH.DOTS}}';
            const dictionary = {
                'KEY.WITH.DOTS': 'test value',
            };
            const result = utils.templateDictReplace(source, dictionary);
            assert.strictEqual(result, 'Value: test value', 'Should handle dots in keys');
        });
    });
    (0, node_test_1.describe)('File System Edge Cases', () => {
        (0, node_test_1.it)('should sanitize invalid file names', () => {
            const invalidName = 'file<with>invalid:chars|and*special?chars/test.pdf';
            const sanitized = app.os.sanitizeFileName(invalidName);
            assert.ok(!sanitized.includes('<'), 'Should remove <');
            assert.ok(!sanitized.includes('>'), 'Should remove >');
            assert.ok(!sanitized.includes(':'), 'Should remove :');
            assert.ok(!sanitized.includes('|'), 'Should remove |');
            assert.ok(!sanitized.includes('*'), 'Should remove *');
            assert.ok(!sanitized.includes('?'), 'Should remove ?');
            assert.ok(!sanitized.includes('/'), 'Should remove /');
        });
        (0, node_test_1.it)('should handle very long file names', () => {
            const longName = 'a'.repeat(200) + '.pdf';
            const sanitized = app.os.sanitizeFileName(longName);
            assert.ok(sanitized.length <= 120, `File name should be capped at 120 chars, got ${sanitized.length}`);
        });
        (0, node_test_1.it)('should handle file names with only invalid characters', () => {
            const invalidName = '<<::>>||??**';
            const sanitized = app.os.sanitizeFileName(invalidName);
            assert.strictEqual(sanitized, 'output', 'Should return default name for all-invalid input');
        });
    });
    (0, node_test_1.describe)('Date Formatting', () => {
        (0, node_test_1.it)('should generate timestamp in correct format', () => {
            const timestamp = app.os.dateAsYYYYMMDDHHMMSS();
            // Check format: YYYY-MM-DD_HHMMSSMSa/p
            const pattern = /^\d{4}-\d{2}-\d{2}_\d{6}\.\d{3}[ap]$/;
            assert.ok(pattern.test(timestamp), `Timestamp should match format: ${timestamp}`);
        });
        (0, node_test_1.it)('should handle midnight hour correctly', () => {
            // Can't easily test specific time, but verify format consistency
            const timestamp1 = app.os.dateAsYYYYMMDDHHMMSS();
            const timestamp2 = app.os.dateAsYYYYMMDDHHMMSS();
            assert.ok(timestamp1.length === timestamp2.length, 'Timestamps should have consistent length');
        });
    });
});
//# sourceMappingURL=EdgeCases.test.js.map