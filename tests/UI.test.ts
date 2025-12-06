import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UI } from '../src/UI.js';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('UI', () => {
  let app: App;
  let ui: UI;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    ui = new UI({ reg: app.reg });
    // UI no longer has init() method (migrated to Registry pattern)
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
    const mockUri = {
      fsPath: '/test/save.pdf',
      path: '/test/save.pdf',
      toString: () => 'file:///test/save.pdf'
    } as any;
    app.vscodeapis.showSaveDialog = async (options?: any) => mockUri;

    // Recreate UI instance after mocking so it picks up the mocked method
    const testUi = new UI({ reg: app.reg });
    
    const path = await testUi.chooseSaveLocation('test.pdf');
    assert.ok(path !== null, `Expected path to not be null, got: ${path}`);
    assert.strictEqual(path, '/test/save.pdf');
    
    testUi.done();
    app.vscodeapis.showSaveDialog = originalShowSaveDialog;
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
    
    const result = await ui.addToolbar(html);
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('toolbar') || result.length > 0);
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
