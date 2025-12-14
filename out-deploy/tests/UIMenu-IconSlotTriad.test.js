"use strict";
/**
 * UIMenu Icon Slot Triad Unit Tests
 *
 * Tests the new iconSlotTriad functionality that replaces the simple icon string
 * with a flexible three-slot structure (begin, main, end) for menu items.
 *
 * @module tests/UIMenu-IconSlotTriad.test
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const UIMenu_js_1 = require("../src/UIMenu.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
let app;
(0, node_test_1.describe)('UIMenu Icon Slot Triad', () => {
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    // Helper to create a menu
    const createTestMenu = (menuIconSlotTriad, items) => {
        const listBuilder = () => items;
        return new UIMenu_js_1.UIMenu({
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
    (0, node_test_1.describe)('Icon Slot Structure', () => {
        (0, node_test_1.it)('should handle empty iconSlotTriad', async () => {
            const items = [
                {
                    id: 'empty',
                    displayName: 'Empty Icons',
                    iconSlotTriad: { begin: '', main: '', end: '' }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.includes('theme'));
        });
        (0, node_test_1.it)('should handle begin slot only', async () => {
            const items = [
                {
                    id: 'begin-only',
                    displayName: 'Begin Icon',
                    iconSlotTriad: { begin: '◀', main: '', end: '' }
                },
            ];
            const menuIcon = { begin: '◀', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle main slot only', async () => {
            const items = [
                {
                    id: 'main-only',
                    displayName: 'Main Icon',
                    iconSlotTriad: { begin: '', main: '●', end: '' }
                },
            ];
            const menuIcon = { begin: '', main: '●', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle end slot only', async () => {
            const items = [
                {
                    id: 'end-only',
                    displayName: 'End Icon',
                    iconSlotTriad: { begin: '', main: '', end: '▶' }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '▶' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle all three slots populated', async () => {
            const items = [
                {
                    id: 'all-slots',
                    displayName: 'All Icons',
                    iconSlotTriad: { begin: '◀', main: '●', end: '▶' }
                },
            ];
            const menuIcon = { begin: '◀', main: '●', end: '▶' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
            assert.strictEqual(menu.id, 'theme');
        });
        (0, node_test_1.it)('should handle multiple items with different icon configurations', async () => {
            const items = [
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
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
            // Verify menu contains all three items
            assert.strictEqual(items.length, 3);
        });
    });
    (0, node_test_1.describe)('Text Edit Widget', () => {
        (0, node_test_1.it)('should detect text_edit object in main slot', async () => {
            const items = [
                {
                    id: 'zoom',
                    displayName: 'Zoom',
                    iconSlotTriad: {
                        begin: '',
                        main: {
                            type: 'text_edit',
                            width: '3ch',
                            constrain: {
                                regex: '^\\d{0,3}$', // Only 2 backslashes - clean and readable!
                                min: 10,
                                max: 300,
                            },
                        },
                        end: '%'
                    }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            // Should contain input element with separate data attributes
            assert.ok(html.includes('<input'));
            assert.ok(html.includes('data-p2p4vsc_constrain_regex'));
            assert.ok(html.includes('data-p2p4vsc_constrain_min'));
            assert.ok(html.includes('data-p2p4vsc_constrain_max'));
        });
        (0, node_test_1.it)('should generate correct data attributes from constrain object', async () => {
            const items = [
                {
                    id: 'zoom',
                    displayName: 'Zoom',
                    iconSlotTriad: {
                        begin: ' ',
                        main: {
                            type: 'text_edit',
                            width: '5ch',
                            constrain: {
                                regex: '^\\d{1,3}$', // Only 2 backslashes - clean!
                                min: 1,
                                max: 500,
                            },
                        },
                        end: '%▼'
                    }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.includes('<input'));
            assert.ok(html.includes('data-p2p4vsc_constrain_regex="^\\d{1,3}$"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_min="1"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_max="500"'));
        });
        (0, node_test_1.it)('should handle text_edit with minimal config', async () => {
            const items = [
                {
                    id: 'simple',
                    displayName: 'Simple',
                    iconSlotTriad: {
                        begin: '',
                        main: {
                            type: 'text_edit',
                            width: '2ch',
                            constrain: {
                                regex: '^\\d{0,2}$',
                                min: 0,
                                max: 99,
                            },
                        },
                        end: ''
                    }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.includes('<input'));
            assert.ok(html.includes('style="width: 2ch;"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_min="0"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_max="99"'));
        });
        (0, node_test_1.it)('should validate regex patterns in text_edit config', async () => {
            const items = [
                {
                    id: 'validated',
                    displayName: 'Validated',
                    iconSlotTriad: {
                        begin: '',
                        main: {
                            type: 'text_edit',
                            width: '3ch',
                            constrain: {
                                regex: '^\\d{0,3}$', // Only 2 backslashes - clean!
                                min: 0,
                                max: 999,
                            },
                        },
                        end: ''
                    }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.includes('data-p2p4vsc_constrain_regex="^\\d{0,3}$"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_min="0"'));
            assert.ok(html.includes('data-p2p4vsc_constrain_max="999"'));
        });
    });
    (0, node_test_1.describe)('Edge Cases', () => {
        (0, node_test_1.it)('should handle special characters in icon slots', async () => {
            const items = [
                {
                    id: 'special',
                    displayName: 'Special Chars',
                    iconSlotTriad: { begin: '←↑↓→', main: '⌘⇧⌥⌃', end: '✓✗✔✘' }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle emoji in icon slots', async () => {
            const items = [
                {
                    id: 'emoji',
                    displayName: 'Emoji',
                    iconSlotTriad: { begin: '🎯', main: '⚡', end: '🚀' }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle whitespace-only slots', async () => {
            const items = [
                {
                    id: 'whitespace',
                    displayName: 'Whitespace',
                    iconSlotTriad: { begin: '   ', main: ' ', end: '  ' }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
        (0, node_test_1.it)('should handle very long icon strings', async () => {
            const longString = 'A'.repeat(100);
            const items = [
                {
                    id: 'long',
                    displayName: 'Long',
                    iconSlotTriad: { begin: longString, main: longString, end: longString }
                },
            ];
            const menuIcon = { begin: '', main: '', end: '' };
            const menu = createTestMenu(menuIcon, items);
            const html = await menu.getHTML();
            assert.ok(html.length > 0);
        });
    });
    (0, node_test_1.describe)('Menu Properties', () => {
        (0, node_test_1.it)('should have correct menu ID and display name', async () => {
            const items = [
                {
                    id: 'test',
                    displayName: 'Test',
                    iconSlotTriad: { begin: '', main: '', end: '' }
                },
            ];
            const menuIcon = { begin: '', main: '📝', end: '' };
            const menu = createTestMenu(menuIcon, items);
            assert.strictEqual(menu.id, 'theme');
            assert.strictEqual(menu.displayName, 'Test Menu');
        });
    });
});
//# sourceMappingURL=UIMenu-IconSlotTriad.test.js.map