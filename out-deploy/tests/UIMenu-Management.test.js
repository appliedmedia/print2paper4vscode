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
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('UIMenu Simple Unit Tests', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should create and retrieve menus', () => {
        // Create menus
        app.paperprinter.createMenus();
        const menus = app.uimenumgr.getUIMenus();
        assert.ok(menus.length > 0, 'Should have menus after creation');
    });
    (0, node_test_1.it)('should get menu by ID', () => {
        app.paperprinter.createMenus();
        // Try to get a known menu
        const printMenu = app.uimenumgr.getMenuById('print');
        assert.ok(printMenu, 'Should retrieve print menu');
        assert.strictEqual(printMenu.id, 'print', 'Should have correct ID');
    });
    (0, node_test_1.it)('should handle menu item selection', () => {
        app.paperprinter.createMenus();
        const themeMenu = app.uimenumgr.getMenuById('theme');
        assert.ok(themeMenu, 'Should have theme menu');
        // Get menu items
        const items = themeMenu.getMenuItems();
        assert.ok(Array.isArray(items), 'Should return array of items');
        assert.ok(items.length > 0, 'Should have theme options');
    });
    (0, node_test_1.it)('should get all menus', () => {
        app.paperprinter.createMenus();
        const menus = app.uimenumgr.getUIMenus();
        assert.ok(Array.isArray(menus), 'Should return array of menus');
        assert.ok(menus.length > 0, 'Should have multiple menus');
    });
    (0, node_test_1.it)('should persist menu selections', () => {
        app.paperprinter.createMenus();
        const persist = app.reg.getInstance('persist');
        // Set a value
        persist.set('theme', 'github-light');
        // Retrieve it
        const selectedTheme = app.uimenumgr.getMenuItemIdSelected('theme');
        assert.strictEqual(selectedTheme, 'github-light', 'Should persist selection');
    });
});
//# sourceMappingURL=UIMenu-Management.test.js.map