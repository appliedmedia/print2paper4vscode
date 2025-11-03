import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
const mockContext = {
  subscriptions: [],
  globalState: {
    get: (key: string) => {
      if (key === 'toolbarPosPx') return 100;
      return undefined;
    },
    update: (key: string, value: any) => {},
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
    activeTextEditor: {
      document: {
        uri: { fsPath: '/test/file.js' },
        getText: () => 'test code',
        languageId: 'javascript',
      },
      selection: {
        isEmpty: true,
      },
    },
    createWebviewPanel: () => ({
      webview: {
        asWebviewUri: (uri: any) => uri,
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => {},
      },
      reveal: () => {},
      onDidDispose: () => ({ dispose: () => {} }),
      title: '',
    }),
  },
  workspace: {
    getConfiguration: () => ({
      get: (key: string) => {
        if (key === 'fontSize') return 14;
        if (key === 'lineHeight') return 1.5;
        if (key === 'fontFamily') return 'Monaco';
        return undefined;
      },
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
  ViewColumn: {
    Active: 1,
    One: 1,
    Two: 2,
    Three: 3,
  },
  extensions: {
    getExtension: () => ({
      extensionPath: process.cwd(),
      packageJSON: { name: 'test' },
    }),
  },
  env: {
    language: 'en',
  },
} as any;

describe('VSCodeAPIs', () => {
  let app: App;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
  });

  afterEach(() => {
    app.done();
  });

  it('should get global storage path', () => {
    const path = app.vscodeapis.getGlobalStoragePath();
    assert.strictEqual(path, '/tmp');
  });

  it('should update and get global state', () => {
    app.vscodeapis.updateGlobalState('testKey', 'testValue');
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
    const panelId = await app.vscodeapis.getOrCreateWebviewPanel('Test Panel', '<html><body>Test</body></html>');
    assert.ok(typeof panelId === 'string');
    assert.ok(panelId.length > 0);
  });

  it('should reuse existing webview panel', async () => {
    const panelId1 = await app.vscodeapis.getOrCreateWebviewPanel('Test', '<html></html>');
    const panelId2 = await app.vscodeapis.getOrCreateWebviewPanel('Test', '<html></html>', panelId1);
    assert.strictEqual(panelId1, panelId2);
  });
});
