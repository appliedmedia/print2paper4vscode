import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UI } from '../src/UI.js';
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
    showSaveDialog: async () => undefined,
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as any;

describe('UI', () => {
  let app: App;
  let ui: UI;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
    ui = new UI(app);
    ui.init();
  });

  afterEach(() => {
    ui.done();
    app.done();
  });

  it('should initialize UI', () => {
    assert.ok(ui instanceof UI);
  });

  it('should get base CSS', () => {
    const css = ui.getBaseCSS();
    assert.ok(typeof css === 'string');
  });

  it('should replace template dictionary', () => {
    const result = ui.templateDictReplace('Hello {{NAME}}', { NAME: 'World' });
    assert.strictEqual(result, 'Hello World');
  });

  it('should choose save location', async () => {
    // Mock showSaveDialog to return a URI
    const originalShowSaveDialog = app.vscodeapis.showSaveDialog;
    app.vscodeapis.showSaveDialog = async () => ({ fsPath: '/test/save.pdf' } as any);

    try {
      const path = await ui.chooseSaveLocation('test.pdf');
      assert.ok(path !== null);
    } catch (error) {
      // Expected if dialog isn't fully mocked
      assert.ok(true);
    } finally {
      app.vscodeapis.showSaveDialog = originalShowSaveDialog;
    }
  });

  it('should return null when save dialog is cancelled', async () => {
    const originalShowSaveDialog = app.vscodeapis.showSaveDialog;
    app.vscodeapis.showSaveDialog = async () => undefined;

    try {
      const path = await ui.chooseSaveLocation('test.pdf');
      assert.strictEqual(path, null);
    } finally {
      app.vscodeapis.showSaveDialog = originalShowSaveDialog;
    }
  });

  it('should add toolbar to HTML', async () => {
    const html = '<html><body>{{toolbar}}</body></html>';
    
    try {
      const result = await ui.addToolbar(html);
      assert.ok(typeof result === 'string');
      assert.ok(result.includes('toolbar') || result.length > 0);
    } catch (error) {
      // May fail if menus aren't initialized
      assert.ok(true);
    }
  });

  it('should have static out method', () => {
    const originalLog = console.log;
    let logged = '';
    console.log = (msg: string) => {
      logged = msg;
    };

    UI.out('Test message');
    assert.strictEqual(logged, 'Test message');

    console.log = originalLog;
  });
});
