import type { App } from './App';
import type { MarginId } from './DocInfo_PaperPrinter';

// Margin ID to points conversion
const MARGIN_ID_TO_PTS: { [key in MarginId]: number } = {
  none: 0,      // 0pts
  minimal: 5,   // 5pts
  normal: 15,   // 15pts  
  wide: 30      // 30pts
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
  public currentPdfDoc: any = null;
  public paperDocInfo: any = null;
  public currentTokens: any = null;

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
  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    // Get current margin ID from PaperPrinter's persistent state
    const marginId = (this.app.paperprinter.docInfo.persist as any).marginId as MarginId;
    const marginPts = MARGIN_ID_TO_PTS[marginId];
    
    return {
      topPts: marginPts,
      bottomPts: marginPts,
      leftPts: marginPts,
      rightPts: marginPts
    };
  }
  
  // Margin setter - sets all 4 sides
  set marginPts(value: { topPts: number; bottomPts: number; leftPts: number; rightPts: number }) {
    this.marginTopPts = value.topPts;
    this.marginBottomPts = value.bottomPts;
    this.marginLeftPts = value.leftPts;
    this.marginRightPts = value.rightPts;
  }

}