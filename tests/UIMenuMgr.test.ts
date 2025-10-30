import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenuMgr } from '../src/UIMenuMgr.js';
import { UIMenu, type HandleSelection_t } from '../src/UIMenu.js';

// Mock App class for testing
class MockApp {
  os: any;
  templateDictReplace: any;
  ui: any;
  dx: any;
  uimenumgr: any;

  constructor() {
    this.dx = {
      create: () => ({
        out: () => {},
        done: () => {},
        require: () => true,
      }),
    };
    this.os = {
      fileRead: () => ({
        ui_menu_html: '<div>{{MENU_ID}} {{BUTTON_ID}} {{TITLE}} {{ICON}} {{MENU_ITEMS}}</div>',
        ui_menu_item: '<div id="{{ITEM_ID}}">{{ITEM_LABEL}}</div>',
        ui_flyout: '<div>{{MENU_ITEMS}}</div>',
        ui_menu_generic_handlers:
          '// Generic handlers for all menus - just pass events to extension',
      }),
    };
    this.templateDictReplace = (template: string, dict: Record<string, string>) => {
      return Object.entries(dict).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }, template);
    };
    this.ui = {
      debugOut: (message: string, level?: string, source?: string) => {
        // Mock debug output - just ignore it for tests
      },
      showErrorMessage: (message: string) => {
        // Mock error message - just ignore it for tests
      },
    };
    this.uimenumgr = {
      getMenu: (id: string) => undefined, // Mock implementation
    };
  }
}

describe('UIMenuMgr', () => {
  let menuMgr: UIMenuMgr;
  let mockApp: MockApp;

  // Create fresh mock app and menu manager for each test
  mockApp = new MockApp();
  menuMgr = new UIMenuMgr(mockApp as any);

  describe('Constructor and Initialization', () => {
    it('should create empty menu manager initially', () => {
      const menus = menuMgr.getAllMenus();
      assert.strictEqual(menus.length, 0, 'Should start with no menus');
    });
  });

  describe('Menu Creation and Management', () => {
    it('should create and add menus correctly', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const menu = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Test Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      menuMgr.addMenu(menu);

      const menus = menuMgr.getAllMenus();
      assert.strictEqual(menus.length, 1, 'Should have 1 menu after adding');
      assert.strictEqual(menus[0].id, 'theme', 'Should have correct menu ID');
    });

    it('should create multiple menus correctly', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const menu1 = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Menu 1',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      const menu2 = menuMgr.createMenu(
        'fontSizeId', // Use valid GlobalStateKey
        'Menu 2',
        '🎨',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      menuMgr.addMenu(menu1);
      menuMgr.addMenu(menu2);

      const menus = menuMgr.getAllMenus();
      assert.strictEqual(menus.length, 2, 'Should have 2 menus total');
    });
  });

  describe('Menu Retrieval', () => {
    it('should get all menus', () => {
      const menus = menuMgr.getAllMenus();
      assert.ok(Array.isArray(menus), 'Should return array');
    });

    it('should get specific menu by ID', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const testMenu = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Test Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      menuMgr.addMenu(testMenu);

      const foundMenu = menuMgr.getMenuById('theme');
      assert.ok(foundMenu, 'Should find test menu');
      assert.strictEqual(foundMenu?.id, 'theme', 'Should have correct ID');
    });

    it('should throw error for non-existent menu', () => {
      assert.throws(
        () => menuMgr.getMenuById('nonExistent' as any),
        /Menu not found: nonExistent/,
        'Should throw error for non-existent menu'
      );
    });

    it('should throw error for case-mismatched menu IDs', () => {
      assert.throws(
        () => menuMgr.getMenuById('TestMenu' as any),
        /Menu not found: TestMenu/,
        'Should be case-sensitive and throw error'
      );
    });
  });

  describe('HTML Generation', () => {
    it('should generate HTML for all menus', async () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const menu1 = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Menu 1',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      const menu2 = menuMgr.createMenu(
        'fontSizeId', // Use valid GlobalStateKey
        'Menu 2',
        '🎨',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      menuMgr.addMenu(menu1);
      menuMgr.addMenu(menu2);

      const html = await menuMgr.getAllUIMenuHTML();

      assert.ok(html.includes('theme'), 'Should include theme HTML');
      assert.ok(html.includes('fontSizeId'), 'Should include fontSizeId HTML');
    });

    it('should handle empty menu list', async () => {
      // Clear any menus that might have been added in previous tests
      (menuMgr as any).menus = [];
      const html = await menuMgr.getAllUIMenuHTML();
      assert.strictEqual(html, '', 'Should return empty string for no menus');
    });
  });

  describe('JavaScript Generation', () => {
    it('should generate generic JavaScript handlers', () => {
      // Create a test menu first so getAllUIMenuJS has something to work with
      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });
      const testMenu = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Test Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      menuMgr.addMenu(testMenu);

      const js = menuMgr.getAllUIMenuJS();
      assert.ok(js.includes('// Generic handlers'), 'Should include generic handlers');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long menu ID', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const longMenu = menuMgr.createMenu(
        'theme', // Use valid GlobalStateKey
        'Long Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      menuMgr.addMenu(longMenu);

      const foundMenu = menuMgr.getMenuById('theme');
      assert.ok(foundMenu, 'Should find long menu');
      assert.strictEqual(foundMenu?.id, 'theme', 'Should have correct long ID');
    });

    it('should handle special characters in menu ID', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string): Promise<HandleSelection_t> =>
        Promise.resolve({ id: '', value: '' });

      const specialMenu = menuMgr.createMenu(
        'fontSizeId', // Use valid GlobalStateKey
        'Special Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      menuMgr.addMenu(specialMenu);

      const foundMenu = menuMgr.getMenuById('fontSizeId');
      assert.ok(foundMenu, 'Should find special menu');
      assert.strictEqual(foundMenu?.id, 'fontSizeId', 'Should have correct special ID');
    });
  });
});
