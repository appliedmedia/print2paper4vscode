import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { TabInspector } from '../src/TabInspector.js';
import { App } from '../src/App.js';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
const mockContext = {
  subscriptions: [],
  globalState: {
    get: () => undefined,
    update: () => {},
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
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as any;

describe('TabInspector', () => {
  let app: App;
  let tabInspector: TabInspector;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    tabInspector = new TabInspector(app);
    tabInspector.init();
  });

  afterEach(() => {
    tabInspector.done();
    app.done();
  });

  it('should initialize', () => {
    assert.ok(tabInspector instanceof TabInspector);
  });

  it('should detect active tab category', () => {
    // Mock has a JavaScript file, so should return 'editor-nonmd'
    const category = tabInspector.detectActiveTabCategory();
    assert.strictEqual(category, 'editor-nonmd');
  });

  it('should get editor selection or all', () => {
    const result = tabInspector.getEditorSelectionOrAll();
    // Mock has empty selection, so should return document text
    assert.ok(result !== null);
    assert.ok(typeof result === 'object');
    assert.ok('text' in result);
    assert.strictEqual(result.text, 'test code');
  });

  it('should inspect tab', async () => {
    const result = await tabInspector.inspectTab();
    assert.ok('code' in result);
    assert.ok('language' in result);
    assert.ok('fileName' in result);
    assert.ok('filePath' in result);
    // Verify actual values from mock
    assert.strictEqual(result.language, 'javascript');
    assert.strictEqual(result.code, 'test code');
    assert.ok(result.fileName.includes('file.js'));
  });

  it('should inspect visible editors', async () => {
    const result = await tabInspector.inspectVisibleEditors();
    assert.ok(Array.isArray(result));
    // Should have at least one editor (the active one)
    assert.ok(result.length >= 1);
    assert.ok(result[0].language === 'javascript');
  });
});
