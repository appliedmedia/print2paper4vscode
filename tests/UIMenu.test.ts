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
      'theme', // Use a valid GlobalStateKey
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
      assert.strictEqual(menu.id, 'theme');
      assert.strictEqual(menu.icon, '🔧');
      assert.strictEqual(menu.displayName, 'Test Menu');
    });

    it('should handle empty string properties', () => {
      const emptyMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        '',
        '',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(emptyMenu.id, 'theme');
      assert.strictEqual(emptyMenu.icon, '');
      assert.strictEqual(emptyMenu.displayName, '');
    });
  });

  describe('ID Generation Methods', () => {
    it('should generate correct menu ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Menu(), 'theme');
    });

    it('should generate correct button ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Button(), 'theme-btn');
    });

    it('should handle special characters in ID', () => {
      const specialMenu = new UIMenu(
        mockApp,
        'fontSizeId', // Use valid GlobalStateKey
        'Special Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(specialMenu.getId_Menu(), 'fontSizeId');
      assert.strictEqual(specialMenu.getId_Button(), 'fontSizeId-btn');
    });
  });

  describe('Template Variable Names', () => {
    it('should generate correct template variable name', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getTemplateVariableName(), 'THEME_MENU_ITEMS');
    });

    it('should handle single character ID', () => {
      const singleMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Single',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(singleMenu.getTemplateVariableName(), 'THEME_MENU_ITEMS');
    });

    it('should handle ID starting with number', () => {
      const numMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Number',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(numMenu.getTemplateVariableName(), 'THEME_MENU_ITEMS');
    });
  });

  describe('HTML Generation', () => {
    it('should provide correct template variable names', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getTemplateVariableName(), 'THEME_MENU_ITEMS');
    });

    it('should provide correct menu and button IDs', () => {
      const menu = createMenu();
      assert.strictEqual(menu.getId_Menu(), 'theme');
      assert.strictEqual(menu.getId_Button(), 'theme-btn');
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
      const longMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Long Menu',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(longMenu.getId_Menu(), 'theme');
      assert.strictEqual(longMenu.getId_Button(), 'theme-btn');
    });

    it('should handle ID with special characters', () => {
      const specialMenu = new UIMenu(
        mockApp,
        'fontSizeId', // Use valid GlobalStateKey
        'Special',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(specialMenu.getId_Menu(), 'fontSizeId');
      assert.strictEqual(specialMenu.getId_Button(), 'fontSizeId-btn');
    });

    it('should handle unicode characters in ID', () => {
      const unicodeMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Unicode',
        '🔧',
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(unicodeMenu.getId_Menu(), 'theme');
      assert.strictEqual(unicodeMenu.getId_Button(), 'theme-btn');
    });
  });
});
