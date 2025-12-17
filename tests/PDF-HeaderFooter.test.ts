import {  describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { installHeaderFooterMenuStubs } from './test-helpers.js';

describe('PDF Header and Footer', () => {
  let app: TestApp;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
    installHeaderFooterMenuStubs(app);
    fn.paperprinter.docInfo().printTitle = 'Test Document';
  });

  afterEach(() => {
    app.done();
  });

  it('should generate PDF without headers/footers when set to none', async () => {
    fn.pdf.docInfo().pageSizeId = 'a4';
    fn.pdf.docInfo().orient = 'portrait';
    fn.pdf.docInfo().fontSizePx = 12;
    fn.pdf.docInfo().lineHeightPx = 18;
    fn.pdf.docInfo().fontFamily = 'Courier';
    fn.pdf.docInfo().theme = 'github-light';
    fn.pdf.docInfo().code = 'console.log("test");';
    fn.pdf.docInfo().languageId = 'javascript';

    await fn.pdf.generatePdf();
    
    assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF');
    assert.ok(fn.pdf.docInfo().pageTotal > 0, 'Should have pages');
  });

  it('should handle multi-page PDF generation', async () => {
    fn.pdf.docInfo().pageSizeId = 'a4';
    fn.pdf.docInfo().orient = 'portrait';
    fn.pdf.docInfo().fontSizePx = 12;
    fn.pdf.docInfo().lineHeightPx = 18;
    fn.pdf.docInfo().fontFamily = 'Courier';
    fn.pdf.docInfo().theme = 'github-light';
    
    // Generate long code to trigger multi-page
    const longCode = Array(100).fill('console.log("This is a test line");').join('\n');
    fn.pdf.docInfo().code = longCode;
    fn.pdf.docInfo().languageId = 'javascript';

    await fn.pdf.generatePdf();
    
    assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF');
    const pageCount = fn.pdf.docInfo().pageTotal;
    assert.ok(pageCount > 1, `Should have multiple pages, got ${pageCount}`);
  });

  it('should handle different margin settings', async () => {
    const marginIds = ['none', 'minimal', 'normal', 'wide'];
    
    for (const marginId of marginIds) {
      fn.pdf.resetCaches();
      
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'const x = 42;';
      fn.pdf.docInfo().languageId = 'javascript';
      fn.pdf.docInfo().marginId = marginId as any;

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, `Should generate PDF with ${marginId} margins`);
      assert.ok(fn.pdf.docInfo().pageTotal > 0, `Should have pages with ${marginId} margins`);
    }
  });

  it('should handle different orientations', async () => {
    const orientations: ('portrait' | 'landscape')[] = ['portrait', 'landscape'];
    
    for (const orient of orientations) {
      fn.pdf.resetCaches();
      
      fn.pdf.docInfo().pageSizeId = 'a4';
      fn.pdf.docInfo().orient = orient;
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'const x = 42;';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, `Should generate PDF in ${orient} orientation`);
      
      const pageSizePx = await fn.pdf.getPageSizePx();
      
      if (orient === 'portrait') {
        assert.ok(pageSizePx.heightPx > pageSizePx.widthPx, 'Portrait should be taller than wide');
      } else {
        assert.ok(pageSizePx.widthPx > pageSizePx.heightPx, 'Landscape should be wider than tall');
      }
    }
  });

  it('should handle different page sizes', async () => {
    const pageSizes = ['a4', 'letter', 'legal'];
    
    for (const pageSize of pageSizes) {
      fn.pdf.resetCaches();
      
      fn.pdf.docInfo().pageSizeId = pageSize as any;
      fn.pdf.docInfo().orient = 'portrait';
      fn.pdf.docInfo().fontSizePx = 12;
      fn.pdf.docInfo().lineHeightPx = 18;
      fn.pdf.docInfo().fontFamily = 'Courier';
      fn.pdf.docInfo().theme = 'github-light';
      fn.pdf.docInfo().code = 'const x = 42;';
      fn.pdf.docInfo().languageId = 'javascript';

      await fn.pdf.generatePdf();
      
      assert.ok(fn.pdf.docInfo().pdfDoc, `Should generate PDF with ${pageSize} size`);
      
      const pageSizePx = await fn.pdf.getPageSizePx();
      assert.ok(pageSizePx.widthPx > 0, `${pageSize} should have width`);
      assert.ok(pageSizePx.heightPx > 0, `${pageSize} should have height`);
    }
  });
});
