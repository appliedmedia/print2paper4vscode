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
const Coords_js_1 = require("../src/Coords.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('Coords Advanced Unit Tests', () => {
    let app;
    let coords;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        coords = new Coords_js_1.Coords({ reg: app.reg });
    });
    (0, node_test_1.afterEach)(() => {
        coords.done();
        app.done();
    });
    (0, node_test_1.it)('should handle coordinate transformations', () => {
        const pageHeightPts = 792; // Letter size height
        // Test Y-axis flip
        const screenY = 100;
        const pdfY = coords.screenYToPdfPtsY(screenY, pageHeightPts);
        // Y should be inverted
        assert.strictEqual(pdfY, pageHeightPts - screenY, 'Y coordinate should be flipped');
        // Test reverse transformation
        const backToScreen = coords.pdfPtsYToScreenY(pdfY, pageHeightPts);
        assert.strictEqual(backToScreen, screenY, 'Should convert back correctly');
    });
    (0, node_test_1.it)('should calculate margins correctly', () => {
        const pageHeightPts = 792;
        const topMarginPts = 72; // 1 inch
        const bottomMarginPts = 72;
        const topMarginY = coords.getPdfPtsYForTopMarginStart(pageHeightPts, topMarginPts);
        const bottomMarginY = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
        assert.strictEqual(topMarginY, pageHeightPts - topMarginPts, 'Top margin should start below top edge');
        assert.strictEqual(bottomMarginY, bottomMarginPts, 'Bottom margin Y should equal margin size');
    });
    (0, node_test_1.it)('should detect page breaks', () => {
        const pageHeightPts = 792;
        const bottomMarginPts = 72;
        const bottomMarginY = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
        // Above bottom margin - should NOT break
        const y1 = bottomMarginY + 100;
        assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(y1, bottomMarginY), false, 'Should not break above margin');
        // At bottom margin - should break
        const y2 = bottomMarginY;
        assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(y2, bottomMarginY), true, 'Should break at margin');
        // Below bottom margin - should break
        const y3 = bottomMarginY - 10;
        assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(y3, bottomMarginY), true, 'Should break below margin');
    });
    (0, node_test_1.it)('should move Y position by line height', () => {
        const startY = 700;
        const lineHeightPx = 20;
        const lineHeightPts = coords.cssPxToPdfPts(lineHeightPx);
        // Move down (decreases Y in PDF coordinates)
        const downY = coords.movePdfPtsYDownOneLine(startY, lineHeightPts);
        assert.ok(downY < startY, 'Moving down should decrease Y');
        assert.strictEqual(downY, startY - lineHeightPts, 'Should move by line height');
        // Move up (increases Y in PDF coordinates)
        const upY = coords.movePdfPtsYUpOneLine(downY, lineHeightPts);
        assert.strictEqual(upY, startY, 'Moving up should return to original Y');
    });
    (0, node_test_1.it)('should calculate available content area', () => {
        const pageHeightPts = 792;
        const pageWidthPts = 612;
        const topMarginPts = 72;
        const bottomMarginPts = 72;
        const leftMarginPts = 72;
        const rightMarginPts = 72;
        const availableHeight = coords.calculatePdfPtsAvailableHeightForContent(pageHeightPts, topMarginPts, bottomMarginPts);
        const availableWidth = coords.calculatePdfPtsAvailableWidthForContent(pageWidthPts, leftMarginPts, rightMarginPts);
        assert.strictEqual(availableHeight, pageHeightPts - topMarginPts - bottomMarginPts, 'Should subtract top and bottom margins');
        assert.strictEqual(availableWidth, pageWidthPts - leftMarginPts - rightMarginPts, 'Should subtract left and right margins');
    });
});
//# sourceMappingURL=Coords-PageLayout.test.js.map