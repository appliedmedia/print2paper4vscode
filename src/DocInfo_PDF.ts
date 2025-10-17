import type { App } from './App';
import type { MarginId_t } from './types/PaperPrinter_t';
import type { ThemedToken } from 'shiki';
import type jsPDF from 'jspdf';

// Margin ID to points conversion
const MARGIN_ID_TO_PTS: { [key in MarginId_t]: number } = {
  none: 0, // 0pts
  minimal: 5, // 5pts
  normal: 15, // 15pts
  wide: 30, // 30pts
} as const;

/**
 * PDF_DocInfo - Document information and configuration for PDF
 *
 * This class contains all PDF-related properties and provides a clean interface
 * for accessing them. The main PDF class accesses these through this.docInfo.
 */
export class DocInfo_PDF {
  private app: App;

  // PDF document state
  public currentPdfDoc: jsPDF | null = null;
  public currentTokens: ThemedToken[][] | null = null;

  // PDF generation settings
  public embedFonts: boolean = true;
  public compress: boolean = true;
  public quality: number = 0.92;

  // Page rendering settings
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  // Margin settings (all 4 sides in points)
  public marginTopPts: number = 15;
  public marginBottomPts: number = 15;
  public marginLeftPts: number = 15;
  public marginRightPts: number = 15;

  // Font settings
  public fontSizePts: number = 0;
  public lineHeightPts: number = 0;
  public fontFamily: string = 'Courier';

  // Theme and styling
  public theme: string = 'github-light';

  // Temporary file tracking
  public tempPdfs: string[] = [];

  constructor(app: App) {
    this.app = app;
  }

  // Margin getter - calculates from current marginId
  get marginPts(): {
    topMarginPts: number;
    bottomMarginPts: number;
    leftMarginPts: number;
    rightMarginPts: number;
  } {
    // Get current margin ID from menu's persistent state
    const menu = this.app.uimenumgr.getMenuById('marginId');
    const rawMarginId = menu.persist.marginId;
    const marginId: MarginId_t =
      typeof rawMarginId === 'string' && rawMarginId in MARGIN_ID_TO_PTS
        ? (rawMarginId as MarginId_t)
        : 'normal';
    const marginPts = MARGIN_ID_TO_PTS[marginId];

    return {
      topMarginPts: marginPts,
      bottomMarginPts: marginPts,
      leftMarginPts: marginPts,
      rightMarginPts: marginPts,
    };
  }

  // Margin setter - sets all 4 sides
  set marginPts(value: {
    topMarginPts: number;
    bottomMarginPts: number;
    leftMarginPts: number;
    rightMarginPts: number;
  }) {
    this.marginTopPts = value.topMarginPts;
    this.marginBottomPts = value.bottomMarginPts;
    this.marginLeftPts = value.leftMarginPts;
    this.marginRightPts = value.rightMarginPts;
  }
}

// end, DocInfo_PDF.ts
