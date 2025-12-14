"use strict";
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
const UIMenuMgr_js_1 = require("../src/UIMenuMgr.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('UIMenuMgr', () => {
    let app;
    let menuMgr;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        menuMgr = new UIMenuMgr_js_1.UIMenuMgr({ reg: app.reg });
    });
    (0, node_test_1.afterEach)(() => {
        menuMgr.done();
        app.done();
    });
    (0, node_test_1.it)('should validate menu IDs', () => {
        assert.strictEqual(menuMgr.isMenuId('theme'), true);
        assert.strictEqual(menuMgr.isMenuId('invalid'), false);
    });
    (0, node_test_1.it)('should validate menu item IDs', () => {
        assert.strictEqual(menuMgr.isMenuItemId('github-light'), true); // Theme ID
        assert.strictEqual(menuMgr.isMenuItemId('invalid'), false);
    });
    (0, node_test_1.it)('should validate numeric menu item IDs (font sizes)', () => {
        // Create a font size menu first
        const iconSlotTriad = { begin: ``, main: `A`, end: `` };
        const fontMenu = menuMgr.createMenu({
            id: 'fontSizeId',
            displayName: 'Font Size',
            iconSlotTriad,
            isFlyout: false,
            menuItems: () => [{ id: '12', displayName: '12', iconSlotTriad: { begin: '', main: '', end: '' } }],
            flyoutMenuItemIds: [],
            selectionHandler: async (id) => ({ id, value: id }),
        });
        menuMgr.addMenu(fontMenu);
        assert.strictEqual(menuMgr.isMenuItemId('12'), true);
    });
    (0, node_test_1.it)('should get all menus', () => {
        const menus = menuMgr.getUIMenus();
        assert.ok(Array.isArray(menus));
    });
    (0, node_test_1.it)('should add menu', () => {
        const iconSlotTriad = { begin: ``, main: `T`, end: `` };
        const menu = menuMgr.createMenu({
            id: 'test',
            displayName: 'Test Menu',
            iconSlotTriad,
            isFlyout: false,
            menuItems: () => [],
            flyoutMenuItemIds: [],
            selectionHandler: async (id) => ({ id, value: id }),
        });
        menuMgr.addMenu(menu);
        const menus = menuMgr.getUIMenus();
        assert.strictEqual(menus.length, 1);
    });
    (0, node_test_1.it)('should not add duplicate menus', () => {
        const iconSlotTriad = { begin: ``, main: `T`, end: `` };
        const menu = menuMgr.createMenu({
            id: 'test',
            displayName: 'Test Menu',
            iconSlotTriad,
            isFlyout: false,
            menuItems: () => [],
            flyoutMenuItemIds: [],
            selectionHandler: async (id) => ({ id, value: id }),
        });
        menuMgr.addMenu(menu);
        menuMgr.addMenu(menu);
        const menus = menuMgr.getUIMenus();
        assert.strictEqual(menus.length, 1);
    });
    (0, node_test_1.it)('should get menu by ID', () => {
        const iconSlotTriad = { begin: ``, main: `T`, end: `` };
        const menu = menuMgr.createMenu({
            id: 'test',
            displayName: 'Test Menu',
            iconSlotTriad,
            isFlyout: false,
            menuItems: () => [],
            flyoutMenuItemIds: [],
            selectionHandler: async (id) => ({ id, value: id }),
        });
        menuMgr.addMenu(menu);
        const foundMenu = menuMgr.getMenuById('test');
        assert.strictEqual(foundMenu.id, 'test');
    });
    (0, node_test_1.it)('should throw error when getting non-existent menu', () => {
        assert.throws(() => {
            menuMgr.getMenuById('nonexistent');
        }, /Menu not found/);
    });
    (0, node_test_1.it)('should get all menu CSS', () => {
        const css = menuMgr.getUIMenus_CSS();
        assert.ok(typeof css === 'string');
    });
    (0, node_test_1.it)('should get all menu JS', () => {
        const js = menuMgr.getUIMenus_JS();
        assert.ok(typeof js === 'string');
    });
    (0, node_test_1.it)('should return empty string when no menus exist for CSS', () => {
        const emptyMgr = new UIMenuMgr_js_1.UIMenuMgr({ reg: app.reg });
        const css = emptyMgr.getUIMenus_CSS();
        assert.strictEqual(css, '');
    });
    (0, node_test_1.it)('should return empty string when no menus exist for JS', () => {
        const emptyMgr = new UIMenuMgr_js_1.UIMenuMgr({ reg: app.reg });
        const js = emptyMgr.getUIMenus_JS();
        assert.strictEqual(js, '');
    });
});
//# sourceMappingURL=UIMenuMgr.test.js.map