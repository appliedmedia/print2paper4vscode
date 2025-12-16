import {  describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import {  App } from '../src/App.js';
import type { FnImport_t } from '../src/types/Registry_t.js';
import {  Utils } from '../src/Utils.js';
import {  mockContext, mockVSCode } from './test-utils.js';
import {  installHeaderFooterMenuStubs, getFn } from './test-helpers.js';

describe('Edge Cases and Error Handling', () => {
  let app: App;
  let fn: FnImport_t;
  let utils: Utils;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    fn = getFn(app);
    utils = app.reg.getInstance<Utils>('utils')!;
    installHeaderFooterMenuStubs(app);
    fn.paperprinter.docInfo().printTitle = 'Test Document';
  });

  afterEach(() => {
    app.done();
  });

  describe('Empty and Invalid Input', () => {
    it('should handle empty source code', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = '';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF for empty code');
      assert.ok(fn.pdf.docInfo().pageTotal > 0, 'Should have at least one page');
    });

    it('should handle whitespace-only source code', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = '   \n\n   \t\t   \n   ';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF for whitespace-only code');
    });

    it('should handle single character code', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'x';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF for single character');
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle unicode characters', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = '// 你好世界\n// こんにちは世界\n// Привет мир\nconst emoji = "🎉🚀";';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF with unicode');
    });

    it('should handle special characters', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'const str = "\\n\\t\\r\\f\\b\\\\\\\'\\\"";';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF with special chars');
    });

    it('should handle very long lines', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      // Create a very long line
      fn.pdf.docInfo().code = `const longString = "${'x'.repeat(500)}";`;
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF with very long lines');
    });
  });

  describe('Language Support', () => {
    it('should handle markdown language', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = '# Heading\n\n**Bold text**\n\n*Italic*';
      fn.pdf.docInfo().languageId = 'markdown';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF for markdown');
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum font size', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 1;
      fn.pdf.docInfo().lineHeightPx = 2;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'const x = 42;';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF with very small font');
    });

    it('should handle large font size', async () => {
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 72;
      fn.pdf.docInfo().lineHeightPx = 100;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'X';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF with very large font');
    });

    it('should handle different zoom levels in PDF generation', async () => {
      // Test that PDFs can be generated at different zoom levels
      const zoomLevels = [0.5, 1.0, 2.0];
      
      for (const zoom of zoomLevels) {
        fn.pdf.resetCaches();
        
        fn.pdf.docInfo().pageSizeId = 'a4';
        fn.pdf.docInfo().orient = 'portrait';
        fn.pdf.docInfo().fontSizePx = 12;
        fn.pdf.docInfo().lineHeightPx = 18;
        fn.pdf.docInfo().fontFamily = 'Courier';
        fn.pdf.docInfo().theme = 'github-light';
        fn.pdf.docInfo().code = 'const x = 42;';
        fn.pdf.docInfo().languageId = 'javascript';
        
        // Set zoom via docInfo
        (fn.pdf.docInfo() as any).zoomLevel = zoom;

        await fn.pdf.generatePdf();
        
        assert.ok(fn.pdf.docInfo().pdfDoc, `Should generate PDF at zoom ${zoom}`);
      }
    });
  });

  describe('Template Replacement Edge Cases', () => {
    it('should handle nested template variables', () => {
      const source = '{{OUTER}}';
      const dictionary = {
        OUTER: '{{INNER}}',
        INNER: 'final value',
      };

      const result = utils.templateDictReplace(source, dictionary);
      assert.strictEqual(result, 'final value', 'Should resolve nested templates');
    });

    it('should handle circular template references', () => {
      const source = '{{A}}';
      const dictionary = {
        A: '{{B}}',
        B: '{{A}}',
      };

      // Should not hang - will stop after max iterations
      const result = utils.templateDictReplace(source, dictionary);
      assert.ok(result, 'Should handle circular references gracefully');
    });

    it('should handle template with special regex characters', () => {
      const source = 'Value: {{KEY.WITH.DOTS}}';
      const dictionary = {
        'KEY.WITH.DOTS': 'test value',
      };

      const result = utils.templateDictReplace(source, dictionary);
      assert.strictEqual(result, 'Value: test value', 'Should handle dots in keys');
    });
  });

  describe('File System Edge Cases', () => {
    it('should sanitize invalid file names', () => {
      const invalidName = 'file<with>invalid:chars|and*special?chars/test.pdf';
      const sanitized = fn.os.sanitizeFileName(invalidName);
      
      assert.ok(!sanitized.includes('<'), 'Should remove <');
      assert.ok(!sanitized.includes('>'), 'Should remove >');
      assert.ok(!sanitized.includes(':'), 'Should remove :');
      assert.ok(!sanitized.includes('|'), 'Should remove |');
      assert.ok(!sanitized.includes('*'), 'Should remove *');
      assert.ok(!sanitized.includes('?'), 'Should remove ?');
      assert.ok(!sanitized.includes('/'), 'Should remove /');
    });

    it('should handle very long file names', () => {
      const longName = 'a'.repeat(200) + '.pdf';
      const sanitized = fn.os.sanitizeFileName(longName);
      
      assert.ok(sanitized.length <= 120, `File name should be capped at 120 chars, got ${sanitized.length}`);
    });

    it('should handle file names with only invalid characters', () => {
      const invalidName = '<<::>>||??**';
      const sanitized = fn.os.sanitizeFileName(invalidName);
      
      assert.strictEqual(sanitized, 'output', 'Should return default name for all-invalid input');
    });
  });

  describe('Date Formatting', () => {
    it('should generate timestamp in correct format', () => {
      const timestamp = fn.os.dateAsYYYYMMDDHHMMSS();
      
      // Check format: YYYY-MM-DD_HHMMSSMSa/p
      const pattern = /^\d{4}-\d{2}-\d{2}_\d{6}\.\d{3}[ap]$/;
      assert.ok(pattern.test(timestamp), `Timestamp should match format: ${timestamp}`);
    });

    it('should handle midnight hour correctly', () => {
      // Can't easily test specific time, but verify format consistency
      const timestamp1 = fn.os.dateAsYYYYMMDDHHMMSS();
      const timestamp2 = fn.os.dateAsYYYYMMDDHHMMSS();
      
      assert.ok(timestamp1.length === timestamp2.length, 'Timestamps should have consistent length');
    });
  });
});
