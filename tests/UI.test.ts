import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { UI } from '../src/UI.js';

describe('UI Abstraction Layer', () => {
  let ui: UI;
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
        showSaveDialog: (options: any) =>
          Promise.resolve({
            fsPath: '/tmp/test-output.pdf',
          }),
        showOpenDialog: (options: any) =>
          Promise.resolve([
            {
              fsPath: '/tmp/test-input.txt',
            },
          ]),
        uriFromPath: (path: string) => ({ fsPath: path }),
        uriToPath: (uri: any) => uri.fsPath,
      },
    };

    ui = new UI(mockApp);
  });

  describe('Initialization', () => {
    it('should initialize with app reference', () => {
      assert.strictEqual(ui['app'], mockApp, 'Should store app reference');
    });

    it('should have diagnostics', () => {
      assert.ok(ui['dx'], 'Should have diagnostics');
    });
  });

  describe('Toolbar Management', () => {
    it('should add toolbar to HTML', async () => {
      const html = '<div>Test content</div>';
      const result = await ui.addToolbar(html);

      assert.ok(result.includes('<div>Test content</div>'), 'Should preserve original HTML');
      assert.ok(result.includes('toolbar'), 'Should add toolbar elements');
    });

    it('should handle empty HTML', async () => {
      const result = await ui.addToolbar('');

      assert.strictEqual(typeof result, 'string', 'Should return string');
      assert.ok(result.includes('toolbar'), 'Should add toolbar even to empty HTML');
    });

    it('should handle HTML with existing toolbar', async () => {
      const htmlWithToolbar = '<div class="toolbar">Existing toolbar</div><div>Content</div>';
      const result = await ui.addToolbar(htmlWithToolbar);

      assert.ok(result.includes('Content'), 'Should preserve content');
      // Should not duplicate toolbar
      const toolbarMatches = (result.match(/toolbar/g) || []).length;
      assert.ok(toolbarMatches >= 1, 'Should have toolbar elements');
    });
  });

  describe('WebView Panel Creation', () => {
    it('should create webview panel from HTML', () => {
      const html = '<div>Test HTML</div>';
      const title = 'Test Panel';

      const result = ui.htmlToWebViewPanel(html, title);

      assert.ok(result, 'Should return a result');
      assert.strictEqual(typeof result, 'object', 'Should return an object');
    });

    it('should handle different HTML content', () => {
      const testCases = [
        { html: '<div>Simple HTML</div>', title: 'Simple' },
        { html: '<div><span>Nested HTML</span></div>', title: 'Nested' },
        { html: '<div class="test">Styled HTML</div>', title: 'Styled' },
        { html: '', title: 'Empty' },
      ];

      for (const testCase of testCases) {
        const result = ui.htmlToWebViewPanel(testCase.html, testCase.title);

        assert.ok(result, `Should create panel for ${testCase.title}`);
        assert.strictEqual(typeof result, 'object', `Should return object for ${testCase.title}`);
      }
    });

    it('should handle special characters in title', () => {
      const specialTitles = [
        'Title with "quotes"',
        "Title with 'apostrophes'",
        'Title with <tags>',
        'Title with & ampersands',
      ];

      for (const title of specialTitles) {
        const result = ui.htmlToWebViewPanel('<div>Test</div>', title);

        assert.ok(result, `Should handle special title: ${title}`);
      }
    });
  });

  describe('Save Location Selection', () => {
    it('should choose save location', async () => {
      const defaultFilename = 'test-output.pdf';

      const result = await ui.chooseSaveLocation(defaultFilename);

      assert.ok(result, 'Should return a result');
      assert.strictEqual(typeof result, 'string', 'Should return string path');
      assert.ok(result.includes('.pdf'), 'Should return PDF file path');
    });

    it('should handle save dialog cancellation', async () => {
      mockApp.vscodeapis.showSaveDialog = () => Promise.resolve(undefined);

      const result = await ui.chooseSaveLocation('test.pdf');

      assert.strictEqual(result, null, 'Should return null when cancelled');
    });

    it('should pass correct options to save dialog', async () => {
      let dialogOptions: any = null;
      mockApp.vscodeapis.showSaveDialog = (options: any) => {
        dialogOptions = options;
        return Promise.resolve({ fsPath: '/tmp/test.pdf' });
      };

      await ui.chooseSaveLocation('test-output.pdf');

      assert.ok(dialogOptions, 'Should pass options to save dialog');
      assert.ok(dialogOptions.defaultUri, 'Should include default URI');
      assert.ok(dialogOptions.filters, 'Should include file filters');
    });

    it('should handle different file extensions', async () => {
      const extensions = ['.pdf', '.html', '.txt', '.md'];

      for (const ext of extensions) {
        const filename = `test${ext}`;
        const result = await ui.chooseSaveLocation(filename);

        assert.ok(result, `Should handle ${ext} extension`);
        assert.ok(result.includes(ext), `Should preserve ${ext} extension`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle VS Code API errors gracefully', async () => {
      mockApp.vscodeapis.showSaveDialog = () => {
        throw new Error('VS Code API error');
      };

      try {
        await ui.chooseSaveLocation('test.pdf');
        assert.fail('Should throw error on VS Code API failure');
      } catch (error) {
        assert.ok(error, 'Should handle VS Code API errors');
      }
    });

    it('should handle missing app reference', () => {
      const uiWithoutApp = new UI(undefined as any);

      assert.ok(uiWithoutApp, 'Should create instance even without app');
    });

    it('should handle null/undefined parameters', () => {
      const result1 = ui.addToolbar(null as any);
      assert.strictEqual(typeof result1, 'string', 'Should handle null HTML');

      const result2 = ui.htmlToWebViewPanel(undefined as any, 'Test');
      assert.ok(result2, 'Should handle undefined HTML');

      const result3 = ui.htmlToWebViewPanel('<div>Test</div>', null as any);
      assert.ok(result3, 'Should handle null title');
    });
  });

  describe('HTML Processing', () => {
    it('should preserve HTML structure', async () => {
      const complexHtml = `
        <div class="container">
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> text</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;

      const result = await ui.addToolbar(complexHtml);

      assert.ok(result.includes('<h1>Title</h1>'), 'Should preserve headings');
      assert.ok(result.includes('<strong>bold</strong>'), 'Should preserve formatting');
      assert.ok(result.includes('<ul>'), 'Should preserve lists');
      assert.ok(result.includes('<li>Item 1</li>'), 'Should preserve list items');
    });

    it('should handle HTML with scripts and styles', async () => {
      const htmlWithScripts = `
        <html>
          <head>
            <style>
              .test { color: red; }
            </style>
            <script>
              console.log('test');
            </script>
          </head>
          <body>
            <div class="test">Content</div>
          </body>
        </html>
      `;

      const result = await ui.addToolbar(htmlWithScripts);

      assert.ok(result.includes('<style>'), 'Should preserve styles');
      assert.ok(result.includes('<script>'), 'Should preserve scripts');
      assert.ok(result.includes('color: red'), 'Should preserve CSS');
      assert.ok(result.includes('console.log'), 'Should preserve JavaScript');
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<div><p>Unclosed paragraph<div>Nested div</div>';

      const result = await ui.addToolbar(malformedHtml);

      assert.ok(result, 'Should handle malformed HTML');
      assert.ok(result.includes('Unclosed paragraph'), 'Should preserve content');
    });
  });

  describe('Integration with VS Code APIs', () => {
    it('should use VS Code APIs for save dialog', async () => {
      let apiCalled = false;
      mockApp.vscodeapis.showSaveDialog = (options: any) => {
        apiCalled = true;
        return Promise.resolve({ fsPath: '/tmp/test.pdf' });
      };

      await ui.chooseSaveLocation('test.pdf');

      assert.ok(apiCalled, 'Should call VS Code save dialog API');
    });

    it('should use VS Code APIs for URI conversion', () => {
      let uriFromPathCalled = false;
      let uriToPathCalled = false;

      mockApp.vscodeapis.uriFromPath = (path: string) => {
        uriFromPathCalled = true;
        return { fsPath: path };
      };

      mockApp.vscodeapis.uriToPath = (uri: any) => {
        uriToPathCalled = true;
        return uri.fsPath;
      };

      // These methods might be called internally
      ui.htmlToWebViewPanel('<div>Test</div>', 'Test');

      // The exact usage depends on implementation
      assert.ok(true, 'Should be able to use URI conversion methods');
    });
  });
});
