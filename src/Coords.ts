import type { App } from './App';
import { Diagnostics } from './Diagnostics';

/**
 * Coords - Centralized coordinate system management
 *
 * Handles all coordinate conversions between different units and coordinate systems.
 * Provides a single source of truth for coordinate transformations.
 */
export class Coords {
  private app: App;
  private dx: Diagnostics;

  // ⚠️ CRITICAL: COORDINATE SYSTEM WARNING ⚠️
  // This class handles coordinate conversions for jsPDF and PDF.js
  //
  // jsPDF Coordinate System (PDF Generation):
  // - Origin (0,0) is at TOP-LEFT corner
  // - Y=0 is at the TOP of the page
  // - Y increases as we go DOWN the page
  // - X=0 is at the LEFT edge
  // - X increases as we go RIGHT
  // - This is DIFFERENT from standard PDF coordinate system!
  //
  // PDF.js Coordinate System (Webview Display):
  // - PDF Content Rendering: Bottom-left origin (standard PDF)
  // - Viewer Interface/Canvas: Top-left origin (web standard)
  // - We use the VIEWER INTERFACE system for canvas rendering
  // - This matches jsPDF's coordinate system!
  //
  // All methods in this class work with TOP-LEFT origin systems
  // (jsPDF generation + PDF.js viewer interface)
  // NOT the standard PDF coordinate system!

  // Conversion constants
  private static readonly POINTS_PER_INCH = 72;
  private static readonly POINTS_PER_MM = 2.834645669;
  private static readonly PX_TO_PTS_RATIO = 0.75; // 72 DPI / 96 DPI

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('Coords');
  }

  /**
   * Initialize the Coords system
   */
  init(): void {
    this.dx.out('Coords system initialized');
  }

  /**
   * Cleanup the Coords system
   */
  done(): void {
    this.dx.out('Coords system cleaned up');
    this.dx.done();
  }

  /**
   * Convert page dimensions from inches/millimeters to PDF points
   */
  pageDimensionsInchesOrMmToPdfPts(
    widthInchesOrMm: number,
    heightInchesOrMm: number,
    unit: 'in' | 'mm'
  ): { widthPts: number; heightPts: number } {
    const multiplier = unit === 'in' ? Coords.POINTS_PER_INCH : Coords.POINTS_PER_MM;
    const widthPts = widthInchesOrMm * multiplier;
    const heightPts = heightInchesOrMm * multiplier;
    return { widthPts, heightPts };
  }

  /**
   * Convert CSS pixels to PDF points
   */
  cssPxToPdfPts(cssPx: number): number {
    return cssPx * Coords.PX_TO_PTS_RATIO;
  }

  /**
   * Convert PDF points to CSS pixels
   */
  pdfPtsToCssPx(pdfPts: number): number {
    return pdfPts / Coords.PX_TO_PTS_RATIO;
  }

  /**
   * Convert PdfPts Y coordinate to screen Y coordinate
   * PdfPts: Y=0 at bottom-left, Y increases upward
   * Screen: Y=0 at top-left, Y increases downward
   */
  pdfPtsYToScreenY(pdfPtsY: number, pageHeightPts: number): number {
    return pageHeightPts - pdfPtsY;
  }

  /**
   * Convert screen Y coordinate to PdfPts Y coordinate
   * Screen: Y=0 at top-left, Y increases downward
   * PdfPts: Y=0 at bottom-left, Y increases upward
   */
  screenYToPdfPtsY(screenY: number, pageHeightPts: number): number {
    return pageHeightPts - screenY;
  }

  /**
   * Get the PdfPts Y coordinate where the top margin starts
   * This is where the first line of content should be positioned
   */
  getPdfPtsYForTopMarginStart(pageHeightPts: number, topMarginPts: number): number {
    return pageHeightPts - topMarginPts;
  }

  /**
   * Get the PdfPts Y coordinate where the bottom margin starts
   * This is where we need to stop rendering content
   */
  getPdfPtsYForBottomMarginStart(bottomMarginPts: number): number {
    return bottomMarginPts;
  }

  /**
   * Move down one line in PdfPts coordinate system
   * PdfPts: Y decreases as we go down the page
   */
  movePdfPtsYDownOneLine(currentPdfPtsY: number, lineHeightPts: number): number {
    return currentPdfPtsY - lineHeightPts;
  }

  /**
   * Move up one line in PdfPts coordinate system
   * PdfPts: Y increases as we go up the page
   */
  movePdfPtsYUpOneLine(currentPdfPtsY: number, lineHeightPts: number): number {
    return currentPdfPtsY + lineHeightPts;
  }

  /**
   * Check if current PdfPts Y position has reached the bottom margin
   * Returns true if we need to start a new page
   */
  hasPdfPtsYReachedBottomMargin(currentPdfPtsY: number, bottomMarginPts: number): boolean {
    return currentPdfPtsY <= bottomMarginPts;
  }

  /**
   * Calculate available height for content in PdfPts coordinates
   * This is the space between top margin and bottom margin
   */
  calculatePdfPtsAvailableHeightForContent(
    pageHeightPts: number,
    topMarginPts: number,
    bottomMarginPts: number
  ): number {
    return this.getPdfPtsYForTopMarginStart(pageHeightPts, topMarginPts) - bottomMarginPts;
  }

  /**
   * Calculate available width for content in PdfPts coordinates
   * This is the space between left margin and right margin
   */
  calculatePdfPtsAvailableWidthForContent(
    pageWidthPts: number,
    leftMarginPts: number,
    rightMarginPts: number
  ): number {
    return pageWidthPts - leftMarginPts - rightMarginPts;
  }

  /**
   * Debug: Log coordinate information
   */
  debugCoords(
    pageWidthPts: number,
    pageHeightPts: number,
    marginsPts: {
      topMarginPts: number;
      bottomMarginPts: number;
      leftMarginPts: number;
      rightMarginPts: number;
    },
    currentPdfY: number
  ): void {
    const dx = this.dx.sub('debugCoords');
    dx.out(`Page: ${pageWidthPts}x${pageHeightPts}pts`);
    dx.out(
      `Margins: top=${marginsPts.topMarginPts}, bottom=${marginsPts.bottomMarginPts}, left=${marginsPts.leftMarginPts}, right=${marginsPts.rightMarginPts}`
    );
    dx.out(`Current PDF Y: ${currentPdfY}`);
    dx.out(
      `Top margin PDF Y: ${this.getPdfPtsYForTopMarginStart(pageHeightPts, marginsPts.topMarginPts)}`
    );
    dx.out(
      `Bottom margin PDF Y: ${this.getPdfPtsYForBottomMarginStart(marginsPts.bottomMarginPts)}`
    );
    dx.out(
      `Available height: ${this.calculatePdfPtsAvailableHeightForContent(pageHeightPts, marginsPts.topMarginPts, marginsPts.bottomMarginPts)}`
    );
    dx.out(
      `Available width: ${this.calculatePdfPtsAvailableWidthForContent(pageWidthPts, marginsPts.leftMarginPts, marginsPts.rightMarginPts)}`
    );
    dx.done();
  }
}
