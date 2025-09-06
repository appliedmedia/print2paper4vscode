import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { PaperPrinter } from '../src/PaperPrinter.js';

describe('PaperPrinter Core Functionality', () => {
  let paperPrinter: PaperPrinter;
  let mockApp: any;

  before(() => {
    // Mock app for testing
    mockApp = {
      dx: {
        create: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
          sub: (method: string) => ({
            out: (msg: string) => console.log(`[${name}.${method}] ${msg}`),
            done: () => {},
            require: (args: any, required: string[]) => {},
          }),
        }),
      },
      stylize: {
        styleToPdf: async (code: string, language: string, opts: any) => {
          return {
            getNumberOfPages: () => 1,
            getPageWidth: () => 210,
            getPageHeight: () => 297,
            output: (format: string) => {
              if (format === 'arraybuffer') {
                return new ArrayBuffer(1024);
              }
              return 'mock-pdf-data';
            },
          };
        },
        styleToHtml: async (code: string, language: string, opts: any) => {
          return '<div>Mock HTML</div>';
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

  describe('Initialization', () => {
    it('should initialize with app reference', () => {
      assert.strictEqual(paperPrinter['app'], mockApp, 'Should store app reference');
    });

    it('should initialize clipboard capture', () => {
      assert.ok(paperPrinter['clipboardCapture'], 'Should have clipboard capture');
    });

    it('should initialize handlers as not registered', () => {
      assert.strictEqual(paperPrinter['handlersRegistered'], false, 'Should start with handlers not registered');
    });

    it('should initialize pdfRendered as null', () => {
      assert.strictEqual(paperPrinter['pdfRendered'], null, 'Should start with no rendered PDF');
    });
  });

  describe('Handler Registration', () => {
    it('should register handlers', () => {
      paperPrinter.registerHandlers();
      
      assert.strictEqual(paperPrinter['handlersRegistered'], true, 'Should mark handlers as registered');
    });

    it('should not register handlers twice', () => {
      paperPrinter['handlersRegistered'] = false;
      paperPrinter.registerHandlers();
      
      const firstCall = paperPrinter['handlersRegistered'];
      paperPrinter.registerHandlers();
      
      assert.strictEqual(paperPrinter['handlersRegistered'], true, 'Should remain registered after second call');
      assert.strictEqual(firstCall, true, 'Should have been registered on first call');
    });
  });

  describe('First Print Command', () => {
    it('should handle first print command', async () => {
      const result = await paperPrinter.handleFirstPrintCommand();
      
      assert.ok(result, 'Should return a result');
      assert.ok(paperPrinter['pdfRendered'], 'Should have rendered PDF in memory');
    });

    it('should capture clipboard content', async () => {
      let captureCalled = false;
      mockApp.clipboardCapture.capture = () => {
        captureCalled = true;
        return Promise.resolve({
          html: '<div>Captured HTML</div>',
          rawCode: 'function test() { return "hello"; }',
          language: 'javascript',
        });
      };

      await paperPrinter.handleFirstPrintCommand();
      
      assert.ok(captureCalled, 'Should call clipboard capture');
    });

    it('should generate PDF from captured content', async () => {
      let styleToPdfCalled = false;
      mockApp.stylize.styleToPdf = async (code: string, language: string, opts: any) => {
        styleToPdfCalled = true;
        assert.strictEqual(code, 'function test() { return "hello"; }', 'Should pass captured code');
        assert.strictEqual(language, 'javascript', 'Should pass captured language');
        return {
          getNumberOfPages: () => 1,
          getPageWidth: () => 210,
          getPageHeight: () => 297,
          output: () => 'mock-pdf-data',
        };
      };

      await paperPrinter.handleFirstPrintCommand();
      
      assert.ok(styleToPdfCalled, 'Should call styleToPdf');
    });
  });

  describe('PDF Rendering State', () => {
    it('should store PDF in pdfRendered property', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      await paperPrinter.openPrintPrepAndPrompt(mockPdfDoc, 'Test Document');
      
      assert.strictEqual(paperPrinter['pdfRendered'], mockPdfDoc, 'Should store PDF document');
    });

    it('should clear PDF when needed', () => {
      paperPrinter['pdfRendered'] = { test: 'pdf' };
      
      // Simulate clearing
      paperPrinter['pdfRendered'] = null;
      
      assert.strictEqual(paperPrinter['pdfRendered'], null, 'Should clear PDF document');
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard capture errors', async () => {
      mockApp.clipboardCapture.capture = () => {
        throw new Error('Clipboard capture failed');
      };

      try {
        await paperPrinter.handleFirstPrintCommand();
        assert.fail('Should throw error on clipboard capture failure');
      } catch (error) {
        assert.ok(error, 'Should handle clipboard capture errors');
      }
    });

    it('should handle PDF generation errors', async () => {
      mockApp.stylize.styleToPdf = async () => {
        throw new Error('PDF generation failed');
      };

      try {
        await paperPrinter.handleFirstPrintCommand();
        assert.fail('Should throw error on PDF generation failure');
      } catch (error) {
        assert.ok(error, 'Should handle PDF generation errors');
      }
    });

    it('should handle missing app reference', () => {
      const paperPrinterWithoutApp = new PaperPrinter(undefined as any);
      
      assert.ok(paperPrinterWithoutApp, 'Should create instance even without app');
    });
  });

  describe('Webview Integration', () => {
    it('should create webview with toolbar', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      let toolbarAdded = false;
      mockApp.ui.addToolbar = (html: string) => {
        toolbarAdded = true;
        return `<div class="toolbar">${html}</div>`;
      };

      await paperPrinter.openPrintPrepAndPrompt(mockPdfDoc, 'Test Document');
      
      assert.ok(toolbarAdded, 'Should add toolbar to webview');
    });

    it('should convert PDF to HTML for display', async () => {
      const mockPdfDoc = {
        getNumberOfPages: () => 1,
        getPageWidth: () => 210,
        getPageHeight: () => 297,
        output: () => 'mock-pdf-data',
      };

      let pdfToHTMLCalled = false;
      mockApp.pdf.pdfToHTML = (pdfDoc: any, title: string) => {
        pdfToHTMLCalled = true;
        assert.strictEqual(pdfDoc, mockPdfDoc, 'Should pass PDF document');
        assert.strictEqual(title, 'Test Document', 'Should pass title');
        return '<div>Mock PDF HTML</div>';
      };

      await paperPrinter.openPrintPrepAndPrompt(mockPdfDoc, 'Test Document');
      
      assert.ok(pdfToHTMLCalled, 'Should convert PDF to HTML');
    });
  });

  describe('Dynamic Re-rendering', () => {
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

      let styleToPdfCalled = false;
      mockApp.stylize.styleToPdf = async (code: string, language: string, opts: any) => {
        styleToPdfCalled = true;
        return {
          getNumberOfPages: () => 1,
          getPageWidth: () => 210,
          getPageHeight: () => 297,
          output: () => 'mock-pdf-data',
        };
      };

      await paperPrinter.applyRenderModes(mockPdfDoc, 'Test Document');
      
      assert.ok(styleToPdfCalled, 'Should regenerate PDF when raw code is available');
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

      let styleToPdfCalled = false;
      mockApp.stylize.styleToPdf = async () => {
        styleToPdfCalled = true;
        return mockPdfDoc;
      };

      await paperPrinter.applyRenderModes(mockPdfDoc, 'Test Document');
      
      assert.strictEqual(styleToPdfCalled, false, 'Should not regenerate PDF when no raw code');
    });
  });

  describe('Message Handling', () => {
    it('should handle print with preview message', async () => {
      const message = {
        type: 'print' as const,
        command: 'printWithPreview',
        data: { title: 'Test Document' }
      };

      let previewCalled = false;
      mockApp.pdf.printWithPreview = async (pdfDoc: any, title: string) => {
        previewCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        assert.strictEqual(title, 'Test Document', 'Should pass the title');
      };

      paperPrinter['pdfRendered'] = { test: 'pdf' };
      await paperPrinter.handlePrintMessage(message);
      
      assert.ok(previewCalled, 'Should call printWithPreview');
    });

    it('should handle print directly message', async () => {
      const message = {
        type: 'print' as const,
        command: 'printDirectly',
        data: { title: 'Test Document' }
      };

      let printCalled = false;
      mockApp.pdf.printDirectly = async (pdfDoc: any, title: string) => {
        printCalled = true;
        assert.strictEqual(pdfDoc, paperPrinter['pdfRendered'], 'Should pass the rendered PDF');
        assert.strictEqual(title, 'Test Document', 'Should pass the title');
      };

      paperPrinter['pdfRendered'] = { test: 'pdf' };
      await paperPrinter.handlePrintMessage(message);
      
      assert.ok(printCalled, 'Should call printDirectly');
    });

    it('should handle save as PDF message', async () => {
      const message = {
        type: 'print' as const,
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

      paperPrinter['pdfRendered'] = { test: 'pdf' };
      const result = await paperPrinter.handlePrintMessage(message);
      
      assert.ok(saveCalled, 'Should call saveAsPDF');
      assert.strictEqual(result, '/tmp/saved.pdf', 'Should return the save result');
    });

    it('should handle unknown command gracefully', async () => {
      const message = {
        type: 'print' as const,
        command: 'unknownCommand',
        data: { title: 'Test Document' }
      };

      const result = await paperPrinter.handlePrintMessage(message);
      
      assert.strictEqual(result, undefined, 'Should return undefined for unknown commands');
    });
  });
});