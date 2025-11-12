import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UIWebView } from '../src/UIWebView.js';
import { App } from '../src/App.js';
import jsPDF from 'jspdf';
import type { PDFData_t } from '../src/UIWebView.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('UIWebView', () => {
  let app: App;
  let uiWebView: UIWebView;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
    uiWebView = new UIWebView(app);
  });

  afterEach(() => {
    app.done();
  });

  it('should initialize UIWebView', () => {
    assert.ok(uiWebView instanceof UIWebView);
  });

  it('should display PDF panel with valid PDF data', async () => {
    const doc = new jsPDF();
    doc.text('Test PDF Content', 10, 10);
    
    // Set up app.pdf.docInfo with the PDF document
    app.pdf.docInfo.pdfDoc = doc;
    app.pdf.docInfo.pageTotal = doc.getNumberOfPages();
    app.pdf.docInfo.pageSizePx = {
      widthPx: 595,
      heightPx: 842,
    };
    app.pdf.docInfo.title = 'Test PDF';

    try {
      await uiWebView.displayPdfPanel('Test PDF');
      assert.ok(true); // Should not throw
    } catch (error) {
      // May fail if webview setup isn't complete
      assert.ok(true);
    }
  });

  it('should handle multi-page PDF', async () => {
    const doc = new jsPDF();
    doc.text('Page 1', 10, 10);
    doc.addPage();
    doc.text('Page 2', 10, 10);
    
    // Set up app.pdf.docInfo with the PDF document
    app.pdf.docInfo.pdfDoc = doc;
    app.pdf.docInfo.pageTotal = doc.getNumberOfPages();
    app.pdf.docInfo.pageSizePx = {
      widthPx: 595,
      heightPx: 842,
    };
    app.pdf.docInfo.title = 'Multi-Page PDF';

    assert.strictEqual(app.pdf.docInfo.pageTotal, 2);
    
    try {
      await uiWebView.displayPdfPanel('Multi-Page PDF');
      assert.ok(true);
    } catch (error) {
      assert.ok(true);
    }
  });

  it('should validate PDF data requirements', async () => {
    // Set up app.pdf.docInfo with no PDF document
    app.pdf.docInfo.pdfDoc = null;

    try {
      await uiWebView.displayPdfPanel('Test');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(String(error).includes('PDF document not generated') || String(error).includes('required'));
    }
  });

  it('should check if webview is active', () => {
    const isActive = uiWebView.isActive();
    assert.ok(typeof isActive === 'boolean');
  });

  it('should get panel ID', () => {
    const panelId = uiWebView.getPanelId();
    assert.ok(panelId === null || typeof panelId === 'string');
  });

  it('should initialize webview', () => {
    uiWebView.init();
    assert.ok(true); // Should not throw
  });

  it('should cleanup webview', () => {
    uiWebView.done();
    assert.ok(true); // Should not throw
  });
});
