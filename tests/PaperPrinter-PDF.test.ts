import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { PaperPrinter } from '../src/PaperPrinter.js';
import type { IThemedToken } from 'shiki';

describe('PaperPrinter PDF Integration', () => {
  let paperPrinter: PaperPrinter;
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
      stylize: {
        styleToPdf: async (code: string, language: string, theme: string) => {
          // Mock PDF generation - return a mock jsPDF object
          return {
            getNumberOfPages: () => 1,
            getPageWidth: () => 210,
            getPageHeight: () => 297,
            output: (format: string) => {
              if (format === 'arraybuffer') {
                return new ArrayBuffer(1024); // Mock PDF data
              }
              return 'mock-pdf-data';
            },
          };
        },
      },
      pdf: {
        pdfToHTML: (pdfDoc: any, title: string) => {
          return `<div>Mock PDF HTML for ${title}</div>`;
        },
        printWithPreview: async (pdfDoc: any, title: string) => {
          return Promise.resolve();
        },
        printDirectly: async (pdfDoc: any, title: string) => {
          return Promise.resolve();
        },
        saveAsPDF: async (pdfDoc: any, title: string) => {
          return '/tmp/saved.pdf';
        },
      },
      ui: {
        addToolbar: (html: string) => `<div class="toolbar">${html}</div>`,
        htmlToWebViewPanel: (html: string, title: string) => {
          return { html, title };
        },
      },
      clipboardCapture: {
        capture: () => Promise.resolve({
          html: '<div>Captured HTML</div>',
          rawCode: 'function test() { return "hello"; }',
          language: 'javascript',
        }),
      },
    };

    paperPrinter = new PaperPrinter(mockApp);
  });

  describe('PDF Rendering Workflow', () => {
    it('should handle first print command with raw code', async () => {
      const result = await paperPrinter.handleFirstPrintCommand();
      
      assert.ok(result, 'Should return a result');
      assert.ok(paperPrinter['pdfRendered'], 'Should have rendered PDF in memory');
    });

    it('should store PDF in pdfRendered property', async () => {
      await paperPrinter.handleFirstPrintCommand();
      
      const pdfRendered = paperPrinter['pdfRendered'];
      assert.ok(pdfRendered, 'pdfRendered should contain the PDF document');
      assert.strictEqual(typeof pdfRendered.getNumberOfPages, 'function', 'Should be a jsPDF-like object');
    });
  });

  describe('openPrintPrepAndPrompt', () => {
    it('should accept PDF document and create webview', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      const result = await paperPrinter.openPrintPrepAndPrompt(mockPdfDoc, 'Test Document');
      
      assert.ok(result, 'Should return a result');
      assert.strictEqual(paperPrinter['pdfRendered'], mockPdfDoc, 'Should store the PDF document');
    });
  });

  describe('applyRenderModes', () => {
    it('should regenerate PDF when raw code is available', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      // Set up raw code for regeneration
      paperPrinter['rawCode'] = 'function test() { return "hello"; }';
      paperPrinter['language'] = 'javascript';
      paperPrinter['theme'] = 'github-light';

      const result = await paperPrinter.applyRenderModes(mockPdfDoc, 'Test Document');
      
      assert.ok(result, 'Should return a result');
      assert.ok(paperPrinter['pdfRendered'], 'Should have regenerated PDF');
    });

    it('should use existing PDF when no raw code available', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      // No raw code set
      paperPrinter['rawCode'] = null;

      const result = await paperPrinter.applyRenderModes(mockPdfDoc, 'Test Document');
      
      assert.ok(result, 'Should return a result');
      assert.strictEqual(paperPrinter['pdfRendered'], mockPdfDoc, 'Should use existing PDF');
    });
  });

  describe('Print Message Handling', () => {
    beforeEach(async () => {
      // Set up a mock PDF for testing
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };
      paperPrinter['pdfRendered'] = mockPdfDoc;
    });

    it('should handle print with preview message', async () => {
      const message = {
        command: 'printWithPreview',
        data: { title: 'Test Document' }
      };

      let previewCalled = false;
      mockApp.pdf.printWithPreview = async (pdfDoc: any, title: string) => {
        previewCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        assert.strictEqual(title, 'Test Document', 'Should pass the title');
      };

      await paperPrinter.handlePrintMessage(message);
      
      assert.ok(previewCalled, 'Should call printWithPreview');
    });

    it('should handle print directly message', async () => {
      const message = {
        command: 'printDirectly',
        data: { title: 'Test Document' }
      };

      let printCalled = false;
      mockApp.pdf.printDirectly = async (pdfDoc: any, title: string) => {
        printCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        assert.strictEqual(title, 'Test Document', 'Should pass the title');
      };

      await paperPrinter.handlePrintMessage(message);
      
      assert.ok(printCalled, 'Should call printDirectly');
    });

    it('should handle save as PDF message', async () => {
      const message = {
        command: 'saveAsPDF',
        data: { title: 'Test Document' }
      };

      let saveCalled = false;
      mockApp.pdf.saveAsPDF = async (pdfDoc: any, title: string) => {
        saveCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        assert.strictEqual(title, 'Test Document', 'Should pass the title');
        return '/tmp/saved.pdf';
      };

      const result = await paperPrinter.handlePrintMessage(message);
      
      assert.ok(saveCalled, 'Should call saveAsPDF');
      assert.strictEqual(result, '/tmp/saved.pdf', 'Should return the save result');
    });

    it('should handle unknown command gracefully', async () => {
      const message = {
        command: 'unknownCommand',
        data: { title: 'Test Document' }
      };

      // Should not throw an error
      const result = await paperPrinter.handlePrintMessage(message);
      
      assert.strictEqual(result, undefined, 'Should return undefined for unknown commands');
    });
  });

  describe('Selection Print Handling', () => {
    beforeEach(async () => {
      // Set up a mock PDF for testing
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };
      paperPrinter['pdfRendered'] = mockPdfDoc;
    });

    it('should handle print with preview selection', async () => {
      let previewCalled = false;
      mockApp.pdf.printWithPreview = async (pdfDoc: any, title: string) => {
        previewCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
      };

      await paperPrinter.handleSelection_Print('printWithPreview');
      
      assert.ok(previewCalled, 'Should call printWithPreview');
    });

    it('should handle print directly selection', async () => {
      let printCalled = false;
      mockApp.pdf.printDirectly = async (pdfDoc: any, title: string) => {
        printCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
      };

      await paperPrinter.handleSelection_Print('printDirectly');
      
      assert.ok(printCalled, 'Should call printDirectly');
    });

    it('should handle save as PDF selection', async () => {
      let saveCalled = false;
      mockApp.pdf.saveAsPDF = async (pdfDoc: any, title: string) => {
        saveCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        return '/tmp/saved.pdf';
      };

      const result = await paperPrinter.handleSelection_Print('saveAsPDF');
      
      assert.ok(saveCalled, 'Should call saveAsPDF');
      assert.strictEqual(result, '/tmp/saved.pdf', 'Should return the save result');
    });
  });
});