/**
 * PDF abstraction types
 * Hides jsPDF implementation details behind our own interface
 */

export interface PDFDoc {
  /**
   * Get the number of pages in the document
   */
  getNumberOfPages(): number;

  /**
   * Get the width of the current page in points
   */
  getPageWidth(): number;

  /**
   * Get the height of the current page in points
   */
  getPageHeight(): number;

  /**
   * Set the current page number (1-based)
   */
  setPage(pageNumber: number): void;

  /**
   * Get current page information
   */
  getCurrentPageInfo(): { pageNumber: number; pageCount: number };

  /**
   * Output the PDF as an ArrayBuffer
   */
  outputArrayBuffer(): ArrayBuffer;

  /**
   * Output the PDF as a data URL string
   */
  outputDataUrl(): string;
}

/**
 * PDF generation options
 */
export interface PDFGenOptions {
  title?: string;
  theme?: string;
  fontSize?: number;
  lineHeight?: number;
  pageSize?: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  orient?: 'portrait' | 'landscape';
}