import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenu } from '../src/UIMenu.js';
import type { UIMenuItem } from '../src/types/UI_t.js';

// Mock App for testing
const mockApp = {
  os: {
    readExtensionYaml: () => ({
      ui_menu_html: '<div>{{MENU_ID}} {{BUTTON_ID}} {{TITLE}} {{ICON}} {{MENU_ITEMS}}</div>',
    }),
  },
  templateDictReplace: (template: string, dict: Record<string, string>) => {
    return Object.entries(dict).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, template);
  },
  dx: {
    create: (name: string) => ({
      out: () => {},
      print: () => {},
      done: () => {},
      sub: (name: string) => ({
        out: () => {},
        print: () => {},
        done: () => {},
        require: () => true,
      }),
    }),
  },
} as any;

// Mock list builder and selection handler
const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
const mockSelectionHandler = async (id: string): Promise<string> => Promise.resolve('');

describe('UIMenu', () => {
  // Helper function to create fresh menu for each test
  const createMenu = () => {
    return new UIMenu(
      mockApp,
      'testMenu',
      'Test Menu',
      '🔧',
      false,
      mockListBuilder,
      [],
      mockSelectionHandler
    );
  };

  describe('Constructor and Properties', () => {
    it('should create menu with correct properties', () => {
      const menu = createMenu();
      assert.strictEqual(menu.id, 'testMenu');
      assert.strictEqual(menu.icon, '🔧');
      assert.strictEqual(menu.displayName, 'Test Menu');
    });

    it('should handle empty string properties', () => {
      const emptyMenu = new UIMenu(
        mockApp,
        '',
        '',
        '',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(emptyMenu.id, '');
      assert.strictEqual(emptyMenu.icon, '');
      assert.strictEqual(emptyMenu.displayName, '');
    });
  });

  describe('ID Generation Methods', () => {
    it('should generate correct menu ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Menu(), 'testMenu');
    });

    it('should generate correct button ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Button(), 'testMenu-btn');
    });

    it('should handle special characters in ID', () => {
      const specialMenu = new UIMenu(
        mockApp,
        'menu-with-dashes',
        'Special Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(specialMenu.getId_Menu(), 'menu-with-dashes');
      assert.strictEqual(specialMenu.getId_Button(), 'menu-with-dashes-btn');
    });
  });

  describe('Template Variable Names', () => {
    it('should generate correct template variable name', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getTemplateVariableName(), 'TESTMENU_MENU_ITEMS');
    });

    it('should handle single character ID', () => {
      const singleMenu = new UIMenu(
        mockApp,
        'a',
        'Single',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(singleMenu.getTemplateVariableName(), 'A_MENU_ITEMS');
    });

    it('should handle ID starting with number', () => {
      const numMenu = new UIMenu(
        mockApp,
        '1menu',
        'Number',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(numMenu.getTemplateVariableName(), '1MENU_MENU_ITEMS');
    });
  });

  describe('HTML Generation', () => {
    it('should provide correct template variable names', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getTemplateVariableName(), 'TESTMENU_MENU_ITEMS');
    });

    it('should provide correct menu and button IDs', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Menu(), 'testMenu');
      assert.strictEqual(menu.getId_Button(), 'testMenu-btn');
    });
  });

  describe('Menu Items', () => {
    it('should return menu items from list builder', () => {
      const menu = createMenu();
      const items = menu.getMenuItems();
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].id, 'test');
      assert.strictEqual(items[0].displayName, 'Test Item');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long ID', () => {
      const longId = 'a'.repeat(100);
      const longMenu = new UIMenu(
        mockApp,
        longId,
        'Long Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(longMenu.getId_Menu(), longId);
      assert.strictEqual(longMenu.getId_Button(), `${longId}-btn`);
    });

    it('should handle ID with special characters', () => {
      const specialMenu = new UIMenu(
        mockApp,
        'menu_$#@!',
        'Special',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(specialMenu.getId_Menu(), 'menu_$#@!');
      assert.strictEqual(specialMenu.getId_Button(), 'menu_$#@!-btn');
    });

    it('should handle unicode characters in ID', () => {
      const unicodeMenu = new UIMenu(
        mockApp,
        'ménu',
        'Unicode',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(unicodeMenu.getId_Menu(), 'ménu');
      assert.strictEqual(unicodeMenu.getId_Button(), 'ménu-btn');
    });
  });
});
