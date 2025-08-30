import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenu } from '../src/UIMenu.js';
import type { UIMenuItem } from '../src/types/UIMenuItem.js';

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
} as any;

// Mock list builder and selection handler
const mockListBuilder = () => [{ id: 'test', displayName: 'Test Item' }];
const mockSelectionHandler = async (id: string) => {};

describe('UIMenu', () => {
  let menu: UIMenu;

  // Create menu for testing
  menu = new UIMenu('testMenu', '🔧', 'Test Menu', mockApp, mockListBuilder, mockSelectionHandler);

  describe('Constructor and Properties', () => {
    it('should create menu with correct properties', () => {
      assert.strictEqual(menu.id, 'testMenu');
      assert.strictEqual(menu.icon, '🔧');
      assert.strictEqual(menu.title, 'Test Menu');
    });

    it('should handle empty string properties', () => {
      const emptyMenu = new UIMenu('', '', '', mockApp, mockListBuilder, mockSelectionHandler);
      assert.strictEqual(emptyMenu.id, '');
      assert.strictEqual(emptyMenu.icon, '');
      assert.strictEqual(emptyMenu.title, '');
    });
  });

  describe('ID Generation Methods', () => {
    it('should generate correct menu ID', () => {
      assert.strictEqual(menu.getId_Menu(), 'testMenu');
    });

    it('should generate correct button ID', () => {
      assert.strictEqual(menu.getId_Button(), 'testMenu-btn');
    });

    it('should handle special characters in ID', () => {
      const specialMenu = new UIMenu(
        'menu-with-dashes',
        '🔧',
        'Special Menu',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );
      assert.strictEqual(specialMenu.getId_Menu(), 'menu-with-dashes');
      assert.strictEqual(specialMenu.getId_Button(), 'menu-with-dashes-btn');
    });
  });

  describe('Template Variable Names', () => {
    it('should generate correct template variable name', () => {
      assert.strictEqual(menu.getTemplateVariableName(), 'TESTMENU_MENU_ITEMS');
    });

    it('should handle single character ID', () => {
      const singleMenu = new UIMenu(
        'a',
        '🔧',
        'Single',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );
      assert.strictEqual(singleMenu.getTemplateVariableName(), 'A_MENU_ITEMS');
    });

    it('should handle ID starting with number', () => {
      const numMenu = new UIMenu(
        '1menu',
        '🔧',
        'Number',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );
      assert.strictEqual(numMenu.getTemplateVariableName(), '1MENU_MENU_ITEMS');
    });
  });

  describe('HTML Generation', () => {
    it('should provide correct template variable names', () => {
      assert.strictEqual(menu.getTemplateVariableName(), 'TESTMENU_MENU_ITEMS');
    });

    it('should provide correct menu and button IDs', () => {
      assert.strictEqual(menu.getId_Menu(), 'testMenu');
      assert.strictEqual(menu.getId_Button(), 'testMenu-btn');
    });
  });

  describe('JavaScript Generation', () => {
    it('should generate empty JavaScript (generic handlers used)', () => {
      const js = menu.generateJavaScript();
      assert.strictEqual(js, '', 'Should return empty string since generic handlers are used');
    });
  });

  describe('Menu Items', () => {
    it('should return menu items from list builder', () => {
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
        longId,
        '🔧',
        'Long Menu',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );

      assert.strictEqual(longMenu.getId_Menu(), longId);
      assert.strictEqual(longMenu.getId_Button(), `${longId}-btn`);
    });

    it('should handle ID with special characters', () => {
      const specialMenu = new UIMenu(
        'menu_$#@!',
        '🔧',
        'Special',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );

      assert.strictEqual(specialMenu.getId_Menu(), 'menu_$#@!');
      assert.strictEqual(specialMenu.getId_Button(), 'menu_$#@!-btn');
    });

    it('should handle unicode characters in ID', () => {
      const unicodeMenu = new UIMenu(
        'ménu',
        '🔧',
        'Unicode',
        mockApp,
        mockListBuilder,
        mockSelectionHandler
      );

      assert.strictEqual(unicodeMenu.getId_Menu(), 'ménu');
      assert.strictEqual(unicodeMenu.getId_Button(), 'ménu-btn');
    });
  });
});
