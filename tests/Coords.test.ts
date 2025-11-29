import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { Coords } from '../src/Coords.js';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('Coords', () => {
  let app: App;
  let coords: Coords;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    coords = new Coords(app);
    coords.init();
  });

  afterEach(() => {
    coords.done();
    app.done();
  });

  describe('pageDimensionsInchesOrMmToPdfPts', () => {
    it('should convert inches to PDF points', () => {
      const result = coords.pageDimensionsInchesOrMmToPdfPts(8.5, 11, 'in');
      assert.strictEqual(result.widthPts, 8.5 * 72);
      assert.strictEqual(result.heightPts, 11 * 72);
    });

    it('should convert millimeters to PDF points', () => {
      const result = coords.pageDimensionsInchesOrMmToPdfPts(210, 297, 'mm');
      const expectedWidth = 210 * 2.834645669;
      const expectedHeight = 297 * 2.834645669;
      assert.ok(Math.abs(result.widthPts - expectedWidth) < 0.001);
      assert.ok(Math.abs(result.heightPts - expectedHeight) < 0.001);
    });
  });

  describe('cssPxToPdfPts', () => {
    it('should convert CSS pixels to PDF points', () => {
      assert.strictEqual(coords.cssPxToPdfPts(96), 72); // 96px * 0.75 = 72pts
      assert.strictEqual(coords.cssPxToPdfPts(100), 75);
    });

    it('should handle zero pixels', () => {
      assert.strictEqual(coords.cssPxToPdfPts(0), 0);
    });
  });

  describe('pdfPtsToCssPx', () => {
    it('should convert PDF points to CSS pixels', () => {
      assert.strictEqual(coords.pdfPtsToCssPx(72), 96); // 72pts / 0.75 = 96px
      assert.strictEqual(coords.pdfPtsToCssPx(75), 100);
    });

    it('should handle zero points', () => {
      assert.strictEqual(coords.pdfPtsToCssPx(0), 0);
    });
  });

  describe('pdfPtsYToScreenY', () => {
    it('should convert PDF Y coordinate to screen Y coordinate', () => {
      const pageHeightPts = 842; // A4 height
      const pdfPtsY = 100; // 100 points from bottom
      const screenY = coords.pdfPtsYToScreenY(pdfPtsY, pageHeightPts);
      assert.strictEqual(screenY, 742); // 842 - 100 = 742
    });

    it('should handle top of page', () => {
      const pageHeightPts = 842;
      const pdfPtsY = 842; // Top of page in PDF coords
      const screenY = coords.pdfPtsYToScreenY(pdfPtsY, pageHeightPts);
      assert.strictEqual(screenY, 0);
    });
  });

  describe('screenYToPdfPtsY', () => {
    it('should convert screen Y coordinate to PDF Y coordinate', () => {
      const pageHeightPts = 842;
      const screenY = 100; // 100 pixels from top
      const pdfPtsY = coords.screenYToPdfPtsY(screenY, pageHeightPts);
      assert.strictEqual(pdfPtsY, 742); // 842 - 100 = 742
    });

    it('should handle top of screen', () => {
      const pageHeightPts = 842;
      const screenY = 0;
      const pdfPtsY = coords.screenYToPdfPtsY(screenY, pageHeightPts);
      assert.strictEqual(pdfPtsY, 842);
    });
  });

  describe('getPdfPtsYForTopMarginStart', () => {
    it('should calculate PDF Y coordinate for top margin', () => {
      const pageHeightPts = 842;
      const topMarginPts = 72; // 1 inch margin
      const result = coords.getPdfPtsYForTopMarginStart(pageHeightPts, topMarginPts);
      assert.strictEqual(result, 770); // 842 - 72 = 770
    });
  });

  describe('getPdfPtsYForBottomMarginStart', () => {
    it('should return bottom margin as PDF Y coordinate', () => {
      const bottomMarginPts = 72;
      const result = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
      assert.strictEqual(result, 72);
    });
  });

  describe('movePdfPtsYDownOneLine', () => {
    it('should decrease Y coordinate when moving down', () => {
      const currentY = 700;
      const lineHeightPts = 14;
      const result = coords.movePdfPtsYDownOneLine(currentY, lineHeightPts);
      assert.strictEqual(result, 686); // 700 - 14 = 686
    });
  });

  describe('movePdfPtsYUpOneLine', () => {
    it('should increase Y coordinate when moving up', () => {
      const currentY = 700;
      const lineHeightPts = 14;
      const result = coords.movePdfPtsYUpOneLine(currentY, lineHeightPts);
      assert.strictEqual(result, 714); // 700 + 14 = 714
    });
  });

  describe('hasPdfPtsYReachedBottomMargin', () => {
    it('should return true when Y is at or below bottom margin', () => {
      assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(72, 72), true);
      assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(50, 72), true);
      assert.strictEqual(coords.hasPdfPtsYReachedBottomMargin(100, 72), false);
    });
  });

  describe('calculatePdfPtsAvailableHeightForContent', () => {
    it('should calculate available height correctly', () => {
      const pageHeightPts = 842;
      const topMarginPts = 72;
      const bottomMarginPts = 72;
      const result = coords.calculatePdfPtsAvailableHeightForContent(
        pageHeightPts,
        topMarginPts,
        bottomMarginPts
      );
      // Top margin starts at 842 - 72 = 770
      // Bottom margin is at 72
      // Available height = 770 - 72 = 698
      assert.strictEqual(result, 698);
    });
  });

  describe('calculatePdfPtsAvailableWidthForContent', () => {
    it('should calculate available width correctly', () => {
      const pageWidthPts = 595; // A4 width
      const leftMarginPts = 72;
      const rightMarginPts = 72;
      const result = coords.calculatePdfPtsAvailableWidthForContent(
        pageWidthPts,
        leftMarginPts,
        rightMarginPts
      );
      assert.strictEqual(result, 451); // 595 - 72 - 72 = 451
    });
  });

  describe('kMarginGutterMinPts', () => {
    it('should have correct margin gutter constant', () => {
      assert.strictEqual(Coords.kMarginGutterMinPts, 0.4 * 72); // 0.4 inch * 72 points/inch
    });
  });

});
