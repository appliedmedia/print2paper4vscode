import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { DocInfo_PaperPrinter } from '../src/DocInfo_PaperPrinter.js';
import { App } from '../src/App.js';
import { PaperPrinter } from '../src/PaperPrinter.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('DocInfo_PaperPrinter', () => {
  let app: App;
  let docInfo: DocInfo_PaperPrinter;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    // Create menus before tests that need them (menus are created on-demand in production)
    // Access private createMenus method through type assertion
    (app.paperprinter as unknown as { createMenus(): void }).createMenus();
    docInfo = DocInfo_PaperPrinter.create(app);
  });

  afterEach(() => {
    app.done();
  });

  it('should return default margin when no menu is set', () => {
    const margin = docInfo.marginPx;
    assert.ok(typeof margin.topPx === 'number');
    assert.ok(typeof margin.bottomPx === 'number');
    assert.ok(typeof margin.leftPx === 'number');
    assert.ok(typeof margin.rightPx === 'number');
    assert.strictEqual(margin.topPx, margin.bottomPx);
    assert.strictEqual(margin.leftPx, margin.rightPx);
  });

  it('should return different margin values for different margin IDs', () => {
    // Set margin to 'none'
    const marginMenu = app.uimenumgr.getMenuById('marginId');
    marginMenu.persist.set('marginId', 'none');
    const noneMargin = docInfo.marginPx;
    assert.strictEqual(noneMargin.topPx, 0);

    // Set margin to 'minimal'
    marginMenu.persist.set('marginId', 'minimal');
    const minimalMargin = docInfo.marginPx;
    assert.strictEqual(minimalMargin.topPx, 7);

    // Set margin to 'normal'
    marginMenu.persist.set('marginId', 'normal');
    const normalMargin = docInfo.marginPx;
    assert.strictEqual(normalMargin.topPx, 20);

    // Set margin to 'wide'
    marginMenu.persist.set('marginId', 'wide');
    const wideMargin = docInfo.marginPx;
    assert.strictEqual(wideMargin.topPx, 40);
  });

  it('should default to normal when invalid margin ID is provided', () => {
    const marginMenu = app.uimenumgr.getMenuById('marginId');
    marginMenu.persist.set('marginId', 'invalid-margin' as any);
    const margin = docInfo.marginPx;
    assert.strictEqual(margin.topPx, 20); // Should default to 'normal'
  });
});
