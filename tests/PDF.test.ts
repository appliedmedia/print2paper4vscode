import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';
import { DocInfo_PDF } from '../src/DocInfo_PDF.js';
import { App } from '../src/App.js';
import jsPDF from 'jspdf';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
const mockContext = {
  subscriptions: [],
  globalState: {
    get: () => undefined,
    update: () => {},
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
    showSaveDialog: async () => undefined,
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as any;

describe('PDF', () => {
  let app: App;
  let pdf: PDF;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
    pdf = new PDF(app);
    pdf.init();
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
    pdf.docInfo.pdfDoc = pdfDoc;

    // Mock fileOpenPrintDialog to avoid actual OS calls
    const originalOpenPrintDialog = app.os.fileOpenPrintDialog;
    app.os.fileOpenPrintDialog = async () => {};

    await pdf.printWithPreview(pdf.docInfo, 'test');
    // If we get here without throwing, it worked
    assert.ok(true);
    
    app.os.fileOpenPrintDialog = originalOpenPrintDialog;
  });

  it('should print directly', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    pdf.docInfo.pdfDoc = pdfDoc;

    // Mock filePrint to avoid actual OS calls
    const originalFilePrint = app.os.filePrint;
    app.os.filePrint = async () => {};

    await pdf.printDirectly(pdf.docInfo, 'test');
    // If we get here without throwing, it worked
    assert.ok(true);
    
    app.os.filePrint = originalFilePrint;
  });

  it('should save as PDF', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test', 10, 10);
    pdf.docInfo.pdfDoc = pdfDoc;

    // Mock chooseSaveLocation to return null (user cancelled)
    const originalChooseSaveLocation = app.ui.chooseSaveLocation;
    app.ui.chooseSaveLocation = async () => null;

    await pdf.saveAsPDF(pdf.docInfo, 'test');
    // Should handle cancellation gracefully without throwing
    
    app.ui.chooseSaveLocation = originalChooseSaveLocation;
  });

  it('should handle done cleanup', () => {
    pdf.done();
    assert.ok(true); // Should not throw
  });

  it('should get total page count', async () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text('Page 1', 10, 10);
    pdf.docInfo.pdfDoc = pdfDoc;

    const pageCount = await pdf.getPageTotal();
    assert.strictEqual(pageCount, 1);
  });

  it('should reset caches', () => {
    pdf.resetCaches();
    assert.ok(true); // Should not throw
  });

  it('should have docInfo property', () => {
    assert.ok(pdf.docInfo);
    assert.ok(pdf.docInfo instanceof DocInfo_PDF);
  });

  it('should get page size in pixels', async () => {
    const pdfDoc = new jsPDF();
    pdf.docInfo.pdfDoc = pdfDoc;

    const pageSize = await pdf.getPageSizePx();
    assert.ok(typeof pageSize.widthPx === 'number');
    assert.ok(typeof pageSize.heightPx === 'number');
    assert.ok(pageSize.widthPx > 0);
    assert.ok(pageSize.heightPx > 0);
  });

  it('should render content for a page', async () => {
    // Set up basic PDF document
    const pdfDoc = new jsPDF();
    pdfDoc.text('Test content', 10, 10);
    pdf.docInfo.pdfDoc = pdfDoc;
    pdf.docInfo.pageWidthPts = 595;
    pdf.docInfo.pageHeightPts = 842;

    // Set up tokens
    pdf.docInfo.currentTokens = [
      [{ content: 'test', color: '#000000', offset: 0 }],
    ];
    pdf.docInfo.theme = 'github-light';

    const pageData = await pdf.renderContent(0, 0, 0);
    assert.ok(pageData);
    assert.ok(typeof pageData.dataUrl === 'string');
    assert.ok(pageData.dataUrl.startsWith('data:application/pdf'));
  });

  it('should setup PDF document', () => {
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';

    pdf.setupPdf();
    assert.ok(pdf.docInfo.pdfDoc !== null);
  });

  it('should render tokenized line', () => {
    // Setup PDF first
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';

    pdf.setupPdf();
    const tokens = [
      { content: 'const', color: '#0000ff', offset: 0 },
      { content: ' x', color: '#000000', offset: 5 },
      { content: ' =', color: '#000000', offset: 7 },
      { content: ' 42', color: '#008000', offset: 9 },
    ];
    pdf.renderTokenizedLine(0, tokens);
    // Should not throw
    assert.ok(true);
  });

  it('should convert hex color to RGB', () => {
    const pdfPrivate = pdf as any;
    const rgb = pdfPrivate.hexToRgb('#FF0000');
    assert.strictEqual(rgb.r, 255);
    assert.strictEqual(rgb.g, 0);
    assert.strictEqual(rgb.b, 0);

    const rgb2 = pdfPrivate.hexToRgb('#00FF00');
    assert.strictEqual(rgb2.r, 0);
    assert.strictEqual(rgb2.g, 255);
    assert.strictEqual(rgb2.b, 0);

    const rgb3 = pdfPrivate.hexToRgb('#0000FF');
    assert.strictEqual(rgb3.r, 0);
    assert.strictEqual(rgb3.g, 0);
    assert.strictEqual(rgb3.b, 255);
  });

  it('should handle invalid hex color', () => {
    const pdfPrivate = pdf as any;
    const rgb = pdfPrivate.hexToRgb('invalid');
    assert.strictEqual(rgb.r, 0);
    assert.strictEqual(rgb.g, 0);
    assert.strictEqual(rgb.b, 0);
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
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    const font = pdfPrivate.mapFontFamilyToJsPDF('Courier', pdf.docInfo.pdfDoc);
    assert.ok(typeof font === 'string');
    assert.ok(font.length > 0);
  });

  it('should set text color from web color (hex)', () => {
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    // Should not throw
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, '#FF0000');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, '#00FF00');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, '#0000FF');
    assert.ok(true);
  });

  it('should set text color from web color (named colors)', () => {
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, 'red');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, 'black');
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, 'blue');
    assert.ok(true);
  });

  it('should handle 3-digit hex colors', () => {
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, '#F00'); // 3-digit hex
    assert.ok(true);
  });

  it('should handle hex colors with alpha channel', () => {
    pdf.docInfo.pageSizeId = 'a4';
    pdf.docInfo.orient = 'portrait';
    pdf.docInfo.fontSizePx = 12;
    pdf.docInfo.lineHeightPx = 18;
    pdf.docInfo.fontFamily = 'Courier';
    pdf.docInfo.theme = 'github-light';
    pdf.setupPdf();

    const pdfPrivate = pdf as any;
    pdfPrivate.setTextColorFromWebColor(pdf.docInfo.pdfDoc, '#FF00005C'); // With alpha
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
