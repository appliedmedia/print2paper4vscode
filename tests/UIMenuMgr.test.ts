import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UIMenuMgr } from '../src/UIMenuMgr.js';
import { App } from '../src/App.js';
import type { MenuId_t, UIMenuItem_t, iconSlotTriad_t } from '../src/UIMenu.js';
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
    const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `A`, end: `` };
    const fontMenu = menuMgr.createMenu(
      'fontSizeId',
      'Font Size',
      iconSlotTriad,
      false,
      () => [{ id: '12', displayName: '12', iconSlotTriad: { begin: '', main: '', end: '' } }],
      [],
      async id => ({ id, value: id })
    );
    menuMgr.addMenu(fontMenu);

    assert.strictEqual(menuMgr.isMenuItemId('12'), true);
  });

  it('should get all menus', () => {
    const menus = menuMgr.getUIMenus();
    assert.ok(Array.isArray(menus));
  });

  it('should add menu', () => {
    const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `T`, end: `` };
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      iconSlotTriad,
      false,
      () => [],
      [],
      async id => ({ id, value: id })
    );

    menuMgr.addMenu(menu);
    const menus = menuMgr.getUIMenus();
    assert.strictEqual(menus.length, 1);
  });

  it('should not add duplicate menus', () => {
    const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `T`, end: `` };
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      iconSlotTriad,
      false,
      () => [],
      [],
      async id => ({ id, value: id })
    );

    menuMgr.addMenu(menu);
    menuMgr.addMenu(menu);
    const menus = menuMgr.getUIMenus();
    assert.strictEqual(menus.length, 1);
  });

  it('should get menu by ID', () => {
    const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `T`, end: `` };
    const menu = menuMgr.createMenu(
      'test' as MenuId_t,
      'Test Menu',
      iconSlotTriad,
      false,
      () => [],
      [],
      async id => ({ id, value: id })
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
    const css = menuMgr.getUIMenus_CSS();
    assert.ok(typeof css === 'string');
  });

  it('should get all menu JS', () => {
    const js = menuMgr.getUIMenus_JS();
    assert.ok(typeof js === 'string');
  });

  it('should return empty string when no menus exist for CSS', () => {
    const emptyMgr = new UIMenuMgr(app);
    const css = emptyMgr.getUIMenus_CSS();
    assert.strictEqual(css, '');
  });

  it('should return empty string when no menus exist for JS', () => {
    const emptyMgr = new UIMenuMgr(app);
    const js = emptyMgr.getUIMenus_JS();
    assert.strictEqual(js, '');
  });
});
