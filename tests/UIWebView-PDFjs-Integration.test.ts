import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { UIWebView } from '../src/UIWebView.js';
import type { PDFData_t } from '../src/UIWebView.js';
import jsPDF from 'jspdf';

/**
 * Integration test for UIWebView PDF panel creation
 * 
 * This test verifies that the createPDFPanel() method works correctly
 * with actual PDF data and validates the complete flow from PDF generation
 * to panel creation.
 * 
 * Note: This test creates mocks for VS Code APIs and doesn't require
 * a running VS Code instance.
 */
describe('UIWebView PDF Panel Creation Integration', () => {
  // Helper function to create DX mock
  function buildDxMock() {
    return {
      create: (name: string) => ({
        out: () => {},
        print: () => {},
        done: () => {},
        sub: (name: string) => ({
          out: () => {},
          print: () => {},
          done: () => {},
          require: (args: any, fields: string[]) => {
            for (const field of fields) {
              if (!args[field]) {
                throw new Error(`Missing required field: ${field}`);
              }
            }
            return true;
          },
        }),
      }),
    };
  }

  // Helper to create a complete App mock
  function buildMockApp() {
    const mockApp = {
      dx: buildDxMock(),
      ui: {
        debugOut: () => {},
        showErrorMessage: (msg: string) => {
          console.error(`ERROR: ${msg}`);
        },
        addToolbar: async (html: string) => {
          // Mock toolbar addition - wrap HTML
          return `<div id="toolbar">Toolbar</div>${html}`;
        },
        yaml: {
          base_css: `<style>
            body { font-family: sans-serif; margin: 0; padding: 0; }
          </style>`,
        },
      },
      vscodeapis: {
        getOrCreateWebviewPanel: async (
          title: string,
          html: string,
          panelId?: string
        ) => {
          // Return a mock panel ID
          console.log(`Creating webview panel: ${title}`);
          return `panel_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        },
      },
      os: {
        readExtensionYaml: () => ({
          webview_html: '',
          webview_css: '',
          webview_js: '',
        }),
        fileRead: async (path: string) => {
          // Mock PDF.js library content
          if (path === 'src/lib/pdf.min.js') {
            return `// Mock PDF.js library
window.pdfjsLib = { 
  getDocument: () => ({ promise: Promise.resolve({ numPages: 1 }) })
};`;
          }
          return '';
        },
        getAsUri: () => ({ fsPath: '/test' }),
      },
      templateDictReplace: (source: string, dict: Record<string, string>) => {
        if (!source) return '';
        return source.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return dict[key] !== undefined ? dict[key] : match;
        });
      },
      stylize: {
        tokenize: async () => {},
      },
    } as any;

    return mockApp;
  }

  describe('Complete PDF Panel Creation Flow', () => {
    test('should create PDF panel from PDF generation to display', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      // Step 1: Generate a real PDF using jsPDF
      const doc = new jsPDF();
      doc.text('Sample Document', 10, 10);
      doc.text('This is a test PDF for integration testing.', 10, 20);
      doc.text('Page 1 of 1', 10, 290);
      
      // Step 2: Convert to ArrayBuffer
      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
      assert.ok(arrayBuffer, 'ArrayBuffer should be generated');
      assert.ok(arrayBuffer.byteLength > 0, 'ArrayBuffer should have content');

      // Step 3: Create PDFData_t structure
      const pdfData: PDFData_t = {
        arrayBuffer,
        pageTotal: doc.getNumberOfPages(),
        pageSizePx: {
          widthPx: 595, // A4 width in pixels at 72 DPI
          heightPx: 842, // A4 height in pixels at 72 DPI
        },
        title: 'Test Document',
      };

      // Step 4: Call createPDFPanel
      const panelId = await uiWebView.createPDFPanel(pdfData);

      // Step 5: Verify panel was created
      assert.ok(panelId, 'Panel ID should be returned');
      assert.ok(typeof panelId === 'string', 'Panel ID should be a string');
      assert.ok(panelId.includes('Test_Document'), 'Panel ID should include title');
    });

    test('should handle multi-page PDF correctly', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      // Generate multi-page PDF
      const doc = new jsPDF();
      doc.text('Page 1 Content', 10, 10);
      
      doc.addPage();
      doc.text('Page 2 Content', 10, 10);
      
      doc.addPage();
      doc.text('Page 3 Content', 10, 10);

      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

      const pdfData: PDFData_t = {
        arrayBuffer,
        pageTotal: doc.getNumberOfPages(),
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Multi-Page Test',
      };

      const panelId = await uiWebView.createPDFPanel(pdfData);

      assert.strictEqual(pdfData.pageTotal, 3, 'Should have 3 pages');
      assert.ok(panelId, 'Panel should be created successfully');
    });

    test('should validate PDF data before creating panel', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      // Test with invalid data
      const invalidPdfData = {
        arrayBuffer: undefined as any,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Invalid PDF',
      };

      try {
        await uiWebView.createPDFPanel(invalidPdfData);
        assert.fail('Should have thrown an error for invalid data');
      } catch (error) {
        assert.ok(String(error).includes('arrayBuffer'), 'Error should mention arrayBuffer');
      }
    });

    test('should convert PDF ArrayBuffer to base64 for webview', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      const doc = new jsPDF();
      doc.text('Base64 Conversion Test', 10, 10);
      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

      const pdfData: PDFData_t = {
        arrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Base64 Test',
      };

      // The createPDFPanel method should handle conversion internally
      const panelId = await uiWebView.createPDFPanel(pdfData);

      // Verify conversion was successful by checking panel was created
      assert.ok(panelId, 'Panel creation should succeed after base64 conversion');
    });
  });

  describe('PDF Size and Display Validation', () => {
    test('should support different page sizes', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      const sizes = [
        { widthPx: 595, heightPx: 842, name: 'A4' },
        { widthPx: 612, heightPx: 792, name: 'Letter' },
        { widthPx: 612, heightPx: 1008, name: 'Legal' },
      ];

      for (const size of sizes) {
        const doc = new jsPDF();
        doc.text(`Testing ${size.name} size`, 10, 10);
        const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

        const pdfData: PDFData_t = {
          arrayBuffer,
          pageTotal: 1,
          pageSizePx: size,
          title: `${size.name} Test`,
        };

        const panelId = await uiWebView.createPDFPanel(pdfData);
        assert.ok(panelId, `Panel should be created for ${size.name} size`);
      }
    });

    test('should handle moderate-size multi-page PDF', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      // Create a larger PDF
      const doc = new jsPDF();
      for (let i = 0; i < 10; i++) {
        if (i > 0) doc.addPage();
        doc.text(`Content on page ${i + 1}`, 10, 10);
        // Add more content to make it larger
        for (let j = 0; j < 50; j++) {
          doc.text(`Line ${j + 1} of content`, 10, 20 + j * 5);
        }
      }

      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

      const pdfData: PDFData_t = {
        arrayBuffer,
        pageTotal: doc.getNumberOfPages(),
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Large PDF Test',
      };

      const panelId = await uiWebView.createPDFPanel(pdfData);

      assert.ok(panelId, 'Panel should be created for moderate-size PDF');
      // A 10-page PDF with ~50 lines each should be at least 10KB
      assert.ok(arrayBuffer.byteLength > 10000, 'ArrayBuffer should be substantial (>10KB)');
    });

    test('should handle very large PDF (500 pages)', async () => {
      // This test generates a 500-page PDF, so it may take longer
      const timeout = 30000; // 30 second timeout
      
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      console.log('Generating 500-page PDF...');
      const startTime = Date.now();
      
      // Create a very large PDF with 500 pages
      const doc = new jsPDF();
      const totalPages = 500;
      const linesPerPage = 30;
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0 && i % 10 === 0) {
          console.log(`Generated ${i} pages...`);
        }
        
        if (i > 0) doc.addPage();
        doc.text(`Page ${i + 1} of ${totalPages}`, 10, 10);
        
        // Add content to each page
        for (let j = 0; j < linesPerPage; j++) {
          doc.text(`Line ${j + 1}: Content on page ${i + 1}, line ${j + 1}`, 10, 20 + j * 8);
        }
      }

      const generationTime = Date.now() - startTime;
      console.log(`PDF generation took ${generationTime}ms`);

      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

      const pdfData: PDFData_t = {
        arrayBuffer,
        pageTotal: doc.getNumberOfPages(),
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Very Large PDF Test (500 pages)',
      };

      assert.strictEqual(pdfData.pageTotal, totalPages, 'Should have exactly 500 pages');
      assert.ok(arrayBuffer.byteLength > 1000000, 'ArrayBuffer should be substantial (>1MB)');

      // Test that the panel can be created with this large PDF
      const panelStartTime = Date.now();
      const panelId = await uiWebView.createPDFPanel(pdfData);
      const panelTime = Date.now() - panelStartTime;
      
      console.log(`Panel creation took ${panelTime}ms`);

      assert.ok(panelId, 'Panel should be created for very large PDF');
      
      // Verify the ArrayBuffer is actually large
      const sizeMB = (arrayBuffer.byteLength / 1024 / 1024);
      console.log(`Successfully handled ${totalPages} pages, ${sizeMB.toFixed(2)} MB ArrayBuffer`);
      assert.ok(arrayBuffer.byteLength > 500000, 'A 500-page PDF should be at least 500KB');
    });
  });

  describe('Error Handling in Integration', () => {
    test('should show error message for invalid page count', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      const doc = new jsPDF();
      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

      const invalidPdfData = {
        arrayBuffer,
        pageTotal: 0, // Invalid
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Invalid Page Count',
      };

      let errorDisplayed = false;
      const originalShowError = mockApp.ui.showErrorMessage;
      mockApp.ui.showErrorMessage = (msg: string) => {
        errorDisplayed = true;
        originalShowError(msg);
      };

      try {
        await uiWebView.createPDFPanel(invalidPdfData);
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Error should be displayed
        assert.ok(errorDisplayed || String(error).includes('pageTotal'), 
          'Error should be displayed for invalid page count');
      }
    });

    test('should show error message for invalid page size', async () => {
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      const doc = new jsPDF();
      const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;

      const invalidPdfData = {
        arrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 0, heightPx: 0 }, // Invalid
        title: 'Invalid Page Size',
      };

      let errorDisplayed = false;
      const originalShowError = mockApp.ui.showErrorMessage;
      mockApp.ui.showErrorMessage = (msg: string) => {
        errorDisplayed = true;
        originalShowError(msg);
      };

      try {
        await uiWebView.createPDFPanel(invalidPdfData);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(errorDisplayed || String(error).includes('pageSizePx'), 
          'Error should be displayed for invalid page size');
      }
    });
  });
});

