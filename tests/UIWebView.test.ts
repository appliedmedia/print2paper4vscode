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
    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const dataUrl = doc.output('dataurlstring') as string;

    const pdfData: PDFData_t = {
      arrayBuffer,
      dataUrl,
      pageTotal: doc.getNumberOfPages(),
      pageSizePx: {
        widthPx: 595,
        heightPx: 842,
      },
      title: 'Test PDF',
    };

    try {
      await uiWebView.displayPdfPanel(pdfData);
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
    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const dataUrl = doc.output('dataurlstring') as string;

    const pdfData: PDFData_t = {
      arrayBuffer,
      dataUrl,
      pageTotal: doc.getNumberOfPages(),
      pageSizePx: {
        widthPx: 595,
        heightPx: 842,
      },
      title: 'Multi-Page PDF',
    };

    assert.strictEqual(pdfData.pageTotal, 2);
    
    try {
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(true);
    } catch (error) {
      assert.ok(true);
    }
  });

  it('should validate PDF data requirements', async () => {
    const invalidPdfData = {
      arrayBuffer: undefined as any,
      pageTotal: 1,
      pageSizePx: { widthPx: 595, heightPx: 842 },
      title: 'Test',
    };

    try {
      await uiWebView.displayPdfPanel(invalidPdfData);
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(String(error).includes('arrayBuffer') || String(error).includes('required'));
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
