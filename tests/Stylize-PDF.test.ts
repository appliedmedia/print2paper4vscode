import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { Stylize } from '../src/Stylize.js';

describe('Stylize PDF Integration', () => {
  let stylize: Stylize;
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
      vscodeapis: {
        getEditorTypography: () => ({ 
          fontSize: 14, 
          lineHeight: 20, 
          fontFamily: 'Consolas, monospace' 
        }),
        getActiveThemeId: () => 'vs-light',
        getVSCodeExtensionsThemes: () => [
          { id: 'vs-extension', displayName: 'VS Extension', extensionPath: '/path/to/vs' },
        ],
        getVSCodeThemeJson: (themeId: string) => {
          const themes: { [key: string]: any } = {
            'vs-light': {
              id: 'vs-light',
              label: 'VS Light',
              colors: { 'editor.background': '#ffffff', 'editor.foreground': '#000000' },
              tokenColors: [
                { scope: ['keyword'], settings: { foreground: '#0000ff' } },
                { scope: ['string'], settings: { foreground: '#008000' } },
              ],
            },
          };
          return themes[themeId] || null;
        },
      },
      pdf: {
        generatePdfFromTokens: async (
          _tokens: any,
          _fontFamily: string,
          _fontSize: number,
          _lineHeight: number,
          _title?: string
        ) => ({
          getNumberOfPages: () => 1,
          getPageWidth: () => 595.28,
          getPageHeight: () => 841.89,
          output: (type: string) =>
            type === 'arraybuffer' ? new ArrayBuffer(256) : 'mock',
        }),
      },
    };

    stylize = new Stylize(mockApp);
  });

  describe('styleToPdf', () => {
    it('should generate PDF from code with syntax highlighting', async () => {
      const code = 'function test() {\n  return "hello";\n}';
      const language = 'javascript';
      const theme = 'github-light';

      const pdfDoc = await stylize.styleToPdf(code, language, { theme });

      assert.ok(pdfDoc, 'PDF document should be created');
      assert.strictEqual(typeof pdfDoc.getNumberOfPages, 'function', 'Should be a jsPDF-like object');
      assert.ok(pdfDoc.getNumberOfPages() > 0, 'Should have at least one page');
    });

    it('should handle empty code', async () => {
      const pdfDoc = await stylize.styleToPdf('', 'javascript', { theme: 'github-light' });

      assert.ok(pdfDoc, 'PDF document should be created even for empty code');
      assert.strictEqual(pdfDoc.getNumberOfPages(), 1, 'Should have one page for empty code');
    });

    it('should handle multi-line code', async () => {
      const code = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;
      
      const pdfDoc = await stylize.styleToPdf(code, 'javascript', { theme: 'github-light' });

      assert.ok(pdfDoc, 'PDF document should be created');
      assert.ok(pdfDoc.getNumberOfPages() > 0, 'Should have pages for multi-line code');
    });

    it('should use theme colors for syntax highlighting', async () => {
      const code = 'const message = "Hello, World!";';
      const pdfDoc = await stylize.styleToPdf(code, 'javascript', { theme: 'github-light' });

      assert.ok(pdfDoc, 'PDF document should be created with theme colors');
    });

    it('should use editor typography settings', async () => {
      const code = 'console.log("test");';
      
      // Mock different typography settings
      mockApp.vscodeapis.getEditorTypography = () => ({
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Fira Code, monospace'
      });

      const pdfDoc = await stylize.styleToPdf(code, 'javascript', { theme: 'github-light' });

      assert.ok(pdfDoc, 'PDF document should be created with custom typography');
    });

    it('should handle different programming languages', async () => {
      const testCases = [
        { code: 'def hello(): print("world")', language: 'python' },
        { code: 'public class Test { }', language: 'java' },
        { code: 'SELECT * FROM users;', language: 'sql' },
        { code: '#include <stdio.h>', language: 'c' },
      ];

      for (const testCase of testCases) {
        const pdfDoc = await stylize.styleToPdf(testCase.code, testCase.language, { theme: 'github-light' });
        assert.ok(pdfDoc, `PDF should be created for ${testCase.language}`);
      }
    });

    it('should handle different themes', async () => {
      const code = 'const x = 42;';
      const themes = ['github-light', 'github-dark', 'vs-light', 'vs-dark'];

      for (const theme of themes) {
        const pdfDoc = await stylize.styleToPdf(code, 'javascript', { theme });
        assert.ok(pdfDoc, `PDF should be created with ${theme} theme`);
      }
    });
  });

  describe('generateHtmlFromTokens', () => {
    it('should generate HTML from Shiki tokens', () => {
      const mockTokens = [
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

      const html = stylize['generateHtmlFromTokens'](mockTokens, 14, 20);

      assert.ok(html.includes('<pre'), 'Should contain pre tag');
      assert.ok(html.includes('function'), 'Should contain function keyword');
      assert.ok(html.includes('return'), 'Should contain return keyword');
      assert.ok(html.includes('"hello"'), 'Should contain string literal');
      assert.ok(html.includes('font-size: 14px'), 'Should use correct font size');
      assert.ok(html.includes('line-height: 20px'), 'Should use correct line height');
    });

    it('should handle tokens with missing color information', () => {
      const mockTokens = [
        [
          { content: 'test', color: undefined, fontStyle: 0 },
          { content: ' ', color: undefined, fontStyle: 0 },
          { content: 'code', color: undefined, fontStyle: 0 },
        ],
      ];

      const html = stylize['generateHtmlFromTokens'](mockTokens, 14, 20);

      assert.ok(html.includes('test'), 'Should contain token content');
      assert.ok(html.includes('code'), 'Should contain token content');
    });

    it('should handle empty token array', () => {
      const html = stylize['generateHtmlFromTokens']([], 14, 20);

      assert.ok(html.includes('<pre'), 'Should contain pre tag');
      assert.ok(html.includes('</pre>'), 'Should close pre tag');
    });
  });

  describe('createHtmlPage', () => {
    it('should wrap HTML code in complete page structure', () => {
      const codeHtml = '<span>test code</span>';
      const title = 'Test Document';
      const fontSize = 14;
      const lineHeight = 20;

      const html = stylize['createHtmlPage'](codeHtml, fontSize, lineHeight, title);

      assert.ok(html.includes('<!DOCTYPE html>'), 'Should contain DOCTYPE');
      assert.ok(html.includes('<html'), 'Should contain html tag');
      assert.ok(html.includes('<head>'), 'Should contain head section');
      assert.ok(html.includes('<title>Test Document</title>'), 'Should contain title');
      assert.ok(html.includes('<body>'), 'Should contain body');
      assert.ok(html.includes('test code'), 'Should contain the code HTML');
      assert.ok(html.includes('font-family: Consolas, monospace'), 'Should use correct font family');
      assert.ok(html.includes('font-size: 14px'), 'Should use correct font size');
      assert.ok(html.includes('line-height: 20px'), 'Should use correct line height');
    });

    it('should handle different font families', () => {
      const codeHtml = '<span>test</span>';
      const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Fira Code'];

      for (const fontFamily of fontFamilies) {
        // Swap editor typography to simulate each font preference
        mockApp.vscodeapis.getEditorTypography = () => ({
          fontSize: 14,
          lineHeight: 20,
          fontFamily,
        });
        const html = stylize['createHtmlPage'](codeHtml, 14, 20, 'Test');
        assert.ok(html.includes(`font-family: ${fontFamily}`), `Should use ${fontFamily} font`);
      }
    });
  });

  describe('getFontFamilyFromTheme', () => {
    it('should get font family from theme or editor settings', () => {
      // Test with editor settings
      const fontFamily1 = stylize['getFontFamilyFromTheme'](null);
      assert.strictEqual(fontFamily1, 'Consolas, monospace', 'Should use editor font family');

      // Test with theme override
      mockApp.vscodeapis.getVSCodeThemeJson = () => ({
        id: 'custom-theme',
        colors: { 'editor.background': '#ffffff' },
        tokenColors: [],
        fonts: {
          editor: 'Fira Code, monospace'
        }
      });

      const fontFamily2 = stylize['getFontFamilyFromTheme'](mockApp.vscodeapis.getVSCodeThemeJson('custom-theme'));
      assert.strictEqual(fontFamily2, 'Fira Code, monospace', 'Should use theme font family');
    });

    it('should fallback to editor settings when theme has no font', () => {
      mockApp.vscodeapis.getVSCodeThemeJson = () => ({
        id: 'no-font-theme',
        colors: { 'editor.background': '#ffffff' },
        tokenColors: [],
        // No fonts property
      });

      const fontFamily = stylize['getFontFamilyFromTheme'](mockApp.vscodeapis.getVSCodeThemeJson('no-font-theme'));
      assert.strictEqual(fontFamily, 'Consolas, monospace', 'Should fallback to editor settings');
    });
  });
});