import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { DocInfo_PDF } from '../src/DocInfo_PDF.js';
import { App } from '../src/App.js';
import jsPDF from 'jspdf';
import { mockContext, mockVSCode } from './test-utils.js';

describe('DocInfo_PDF', () => {
  let app: App;
  let docInfo: DocInfo_PDF;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
    docInfo = new DocInfo_PDF(app);
  });

  afterEach(() => {
    app.done();
  });

  it('should set page on PDF document', () => {
    const pdfDoc = new jsPDF();
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

  it('should handle setPage when PDF doc is null', () => {
    docInfo.pdfDoc = null;
    // Should not throw
    docInfo.setPage(1);
    assert.ok(true);
  });

  it('should get current page info', () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    docInfo.pdfDoc = pdfDoc;

    const info = docInfo.getCurrentPageInfo();
    assert.strictEqual(info.pageNumber, 1);
    assert.strictEqual(info.pageTotal, 1);
  });

  it('should return zero page info when PDF doc is null', () => {
    docInfo.pdfDoc = null;
    const info = docInfo.getCurrentPageInfo();
    assert.strictEqual(info.pageNumber, 0);
    assert.strictEqual(info.pageTotal, 0);
  });

  it('should get page size in pixels', () => {
    const pdfDoc = new jsPDF();
    docInfo.pdfDoc = pdfDoc;

    const pageSize = docInfo.pageSizePx;
    assert.ok(typeof pageSize.widthPx === 'number');
    assert.ok(typeof pageSize.heightPx === 'number');
    assert.ok(pageSize.widthPx > 0);
    assert.ok(pageSize.heightPx > 0);
  });

  it('should return zero page size when PDF doc is null', () => {
    docInfo.pdfDoc = null;
    const pageSize = docInfo.pageSizePx;
    assert.strictEqual(pageSize.widthPx, 0);
    assert.strictEqual(pageSize.heightPx, 0);
  });

  it('should get PDF as data URL', () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    docInfo.pdfDoc = pdfDoc;

    const dataUrl = docInfo.asDataUrl();
    assert.ok(typeof dataUrl === 'string');
    // jsPDF returns: data:application/pdf;filename=generated.pdf;base64,...
    assert.ok(dataUrl.startsWith('data:application/pdf'));
    assert.ok(dataUrl.includes('base64,'));
  });

  it('should return empty string when PDF doc is null', () => {
    docInfo.pdfDoc = null;
    const dataUrl = docInfo.asDataUrl();
    assert.strictEqual(dataUrl, '');
  });
});
