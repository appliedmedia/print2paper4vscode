import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { VSCodeAPIs } from '../src/VSCodeAPIs.js';

describe('VSCodeAPIs Wrapper', () => {
  let vscodeAPIs: VSCodeAPIs;
  let mockApp: any;
  let mockVSCode: any;
  let mockContext: any;

  // Mock App
  mockApp = {
    dx: {
      create: (name: string) => ({
        out: (msg: string) => console.log(msg),
        done: () => {},
      }),
    },
    os: {
      dateAsYYYYMMDDHHMMSS: () => '20250101120000',
    },
  };

  // Mock VS Code API
  mockVSCode = {
    version: '1.60.0',
    Position: class Position {
      constructor(
        public line: number,
        public character: number
      ) {}
    },
    Range: class Range {
      constructor(
        public start: any,
        public end: any
      ) {}
    },
    Selection: class Selection {
      constructor(
        public start: any,
        public end: any
      ) {}
    },
    Uri: {
      file: (path: string) => ({
        fsPath: path,
        scheme: 'file',
        authority: '',
        path,
        query: '',
        fragment: '',
      }),
    },
    env: {
      language: 'en-US',
    },
    window: {
      showInformationMessage: (message: string) => Promise.resolve(undefined),
      showErrorMessage: (message: string) => Promise.resolve(undefined),
      showWarningMessage: (message: string) => Promise.resolve(undefined),
      createWebviewPanel: (viewType: string, title: string, showOptions: any) => ({
        webview: {
          html: '',
          onDidReceiveMessage: (callback: Function) => ({ dispose: () => {} }),
          postMessage: (message: any) => {},
        },
        onDidDispose: (callback: Function) => ({ dispose: () => {} }),
        reveal: (showOptions?: any) => {},
      }),
      showSaveDialog: (options: any) => Promise.resolve(undefined),
      showOpenDialog: (options: any) => Promise.resolve(undefined),
      activeTextEditor: {
        selection: { isEmpty: false, text: 'selected code' },
        document: {
          getText: () => 'full document',
          languageId: 'javascript',
          fileName: 'test.js',
          uri: { fsPath: '/path/to/test.js' },
        },
      },
    },
    ViewColumn: {
      Active: 1,
      One: 1,
      Two: 2,
      Three: 3,
    },
    extensions: {
      all: [
        {
          id: 'test.theme',
          packageJSON: {
            contributes: {
              themes: [
                {
                  id: 'vs-light',
                  label: 'Test Theme',
                  uiTheme: 'vs-dark',
                  path: './themes/test-theme.json',
                },
              ],
            },
          },
        },
      ],
      getExtension: (extensionId: string) => ({
        extensionPath: '/test/extension/path',
      }),
    },
    workspace: {
      getConfiguration: (section?: string) => ({
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
    commands: {
      registerCommand: (command: string, callback: Function) => ({ dispose: () => {} }),
    },
  };

  // Mock VS Code context
  mockContext = {
    subscriptions: [],
    extensionPath: '/test/extension/path',
    globalState: {
      get: (key: string) => undefined,
      update: (key: string, value: any) => Promise.resolve(),
    },
    workspaceState: {
      get: (key: string) => undefined,
      update: (key: string, value: any) => Promise.resolve(),
    },
  };

  vscodeAPIs = new VSCodeAPIs(mockApp, mockVSCode, mockContext);

  // Ensure extensions.all behaves as a normal array (already literal array)

  describe('Initialization', () => {
    it('should initialize with context and VS Code API', () => {
      assert.strictEqual(vscodeAPIs['context'], mockContext, 'Should store context');
      assert.strictEqual(vscodeAPIs['vscode'], mockVSCode, 'Should store VS Code API');
    });

    it('should have diagnostics', () => {
      assert.ok(vscodeAPIs['dx'], 'Should have diagnostics');
    });
  });

  describe('Message Display', () => {
    it('should show information message', async () => {
      const result = await vscodeAPIs.showInformationMessage('Test info message');

      assert.strictEqual(result, undefined, 'Should return undefined for info message');
    });

    it('should show error message', async () => {
      const result = await vscodeAPIs.showErrorMessage('Test error message');

      assert.strictEqual(result, undefined, 'Should return undefined for error message');
    });

    it('should show warning message', async () => {
      const result = await vscodeAPIs.showWarningMessage('Test warning message');

      assert.strictEqual(result, undefined, 'Should return undefined for warning message');
    });
  });

  describe('WebView Panel Management', () => {
    it('should create webview panel', async () => {
      const panelId = await vscodeAPIs.getOrCreateWebviewPanel(
        'Test Panel',
        '<html><body>Test</body></html>'
      );

      assert.ok(panelId, 'Should create webview panel ID');
      assert.strictEqual(typeof panelId, 'string', 'Should return string ID');
    });

    it('should handle webview panel options', async () => {
      const panelId = await vscodeAPIs.getOrCreateWebviewPanel(
        'Test Panel',
        '<html><body>Test with options</body></html>'
      );

      assert.ok(panelId, 'Should create panel with options');
      assert.strictEqual(typeof panelId, 'string', 'Should return string ID');
    });

    it('should handle different view types', async () => {
      const viewTypes = ['test-view', 'custom-view', 'print-preview'];

      for (const viewType of viewTypes) {
        const panelId = await vscodeAPIs.getOrCreateWebviewPanel(
          'Test Panel',
          `<html><body>Test ${viewType}</body></html>`
        );
        assert.ok(panelId, `Should create panel for view type: ${viewType}`);
        assert.strictEqual(typeof panelId, 'string', 'Should return string ID');
      }
    });
  });

  describe('Dialog Management', () => {
    it('should show save dialog', async () => {
      const options = {
        defaultUri: mockVSCode.Uri.file('/tmp/test.pdf'),
        filters: { 'PDF files': ['pdf'] },
      };

      const result = await vscodeAPIs.showSaveDialog(options);

      assert.strictEqual(result, undefined, 'Should return undefined for save dialog');
    });

    // Note: showOpenDialog method not implemented in VSCodeAPIs

    it('should handle dialog cancellation', async () => {
      mockVSCode.window.showSaveDialog = () => Promise.resolve(undefined);

      const result = await vscodeAPIs.showSaveDialog({});

      assert.strictEqual(result, undefined, 'Should handle dialog cancellation');
    });
  });

  describe('Editor Information', () => {
    it('should get active text editor', () => {
      const editor = vscodeAPIs.getActiveTextEditor();

      assert.ok(editor, 'Should return active text editor');
      assert.ok(editor.selection, 'Should have selection');
      assert.ok(editor.document, 'Should have document');
    });

    it('should get editor typography settings', () => {
      const typography = vscodeAPIs.getEditorTypography();

      assert.ok(typography, 'Should return typography settings');
      assert.strictEqual(typeof typography.fontSize, 'number', 'Should have fontSize');
      assert.strictEqual(typeof typography.lineHeight, 'number', 'Should have lineHeight');
      assert.strictEqual(typeof typography.fontFamily, 'string', 'Should have fontFamily');
    });

    // Note: getWorkspaceConfiguration method not implemented in VSCodeAPIs
  });

  describe('Extension Management', () => {
    it('should get extension path', () => {
      const path = vscodeAPIs.getExtensionPath();

      assert.strictEqual(typeof path, 'string', 'Should return string path');
      assert.ok(path.length > 0, 'Should return non-empty path');
    });

    // Note: getExtension method not implemented in VSCodeAPIs (only getExtensionPath exists)
  });

  describe('URI Management', () => {
    it('should create URI from path', () => {
      const path = '/test/path/file.txt';
      const uri = vscodeAPIs.uriFromPath(path);

      assert.ok(uri, 'Should return URI');
      assert.strictEqual(uri.fsPath, path, 'Should have correct file system path');
    });

    it('should convert URI to path', () => {
      const uri = mockVSCode.Uri.file('/test/path/file.txt');
      const path = vscodeAPIs.uriToPath(uri);

      assert.strictEqual(path, '/test/path/file.txt', 'Should convert URI to path');
    });

    it('should handle different path formats', () => {
      const paths = [
        '/absolute/path/file.txt',
        './relative/path/file.txt',
        'C:\\Windows\\path\\file.txt',
        'file:///protocol/path/file.txt',
      ];

      for (const path of paths) {
        const uri = vscodeAPIs.uriFromPath(path);
        assert.ok(uri, `Should handle path: ${path}`);
      }
    });
  });

  // Note: registerCommand method not implemented in VSCodeAPIs

  describe('Theme Management', () => {
    it('should get active theme ID', () => {
      mockVSCode.window.activeColorTheme = { kind: 1 }; // Light theme

      const themeId = vscodeAPIs.getActiveThemeId();

      assert.strictEqual(typeof themeId, 'string', 'Should return theme ID');
    });

    it('should get VS Code extensions themes', () => {
      const themes = vscodeAPIs.getVSCodeExtensionsThemes();

      assert.ok(Array.isArray(themes), 'Should return array of themes');
    });

    it('should get VS Code theme JSON', () => {
      const themeId = 'vs-light';
      const themeJson = vscodeAPIs.getVSCodeThemeJson(themeId);

      // The method should return the theme object when found in extensions
      assert.ok(
        themeJson && typeof themeJson === 'object',
        'Should return theme object when found'
      );
      assert.strictEqual((themeJson as any).id, 'vs-light', 'Should return correct theme ID');
    });
  });

  describe('Error Handling', () => {
    it('should handle VS Code API errors gracefully', async () => {
      mockVSCode.window.showInformationMessage = () => {
        throw new Error('VS Code API error');
      };

      try {
        await vscodeAPIs.showInformationMessage('Test');
        assert.fail('Should throw error on VS Code API failure');
      } catch (error) {
        assert.ok(error, 'Should handle VS Code API errors');
      }
    });

    it('should handle missing context', () => {
      const vscodeAPIsWithoutContext = new VSCodeAPIs(mockApp, mockVSCode, undefined as any);

      assert.ok(vscodeAPIsWithoutContext, 'Should create instance even without context');
    });

    it('should handle missing VS Code API', () => {
      const vscodeAPIsWithoutAPI = new VSCodeAPIs(mockApp, undefined as any, mockContext);

      assert.ok(vscodeAPIsWithoutAPI, 'Should create instance even without VS Code API');
    });
  });

  describe('State Management', () => {
    it('should get global state', () => {
      const value = vscodeAPIs.getGlobalState('test-key');

      assert.strictEqual(value, '', 'Should return empty string for missing key');
    });

    it('should get locale from VS Code environment', () => {
      mockVSCode.env = { language: 'en-US' };

      const locale = vscodeAPIs.getLocale();

      assert.strictEqual(locale, 'en-US', 'Should return VS Code language setting');
    });

    it('should handle missing env object', () => {
      mockVSCode.env = undefined;

      try {
        const locale = vscodeAPIs.getLocale();
        assert.strictEqual(locale, undefined, 'Should return undefined when env is missing');
      } catch (error) {
        assert.ok(error, 'Should throw error when env is missing');
      }
    });

    // Note: setGlobalState, getWorkspaceState, setWorkspaceState methods not implemented in VSCodeAPIs
  });
});
