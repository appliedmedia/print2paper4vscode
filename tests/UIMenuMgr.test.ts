import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenuMgr } from '../src/UIMenuMgr.js';
import { UIMenu } from '../src/UIMenu.js';

// Mock App class for testing
class MockApp {
  os: any;
  templateDictReplace: any;

  constructor() {
    this.os = {
      readExtensionYaml: () => ({
        ui_menu_html: '<div>{{MENU_ID}} {{BUTTON_ID}} {{TITLE}} {{ICON}} {{MENU_ITEMS}}</div>',
        ui_menu_item: '<div id="{{ITEM_ID}}">{{ITEM_LABEL}}</div>',
        ui_menu_generic_handlers: '// Generic handlers',
      }),
    };
    this.templateDictReplace = (template: string, dict: Record<string, string>) => {
      return Object.entries(dict).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }, template);
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
      const mockSelectionHandler = async (id: string) => {};

      const menu = menuMgr.createMenu(
        'testMenu',
        '🔧',
        'Test Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(menu);

      const menus = menuMgr.getAllMenus();
      assert.strictEqual(menus.length, 1, 'Should have 1 menu after adding');
      assert.strictEqual(menus[0].id, 'testMenu', 'Should have correct menu ID');
    });

    it('should create multiple menus correctly', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const menu1 = menuMgr.createMenu(
        'menu1',
        '🔧',
        'Menu 1',
        mockListBuilder,
        mockSelectionHandler
      );
      const menu2 = menuMgr.createMenu(
        'menu2',
        '🎨',
        'Menu 2',
        mockListBuilder,
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
      const mockSelectionHandler = async (id: string) => {};

      const testMenu = menuMgr.createMenu(
        'testMenu',
        '🔧',
        'Test Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(testMenu);

      const foundMenu = menuMgr.getMenu('testMenu');
      assert.ok(foundMenu, 'Should find test menu');
      assert.strictEqual(foundMenu?.id, 'testMenu', 'Should have correct ID');
    });

    it('should return undefined for non-existent menu', () => {
      const nonExistent = menuMgr.getMenu('nonExistent');
      assert.strictEqual(nonExistent, undefined, 'Should return undefined for non-existent menu');
    });

    it('should handle case-sensitive menu IDs', () => {
      const testMenu = menuMgr.getMenu('TestMenu');
      assert.strictEqual(testMenu, undefined, 'Should be case-sensitive');
    });
  });

  describe('HTML Generation', () => {
    it('should generate HTML for all menus', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const menu1 = menuMgr.createMenu(
        'menu1',
        '🔧',
        'Menu 1',
        mockListBuilder,
        mockSelectionHandler
      );
      const menu2 = menuMgr.createMenu(
        'menu2',
        '🎨',
        'Menu 2',
        mockListBuilder,
        mockSelectionHandler
      );

      menuMgr.addMenu(menu1);
      menuMgr.addMenu(menu2);

      const html = menuMgr.getAllUIMenuHTML();

      assert.ok(html.includes('menu1'), 'Should include menu1 HTML');
      assert.ok(html.includes('menu2'), 'Should include menu2 HTML');
    });

    it('should handle empty menu list', () => {
      // Clear any menus that might have been added in previous tests
      (menuMgr as any).menus = [];
      const html = menuMgr.getAllUIMenuHTML();
      assert.strictEqual(html, '', 'Should return empty string for no menus');
    });
  });

  describe('JavaScript Generation', () => {
    it('should generate generic JavaScript handlers', () => {
      const js = menuMgr.getAllUIMenuJS();
      assert.ok(js.includes('// Generic handlers'), 'Should include generic handlers');
    });
  });

  describe('Template Variable Mappings', () => {
    it('should generate correct template variable mappings', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const testMenu = menuMgr.createMenu(
        'testMenu',
        '🔧',
        'Test Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(testMenu);

      const mappings = menuMgr.getTemplateVariableMappings();

      assert.ok('UIMENU_HTML' in mappings, 'Should have UIMENU_HTML mapping');
      assert.ok('UIMENU_JS' in mappings, 'Should have UIMENU_JS mapping');
      assert.ok('TESTMENU_MENU_ITEMS' in mappings, 'Should have menu-specific mapping');
    });

    it('should handle multiple menus in mappings', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const menu1 = menuMgr.createMenu(
        'menu1',
        '🔧',
        'Menu 1',
        mockListBuilder,
        mockSelectionHandler
      );
      const menu2 = menuMgr.createMenu(
        'menu2',
        '🎨',
        'Menu 2',
        mockListBuilder,
        mockSelectionHandler
      );

      menuMgr.addMenu(menu1);
      menuMgr.addMenu(menu2);

      const mappings = menuMgr.getTemplateVariableMappings();

      assert.ok('MENU1_MENU_ITEMS' in mappings, 'Should have menu1 mapping');
      assert.ok('MENU2_MENU_ITEMS' in mappings, 'Should have menu2 mapping');
    });
  });

  describe('Menu Configuration', () => {
    it('should return correct menu configuration', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const testMenu = menuMgr.createMenu(
        'testMenu',
        '🔧',
        'Test Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(testMenu);

      const config = menuMgr.getMenuConfiguration();

      assert.strictEqual(config.length, 1, 'Should have 1 menu configuration');
      assert.strictEqual(config[0].id, 'testMenu', 'Should have correct ID');
      assert.strictEqual(config[0].icon, '🔧', 'Should have correct icon');
      assert.strictEqual(config[0].title, 'Test Menu', 'Should have correct title');
      assert.strictEqual(
        config[0].templateVariable,
        'TESTMENU_MENU_ITEMS',
        'Should have correct template variable'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long menu ID', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const longId = 'a'.repeat(100);
      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const longMenu = menuMgr.createMenu(
        longId,
        '🔧',
        'Long Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(longMenu);

      const foundMenu = menuMgr.getMenu(longId);
      assert.ok(foundMenu, 'Should find long menu');
      assert.strictEqual(foundMenu?.id, longId, 'Should have correct long ID');
    });

    it('should handle special characters in menu ID', () => {
      // Clear any existing menus
      (menuMgr as any).menus = [];

      const specialId = 'menu_$#@!';
      const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
      const mockSelectionHandler = async (id: string) => {};

      const specialMenu = menuMgr.createMenu(
        specialId,
        '🔧',
        'Special Menu',
        mockListBuilder,
        mockSelectionHandler
      );
      menuMgr.addMenu(specialMenu);

      const foundMenu = menuMgr.getMenu(specialId);
      assert.ok(foundMenu, 'Should find special menu');
      assert.strictEqual(foundMenu?.id, specialId, 'Should have correct special ID');
    });
  });
});
