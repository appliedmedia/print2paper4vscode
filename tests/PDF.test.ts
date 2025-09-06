import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';
import type { IThemedToken } from 'shiki';

describe('PDF Generation and Display', () => {
  let pdf: PDF;
  let mockApp: any;

  before(() => {
    // Mock app for testing
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

  describe('generatePdfFromTokens', () => {
    it('should generate PDF from Shiki tokens', async () => {
      const mockTokens: IThemedToken[][] = [
        [
          { content: 'function', color: '#0000ff', fontStyle: 1 },
          { content: ' ', color: '#000000', fontStyle: 0 },
          { content: 'test', color: '#000000', fontStyle: 0 },
          { content: '()', color: '#000000', fontStyle: 0 },
        ],
        [
          { content: '  ', color: '#000000', fontStyle: 0 },
          { content: 'return', color: '#0000ff', fontStyle: 1 },
          { content: ' ', color: '#000000', fontStyle: 0 },
          { content: '"hello"', color: '#008000', fontStyle: 0 },
        ],
      ];

      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test Code', 14, 20, 'Arial');

      assert.ok(pdfDoc, 'PDF document should be created');
      assert.strictEqual(typeof pdfDoc.getNumberOfPages(), 'number', 'Should have page count');
      assert.ok(pdfDoc.getNumberOfPages() > 0, 'Should have at least one page');
    });

    it('should handle empty token array', async () => {
      const pdfDoc = await pdf.generatePdfFromTokens([], 'Empty', 14, 20, 'Arial');
      
      assert.ok(pdfDoc, 'PDF document should be created even for empty content');
      assert.strictEqual(pdfDoc.getNumberOfPages(), 1, 'Should have one page for empty content');
    });

    it('should handle tokens with missing color information', async () => {
      const mockTokens: IThemedToken[][] = [
        [
          { content: 'test', color: undefined, fontStyle: 0 },
          { content: ' ', color: undefined, fontStyle: 0 },
          { content: 'code', color: undefined, fontStyle: 0 },
        ],
      ];

      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'No Colors', 14, 20, 'Arial');
      
      assert.ok(pdfDoc, 'PDF document should be created even without colors');
    });
  });

  describe('pdfToHTML', () => {
    it('should convert PDF to HTML with canvas', async () => {
      const mockTokens: IThemedToken[][] = [
        [{ content: 'test', color: '#000000', fontStyle: 0 }],
      ];
      
      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
      const html = pdf.pdfToHTML(pdfDoc, 'Test Document');

      assert.ok(html.includes('<canvas'), 'HTML should contain canvas element');
      assert.ok(html.includes('PDF.js'), 'HTML should include PDF.js');
      assert.ok(html.includes('data:application/pdf'), 'HTML should contain PDF data URL');
      assert.ok(html.includes('Test Document'), 'HTML should contain the title');
    });
  });

  describe('saveAsPDF', () => {
    it('should save PDF to chosen location', async () => {
      const mockTokens: IThemedToken[][] = [
        [{ content: 'test', color: '#000000', fontStyle: 0 }],
      ];
      
      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
      
      // Mock the UI to return a specific path
      mockApp.ui.chooseSaveLocation = (filename: string) => {
        assert.ok(filename.includes('Print2Paper'), 'Should use proper filename format');
        return Promise.resolve('/tmp/saved-test.pdf');
      };

      const result = await pdf.saveAsPDF(pdfDoc, 'Test Document');
      
      assert.strictEqual(result, '/tmp/saved-test.pdf', 'Should return the saved path');
    });

    it('should handle save cancellation', async () => {
      const mockTokens: IThemedToken[][] = [
        [{ content: 'test', color: '#000000', fontStyle: 0 }],
      ];
      
      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
      
      // Mock the UI to return null (cancelled)
      mockApp.ui.chooseSaveLocation = () => Promise.resolve(null);

      const result = await pdf.saveAsPDF(pdfDoc, 'Test Document');
      
      assert.strictEqual(result, null, 'Should return null when save is cancelled');
    });
  });

  describe('printWithPreview', () => {
    it('should create temp file and open print dialog', async () => {
      const mockTokens: IThemedToken[][] = [
        [{ content: 'test', color: '#000000', fontStyle: 0 }],
      ];
      
      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
      
      let tempFileCreated = false;
      mockApp.os.fileWrite = (path: string, content: Buffer) => {
        tempFileCreated = true;
        assert.ok(path.includes('.pdf'), 'Should create PDF file');
        assert.ok(content.length > 0, 'Should write PDF content');
      };

      await pdf.printWithPreview(pdfDoc, 'Test Document');
      
      assert.ok(tempFileCreated, 'Should create temporary PDF file');
    });
  });

  describe('printDirectly', () => {
    it('should create temp file and print directly', async () => {
      const mockTokens: IThemedToken[][] = [
        [{ content: 'test', color: '#000000', fontStyle: 0 }],
      ];
      
      const pdfDoc = await pdf.generatePdfFromTokens(mockTokens, 'Test', 14, 20, 'Arial');
      
      let tempFileCreated = false;
      mockApp.os.fileWrite = (path: string, content: Buffer) => {
        tempFileCreated = true;
        assert.ok(path.includes('.pdf'), 'Should create PDF file');
        assert.ok(content.length > 0, 'Should write PDF content');
      };

      await pdf.printDirectly(pdfDoc, 'Test Document');
      
      assert.ok(tempFileCreated, 'Should create temporary PDF file');
    });
  });

  describe('hexToRgb helper', () => {
    it('should convert hex colors to RGB', () => {
      const rgb1 = pdf['hexToRgb']('#ff0000');
      assert.deepStrictEqual(rgb1, { r: 255, g: 0, b: 0 }, 'Should convert red hex to RGB');

      const rgb2 = pdf['hexToRgb']('#00ff00');
      assert.deepStrictEqual(rgb2, { r: 0, g: 255, b: 0 }, 'Should convert green hex to RGB');

      const rgb3 = pdf['hexToRgb']('#0000ff');
      assert.deepStrictEqual(rgb3, { r: 0, g: 0, b: 255 }, 'Should convert blue hex to RGB');

      const rgb4 = pdf['hexToRgb']('#ffffff');
      assert.deepStrictEqual(rgb4, { r: 255, g: 255, b: 255 }, 'Should convert white hex to RGB');
    });

    it('should handle invalid hex colors', () => {
      const rgb1 = pdf['hexToRgb']('invalid');
      assert.deepStrictEqual(rgb1, { r: 0, g: 0, b: 0 }, 'Should return black for invalid hex');

      const rgb2 = pdf['hexToRgb']('#gggggg');
      assert.deepStrictEqual(rgb2, { r: 0, g: 0, b: 0 }, 'Should return black for invalid hex chars');
    });
  });
});