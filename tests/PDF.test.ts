import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';
import { DocInfo_PDF } from '../src/DocInfo_PDF.js';
import { createTestApp, TestApp } from './test-utils.js';
import jsPDF from 'jspdf';
import { mockContext, mockVSCode } from './test-utils.js';
import { installHeaderFooterMenuStubs, getFn } from './test-helpers.js';

describe('PDF', () => {
  let app: TestApp;
  let pdf: PDF;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
    installHeaderFooterMenuStubs(app);
    fn = getFn(app);

    pdf = new PDF({ reg: app.reg });
    
    // Set up paperprinter docInfo for tests
    fn.paperprinter.docInfo().printTitle = 'Test Document';
  });

  afterEach(() => {
    pdf.done();
    app.done();
  });

  it('should initialize PDF document', () => {
    assert.ok(pdf instanceof PDF);
  });

  it('should print with preview', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    pdf.docInfo().pdfDoc = pdfDoc;

    // Mock fileOpenPrintDialog to avoid actual OS calls
    const originalOpenPrintDialog = app.os.fileOpenPrintDialog;
    app.os.fileOpenPrintDialog = async () => {};

    await pdf.printWithPreview('test');
    // If we get here without throwing, it worked
    assert.ok(true);
    
    app.os.fileOpenPrintDialog = originalOpenPrintDialog;
  });

  it('should print directly', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    pdf.docInfo().pdfDoc = pdfDoc;

    // Mock filePrint to avoid actual OS calls
    const originalFilePrint = app.os.filePrint;
    app.os.filePrint = async () => {};

    await pdf.printDirectly('test');
    // If we get here without throwing, it worked
    assert.ok(true);
    
    app.os.filePrint = originalFilePrint;
  });

  it('should save as PDF', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    pdf.docInfo().pdfDoc = pdfDoc;

    // Mock chooseSaveLocation to return null (user cancelled)
    const originalChooseSaveLocation = app.ui.chooseSaveLocation;
    app.ui.chooseSaveLocation = async () => null;

    await pdf.saveAsPDF('test');
    // Should handle cancellation gracefully without throwing
    
    app.ui.chooseSaveLocation = originalChooseSaveLocation;
  });

  it('should handle done cleanup', () => {
    // Note: pdf.done() is called in afterEach, so we don't call it here
    // Just verify the method exists and is callable
    assert.ok(typeof pdf.done === 'function');
  });

  it('should get total page count', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Page 1', 10, 10);
    pdf.docInfo().pdfDoc = pdfDoc;

    const pageCount = await pdf.getPageTotal();
    assert.strictEqual(pageCount, 1);
  });

  it('should reset caches', () => {
    pdf.resetCaches();
    assert.ok(true); // Should not throw
  });

  it('should have docInfo property', () => {
    assert.ok(pdf.docInfo());
    assert.ok(pdf.docInfo() instanceof DocInfo_PDF);
  });

  it('should get page size in pixels', async () => {
    const pdfDoc = new jsPDF();
    pdf.docInfo().pdfDoc = pdfDoc;

    const pageSize = await pdf.getPageSizePx();
    assert.ok(typeof pageSize.widthPx === 'number');
    assert.ok(typeof pageSize.heightPx === 'number');
    assert.ok(pageSize.widthPx > 0);
    assert.ok(pageSize.heightPx > 0);
  });

  it('should generate complete PDF document', async () => {
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

  it('should setup PDF document', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';

    pdf.setupPdf();
    assert.ok(pdf.docInfo().pdfDoc !== null);
  });

  it('should render tokenized line', () => {
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

  it('should handle invalid hex color', () => {
    // Setup PDF first
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    // Should handle invalid color gracefully without throwing
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'invalid');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'not-a-color');
    assert.ok(true);
  });

  it('should get page dimensions', () => {
    const pdfPrivate = pdf as any;
    const dims = pdfPrivate.getPageDimensions('a4', 'portrait');
    assert.ok(dims.width > 0);
    assert.ok(dims.height > 0);

    const dimsLandscape = pdfPrivate.getPageDimensions('a4', 'landscape');
    assert.strictEqual(dimsLandscape.width, dims.height);
    assert.strictEqual(dimsLandscape.height, dims.width);
  });

  it('should get unit for page size', () => {
    const pdfPrivate = pdf as any;
    const unit = pdfPrivate.getUnitForPageSize('a4');
    assert.ok(['mm', 'in'].includes(unit));
  });

  it('should map font family to jsPDF font', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    const font = pdfPrivate.mapFontFamilyToJsPDF('Courier', pdf.docInfo().pdfDoc);
    assert.ok(typeof font === 'string');
    assert.ok(font.length > 0);
  });

  it('should set text color from web color (hex)', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    // Should not throw
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#FF0000');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#00FF00');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#0000FF');
    assert.ok(true);
  });

  it('should set text color from web color (named colors)', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'red');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'black');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, 'blue');
    assert.ok(true);
  });

  it('should handle 3-digit hex colors', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#F00'); // 3-digit hex
    assert.ok(true);
  });

  it('should handle hex colors with alpha channel', () => {
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo().pdfDoc, '#FF00005C'); // With alpha
    assert.ok(true);
  });

  it('should convert page size to points', () => {
    const pdfPrivate = pdf as any;
    const pts = pdfPrivate.pageSizeToPts(8.5, 11, 'in');
    assert.strictEqual(pts.widthPts, 8.5 * 72);
    assert.strictEqual(pts.heightPts, 11 * 72);

    const ptsMm = pdfPrivate.pageSizeToPts(210, 297, 'mm');
    assert.ok(ptsMm.widthPts > 0);
    assert.ok(ptsMm.heightPts > 0);
  });
});
