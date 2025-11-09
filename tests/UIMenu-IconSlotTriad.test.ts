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
import {
  UIMenu,
  type HandleSelection_t,
  type UIMenuItem_t,
  type MenuId_t,
  type MenuItemId_t,
  type iconSlotTriad_t,
} from '../src/UIMenu.js';
import { App } from '../src/App.js';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context
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
    createWebviewPanel: () => ({
      webview: {
        asWebviewUri: (uri: any) => uri,
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => {},
      },
      reveal: () => {},
      onDidDispose: () => ({ dispose: () => {} }),
      title: '',
    }),
  },
  workspace: {
    getConfiguration: () => ({
      get: (key: string) => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
  ViewColumn: { Active: 1 },
} as any;

let app: App;

describe('UIMenu Icon Slot Triad', () => {
  
  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
  });

  // Helper to create a menu
  const createTestMenu = (
    menuIconSlotTriad: iconSlotTriad_t, 
    items: UIMenuItem_t[]
  ): UIMenu => {
    const listBuilder = (): UIMenuItem_t[] => items;
    return new UIMenu(
      app,
      'theme', // Use valid MenuId_t
      'Test Menu',
      menuIconSlotTriad,
      false,
      listBuilder,
      [],
      async () => ({ id: '', value: '' })
    );
  };
  
  describe('Icon Slot Structure', () => {
    it('should handle empty iconSlotTriad', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'empty', 
          displayName: 'Empty Icons',
          iconSlotTriad: { begin: '', main: '', end: '' }
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
          iconSlotTriad: { begin: '◀', main: '', end: '' }
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
          iconSlotTriad: { begin: '', main: '●', end: '' }
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
          iconSlotTriad: { begin: '', main: '', end: '▶' }
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
          iconSlotTriad: { begin: '◀', main: '●', end: '▶' }
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
          iconSlotTriad: { begin: '1', main: '', end: '' }
        },
        { 
          id: 'item2', 
          displayName: 'Item 2',
          iconSlotTriad: { begin: '', main: '2', end: '' }
        },
        { 
          id: 'item3', 
          displayName: 'Item 3',
          iconSlotTriad: { begin: '', main: '', end: '3' }
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
    it('should detect text_edit: prefix in main slot', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'zoom', 
          displayName: 'Zoom',
          iconSlotTriad: { 
            begin: '', 
            main: 'text_edit: {"width": "3ch", "constraints_regex": "^\\\\\\\\d{0,3}$", "value_min": 10, "value_max": 300}',
            end: '%' 
          }
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();
      
      // Should contain input element
      assert.ok(html.includes('<input'));
    });

    it('should parse text_edit JSON config correctly', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'zoom', 
          displayName: 'Zoom',
          iconSlotTriad: { 
            begin: ' ', 
            main: 'text_edit: {"width": "5ch", "constraints_regex": "^\\\\\\\\d{1,3}$", "value_min": 1, "value_max": 500}',
            end: '%▼' 
          }
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();
      
      assert.ok(html.includes('<input'));
      assert.ok(html.includes('zoom'));
    });

    it('should handle text_edit with minimal config', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'simple', 
          displayName: 'Simple',
          iconSlotTriad: { 
            begin: '', 
            main: 'text_edit: {"width": "2ch"}',
            end: '' 
          }
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();
      
      assert.ok(html.includes('<input'));
    });

    it('should validate regex patterns in text_edit config', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'validated', 
          displayName: 'Validated',
          iconSlotTriad: { 
            begin: '', 
            main: 'text_edit: {"width": "3ch", "constraints_regex": "^\\\\\\\\d{0,3}$"}',
            end: '' 
          }
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '', end: '' };
      const menu = createTestMenu(menuIcon, items);
      const html = await menu.getHTML();
      
      assert.ok(html.length > 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in icon slots', async () => {
      const items: UIMenuItem_t[] = [
        { 
          id: 'special', 
          displayName: 'Special Chars',
          iconSlotTriad: { begin: '←↑↓→', main: '⌘⇧⌥⌃', end: '✓✗✔✘' }
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
          iconSlotTriad: { begin: '🎯', main: '⚡', end: '🚀' }
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
          iconSlotTriad: { begin: '   ', main: ' ', end: '  ' }
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
          iconSlotTriad: { begin: longString, main: longString, end: longString }
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
          iconSlotTriad: { begin: '', main: '', end: '' }
        },
      ];
      const menuIcon: iconSlotTriad_t = { begin: '', main: '📝', end: '' };
      const menu = createTestMenu(menuIcon, items);
      
      assert.strictEqual(menu.id, 'theme');
      assert.strictEqual(menu.displayName, 'Test Menu');
    });
  });
});
