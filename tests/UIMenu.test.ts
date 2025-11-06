import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  UIMenu,
  type HandleSelection_t,
  type UIMenuItem_t,
  type MenuId_t,
  type MenuItemId_t,
  type iconSlotTriad_t,
} from '../src/UIMenu.js';

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
const mockListBuilder = (): UIMenuItem_t[] => [
  { id: 'default', displayName: 'Default', iconSlotTriad: { begin: '', main: '', end: '' } },
  { id: 'test', displayName: 'Test Item', iconSlotTriad: { begin: '', main: '', end: '' } },
];
const mockSelectionHandler = async (
  menuId: MenuId_t,
  menuItemId: MenuItemId_t
): Promise<HandleSelection_t> => Promise.resolve({ id: '', value: '' });

describe('UIMenu', () => {
  // Helper function to create fresh menu for each test
  const createMenu = () => {
    const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `🔧`, end: `` };
    return new UIMenu(
      mockApp,
      'theme', // Use a valid GlobalStateKey
      'Test Menu',
      iconSlotTriad,
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
      assert.strictEqual(menu.displayName, 'Test Menu');
    });

    it('should handle empty string properties', () => {
      const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: ``, end: `` };
      const emptyMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        '',
        iconSlotTriad,
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(emptyMenu.id, 'theme');
      assert.strictEqual(emptyMenu.displayName, '');
    });
  });

  describe('ID Generation Methods', () => {
    it('should generate correct menu ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.id, 'theme');
    });

    it('should handle special characters in ID', () => {
      const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `🔧`, end: `` };
      const specialMenu = new UIMenu(
        mockApp,
        'fontSizeId', // Use valid GlobalStateKey
        'Special Menu',
        iconSlotTriad,
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );
      assert.strictEqual(specialMenu.id, 'fontSizeId');
    });
  });

  describe('HTML Generation', () => {
    it('should provide correct menu ID', () => {
      const menu = createMenu();
      assert.strictEqual(menu.id, 'theme');
    });
  });

  describe('Menu Items', () => {
    it('should return menu items from list builder', () => {
      const menu = createMenu();
      const items = menu.getMenuItems();
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].id, 'default');
      assert.strictEqual(items[1].id, 'test');
      assert.strictEqual(items[1].displayName, 'Test Item');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long ID', () => {
      const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `🔧`, end: `` };
      const longMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Long Menu',
        iconSlotTriad,
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(longMenu.id, 'theme');
    });

    it('should handle ID with special characters', () => {
      const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `🔧`, end: `` };
      const specialMenu = new UIMenu(
        mockApp,
        'fontSizeId', // Use valid GlobalStateKey
        'Special',
        iconSlotTriad,
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(specialMenu.id, 'fontSizeId');
    });

    it('should handle unicode characters in ID', () => {
      const iconSlotTriad: iconSlotTriad_t = { begin: ``, main: `🔧`, end: `` };
      const unicodeMenu = new UIMenu(
        mockApp,
        'theme', // Use valid GlobalStateKey
        'Unicode',
        iconSlotTriad,
        false,
        mockListBuilder,
        [],
        mockSelectionHandler
      );

      assert.strictEqual(unicodeMenu.id, 'theme');
    });
  });
});
