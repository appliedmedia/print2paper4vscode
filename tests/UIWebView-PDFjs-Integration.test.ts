import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { UIWebView } from '../src/UIWebView.js';
import type { PDFData_t } from '../src/UIWebView.js';
import jsPDF from 'jspdf';

/**
 * Integration test for UIWebView PDF panel creation
 * 
 * This test verifies that the displayPdfPanel() method works correctly
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
  function buildMockApp(pdfDoc?: jsPDF) {
    const mockDocInfo = pdfDoc ? {
      pdfDoc,
      asArrayBuffer: () => pdfDoc.output('arraybuffer') as ArrayBuffer,
      asDataUrl: () => pdfDoc.output('dataurlstring') as string,
      pageTotal: pdfDoc.getNumberOfPages(),
      pageSizePx: {
        widthPx: 595,
        heightPx: 842,
      },
      title: 'Test Document',
    } : {
      pdfDoc: null,
      asArrayBuffer: () => new ArrayBuffer(0),
      asDataUrl: () => '',
      pageTotal: 0,
      pageSizePx: { widthPx: 0, heightPx: 0 },
      title: '',
    };

    const mockApp = {
      dx: buildDxMock(),
      pdf: {
        docInfo: mockDocInfo,
      },
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
      // Step 1: Generate a real PDF using jsPDF
      const doc = new jsPDF();
      doc.text('Sample Document', 10, 10);
      doc.text('This is a test PDF for integration testing.', 10, 20);
      doc.text('Page 1 of 1', 10, 290);
      
      // Step 2: Create mock app with PDF document
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);

      // Step 3: Call displayPdfPanel (uses app.pdf.docInfo)
      const panelId = await uiWebView.displayPdfPanel('Test Document');

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

      const panelId = await uiWebView.displayPdfPanel(pdfData);

      assert.strictEqual(pdfData.pageTotal, 3, 'Should have 3 pages');
      assert.ok(panelId, 'Panel should be created successfully');
    });

    test('should validate PDF data before creating panel', async () => {
      // Test with invalid data (no PDF document)
      const mockApp = buildMockApp(); // No PDF doc
      const uiWebView = new UIWebView(mockApp);

      try {
        await uiWebView.displayPdfPanel('Invalid PDF');
        assert.fail('Should have thrown an error for invalid data');
      } catch (error) {
        assert.ok(String(error).includes('arrayBuffer'), 'Error should mention arrayBuffer');
      }
    });

    test('should convert PDF ArrayBuffer to base64 for webview', async () => {
      const doc = new jsPDF();
      doc.text('Base64 Conversion Test', 10, 10);

      // Create mock app with PDF document
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);

      // The displayPdfPanel method should handle conversion internally
      const panelId = await uiWebView.displayPdfPanel('Base64 Test');

      // Verify conversion was successful by checking panel was created
      assert.ok(panelId, 'Panel creation should succeed after base64 conversion');
    });
  });

  describe('PDF Size and Display Validation', () => {
    test('should support different page sizes', async () => {
      const sizes = [
        { widthPx: 595, heightPx: 842, name: 'A4' },
        { widthPx: 612, heightPx: 792, name: 'Letter' },
        { widthPx: 612, heightPx: 1008, name: 'Legal' },
      ];

      for (const size of sizes) {
        const doc = new jsPDF();
        doc.text(`Testing ${size.name} size`, 10, 10);
        
        // Create mock app with PDF document
        const mockApp = buildMockApp(doc);
        const uiWebView = new UIWebView(mockApp);
        // Update pageSizePx to match test size
        mockApp.pdf.docInfo.pageSizePx = size;

        const panelId = await uiWebView.displayPdfPanel(`${size.name} Test`);
        assert.ok(panelId, `Panel should be created for ${size.name} size`);
      }
    });

    test('should handle moderate-size multi-page PDF', async () => {
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

      // Create mock app with PDF document
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);

      const panelId = await uiWebView.displayPdfPanel('Large PDF Test');

      assert.ok(panelId, 'Panel should be created for moderate-size PDF');
      // A 10-page PDF with ~50 lines each should be at least 10KB
      const arrayBuffer = mockApp.pdf.docInfo.asArrayBuffer();
      assert.ok(arrayBuffer.byteLength > 10000, 'ArrayBuffer should be substantial (>10KB)');
    });

    test('should handle very large PDF (500 pages)', async function() {
      // Gate this slow test behind an environment variable
      if (process.env.RUN_LARGE_PDF_TEST !== '1') {
        // @ts-ignore - Mocha Context
        this.skip();
        return;
      }

      // This test generates a 500-page PDF, so it may take longer
      // @ts-ignore - Mocha Context
      this.timeout(300000); // 5 minute timeout for CI stability
      
      const mockApp = buildMockApp();
      const uiWebView = new UIWebView(mockApp);

      console.log('Generating 500-page PDF...');
      const startTime = Date.now();
      
      // Lorem ipsum sample paragraphs for varied content
      const loremParagraphs = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
        'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.',
        'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
        'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.'
      ];
      
      // Create a very large PDF with 500 pages
      const doc = new jsPDF();
      const totalPages = 500;
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0 && i % 50 === 0) {
          console.log(`Generated ${i} pages...`);
        }
        
        if (i > 0) doc.addPage();
        
        // Add page heading with varying font sizes (cycle through 16, 18, 20, 22, 24)
        const headingSize = 16 + ((i % 5) * 2);
        doc.setFontSize(headingSize);
        doc.text(`Page ${i + 1} of ${totalPages}`, 10, 15);
        
        // Reset to normal font size for body text
        doc.setFontSize(11);
        
        // Add subheading
        doc.setFontSize(14);
        doc.text(`Section ${Math.floor(i / 10) + 1}`, 10, 25);
        
        // Add lorem ipsum paragraphs with varied content
        doc.setFontSize(10);
        let yPos = 35;
        const paragraphsToUse = 3 + (i % 3); // Use 3-5 paragraphs per page
        
        for (let j = 0; j < paragraphsToUse; j++) {
          const paragraph = loremParagraphs[(i + j) % loremParagraphs.length];
          // Type assertion for splitTextToSize which exists but isn't in our type def
          const lines = (doc as any).splitTextToSize(paragraph, 180) as string[];
          // Draw each line separately
          for (let k = 0; k < lines.length; k++) {
            doc.text(lines[k], 10, yPos);
            yPos += 5;
          }
          yPos += 8; // Space between paragraphs
          
          if (yPos > 270) break; // Don't overflow page
        }
        
        // Add footer with smaller text
        doc.setFontSize(8);
        doc.text(`Document generated at ${new Date().toISOString()}`, 10, 285);
      }

      const generationTime = Date.now() - startTime;
      console.log(`PDF generation took ${generationTime}ms`);

      // Create mock app with PDF document
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);
      
      const arrayBuffer = mockApp.pdf.docInfo.asArrayBuffer();
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

      // Page count assertion (most reliable)
      assert.strictEqual(mockApp.pdf.docInfo.pageTotal, totalPages, 'Should have exactly 500 pages');
      
      // Relaxed size assertion - just verify it's substantial (>100KB)
      // Different jsPDF versions may have varying compression/formatting
      assert.ok(arrayBuffer.byteLength > 100000, 'ArrayBuffer should be substantial (>100KB)');

      // Test that the panel can be created with this large PDF
      const panelStartTime = Date.now();
      const panelId = await uiWebView.displayPdfPanel('Very Large PDF Test (500 pages)');
      const panelTime = Date.now() - panelStartTime;
      
      console.log(`Panel creation took ${panelTime}ms`);

      assert.ok(panelId, 'Panel should be created for very large PDF');
      
      // Report final size
      const sizeMB = (arrayBuffer.byteLength / 1024 / 1024);
      console.log(`Successfully handled ${totalPages} pages, ${sizeMB.toFixed(2)} MB ArrayBuffer`);
    });
  });

  describe('Error Handling in Integration', () => {
    test('should show error message for invalid page count', async () => {
      const doc = new jsPDF();
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);
      // Set invalid pageTotal
      mockApp.pdf.docInfo.pageTotal = 0;

      let errorDisplayed = false;
      const originalShowError = mockApp.ui.showErrorMessage;
      mockApp.ui.showErrorMessage = (msg: string) => {
        errorDisplayed = true;
        originalShowError(msg);
      };

      try {
        await uiWebView.displayPdfPanel('Invalid Page Count');
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Error should be displayed
        assert.ok(errorDisplayed || String(error).includes('pageTotal'), 
          'Error should be displayed for invalid page count');
      }
    });

    test('should show error message for invalid page size', async () => {
      const doc = new jsPDF();
      const mockApp = buildMockApp(doc);
      const uiWebView = new UIWebView(mockApp);
      // Set invalid pageSizePx
      mockApp.pdf.docInfo.pageSizePx = { widthPx: 0, heightPx: 0 };

      let errorDisplayed = false;
      const originalShowError = mockApp.ui.showErrorMessage;
      mockApp.ui.showErrorMessage = (msg: string) => {
        errorDisplayed = true;
        originalShowError(msg);
      };

      try {
        await uiWebView.displayPdfPanel('Invalid Page Size');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(errorDisplayed || String(error).includes('pageSizePx'), 
          'Error should be displayed for invalid page size');
      }
    });
  });
});

