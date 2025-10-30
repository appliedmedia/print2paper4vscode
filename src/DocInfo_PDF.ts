import type { App } from './App';
import type { MarginId_t, PageSizeId_t, Orient_t } from './types/PaperPrinter_t';
import { kMarginId } from './types/PaperPrinter_t';
import type { ThemedToken } from 'shiki';
import type jsPDF from 'jspdf';
import type { LanguageId_t } from './Stylize';

/**
 * PDF_DocInfo - Document information and configuration for PDF
 *
 * This class contains all PDF-related properties and provides a clean interface
 * for accessing them. The main PDF class accesses these through this.docInfo.
 */
export class DocInfo_PDF {
  private app: App;

  // Base margin constant: 0.4 inch = 28.8 points (minimum safe printing margin)
  private static readonly kMarginBasePts = 0.4 * 72; // 28.8 points

  // PDF document state
  public currentPdfDoc: jsPDF | null = null;
  public currentTokens: ThemedToken[][] | null = null;

  // PDF document wrapper - holds the jsPDF object and exposes interface methods
  public pdfDoc: jsPDF | null = null;

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
  public fontSizePx: number = 12; // Font size in pixels (source value)
  public lineHeightPts: number = 0;
  public lineHeightPx: number = 18; // Line height in pixels (source value)
  public fontFamily: string = 'Courier';

  // Theme and styling
  public theme: string = 'github-light';

  // Page settings
  public pageSizeId: PageSizeId_t = 'a4';
  public orient: Orient_t = 'portrait';
  public marginId: MarginId_t = 'normal';

  // Document content (set by caller before generatePdf)
  public code: string = '';
  public languageId: LanguageId_t = 'typescript';
  public title: string = '';

  // Temporary file tracking
  public tempPdfs: string[] = [];

  constructor(app: App) {
    this.app = app;
  }

  // Margin getter - calculates from current marginId
  // Always includes base 0.4 inch (28.8 pts) minimum margin for safe printing
  // Margin settings (none/minimal/normal/wide) are ADDED to this base
  get marginPts(): {
    topMarginPts: number;
    bottomMarginPts: number;
    leftMarginPts: number;
    rightMarginPts: number;
  } {
    // Get margin setting from kMarginId (this is ADDED to base)
    const marginSettingPts = kMarginId[this.marginId].marginPts;

    // Total margin = base + setting
    const totalMarginPts = DocInfo_PDF.kMarginBasePts + marginSettingPts;

    return {
      topMarginPts: totalMarginPts,
      bottomMarginPts: totalMarginPts,
      leftMarginPts: totalMarginPts,
      rightMarginPts: totalMarginPts,
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

  // PDF interface methods - expose jsPDF functionality through docInfo
  /**
   * Get the total number of pages in the document
   */
  get pageTotal(): number {
    return this.pdfDoc ? this.pdfDoc.getNumberOfPages() : 0;
  }

  /**
   * Get the total number of pages in the document (method version)
   * @deprecated Use pageTotal property instead
   */
  getPageTotal(): number {
    return this.pageTotal;
  }

  /**
   * Get the number of pages in the document (alias for getPageTotal)
   * @deprecated Use pageTotal property instead
   */
  getNumberOfPages(): number {
    return this.pageTotal;
  }

  /**
   * Get the width of the current page in points
   */
  getPageWidth(): number {
    if (!this.pdfDoc) return 0;
    return (this.pdfDoc as any).getPageWidth();
  }

  /**
   * Get the height of the current page in points
   */
  getPageHeight(): number {
    if (!this.pdfDoc) return 0;
    return (this.pdfDoc as any).getPageHeight();
  }

  /**
   * Set the current page number
   * @param pageNumber The page number to set (1-indexed)
   */
  setPage(pageNumber: number): void {
    if (this.pdfDoc) {
      this.pdfDoc.setPage(pageNumber);
    }
  }

  /**
   * Get information about the current page
   */
  getCurrentPageInfo(): { pageNumber: number; pageCount: number } {
    if (!this.pdfDoc) {
      return { pageNumber: 0, pageCount: 0 };
    }
    return {
      pageNumber: this.pdfDoc.getCurrentPageInfo().pageNumber,
      pageCount: this.pdfDoc.getNumberOfPages(),
    };
  }

  /**
   * Get page dimensions in pixels (UI native format)
   * PDF layer uses points internally but exposes pixels for UI consumption
   */
  get pageSizePx(): { widthPx: number; heightPx: number } {
    if (!this.pdfDoc) {
      return { widthPx: 0, heightPx: 0 };
    }

    const { Coords } = require('./Coords');
    const coords = new Coords(this.app);

    const pageWidthPts = this.getPageWidth();
    const pageHeightPts = this.getPageHeight();

    return {
      widthPx: Math.round(coords.pdfPtsToCssPx(pageWidthPts)),
      heightPx: Math.round(coords.pdfPtsToCssPx(pageHeightPts)),
    };
  }

  /**
   * Get the PDF as an ArrayBuffer
   */
  asArrayBuffer(): ArrayBuffer {
    return this.pdfDoc ? (this.pdfDoc.output('arraybuffer') as ArrayBuffer) : new ArrayBuffer(0);
  }

  /**
   * Get the PDF as a data URL string
   */
  asDataUrl(): string {
    return this.pdfDoc ? (this.pdfDoc.output('dataurlstring') as string) : '';
  }
}

// end, DocInfo_PDF.ts
