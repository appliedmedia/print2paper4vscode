/**
 * PageRender Interface Definitions
 *
 * Defines the contract for page-based content rendering in the scrollable viewer system.
 * Any content type that can be rendered as pages should implement this interface.
 */

import type { PageSizeId_t, Orient_t, MarginId_t } from './PaperPrinter_t';

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
  fontSizePx: number;
  /** Line height in pixels */
  lineHeightPx: number;
  /** Theme name for syntax highlighting */
  theme: string;
  /** Page size ID */
  pageSizeId: PageSizeId_t;
  /** Page orientation */
  orient: Orient_t;
  /** Margin ID */
  marginId: MarginId_t;
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
   * Render content for a specific line range
   * @param lineBegin Starting line number (0-based)
   * @param lineEnd Ending line number (exclusive, 0-based)
   * @param options Rendering options (font, size, theme, etc.)
   * @returns Promise resolving to page data (data URL, dimensions, etc.)
   * @throws PageRenderError for invalid line ranges or generation failures
   */
  renderContent(lineBegin: number, lineEnd: number, options: RenderOptions): Promise<PageData>;

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

// end, PageRender_t.ts
