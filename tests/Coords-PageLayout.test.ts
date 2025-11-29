import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { Coords } from '../src/Coords.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('Coords Advanced Unit Tests', () => {
  let app: App;
  let coords: Coords;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    app.init();
    coords = new Coords(app);
    coords.init();
  });

  afterEach(() => {
    coords.done();
    app.done();
  });

  it('should convert various page sizes correctly', () => {
    // Test A4 dimensions (210mm x 297mm)
    const a4 = coords.pageDimensionsInchesOrMmToPdfPts(210, 297, 'mm');
    const expectedA4Width = 210 * 72 / 25.4; // ~595.28 pts
    const expectedA4Height = 297 * 72 / 25.4; // ~841.89 pts
    assert.ok(Math.abs(a4.widthPts - expectedA4Width) < 0.1, 'A4 width should be ~595.28 pts');
    assert.ok(Math.abs(a4.heightPts - expectedA4Height) < 0.1, 'A4 height should be ~841.89 pts');

    // Test Letter dimensions (8.5in x 11in)
    const letter = coords.pageDimensionsInchesOrMmToPdfPts(8.5, 11, 'in');
    assert.strictEqual(letter.widthPts, 8.5 * 72, 'Letter width should be 612 pts');
    assert.strictEqual(letter.heightPts, 11 * 72, 'Letter height should be 792 pts');
  });

  it('should handle coordinate transformations', () => {
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

  it('should calculate margins correctly', () => {
    const pageHeightPts = 792;
    const topMarginPts = 72; // 1 inch
    const bottomMarginPts = 72;
    
    const topMarginY = coords.getPdfPtsYForTopMarginStart(pageHeightPts, topMarginPts);
    const bottomMarginY = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
    
    assert.strictEqual(topMarginY, pageHeightPts - topMarginPts, 'Top margin should start below top edge');
    assert.strictEqual(bottomMarginY, bottomMarginPts, 'Bottom margin Y should equal margin size');
  });

  it('should detect page breaks', () => {
    const pageHeightPts = 792;
    const bottomMarginPts = 72;
    const bottomMarginY = coords.getPdfPtsYForBottomMarginStart(bottomMarginPts);
    
    // Above bottom margin - should NOT break
    const y1 = bottomMarginY + 100;
    assert.strictEqual(
      coords.hasPdfPtsYReachedBottomMargin(y1, bottomMarginY),
      false,
      'Should not break above margin'
    );
    
    // At bottom margin - should break
    const y2 = bottomMarginY;
    assert.strictEqual(
      coords.hasPdfPtsYReachedBottomMargin(y2, bottomMarginY),
      true,
      'Should break at margin'
    );
    
    // Below bottom margin - should break
    const y3 = bottomMarginY - 10;
    assert.strictEqual(
      coords.hasPdfPtsYReachedBottomMargin(y3, bottomMarginY),
      true,
      'Should break below margin'
    );
  });

  it('should move Y position by line height', () => {
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

  it('should calculate available content area', () => {
    const pageHeightPts = 792;
    const pageWidthPts = 612;
    const topMarginPts = 72;
    const bottomMarginPts = 72;
    const leftMarginPts = 72;
    const rightMarginPts = 72;
    
    const availableHeight = coords.calculatePdfPtsAvailableHeightForContent(
      pageHeightPts,
      topMarginPts,
      bottomMarginPts
    );
    
    const availableWidth = coords.calculatePdfPtsAvailableWidthForContent(
      pageWidthPts,
      leftMarginPts,
      rightMarginPts
    );
    
    assert.strictEqual(
      availableHeight,
      pageHeightPts - topMarginPts - bottomMarginPts,
      'Should subtract top and bottom margins'
    );
    
    assert.strictEqual(
      availableWidth,
      pageWidthPts - leftMarginPts - rightMarginPts,
      'Should subtract left and right margins'
    );
  });
});
