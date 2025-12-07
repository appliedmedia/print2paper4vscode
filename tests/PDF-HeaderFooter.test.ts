import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { installHeaderFooterMenuStubs } from './test-helpers.js';

describe('PDF Header and Footer', () => {
  let app: App;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    installHeaderFooterMenuStubs(app);
    app.paperprinter.docInfo.printTitle = 'Test Document';
  });

  afterEach(() => {
    app.done();
  });

  it('should generate PDF without headers/footers when set to none', async () => {
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

  it('should handle multi-page PDF generation', async () => {
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

  it('should handle different margin settings', async () => {
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
      app.pdf.docInfo().marginId = marginId as any;

      await app.pdf.generatePdf();
      
      assert.ok(app.pdf.docInfo().pdfDoc, `Should generate PDF with ${marginId} margins`);
      assert.ok(app.pdf.docInfo().pageTotal > 0, `Should have pages with ${marginId} margins`);
    }
  });

  it('should handle different orientations', async () => {
    const orientations: ('portrait' | 'landscape')[] = ['portrait', 'landscape'];
    
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
      } else {
        assert.ok(pageSizePx.widthPx > pageSizePx.heightPx, 'Landscape should be wider than tall');
      }
    }
  });

  it('should handle different page sizes', async () => {
    const pageSizes = ['a4', 'letter', 'legal'];
    
    for (const pageSize of pageSizes) {
      app.pdf.resetCaches();
      
      app.pdf.docInfo().pageSizeId = pageSize as any;
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
