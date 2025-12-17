import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { Persist } from '../src/Persist.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { getFn } from './test-helpers.js';

describe('UIMenu Simple Unit Tests', () => {
  let app: TestApp;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
  });

  afterEach(() => {
    app.done();
  });

  it('should create and retrieve menus', () => {
    // Create menus
    (app.paperprinter as any).createMenus();
    
    const menus = fn.uimenumgr.getUIMenus();
    assert.ok(menus.length > 0, 'Should have menus after creation');
  });

  it('should get menu by ID', () => {
    (app.paperprinter as any).createMenus();
    
    // Try to get a known menu
    const printMenu = fn.uimenumgr.getMenuById('print');
    assert.ok(printMenu, 'Should retrieve print menu');
    assert.strictEqual(printMenu.id, 'print', 'Should have correct ID');
  });

  it('should handle menu item selection', () => {
    (app.paperprinter as any).createMenus();
    
    const themeMenu = fn.uimenumgr.getMenuById('theme');
    assert.ok(themeMenu, 'Should have theme menu');
    
    // Get menu items
    const items = themeMenu.getMenuItems();
    assert.ok(Array.isArray(items), 'Should return array of items');
    assert.ok(items.length > 0, 'Should have theme options');
  });

  it('should get all menus', () => {
    (app.paperprinter as any).createMenus();
    
    const menus = fn.uimenumgr.getUIMenus();
    assert.ok(Array.isArray(menus), 'Should return array of menus');
    assert.ok(menus.length > 0, 'Should have multiple menus');
  });

  it('should persist menu selections', () => {
    (app.paperprinter as any).createMenus();
    
    const persist = app.reg.getInstance<Persist>('persist')!;
    
    // Set a value
    persist.set('theme', 'github-light');
    
    // Retrieve it
    const selectedTheme = fn.uimenumgr.getMenuItemIdSelected('theme');
    assert.strictEqual(selectedTheme, 'github-light', 'Should persist selection');
  });
});
