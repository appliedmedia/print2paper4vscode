import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';

describe('App Core Functionality', () => {
  let app: App;
  let mockContext: any;

  // Setup before each test
  const setup = () => {
    // Mock VS Code context
    mockContext = {
      subscriptions: [],
      extensionPath: '/test/extension/path',
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
      },
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
      },
    };

    // Mock VS Code API
    const mockVSCode = {
      window: {
        showInformationMessage: () => Promise.resolve(undefined),
        showErrorMessage: () => Promise.resolve(undefined),
        showWarningMessage: () => Promise.resolve(undefined),
        createWebviewPanel: () => ({
          webview: {
            html: '',
            onDidReceiveMessage: () => ({ dispose: () => {} }),
            postMessage: () => {},
          },
          onDidDispose: () => ({ dispose: () => {} }),
          reveal: () => {},
        }),
        showSaveDialog: () => Promise.resolve(undefined),
        showOpenDialog: () => Promise.resolve(undefined),
        activeTextEditor: {
          selection: { isEmpty: false, text: 'test code' },
          document: { getText: () => 'test code', languageId: 'javascript' },
        },
      },
      workspace: {
        getConfiguration: () => ({
          get: (key: string) => {
            const config: { [key: string]: any } = {
              'editor.fontSize': 14,
              'editor.lineHeight': 20,
              'editor.fontFamily': 'Consolas, monospace',
            };
            return config[key];
          },
        }),
      },
      Uri: {
        file: (path: string) => ({ fsPath: path }),
      },
      commands: {
        registerCommand: () => ({ dispose: () => {} }),
      },
      extensions: {
        getExtension: () => ({
          extensionPath: '/test/extension/path',
        }),
      },
    };

    // Create app instance
    app = new App(mockContext, mockVSCode);
  };

  // Call setup before each test
  setup();

  describe('Initialization', () => {
    it('should initialize all components', () => {
      assert.ok(app.dx, 'Should have diagnostics');
      assert.ok(app.vscodeapis, 'Should have VS Code APIs');
      assert.ok(app.os, 'Should have OS abstraction');
      assert.ok(app.ui, 'Should have UI abstraction');
      assert.ok(app.stylize, 'Should have stylize component');
      assert.ok(app.pdf, 'Should have PDF component');
      assert.ok(app.paperPrinter, 'Should have paper printer');
      // ClipboardCapture is not a direct property of App
      assert.ok(app.tabInspector, 'Should have tab inspector');
    });

    it('should have correct component types', () => {
      assert.strictEqual(typeof app.dx.create, 'function', 'Diagnostics should have create method');
      assert.strictEqual(typeof app.vscodeapis.getActiveTextEditor, 'function', 'VSCodeAPIs should have getActiveTextEditor method');
      assert.strictEqual(typeof app.os.fileOpenInDefaultApp, 'function', 'OS should have fileOpenInDefaultApp method');
      assert.strictEqual(typeof app.ui.addToolbar, 'function', 'UI should have addToolbar method');
      assert.strictEqual(typeof app.stylize.styleToHtml, 'function', 'Stylize should have styleToHtml method');
      assert.strictEqual(typeof app.pdf.generatePdfFromTokens, 'function', 'PDF should have generatePdfFromTokens method');
      assert.strictEqual(typeof app.paperPrinter.handleFirstPrintCommand, 'function', 'PaperPrinter should have handleFirstPrintCommand method');
      // ClipboardCapture is not a direct property of App
      assert.strictEqual(typeof app.tabInspector.inspectTab, 'function', 'TabInspector should have inspectTab method');
    });
  });

  describe('Component Integration', () => {
    it('should pass app reference to all components', () => {
      // Check that components have access to the app instance
      assert.strictEqual(app.pdf['app'], app, 'PDF should have app reference');
      assert.strictEqual(app.stylize['app'], app, 'Stylize should have app reference');
      assert.strictEqual(app.paperPrinter['app'], app, 'PaperPrinter should have app reference');
      assert.strictEqual(app.ui['app'], app, 'UI should have app reference');
    });

    it('should initialize diagnostics with correct names', () => {
      const dxNames = [
        'App',
        'VSCodeAPIs', 
        'OS',
        'UI',
        'Stylize',
        'PDF',
        'PaperPrinter',
        'ClipboardCapture',
        'TabInspector'
      ];

      // Check that diagnostics are created for all components
      for (const name of dxNames) {
        const dx = app.dx.create(name);
        assert.ok(dx, `Should create diagnostics for ${name}`);
        assert.strictEqual(typeof dx.out, 'function', `${name} diagnostics should have out method`);
        assert.strictEqual(typeof dx.done, 'function', `${name} diagnostics should have done method`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing VS Code context gracefully', () => {
      // This should not throw an error
      const appWithoutContext = new App(undefined as any, {} as any);
      assert.ok(appWithoutContext, 'Should create app even without context');
    });

    it('should handle missing VS Code API gracefully', () => {
      // This should not throw an error
      const appWithoutAPI = new App(mockContext, {} as any);
      assert.ok(appWithoutAPI, 'Should create app even without VS Code API');
    });
  });

  describe('Platform Detection', () => {
    it('should detect correct OS platform', () => {
      const platform = process.platform;
      
      if (platform === 'win32') {
        assert.strictEqual(app.os.constructor.name, 'OSWin', 'Should use OSWin on Windows');
      } else if (platform === 'linux') {
        assert.strictEqual(app.os.constructor.name, 'OSLinux', 'Should use OSLinux on Linux');
      } else {
        assert.strictEqual(app.os.constructor.name, 'OSMac', 'Should use OSMac on other platforms');
      }
    });
  });

  describe('Extension Lifecycle', () => {
    it('should have init and done methods', () => {
      assert.strictEqual(typeof app.init, 'function', 'Should have init method');
      assert.strictEqual(typeof app.done, 'function', 'Should have done method');
    });

    it('should initialize all components', () => {
      // Test that init method exists and can be called
      assert.doesNotThrow(() => app.init(), 'Init should not throw');
    });
  });
});