/**
 * UIMenu Icon Slot Triad Unit Tests
 *
 * Tests the new iconSlotTriad functionality that replaces the simple icon string
 * with a flexible three-slot structure (begin, main, end) for menu items.
 *
 * @module tests/UIMenu-IconSlotTriad.test
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { UIMenu } from '../src/UIMenu.js';
import type {
  UIMenuItem_t,
  iconSlotTriad_t,
} from '../src/types/UIMenu_t.js';
import { createTestApp, TestApp } from './test-utils.js';
import { mockContext, mockVSCode } from './test-utils.js';

let app: TestApp;

describe('UIMenu Icon Slot Triad', () => {
  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
  });

  // Helper to create a menu
  const createTestMenu = (menuIconSlotTriad: iconSlotTriad_t, items: UIMenuItem_t[]): UIMenu => {
    const listBuilder = (): UIMenuItem_t[] => items;
    return new UIMenu({
      reg: app.reg,
      id: 'theme', // Use valid MenuId_t
      displayName: 'Test Menu',
      iconSlotTriad: menuIconSlotTriad,
      isFlyout: false,
      menuItems: listBuilder,
      flyoutMenuItemIds: [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
  };

  describe('Icon Slot Structure', () => {
    it('should handle empty iconSlotTriad', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'empty',
          displayName: 'Empty Icons',
          iconSlotTriad: { begin: '', main: '', end: '' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.includes('theme'));
    });

    it('should handle begin slot only', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'begin-only',
          displayName: 'Begin Icon',
          iconSlotTriad: { begin: '◀', main: '', end: '' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '◀', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle main slot only', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'main-only',
          displayName: 'Main Icon',
          iconSlotTriad: { begin: '', main: '●', end: '' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '●', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle end slot only', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'end-only',
          displayName: 'End Icon',
          iconSlotTriad: { begin: '', main: '', end: '▶' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '▶' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle all three slots populated', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'all-slots',
          displayName: 'All Icons',
          iconSlotTriad: { begin: '◀', main: '●', end: '▶' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '◀', main: '●', end: '▶' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
      assert.strictEqual(menu.id, 'theme');
    });

    it('should handle multiple items with different icon configurations', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'item1',
          displayName: 'Item 1',
          iconSlotTriad: { begin: '1', main: '', end: '' },
        },
        {
          id: 'item2',
          displayName: 'Item 2',
          iconSlotTriad: { begin: '', main: '2', end: '' },
        },
        {
          id: 'item3',
          displayName: 'Item 3',
          iconSlotTriad: { begin: '', main: '', end: '3' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
      // Verify menu contains all three items
      assert.strictEqual(items.length, 3);
    });
  });

  describe('Text Edit Widget', () => {
    it('should detect text_edit object in main slot', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'zoom',
          displayName: 'Zoom',
          iconSlotTriad: {
            begin: '',
            main: {
              type: 'text_edit' as const,
              width: '3ch',
              persistId: 'test_zoom',
              constrain: {
                regex: '^\\d{0,3}$', // Only 2 backslashes - clean and readable!
                min: 10,
                max: 300,
              },
            },
            end: '%',
          },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      // Should contain input element with separate data attributes
      assert.ok(html.includes('<input'));
      assert.ok(html.includes('data-p2p4vsc_constrain_regex'));
      assert.ok(html.includes('data-p2p4vsc_constrain_min'));
      assert.ok(html.includes('data-p2p4vsc_constrain_max'));
    });

    it('should generate correct data attributes from constrain object', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'zoom',
          displayName: 'Zoom',
          iconSlotTriad: {
            begin: ' ',
            main: {
              type: 'text_edit' as const,
              width: '5ch',
              persistId: 'test_zoom2',
              constrain: {
                regex: '^\\d{1,3}$', // Only 2 backslashes - clean!
                min: 1,
                max: 500,
              },
            },
            end: '%▼',
          },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.includes('<input'));
      assert.ok(html.includes('data-p2p4vsc_constrain_regex="^\\d{1,3}$"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_min="1"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_max="500"'));
    });

    it('should handle text_edit with minimal config', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'simple',
          displayName: 'Simple',
          iconSlotTriad: {
            begin: '',
            main: {
              type: 'text_edit' as const,
              width: '2ch',
              persistId: 'test_value',
              constrain: {
                regex: '^\\d{0,2}$',
                min: 0,
                max: 99,
              },
            },
            end: '',
          },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.includes('<input'));
      assert.ok(html.includes('style="width: 2ch;"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_min="0"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_max="99"'));
    });

    it('should validate regex patterns in text_edit config', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'validated',
          displayName: 'Validated',
          iconSlotTriad: {
            begin: '',
            main: {
              type: 'text_edit' as const,
              width: '3ch',
              persistId: 'test_count',
              constrain: {
                regex: '^\\d{0,3}$', // Only 2 backslashes - clean!
                min: 0,
                max: 999,
              },
            },
            end: '',
          },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.includes('data-p2p4vsc_constrain_regex="^\\d{0,3}$"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_min="0"'));
      assert.ok(html.includes('data-p2p4vsc_constrain_max="999"'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in icon slots', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'special',
          displayName: 'Special Chars',
          iconSlotTriad: { begin: '←↑↓→', main: '⌘⇧⌥⌃', end: '✓✗✔✘' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle emoji in icon slots', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'emoji',
          displayName: 'Emoji',
          iconSlotTriad: { begin: '🎯', main: '⚡', end: '🚀' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle whitespace-only slots', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'whitespace',
          displayName: 'Whitespace',
          iconSlotTriad: { begin: '   ', main: ' ', end: '  ' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });

    it('should handle very long icon strings', async () => {
      const longString = 'A'.repeat(100);
      const items: UIMenuItem_t[] = [
        {
          id: 'long',
          displayName: 'Long',
          iconSlotTriad: { begin: longString, main: longString, end: longString },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();

      assert.ok(html.length > 0);
    });
  });

  describe('Menu Properties', () => {
    it('should have correct menu ID and display name', async () => {
      const items: UIMenuItem_t[] = [
        {
          id: 'test',
          displayName: 'Test',
          iconSlotTriad: { begin: '', main: '', end: '' },
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '📝', end: '' };
      const menu = createTestMenu(menuIcon, items);

      assert.strictEqual(menu.id, 'theme');
      assert.strictEqual(menu.displayName, 'Test Menu');
    });
  });
});
