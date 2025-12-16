import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import type { FnImport_t } from '../src/types/Registry_t.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { getFn } from './test-helpers.js';

describe('PaperPrinter Page Size Unit Tests', () => {
  let app: App;
  let fn: FnImport_t;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    fn = getFn(app);
  });

  afterEach(() => {
    app.done();
  });

  it('should have page size menu items', () => {
    const pageSizeItems = (app.paperprinter as any).menuItems_PageSizeId();
    assert.ok(Array.isArray(pageSizeItems), 'Should return array of page sizes');
    assert.ok(pageSizeItems.length > 0, 'Should have page size options');
    
    // Check structure
    const firstItem = pageSizeItems[0];
    assert.ok(firstItem.id, 'Should have id');
    assert.ok(firstItem.displayName, 'Should have displayName');
  });

  it('should have orientation menu items', () => {
    const orientItems = (app.paperprinter as any).menuItems_Orient();
    assert.ok(Array.isArray(orientItems), 'Should return array of orientations');
    assert.strictEqual(orientItems.length, 2, 'Should have portrait and landscape');
    
    // Check for portrait and landscape
    const ids = orientItems.map((item: any) => item.id);
    assert.ok(ids.includes('portrait'), 'Should have portrait option');
    assert.ok(ids.includes('landscape'), 'Should have landscape option');
  });

  it('should have margin menu items', () => {
    const marginItems = (app.paperprinter as any).menuItems_MarginId();
    assert.ok(Array.isArray(marginItems), 'Should return array of margins');
    assert.ok(marginItems.length > 0, 'Should have margin options');
  });

  it('should have valid page sizes in constants', () => {
    const { kPageSizeId } = require('../src/types/PaperPrinter_t.js');
    
    assert.ok(kPageSizeId, 'Should have page size constants');
    assert.ok(kPageSizeId.menuItems, 'Should have menu items array');
    assert.ok(kPageSizeId.menuItems.length > 0, 'Should have page size options');
    
    // Check common page sizes exist
    const ids = kPageSizeId.menuItems.map((item: any) => item.id);
    assert.ok(ids.includes('a4'), 'Should have A4');
    assert.ok(ids.includes('letter'), 'Should have Letter');
  });
});
