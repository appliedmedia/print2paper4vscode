import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UIMenuMgr } from '../src/UIMenuMgr.js';
import { App } from '../src/App.js';
import type { MenuId_t } from '../src/UIMenu.js';
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
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as any;

describe('UIMenuMgr', () => {
  let app: App;
  let menuMgr: UIMenuMgr;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
    menuMgr = new UIMenuMgr(app);
  });

  afterEach(() => {
    menuMgr.done();
    app.done();
  });

  it('should validate menu IDs', () => {
    assert.strictEqual(menuMgr.isMenuId('theme'), true);
    assert.strictEqual(menuMgr.isMenuId('invalid'), false);
  });

  it('should validate menu item IDs', () => {
    assert.strictEqual(menuMgr.isMenuItemId('github-light'), true); // Theme ID
    assert.strictEqual(menuMgr.isMenuItemId('invalid'), false);
  });

  it('should validate numeric menu item IDs (font sizes)', () => {
    // Create a font size menu first
    const fontMenu = menuMgr.createMenu(
      'fontSizeId',
      'Font Size',
      'A',
      false,
      () => [{ id: '12', displayName: '12' }],
      [],
      async (id) => ({ id, value: id })
    );
    menuMgr.addMenu(fontMenu);
    
    assert.strictEqual(menuMgr.isMenuItemId('12'), true);
  });

  it('should get all menus', () => {
    const menus = menuMgr.getAllMenus();
    assert.ok(Array.isArray(menus));
  });

  it('should add menu', () => {
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      'T',
      false,
      () => [],
      [],
      async (id) => ({ id, value: id })
    );
    
    menuMgr.addMenu(menu);
    const menus = menuMgr.getAllMenus();
    assert.strictEqual(menus.length, 1);
  });

  it('should not add duplicate menus', () => {
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      'T',
      false,
      () => [],
      [],
      async (id) => ({ id, value: id })
    );
    
    menuMgr.addMenu(menu);
    menuMgr.addMenu(menu);
    const menus = menuMgr.getAllMenus();
    assert.strictEqual(menus.length, 1);
  });

  it('should get menu by ID', () => {
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      'T',
      false,
      () => [],
      [],
      async (id) => ({ id, value: id })
    );
    menuMgr.addMenu(menu);
    
    const foundMenu = menuMgr.getMenuById('test');
    assert.strictEqual(foundMenu.id, 'test');
  });

  it('should throw error when getting non-existent menu', () => {
    assert.throws(() => {
      menuMgr.getMenuById('nonexistent');
    }, /Menu not found/);
  });

  it('should get all menu CSS', () => {
    const css = menuMgr.getAllUIMenuCSS();
    assert.ok(typeof css === 'string');
  });

  it('should get all menu JS', () => {
    const js = menuMgr.getAllUIMenuJS();
    assert.ok(typeof js === 'string');
  });

  it('should return empty string when no menus exist for CSS', () => {
    const emptyMgr = new UIMenuMgr(app);
    const css = emptyMgr.getAllUIMenuCSS();
    assert.strictEqual(css, '');
  });

  it('should return empty string when no menus exist for JS', () => {
    const emptyMgr = new UIMenuMgr(app);
    const js = emptyMgr.getAllUIMenuJS();
    assert.strictEqual(js, '');
  });
});
