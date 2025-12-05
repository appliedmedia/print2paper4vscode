import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import type { ExtensionContext } from 'vscode';
import { mockVSCode } from './test-utils.js';

// Mock VS Code context with state tracking for this test suite
let mockGlobalState: Record<string, any> = {};

const mockContext = {
  subscriptions: [],
  extensionPath: process.cwd(),
  globalState: {
    get: (key: string) => mockGlobalState[key],
    update: async (key: string, value: any) => {
      if (value === undefined) {
        delete mockGlobalState[key];
      } else {
        mockGlobalState[key] = value;
      }
    },
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

describe('VSCodeAPIs', () => {
  let app: App;

  beforeEach(() => {
    mockGlobalState = {}; // Reset state before each test
    app = new App({ context: mockContext, vscode: mockVSCode });
  });

  afterEach(() => {
    app.done();
  });

  it('should get global storage path', () => {
    const path = app.vscodeapis.getGlobalStoragePath();
    assert.strictEqual(path, '/tmp');
  });

  it('should update and get global state', () => {
    app.vscodeapis.updateGlobalState({ key: 'testKey', value: 'testValue' });
    const value = app.vscodeapis.getGlobalState('testKey');
    assert.strictEqual(value, 'testValue');
  });

  it('should get editor typography', () => {
    const typography = app.vscodeapis.getEditorTypography();
    assert.strictEqual(typography.fontSize, 14);
    assert.strictEqual(typography.lineHeight, 1.5);
    assert.strictEqual(typography.fontFamily, 'Monaco');
  });

  it('should get active text editor', () => {
    const editor = app.vscodeapis.getActiveTextEditor();
    assert.ok(editor !== undefined);
  });

  it('should get extension path', () => {
    const path = app.vscodeapis.getExtensionPath();
    assert.ok(typeof path === 'string');
  });

  it('should get active theme ID', () => {
    const themeId = app.vscodeapis.getActiveThemeId();
    assert.ok(typeof themeId === 'string');
  });

  it('should get or create webview panel', async () => {
    const panelId = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test Panel', html: '<html><body>Test</body></html>' });
    assert.ok(typeof panelId === 'string');
    assert.ok(panelId.length > 0);
  });

  it('should reuse existing webview panel', async () => {
    const panelId1 = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test', html: '<html></html>' });
    const panelId2 = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test', html: '<html></html>', existingPanelId: panelId1 });
    assert.strictEqual(panelId1, panelId2);
  });

  it('should get selection or document text', () => {
    const editor = app.vscodeapis.getActiveTextEditor();
    if (editor) {
      const text = app.vscodeapis.getSelectionOrDocumentText(editor);
      assert.ok(typeof text === 'string');
    }
  });

  it('should get active language ID', () => {
    const languageId = app.vscodeapis.getActiveLanguageId();
    assert.ok(typeof languageId === 'string');
  });

  it('should check if active selection exists', () => {
    const hasSelection = app.vscodeapis.hasActiveSelection();
    assert.ok(typeof hasSelection === 'boolean');
  });

  it('should get active tab name', () => {
    const tabName = app.vscodeapis.getActiveTabName();
    assert.ok(typeof tabName === 'string');
  });

  it('should get descriptive name from document', () => {
    const editor = app.vscodeapis.getActiveTextEditor();
    if (editor) {
      const name = app.vscodeapis.getDescriptiveName(editor.document);
      assert.ok(typeof name === 'string');
    }
  });

  it('should set status bar message', () => {
    const disposable = app.vscodeapis.setStatusBarMessage('Test message');
    assert.ok(disposable);
    disposable.dispose();
  });

  it('should set status bar message with timeout', () => {
    const disposable = app.vscodeapis.setStatusBarMessage('Test message', 1000);
    assert.ok(disposable);
    disposable.dispose();
  });

  it('should get temp directory', () => {
    const tempDir = app.vscodeapis.getDir_Temp();
    assert.ok(typeof tempDir === 'string');
    assert.ok(tempDir.includes('temp'));
  });

  it('should convert URI from path', () => {
    const uri = app.vscodeapis.uriFromPath('/test/path');
    assert.ok(uri);
    assert.strictEqual(uri.fsPath, '/test/path');
  });

  it('should convert URI to path', () => {
    const uri = app.vscodeapis.uriFromPath('/test/path');
    const path = app.vscodeapis.uriToPath(uri);
    assert.strictEqual(path, '/test/path');
  });
});
