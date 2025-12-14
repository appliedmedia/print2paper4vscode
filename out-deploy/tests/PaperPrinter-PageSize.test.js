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
(0, node_test_1.describe)('PaperPrinter Page Size Unit Tests', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should have page size menu items', () => {
        const pageSizeItems = app.paperprinter.menuItems_PageSizeId();
        assert.ok(Array.isArray(pageSizeItems), 'Should return array of page sizes');
        assert.ok(pageSizeItems.length > 0, 'Should have page size options');
        // Check structure
        const firstItem = pageSizeItems[0];
        assert.ok(firstItem.id, 'Should have id');
        assert.ok(firstItem.displayName, 'Should have displayName');
    });
    (0, node_test_1.it)('should have orientation menu items', () => {
        const orientItems = app.paperprinter.menuItems_Orient();
        assert.ok(Array.isArray(orientItems), 'Should return array of orientations');
        assert.strictEqual(orientItems.length, 2, 'Should have portrait and landscape');
        // Check for portrait and landscape
        const ids = orientItems.map((item) => item.id);
        assert.ok(ids.includes('portrait'), 'Should have portrait option');
        assert.ok(ids.includes('landscape'), 'Should have landscape option');
    });
    (0, node_test_1.it)('should have margin menu items', () => {
        const marginItems = app.paperprinter.menuItems_MarginId();
        assert.ok(Array.isArray(marginItems), 'Should return array of margins');
        assert.ok(marginItems.length > 0, 'Should have margin options');
    });
    (0, node_test_1.it)('should have valid page sizes in constants', () => {
        const { kPageSizeId } = require('../src/types/PaperPrinter_t.js');
        assert.ok(kPageSizeId, 'Should have page size constants');
        assert.ok(kPageSizeId.menuItems, 'Should have menu items array');
        assert.ok(kPageSizeId.menuItems.length > 0, 'Should have page size options');
        // Check common page sizes exist
        const ids = kPageSizeId.menuItems.map((item) => item.id);
        assert.ok(ids.includes('a4'), 'Should have A4');
        assert.ok(ids.includes('letter'), 'Should have Letter');
    });
});
//# sourceMappingURL=PaperPrinter-PageSize.test.js.map