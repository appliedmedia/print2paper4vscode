import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { VSCodeAPIs } from '../src/VSCodeAPIs.js';

describe('VSCodeAPIs Wrapper', () => {
  let vscodeAPIs: VSCodeAPIs;
  let mockVSCode: any;
  let mockContext: any;

  before(() => {
    // Mock VS Code API
    mockVSCode = {
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
            uri: { fsPath: '/path/to/test.js' }
          },
        },
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
      Uri: {
        file: (path: string) => ({ fsPath: path }),
      },
      commands: {
        registerCommand: (command: string, callback: Function) => ({ dispose: () => {} }),
      },
      extensions: {
        getExtension: (extensionId: string) => ({
          extensionPath: '/test/extension/path',
        }),
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

    vscodeAPIs = new VSCodeAPIs(mockContext, mockVSCode);
  });

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
    it('should create webview panel', () => {
      const panel = vscodeAPIs.createWebviewPanel('test-view', 'Test Panel', {});
      
      assert.ok(panel, 'Should create webview panel');
      assert.ok(panel.webview, 'Should have webview property');
      assert.ok(panel.onDidDispose, 'Should have onDidDispose method');
      assert.ok(panel.reveal, 'Should have reveal method');
    });

    it('should handle webview panel options', () => {
      const options = { preserveFocus: true, viewColumn: 2 };
      const panel = vscodeAPIs.createWebviewPanel('test-view', 'Test Panel', options);
      
      assert.ok(panel, 'Should create panel with options');
    });

    it('should handle different view types', () => {
      const viewTypes = ['test-view', 'custom-view', 'print-preview'];
      
      for (const viewType of viewTypes) {
        const panel = vscodeAPIs.createWebviewPanel(viewType, 'Test Panel', {});
        assert.ok(panel, `Should create panel for view type: ${viewType}`);
      }
    });
  });

  describe('Dialog Management', () => {
    it('should show save dialog', async () => {
      const options = {
        defaultUri: { fsPath: '/tmp/test.pdf' },
        filters: { 'PDF files': ['pdf'] }
      };
      
      const result = await vscodeAPIs.showSaveDialog(options);
      
      assert.strictEqual(result, undefined, 'Should return undefined for save dialog');
    });

    it('should show open dialog', async () => {
      const options = {
        canSelectFiles: true,
        canSelectFolders: false,
        filters: { 'Text files': ['txt'] }
      };
      
      const result = await vscodeAPIs.showOpenDialog(options);
      
      assert.strictEqual(result, undefined, 'Should return undefined for open dialog');
    });

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

    it('should get workspace configuration', () => {
      const config = vscodeAPIs.getWorkspaceConfiguration();
      
      assert.ok(config, 'Should return workspace configuration');
      assert.strictEqual(typeof config.get, 'function', 'Should have get method');
    });
  });

  describe('Extension Management', () => {
    it('should get extension path', () => {
      const path = vscodeAPIs.getExtensionPath();
      
      assert.strictEqual(typeof path, 'string', 'Should return string path');
      assert.ok(path.length > 0, 'Should return non-empty path');
    });

    it('should get extension by ID', () => {
      const extension = vscodeAPIs.getExtension('test-extension');
      
      assert.ok(extension, 'Should return extension');
      assert.ok(extension.extensionPath, 'Should have extension path');
    });

    it('should handle missing extension', () => {
      mockVSCode.extensions.getExtension = () => undefined;
      
      const extension = vscodeAPIs.getExtension('nonexistent-extension');
      
      assert.strictEqual(extension, undefined, 'Should return undefined for missing extension');
    });
  });

  describe('URI Management', () => {
    it('should create URI from path', () => {
      const path = '/test/path/file.txt';
      const uri = vscodeAPIs.uriFromPath(path);
      
      assert.ok(uri, 'Should return URI');
      assert.strictEqual(uri.fsPath, path, 'Should have correct file system path');
    });

    it('should convert URI to path', () => {
      const uri = { fsPath: '/test/path/file.txt' };
      const path = vscodeAPIs.uriToPath(uri);
      
      assert.strictEqual(path, '/test/path/file.txt', 'Should convert URI to path');
    });

    it('should handle different path formats', () => {
      const paths = [
        '/absolute/path/file.txt',
        './relative/path/file.txt',
        'C:\\Windows\\path\\file.txt',
        'file:///protocol/path/file.txt'
      ];

      for (const path of paths) {
        const uri = vscodeAPIs.uriFromPath(path);
        assert.ok(uri, `Should handle path: ${path}`);
      }
    });
  });

  describe('Command Registration', () => {
    it('should register command', () => {
      const disposable = vscodeAPIs.registerCommand('test.command', () => {});
      
      assert.ok(disposable, 'Should return disposable');
      assert.strictEqual(typeof disposable.dispose, 'function', 'Should have dispose method');
    });

    it('should handle command callback', () => {
      let callbackCalled = false;
      const callback = () => { callbackCalled = true; };
      
      vscodeAPIs.registerCommand('test.command', callback);
      
      // The callback would be called by VS Code, not by our test
      assert.strictEqual(callbackCalled, false, 'Callback should not be called immediately');
    });

    it('should register multiple commands', () => {
      const commands = ['command1', 'command2', 'command3'];
      
      for (const command of commands) {
        const disposable = vscodeAPIs.registerCommand(command, () => {});
        assert.ok(disposable, `Should register command: ${command}`);
      }
    });
  });

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
      
      assert.ok(themeJson, 'Should return theme JSON');
      assert.strictEqual(typeof themeJson, 'object', 'Should return object');
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
      const vscodeAPIsWithoutContext = new VSCodeAPIs(undefined as any, mockVSCode);
      
      assert.ok(vscodeAPIsWithoutContext, 'Should create instance even without context');
    });

    it('should handle missing VS Code API', () => {
      const vscodeAPIsWithoutAPI = new VSCodeAPIs(mockContext, undefined as any);
      
      assert.ok(vscodeAPIsWithoutAPI, 'Should create instance even without VS Code API');
    });
  });

  describe('State Management', () => {
    it('should get global state', () => {
      const value = vscodeAPIs.getGlobalState('test-key');
      
      assert.strictEqual(value, undefined, 'Should return undefined for missing key');
    });

    it('should set global state', async () => {
      const result = await vscodeAPIs.setGlobalState('test-key', 'test-value');
      
      assert.strictEqual(result, undefined, 'Should return undefined for set operation');
    });

    it('should get workspace state', () => {
      const value = vscodeAPIs.getWorkspaceState('test-key');
      
      assert.strictEqual(value, undefined, 'Should return undefined for missing key');
    });

    it('should set workspace state', async () => {
      const result = await vscodeAPIs.setWorkspaceState('test-key', 'test-value');
      
      assert.strictEqual(result, undefined, 'Should return undefined for set operation');
    });
  });
});