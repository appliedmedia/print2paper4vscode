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
const Coords_js_1 = require("../src/Coords.js");
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('Coords', () => {
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
    // pageDimensionsInchesOrMmToPdfPts was removed as dead code (only used in tests)
    (0, node_test_1.describe)('cssPxToPdfPts', () => {
        (0, node_test_1.it)('should convert CSS pixels to PDF points', () => {
            assert.strictEqual(coords.cssPxToPdfPts(96), 72); // 96px * 0.75 = 72pts
            assert.strictEqual(coords.cssPxToPdfPts(100), 75);
        });
        (0, node_test_1.it)('should handle zero pixels', () => {
            assert.strictEqual(coords.cssPxToPdfPts(0), 0);
        });
    });
    (0, node_test_1.describe)('pdfPtsToCssPx', () => {
        (0, node_test_1.it)('should convert PDF points to CSS pixels', () => {
            assert.strictEqual(coords.pdfPtsToCssPx(72), 96); // 72pts / 0.75 = 96px
            assert.strictEqual(coords.pdfPtsToCssPx(75), 100);
        });
        (0, node_test_1.it)('should handle zero points', () => {
            assert.strictEqual(coords.pdfPtsToCssPx(0), 0);
        });
    });
    (0, node_test_1.describe)('pdfPtsYToScreenY', () => {
        (0, node_test_1.it)('should convert PDF Y coordinate to screen Y coordinate', () => {
            const pageHeightPts = 842; // A4 height
            const pdfPtsY = 100; // 100 points from bottom
            const screenY = coords.pdfPtsYToScreenY(pdfPtsY, pageHeightPts);
            assert.strictEqual(screenY, 742); // 842 - 100 = 742
        });
        (0, node_test_1.it)('should handle top of page', () => {
            const pageHeightPts = 842;
            const pdfPtsY = 842; // Top of page in PDF coords
            const screenY = coords.pdfPtsYToScreenY(pdfPtsY, pageHeightPts);
            assert.strictEqual(screenY, 0);
        });
    });
    (0, node_test_1.describe)('screenYToPdfPtsY', () => {
        (0, node_test_1.it)('should convert screen Y coordinate to PDF Y coordinate', () => {
            const pageHeightPts = 842;
            const screenY = 100; // 100 pixels from top
            const pdfPtsY = coords.screenYToPdfPtsY(screenY, pageHeightPts);
            assert.strictEqual(pdfPtsY, 742); // 842 - 100 = 742
        });
        (0, node_test_1.it)('should handle top of screen', () => {
            const pageHeightPts = 842;
            const screenY = 0;
            const pdfPtsY = coords.screenYToPdfPtsY(screenY, pageHeightPts);
            assert.strictEqual(pdfPtsY, 842);
        });
    });
    (0, node_test_1.describe)('getPdfPtsYForTopMarginStart', () => {
        (0, node_test_1.it)('should calculate PDF Y coordinate for top margin', () => {
            const pageHeightPts = 842;
            const topMarginPts = 72; // 1 inch margin
            const result = coords.getPdfPtsYForTopMarginStart(pageHeightPts, topMarginPts);
            assert.strictEqual(result, 770); // 842 - 72 = 770
        });
    });
    (0, node_test_1.describe)('getPdfPtsYForBottomMarginStart', () => {
        (0, node_test_1.it)('should return bottom margin as PDF Y coordinate', () => {
            const bottomMarginPts = 72;
            const result = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
            assert.strictEqual(result, 72);
        });
    });
    (0, node_test_1.describe)('movePdfPtsYDownOneLine', () => {
        (0, node_test_1.it)('should decrease Y coordinate when moving down', () => {
            const currentY = 700;
            const lineHeightPts = 14;
            const result = coords.movePdfPtsYDownOneLine(currentY, lineHeightPts);
            assert.strictEqual(result, 686); // 700 - 14 = 686
        });
    });
    (0, node_test_1.describe)('movePdfPtsYUpOneLine', () => {
        (0, node_test_1.it)('should increase Y coordinate when moving up', () => {
            const currentY = 700;
            const lineHeightPts = 14;
            const result = coords.movePdfPtsYUpOneLine(currentY, lineHeightPts);
            assert.strictEqual(result, 714); // 700 + 14 = 714
        });
    });
    (0, node_test_1.describe)('hasPdfPtsYReachedBottomMargin', () => {
        (0, node_test_1.it)('should return true when Y is at or below bottom margin', () => {
            assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(72, 72), true);
            assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(50, 72), true);
            assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(100, 72), false);
        });
    });
    (0, node_test_1.describe)('calculatePdfPtsAvailableHeightForContent', () => {
        (0, node_test_1.it)('should calculate available height correctly', () => {
            const pageHeightPts = 842;
            const topMarginPts = 72;
            const bottomMarginPts = 72;
            const result = coords.calculatePdfPtsAvailableHeightForContent(pageHeightPts, topMarginPts, bottomMarginPts);
            // Top margin starts at 842 - 72 = 770
            // Bottom margin is at 72
            // Available height = 770 - 72 = 698
            assert.strictEqual(result, 698);
        });
    });
    (0, node_test_1.describe)('calculatePdfPtsAvailableWidthForContent', () => {
        (0, node_test_1.it)('should calculate available width correctly', () => {
            const pageWidthPts = 595; // A4 width
            const leftMarginPts = 72;
            const rightMarginPts = 72;
            const result = coords.calculatePdfPtsAvailableWidthForContent(pageWidthPts, leftMarginPts, rightMarginPts);
            assert.strictEqual(result, 451); // 595 - 72 - 72 = 451
        });
    });
    (0, node_test_1.describe)('kMarginGutterMinPts', () => {
        (0, node_test_1.it)('should have correct margin gutter constant', () => {
            assert.strictEqual(Coords_js_1.Coords.kMarginGutterMinPts, 0.4 * 72); // 0.4 inch * 72 points/inch
        });
    });
});
//# sourceMappingURL=Coords.test.js.map