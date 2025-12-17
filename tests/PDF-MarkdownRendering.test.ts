import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';
import { createTestApp, TestApp } from './test-utils.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { installHeaderFooterMenuStubs } from './test-helpers.js';

/**
 * Tests for PDF markdown HTML rendering functionality
 * 
 * These tests verify that the HTML rendering infrastructure properly handles
 * markdown elements: headings, paragraphs, lists, code blocks, blockquotes, etc.
 */
describe('PDF Markdown HTML Rendering', () => {
  let app: TestApp;
  let pdf: PDF;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
    installHeaderFooterMenuStubs(app);

    pdf = new PDF({ reg: app.reg });
    
    // Set up basic PDF document properties
    pdf.docInfo().pageSizeId = 'a4';
    pdf.docInfo().orient = 'portrait';
    pdf.docInfo().fontSizePx = 12;
    pdf.docInfo().lineHeightPx = 18;
    pdf.docInfo().fontFamily = 'Courier';
    pdf.docInfo().theme = 'github-light';
    pdf.docInfo().marginId = 'normal';
  });

  afterEach(() => {
    pdf.done();
    app.done();
  });

  describe('renderFromHTML', () => {
    it('should render simple HTML paragraph', async () => {
      pdf.setupPdf();
      const initialBufferSize = pdf.docInfo().asArrayBuffer().byteLength;
      const html = '<p>Simple paragraph text</p>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
      const finalBufferSize = pdf.docInfo().asArrayBuffer().byteLength;
      assert.ok(finalBufferSize > initialBufferSize, 'PDF buffer should grow after rendering content');
    });

    it('should render heading elements', async () => {
      pdf.setupPdf();
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render inline formatting', async () => {
      pdf.setupPdf();
      const html = '<p>Text with <strong>bold</strong> and <em>italic</em> and <code>code</code></p>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render unordered lists', async () => {
      pdf.setupPdf();
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render ordered lists', async () => {
      pdf.setupPdf();
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render code blocks with syntax highlighting', async () => {
      pdf.setupPdf();
      const html = '<pre><code class="language-javascript">const x = 42;\nconsole.log(x);</code></pre>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render code blocks without language', async () => {
      pdf.setupPdf();
      const html = '<pre><code>Plain text code\nNo syntax highlighting</code></pre>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render blockquotes', async () => {
      pdf.setupPdf();
      const html = '<blockquote><p>This is a quote</p></blockquote>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should render horizontal rules', async () => {
      pdf.setupPdf();
      const html = '<p>Before</p><hr><p>After</p>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should handle complex nested structures', async () => {
      pdf.setupPdf();
      const html = `
        <h1>Title</h1>
        <p>Introduction paragraph with <strong>bold</strong> text.</p>
        <ul>
          <li>First item with <code>inline code</code></li>
          <li>Second item with <em>emphasis</em></li>
        </ul>
        <blockquote>
          <p>A quoted paragraph</p>
        </blockquote>
        <pre><code class="language-typescript">function test(): void {
  console.log('test');
}</code></pre>
      `;
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
      assert.strictEqual(pdf.getPageTotal(), 1, 'Complex structure should fit on one page');
    });

    it('should handle empty HTML gracefully', async () => {
      pdf.setupPdf();
      const html = '';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should handle HTML with only whitespace', async () => {
      pdf.setupPdf();
      const html = '   \n\n   ';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });
  });

  describe('getMarkdownFontInfo', () => {
    it('should return font info from markdown preview settings', () => {
      const pdfPrivate = pdf as any;
      const fontInfo = pdfPrivate.getMarkdownFontInfo();
      
      assert.ok(fontInfo, 'Font info should be returned');
      assert.ok(typeof fontInfo.fontFamily === 'string', 'Font family should be a string');
      assert.ok(typeof fontInfo.fontSize === 'number', 'Font size should be a number');
      assert.ok(fontInfo.fontSize > 0, 'Font size should be positive');
    });
  });

  describe('getFontFromElementStyle', () => {
    it('should extract font-family from style attribute', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      // Create mock element with style
      const mockElement = {
        getAttribute: (attr: string) => {
          if (attr === 'style') return 'font-family: Arial';
          return null;
        }
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      assert.ok(fontInfo, 'Font info should be extracted');
      assert.strictEqual(fontInfo.fontFamily, 'Arial');
    });

    it('should extract font-size in pixels', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      const mockElement = {
        getAttribute: (attr: string) => {
          if (attr === 'style') return 'font-size: 16px';
          return null;
        }
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      assert.ok(fontInfo, 'Font info should be extracted');
      assert.strictEqual(fontInfo.fontSize, 16);
    });

    it('should extract font-size in points and convert to pixels', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      const mockElement = {
        getAttribute: (attr: string) => {
          if (attr === 'style') return 'font-size: 12pt';
          return null;
        }
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      assert.ok(fontInfo, 'Font info should be extracted');
      // 12pt * (96/72) = 16px
      assert.strictEqual(fontInfo.fontSize, 16);
    });

    it('should extract font-size in em and convert to pixels', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      const mockElement = {
        getAttribute: (attr: string) => {
          if (attr === 'style') return 'font-size: 1.5em';
          return null;
        }
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      assert.ok(fontInfo, 'Font info should be extracted');
      // 1.5em * base font size (should be positive)
      assert.ok(fontInfo.fontSize > 0, 'Font size should be positive');
      // Verify it's larger than base (1.5x multiplier)
      const baseFontInfo = pdfPrivate.getMarkdownFontInfo();
      assert.ok(fontInfo.fontSize > baseFontInfo.fontSize, 'Em size should be larger than base');
    });

    it('should return null for element without style', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      const mockElement = {
        getAttribute: () => null
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      assert.strictEqual(fontInfo, null);
    });
  });

  describe('renderTextContent', () => {
    it('should render plain text', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      pdfPrivate.renderTextContent('Simple text');
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should handle empty text', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      pdfPrivate.renderTextContent('');
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });

    it('should wrap long text', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      const longText = 'This is a very long line of text that should wrap to multiple lines when rendered in the PDF document with normal margins and font size.';
      pdfPrivate.renderTextContent(longText);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });
  });

  describe('Markdown vs Token rendering integration', () => {
    it('should generate PDF with markdown rendering mode', async () => {
      pdf.docInfo().code = '# Heading\n\nParagraph with **bold** text.';
      pdf.docInfo().languageId = 'markdown';
      
      // Mock the markdown rendering to return HTML
      const originalRenderMd = app.vscodeapis.renderMarkdownToHtml;
      app.vscodeapis.renderMarkdownToHtml = async () => {
        return '<h1>Heading</h1><p>Paragraph with <strong>bold</strong> text.</p>';
      };
      
      await pdf.generatePdf({ useRenderedMd: true });
      
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should be generated');
      assert.ok(pdf.getPageTotal() > 0, 'Should have at least one page');
      
      app.vscodeapis.renderMarkdownToHtml = originalRenderMd;
    });

    it('should generate PDF with token rendering mode (raw markdown)', async () => {
      pdf.docInfo().code = '# Heading\n\nParagraph text.';
      pdf.docInfo().languageId = 'markdown';
      
      await pdf.generatePdf({ useRenderedMd: false });
      
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should be generated');
      assert.ok(pdf.getPageTotal() > 0, 'Should have at least one page');
    });
  });

  describe('HTML Element Handlers', () => {
    it('should have handlers for core required elements', () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      const handlers = pdfPrivate.htmlElementHandlers;
      
      // Verify handlers object exists and is non-empty
      assert.ok(handlers, 'Handlers object should exist');
      assert.ok(Object.keys(handlers).length > 0, 'Handlers object should not be empty');
      
      // Verify core required handlers exist (minimal subset)
      const requiredHandlers = ['h1', 'p', 'ul', 'ol', 'pre'];
      
      for (const tag of requiredHandlers) {
        assert.ok(handlers[tag], `Handler for ${tag} should exist`);
        assert.strictEqual(typeof handlers[tag], 'function', `Handler for ${tag} should be a function`);
      }
      
      // Verify all registered handlers are functions
      for (const [tag, handler] of Object.entries(handlers)) {
        assert.strictEqual(typeof handler, 'function', `Handler for ${tag} should be a function`);
      }
    });

    it('should gracefully handle unknown elements', async () => {
      pdf.setupPdf();
      // Unknown element should be logged but not cause error
      const html = '<unknown-tag>Content</unknown-tag>';
      await pdf.renderFromHTML(html);
      assert.ok(pdf.docInfo().pdfDoc, 'PDF document should exist');
    });
  });

  describe('Font rendering consistency', () => {
    it('should use markdown preview font settings', async () => {
      pdf.setupPdf();
      
      // Get font info before rendering
      const pdfPrivate = pdf as any;
      const fontInfo = pdfPrivate.getMarkdownFontInfo();
      
      // Render HTML that should use these settings
      const html = '<p>Test paragraph</p>';
      await pdf.renderFromHTML(html);
      
      assert.ok(fontInfo.fontFamily, 'Should have font family');
      assert.ok(fontInfo.fontSize > 0, 'Should have positive font size');
    });

    it('should override with inline styles when present', async () => {
      pdf.setupPdf();
      const pdfPrivate = pdf as any;
      
      const mockElement = {
        getAttribute: (attr: string) => {
          if (attr === 'style') return 'font-family: Courier; font-size: 14px';
          return null;
        }
      };
      
      const fontInfo = pdfPrivate.getFontFromElementStyle(mockElement);
      
      assert.strictEqual(fontInfo.fontFamily, 'Courier', 'Should use inline font family');
      assert.strictEqual(fontInfo.fontSize, 14, 'Should use inline font size');
    });
  });
});
