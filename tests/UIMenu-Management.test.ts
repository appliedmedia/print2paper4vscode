import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('UIMenu Simple Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
  });

  afterEach(() => {
    app.done();
  });

  it('should create and retrieve menus', () => {
    // Create menus
    (app.paperprinter as any).createMenus();
    
    const menus = app.uimenumgr.getUIMenus();
    assert.ok(menus.length > 0, 'Should have menus after creation');
  });

  it('should get menu by ID', () => {
    (app.paperprinter as any).createMenus();
    
    // Try to get a known menu
    const printMenu = app.uimenumgr.getMenuById('print');
    assert.ok(printMenu, 'Should retrieve print menu');
    assert.strictEqual(printMenu.id, 'print', 'Should have correct ID');
  });

  it('should handle menu item selection', () => {
    (app.paperprinter as any).createMenus();
    
    const themeMenu = app.uimenumgr.getMenuById('theme');
    assert.ok(themeMenu, 'Should have theme menu');
    
    // Get menu items
    const items = themeMenu.getMenuItems();
    assert.ok(Array.isArray(items), 'Should return array of items');
    assert.ok(items.length > 0, 'Should have theme options');
  });

  it('should get all menus', () => {
    (app.paperprinter as any).createMenus();
    
    const menus = app.uimenumgr.getUIMenus();
    assert.ok(Array.isArray(menus), 'Should return array of menus');
    assert.ok(menus.length > 0, 'Should have multiple menus');
  });

  it('should persist menu selections', () => {
    (app.paperprinter as any).createMenus();
    
    const themeMenu = app.uimenumgr.getMenuById('theme');
    
    // Set a value
    themeMenu.persist.theme = 'github-light';
    
    // Retrieve it
    const selectedTheme = app.uimenumgr.getMenuItemIdSelected('theme');
    assert.strictEqual(selectedTheme, 'github-light', 'Should persist selection');
  });
});
