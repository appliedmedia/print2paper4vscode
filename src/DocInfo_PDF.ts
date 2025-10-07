import type { App } from './App';

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

  // Margin getter - computes margin data from PaperPrinter's margin ID
  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    const marginValue = this.app.paperprinter.docInfo.getMarginPts();
    return {
      topPts: marginValue,
      bottomPts: marginValue,
      leftPts: marginValue,
      rightPts: marginValue
    };
  }
}