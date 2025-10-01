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
  /** Page size configuration */
  pageSize: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  /** Page orient */
  orient: 'portrait' | 'landscape';
}

export interface PageMetadata {
  /** Total number of pages in the document */
  pageTotal: number;
  /** Standard page width in pixels */
  pageWidthPx: number;
  /** Standard page height in pixels */
  pageHeightPx: number;
  /** Estimated memory usage in MB */
  estimatedMemoryMB: number;
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
  pageRender(pageNumber: number, options: RenderOptions): Promise<PageData>;

  /**
   * Get the total number of pages in the document
   * @returns Promise resolving to total page count
   */
  getTotalPages(): Promise<number>;

  /**
   * Get metadata about the document and pages
   * @returns Promise resolving to page metadata
   */
  getPageMetadata(): Promise<PageMetadata>;
}

// Re-export PageSize from PaperPrinter for convenience
export type { PageSize } from '../PaperPrinter';