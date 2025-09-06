import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';

describe('Simple PDF Test', () => {
  let pdf: PDF;
  let mockApp: any;

  beforeEach(() => {
    // Simple mock app
    mockApp = {
      dx: {
        create: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
        }),
      },
      os: {
        getTempDirectory: () => '/tmp',
        fileWrite: (path: string, content: Buffer) => {
          console.log(`Mock: Writing ${content.length} bytes to ${path}`);
        },
        fileOpenPrintDialog: (path: string) => Promise.resolve(),
        filePrint: (path: string) => Promise.resolve(),
      },
      ui: {
        chooseSaveLocation: (filename: string) => Promise.resolve('/tmp/test-output.pdf'),
      },
    };

    pdf = new PDF(mockApp);
  });

  it('should create PDF instance', () => {
    assert.ok(pdf, 'PDF instance should be created');
    assert.strictEqual(typeof pdf.generatePdfFromTokens, 'function', 'Should have generatePdfFromTokens method');
    assert.strictEqual(typeof pdf.pdfToHTML, 'function', 'Should have pdfToHTML method');
    assert.strictEqual(typeof pdf.saveAsPDF, 'function', 'Should have saveAsPDF method');
    assert.strictEqual(typeof pdf.printWithPreview, 'function', 'Should have printWithPreview method');
    assert.strictEqual(typeof pdf.printDirectly, 'function', 'Should have printDirectly method');
  });

  it('should generate PDF from simple tokens', async () => {
    const mockTokens = [
      [
        { content: 'function', color: '#0000ff', fontStyle: 1 },
        { content: ' ', color: '#000000', fontStyle: 0 },
        { content: 'test', color: '#000000', fontStyle: 0 },
        { content: '()', color: '#000000', fontStyle: 0 },
      ],
    ];

    const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test Code', 14, 20, 'Arial');

    assert.ok(pdfDoc, 'PDF document should be created');
    assert.strictEqual(typeof pdfDoc.getNumberOfPages, 'function', 'Should have getNumberOfPages method');
    assert.ok(pdfDoc.getNumberOfPages() > 0, 'Should have at least one page');
  });

  it('should convert PDF to HTML', async () => {
    const mockTokens = [
      [{ content: 'test', color: '#000000', fontStyle: 0 }],
    ];
    
    const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
    const html = pdf.pdfToHTML(pdfDoc, 'Test Document');

    assert.ok(html.includes('<canvas'), 'HTML should contain canvas element');
    assert.ok(html.includes('PDF.js'), 'HTML should include PDF.js');
    assert.ok(html.includes('Test Document'), 'HTML should contain the title');
  });

  it('should save PDF to file', async () => {
    const mockTokens = [
      [{ content: 'test', color: '#000000', fontStyle: 0 }],
    ];
    
    const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
    const result = await pdf.saveAsPDF(pdfDoc, 'Test Document');
    
    assert.strictEqual(result, '/tmp/test-output.pdf', 'Should return the saved path');
  });

  it('should handle print operations', async () => {
    const mockTokens = [
      [{ content: 'test', color: '#000000', fontStyle: 0 }],
    ];
    
    const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
    
    // These should not throw errors
    await pdf.printWithPreview(pdfDoc, 'Test Document');
    await pdf.printDirectly(pdfDoc, 'Test Document');
    
    assert.ok(true, 'Print operations should complete without errors');
  });
});