import type jsPDF from 'jspdf';

/**
 * Extended jsPDF type with methods that exist at runtime but aren't in TypeScript definitions
 *
 * jsPDF has getPageWidth() and getPageHeight() methods at runtime, but the @types/jspdf
 * package doesn't include them in the type definitions. This type extends jsPDF to include
 * these missing methods.
 */
export interface jsPDF_t extends jsPDF {
  /**
   * Get the width of the current page in points
   */
  getPageWidth(): number;

  /**
   * Get the height of the current page in points
   */
  getPageHeight(): number;
}

// end, PDF_t.ts
