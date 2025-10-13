/**
 * PageRender Interface Definitions
 *
 * Defines the contract for page-based content rendering in the scrollable viewer system.
 * Any content type that can be rendered as pages should implement this interface.
 */

export interface PageData {
  /** Data URL of the rendered page (e.g., PDF data URL) */
  dataUrl: string;
  /** Width of the page in pixels */
  widthPx: number;
  /** Height of the page in pixels */
  heightPx: number;
  /** Page number (1-based) */
  pageNumber: number;
}

export interface RenderOptions {
  /** Font family for text rendering */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Line height in pixels */
  lineHeight: number;
  /** Theme name for syntax highlighting */
  theme: string;
  /** Page size ID */
  pageSizeId: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  /** Page orient */
  orient: 'portrait' | 'landscape';
}

export interface PageRenderError {
  /** Error message */
  message: string;
  /** Page number that failed to render */
  pageNumber: number;
  /** Error type for categorization */
  type: 'generation' | 'validation' | 'memory' | 'unknown';
  /** Timestamp of the error */
  timestamp: Date;
}

/**
 * PageRender Interface
 *
 * Core interface for page-based content rendering. Implementations should:
 * - Generate individual pages on-demand
 * - Provide metadata about the document
 * - Handle errors gracefully
 * - Cache results when appropriate
 */
export interface PageRender {
  /**
   * Render a specific page with the given options
   * @param pageNumber 1-based page number
   * @param options Rendering configuration
   * @returns Promise resolving to page data
   * @throws PageRenderError for invalid page numbers or generation failures
   */
  renderPage(pageNumber: number, options: RenderOptions): Promise<PageData>;

  /**
   * Get the total number of pages in the document
   * @returns Promise resolving to total page count
   */
  getPageTotal(): Promise<number>;

  /**
   * Get page dimensions in pixels
   * @returns Promise resolving to page dimensions
   */
  getPageSizePx(): Promise<{ widthPx: number; heightPx: number }>;
}

// Re-export PageSizeId_t from PaperPrinter for convenience
export type { PageSizeId_t } from '../PaperPrinter';
