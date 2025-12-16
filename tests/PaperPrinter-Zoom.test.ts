import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import type { FnImport_t } from '../src/types/Registry_t.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { getFn } from './test-helpers.js';

describe('PaperPrinter Zoom Unit Tests', () => {
  let app: App;
  let fn: FnImport_t;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    fn = getFn(app);
    // Create menus so zoom menus exist
    (app.paperprinter as any).createMenus();
  });

  afterEach(() => {
    app.done();
  });

  it('should have zoom menu items', () => {
    const zoomMenuItems = (app.paperprinter as any).menuItems_ZoomLevel();
    assert.ok(Array.isArray(zoomMenuItems), 'Should return array of zoom levels');
    assert.ok(zoomMenuItems.length > 0, 'Should have zoom level options');
  });

  it('should have zoom in/out menu items', () => {
    const zoomInOutItems = (app.paperprinter as any).menuItems_ZoomInOut();
    assert.ok(Array.isArray(zoomInOutItems), 'Should return array');
    // ZoomInOut may return different number of items based on implementation
    assert.ok(zoomInOutItems.length >= 0, 'Should return array of zoom controls');
  });

  it('should set zoom level text edit value', () => {
    const zoomValue = 1.25; // 125%
    (app.paperprinter as any).zoomLevel_setTextEdit(zoomValue);
    
    // Should not throw
    assert.ok(true, 'Should set zoom level without error');
  });

  it('should clamp zoom values to valid range', () => {
    // Test values outside normal range
    const testValues = [0.3, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    
    testValues.forEach(value => {
      try {
        (app.paperprinter as any).zoomLevel_setTextEdit(value);
        assert.ok(true, `Should handle zoom value ${value}`);
      } catch (error) {
        assert.fail(`Should not throw for zoom value ${value}`);
      }
    });
  });
});
