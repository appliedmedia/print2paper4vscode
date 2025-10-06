/**
 * PDF_DocInfo - Document information and configuration for PDF
 * 
 * This class contains all PDF-related properties and provides a clean interface
 * for accessing them. The main PDF class accesses these through this.docInfo.
 */
export class PDF_DocInfo {
  private owner: any;
  private app: any;

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

  constructor(owner: any, app: any) {
    this.owner = owner;
    this.app = app;
  }

  // Margin getter/setter
  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    return {
      topPts: this.marginTopPts,
      bottomPts: this.marginBottomPts,
      leftPts: this.marginLeftPts,
      rightPts: this.marginRightPts
    };
  }
  set marginPts(value: { topPts: number; bottomPts: number; leftPts: number; rightPts: number }) {
    this.marginTopPts = value.topPts;
    this.marginBottomPts = value.bottomPts;
    this.marginLeftPts = value.leftPts;
    this.marginRightPts = value.rightPts;
  }
}