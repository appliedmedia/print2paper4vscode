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
   * Set the current page number
   * @param pageNumber The page number to set (1-indexed)
   */
  setPage(pageNumber: number): void;

  /**
   * Get information about the current page
   */
  getCurrentPageInfo(): { pageNumber: number; pageCount: number };

  /**
   * Get the PDF as an ArrayBuffer
   */
  asArrayBuffer(): ArrayBuffer;

  /**
   * Get the PDF as a data URL string
   */
  asDataUrl(): string;
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

// end, PDF_t.ts
