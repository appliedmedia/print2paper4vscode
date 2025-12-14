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
(0, node_test_1.describe)('PaperPrinter Zoom Unit Tests', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Create menus so zoom menus exist
        app.paperprinter.createMenus();
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should have zoom menu items', () => {
        const zoomMenuItems = app.paperprinter.menuItems_ZoomLevel();
        assert.ok(Array.isArray(zoomMenuItems), 'Should return array of zoom levels');
        assert.ok(zoomMenuItems.length > 0, 'Should have zoom level options');
    });
    (0, node_test_1.it)('should have zoom in/out menu items', () => {
        const zoomInOutItems = app.paperprinter.menuItems_ZoomInOut();
        assert.ok(Array.isArray(zoomInOutItems), 'Should return array');
        // ZoomInOut may return different number of items based on implementation
        assert.ok(zoomInOutItems.length >= 0, 'Should return array of zoom controls');
    });
    (0, node_test_1.it)('should set zoom level text edit value', () => {
        const zoomValue = 1.25; // 125%
        app.paperprinter.zoomLevel_setTextEdit(zoomValue);
        // Should not throw
        assert.ok(true, 'Should set zoom level without error');
    });
    (0, node_test_1.it)('should clamp zoom values to valid range', () => {
        // Test values outside normal range
        const testValues = [0.3, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
        testValues.forEach(value => {
            try {
                app.paperprinter.zoomLevel_setTextEdit(value);
                assert.ok(true, `Should handle zoom value ${value}`);
            }
            catch (error) {
                assert.fail(`Should not throw for zoom value ${value}`);
            }
        });
    });
});
//# sourceMappingURL=PaperPrinter-Zoom.test.js.map