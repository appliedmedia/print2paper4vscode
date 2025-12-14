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
const DocInfo_PaperPrinter_js_1 = require("../src/DocInfo_PaperPrinter.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('DocInfo_PaperPrinter', () => {
    let app;
    let docInfo;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Create menus before tests that need them (menus are created on-demand in production)
        // Access private createMenus method through type assertion
        app.paperprinter.createMenus();
        docInfo = DocInfo_PaperPrinter_js_1.DocInfo_PaperPrinter.create({ reg: app.reg });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should return default margin when no menu is set', () => {
        const margin = docInfo.marginPx;
        assert.ok(typeof margin.topPx === 'number');
        assert.ok(typeof margin.bottomPx === 'number');
        assert.ok(typeof margin.leftPx === 'number');
        assert.ok(typeof margin.rightPx === 'number');
        assert.strictEqual(margin.topPx, margin.bottomPx);
        assert.strictEqual(margin.leftPx, margin.rightPx);
    });
    (0, node_test_1.it)('should return different margin values for different margin IDs', () => {
        const persist = app.reg.getInstance('persist');
        // Set margin to 'none'
        persist.set('marginId', 'none');
        const noneMargin = docInfo.marginPx;
        assert.strictEqual(noneMargin.topPx, 0);
        // Set margin to 'minimal'
        persist.set('marginId', 'minimal');
        const minimalMargin = docInfo.marginPx;
        assert.strictEqual(minimalMargin.topPx, 7);
        // Set margin to 'normal'
        persist.set('marginId', 'normal');
        const normalMargin = docInfo.marginPx;
        assert.strictEqual(normalMargin.topPx, 20);
        // Set margin to 'wide'
        persist.set('marginId', 'wide');
        const wideMargin = docInfo.marginPx;
        assert.strictEqual(wideMargin.topPx, 40);
    });
    (0, node_test_1.it)('should default to normal when invalid margin ID is provided', () => {
        const persist = app.reg.getInstance('persist');
        persist.set('marginId', 'invalid-margin');
        const margin = docInfo.marginPx;
        assert.strictEqual(margin.topPx, 20); // Should default to 'normal'
    });
});
//# sourceMappingURL=DocInfo_PaperPrinter.test.js.map