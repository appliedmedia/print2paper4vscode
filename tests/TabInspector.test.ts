import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { TabInspector } from '../src/TabInspector.js';
import { App } from '../src/App.js';
import type { FnImport_t } from '../src/types/Registry_t.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { getFn } from './test-helpers.js';

describe('TabInspector', () => {
  let app: App;
  let fn: FnImport_t;
  let tabInspector: TabInspector;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    fn = getFn(app);
    tabInspector = new TabInspector({ reg: app.reg });
    // Note: TabInspector no longer has init() - initialization happens in constructor
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
