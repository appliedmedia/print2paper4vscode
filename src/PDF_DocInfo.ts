/**
 * PDF_DocInfo - Document information and configuration for PDF
 * 
 * This class provides a clean interface to PDF's document-related properties
 * through getters/setters that map directly to the owner's fields.
 */
export class PDF_DocInfo {
  private owner: any;
  private app: any;

  constructor(owner: any, app: any) {
    this.owner = owner;
    this.app = app;
  }

  // PDF document state
  get currentPdfDoc(): any {
    return this.owner.currentPdfDoc;
  }
  set currentPdfDoc(value: any) {
    this.owner.currentPdfDoc = value;
  }

  get paperDocInfo(): any {
    return this.owner.paperDocInfo;
  }
  set paperDocInfo(value: any) {
    this.owner.paperDocInfo = value;
  }

  // PDF generation settings
  get embedFonts(): boolean {
    return this.owner.embedFonts;
  }
  set embedFonts(value: boolean) {
    this.owner.embedFonts = value;
  }

  get compress(): boolean {
    return this.owner.compress;
  }
  set compress(value: boolean) {
    this.owner.compress = value;
  }

  get quality(): number {
    return this.owner.quality;
  }
  set quality(value: number) {
    this.owner.quality = value;
  }

  // Page rendering settings
  get pageWidthPts(): number {
    return this.owner.pageWidthPts;
  }
  set pageWidthPts(value: number) {
    this.owner.pageWidthPts = value;
  }

  get pageHeightPts(): number {
    return this.owner.pageHeightPts;
  }
  set pageHeightPts(value: number) {
    this.owner.pageHeightPts = value;
  }

  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    return this.owner.getMarginPts();
  }
  set marginPts(value: { topPts: number; bottomPts: number; leftPts: number; rightPts: number }) {
    this.owner.setMarginPts(value);
  }

  // Font settings
  get fontSizePts(): number {
    return this.owner.fontSizePts;
  }
  set fontSizePts(value: number) {
    this.owner.fontSizePts = value;
  }

  get lineHeightPts(): number {
    return this.owner.lineHeightPts;
  }
  set lineHeightPts(value: number) {
    this.owner.lineHeightPts = value;
  }

  get fontFamily(): string {
    return this.owner.fontFamily;
  }
  set fontFamily(value: string) {
    this.owner.fontFamily = value;
  }

  // Theme and styling
  get theme(): string {
    return this.owner.theme;
  }
  set theme(value: string) {
    this.owner.theme = value;
  }

  // Temporary file tracking
  get tempPdfs(): string[] {
    return this.owner.tempPdfs;
  }
  set tempPdfs(value: string[]) {
    this.owner.tempPdfs = value;
  }
}