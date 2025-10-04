import type { App } from './App';
import type { PageSizeId } from './PaperPrinter';
import type { PageRender, PageData, RenderOptions, PageRenderError } from './types/PageRender_t';
import type { PDFDoc } from './types/PDF_t';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';
import type { ThemedToken } from 'shiki';

/**
 * PDFDoc wrapper that hides jsPDF implementation details
 */
class PDFDocWrapper implements PDFDoc {
  constructor(private jsPdfDoc: jsPDF) {}

  getNumberOfPages(): number {
    return this.jsPdfDoc.getNumberOfPages();
  }

  getPageWidth(): number {
    return this.jsPdfDoc.getPageWidth();
  }

  getPageHeight(): number {
    return this.jsPdfDoc.getPageHeight();
  }

  setPage(pageNumber: number): void {
    this.jsPdfDoc.setPage(pageNumber);
  }

  getCurrentPageInfo(): { pageNumber: number; pageCount: number } {
    return this.jsPdfDoc.getCurrentPageInfo();
  }

  asArrayBuffer(): ArrayBuffer {
    return this.jsPdfDoc.output('arraybuffer') as ArrayBuffer;
  }

  asDataUrl(): string {
    return this.jsPdfDoc.output('datauristring') as string;
  }

  // Internal method to get the underlying jsPDF instance
  // This should only be used within the PDF class
  _getJsPDFInstance(): jsPDF {
    return this.jsPdfDoc;
  }
}

export class PDF implements PageRender {
  private app: App;
  private tempPdfs: string[] = [];
  private dx: Diagnostics;
  private _yaml: {
    pdf_html: string;
    pdf_css: string;
    pdf_js: string;
  } = {
    pdf_html: '',
    pdf_css: '',
    pdf_js: '',
  };

  // PageRender implementation state
  private currentTokens: ThemedToken[][] | null = null;
  private pageBreaks: number[] = [];
  private pageTotal: number = 0;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('PDF');
  }

  get yaml() {
    // If already loaded, return it
    if (this._yaml.pdf_html) {
      return this._yaml;
    }

    // Load and parse YAML file
    const yaml = this.app.os.fileRead<{
      pdf_html: string;
      pdf_css: string;
      pdf_js: string;
    }>('src/PDF.yaml');

    // Cache it
    if (yaml) {
      this._yaml = yaml;
    }
    return this._yaml;
  }

  init(): void {
    this.tempPdfs = [];
    this.currentTokens = null;
    this.pageBreaks = [];
    this.pageTotal = 0;
  }

  done(): void {
    // Best-effort cleanup of temp PDFs created this session
    for (const p of this.tempPdfs) {
      try {
        this.app.os.fileDelete(p);
      } catch {
        /* ignore */
      }
    }
    this.tempPdfs = [];
    this.dx.done();
  }

  /**
   * Create a PDFDoc wrapper from a jsPDF instance
   * This hides the jsPDF implementation details
   */
  createPDFDoc(jsPdfDoc: jsPDF): PDFDoc {
    return new PDFDocWrapper(jsPdfDoc);
  }

  async printWithPreview(pdfDoc: PDFDoc, descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub('printWithPreview');
    dx.require({ pdfDoc }, ['pdfDoc']);

    try {
      // Generate filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.app.vscodeapis.getDir_Temp();
      this.app.os.ensureDir(tempDir);
      const tempPdfPath = this.app.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
      const pdfBuffer = pdfDoc.asArrayBuffer();
      this.app.os.fileWrite(tempPdfPath, Buffer.from(new Uint8Array(pdfBuffer)));

      this.trackTempPdf(tempPdfPath);
      await this.app.os.fileOpenPrintDialog(tempPdfPath);
      dx.out('Opened PDF in Preview app');
    } catch (error) {
      dx.out(`Error in print with preview: ${error}`);
      throw error;
    }
    dx.done();
  }

  async printDirectly(pdfDoc: PDFDoc, descriptiveName?: string): Promise<void> {
    try {
      // Generate filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.app.vscodeapis.getDir_Temp();
      this.app.os.ensureDir(tempDir);
      const tempPdfPath = this.app.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
      const pdfBuffer = pdfDoc.asArrayBuffer();
      this.app.os.fileWrite(tempPdfPath, Buffer.from(new Uint8Array(pdfBuffer)));

      this.trackTempPdf(tempPdfPath);
      // Send PDF to printer
      await this.app.os.filePrint(tempPdfPath);
      this.dx.out('Sent PDF to printer');
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to print PDF: ${String(error)}`);
      throw error;
    }
  }

  async saveAsPDF(pdfDoc: PDFDoc, descriptiveName?: string): Promise<void> {
    try {
      // Generate default filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const defaultFilename = `${timestamp}_${safeName}.pdf`;

      // Ask user for save location using UI method
      const targetPath = await this.app.ui.chooseSaveLocation(defaultFilename);

      if (!targetPath) {
        this.dx.out('Save cancelled by user');
        return;
      }

      // Ensure directory exists
      const targetDir = this.app.os.pathDirname(targetPath);
      this.app.os.ensureDir(targetDir);

      // Save PDF document directly to chosen location
      const pdfBuffer = pdfDoc.asArrayBuffer();
      this.app.os.fileWrite(targetPath, Buffer.from(new Uint8Array(pdfBuffer)));

      // Track file for cleanup (optional)
      this.trackTempPdf(targetPath);

      // Reveal file in file explorer
      await this.app.os.fileReveal(targetPath);

      this.dx.out(`Saved PDF document to ${targetPath}`);
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to save PDF: ${String(error)}`);
      throw error;
    }
  }

  private trackTempPdf(p: string): void {
    if (!p) return;
    this.tempPdfs.push(p);
  }

  // Map font family to jsPDF built-in fonts
  private mapFontFamilyToJsPDF(fontFamily: string, doc: jsPDF): string {
    const dx = this.dx.sub('mapFontFamilyToJsPDF');

    // Get available fonts from jsPDF
    const availableFonts = doc.getFontList();
    const jsPdfFonts = Object.keys(availableFonts);
    dx.out(`Available fonts: ${jsPdfFonts.join(', ')}`);

    // Step 1: Lowercase our list
    const ourFontsLower = fontFamily.toLowerCase();

    // Step 2: Remove everything that isn't a-z, space, or comma
    const ourFontsClean = ourFontsLower.replace(/[^a-z\s,]/g, '');

    // Step 3: Split it at commas first, then spaces
    const ourFontList = ourFontsClean
      .split(/\s*,\s*/)
      .flatMap(font => font.split(/\s+/).filter(f => f.length > 0));

    // Step 4: Lowercase jsPDF font list
    const jsPdfFontsLower = jsPdfFonts.map(font => font.toLowerCase());

    // Step 5: Remove everything that isn't a-z or space from jsPDF fonts
    const jsPdfFontsClean = jsPdfFontsLower.map(font => font.replace(/[^a-z\s]/g, ''));

    // Step 6: Walk our list and see if any of jsPDFs font list items start with the entire item of our list
    for (const ourFont of ourFontList) {
      for (let i = 0; i < jsPdfFontsClean.length; i++) {
        if (jsPdfFontsClean[i].startsWith(ourFont)) {
          dx.out(`Found match: ${ourFont} -> ${jsPdfFonts[i]}`);
          return jsPdfFonts[i];
        }
      }
    }

    // Step 7: Walk jsPDFs font list and if any of our items start with the entire item of jsPDFs list
    for (let i = 0; i < jsPdfFontsClean.length; i++) {
      for (const ourFont of ourFontList) {
        if (ourFont.startsWith(jsPdfFontsClean[i])) {
          dx.out(`Found reverse match: ${ourFont} -> ${jsPdfFonts[i]}`);
          return jsPdfFonts[i];
        }
      }
    }

    // Step 8: Use Courier
    dx.out(`No match found, using Courier for: ${fontFamily}`);
    return 'Courier';
  }

  /**
   * Convert page dimensions to points (72 points = 1 inch, 2.834645669 points = 1 mm)
   * This centralizes all unit conversion so we work exclusively in points internally
   */
  private pageSizeToPts(
    width: number,
    height: number,
    unit: 'in' | 'mm'
  ): { widthPts: number; heightPts: number } {
    const POINTS_PER_INCH = 72;
    const POINTS_PER_MM = 2.834645669;
    const multiplier = unit === 'in' ? POINTS_PER_INCH : POINTS_PER_MM;
    const widthPts = width * multiplier;
    const heightPts = height * multiplier;
    return { widthPts, heightPts };
  }

  /**
   * Convert pixels to points
   */
  private pxToPts(px: number): number {
    const PX_TO_PTS_RATIO = 0.75; // 72 DPI / 96 DPI
    return px * PX_TO_PTS_RATIO;
  }

  /**
   * Convert points to pixels
   */
  private ptsToPx(pts: number): number {
    const PX_TO_PTS_RATIO = 0.75; // 72 DPI / 96 DPI
    return pts / PX_TO_PTS_RATIO;
  }

  /**
   * Set text color in jsPDF from web color (hex or named color)
   * Supports hex colors like "#FF0000" and named colors like "red", "black", etc.
   * Handles colors with alpha channels by stripping them
   */
  private setTextColorFromWebColor(doc: jsPDF, color: string): void {
    // Start with black as default
    let r = 0;
    let g = 0;
    let b = 0;

    // Basic web color names to RGB
    const webColors: { [key: string]: [number, number, number] } = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      green: [0, 128, 0],
      blue: [0, 0, 255],
    };

    // Check if it's a named color
    const namedColor = webColors[color.toLowerCase()];
    if (namedColor) {
      r = namedColor[0];
      g = namedColor[1];
      b = namedColor[2];
    } else {
      // Otherwise treat as hex color
      let hex = color;

      // Remove alpha channel if present (e.g., #FFFFFF5C -> #FFFFFF)
      if (hex.length === 9 && hex.startsWith('#')) {
        hex = hex.substring(0, 7);
      }

      // Remove # if present
      hex = hex.replace('#', '');

      // Convert 3-digit hex to 6-digit
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map(char => char + char)
          .join('');
      }

      // Parse hex to RGB if valid
      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      // Otherwise r, g, b remain as black (0, 0, 0)
    }

    // Single exit point - set the color
    doc.setTextColor(r, g, b);
  }

  // NEW: Generate PDF directly from Shiki tokens
  async generatePdfFromTokens(
    tokens: ThemedToken[][],
    fontFamily: string,
    fontSizePx: number,
    lineHeightPx: number,
    title?: string
  ): Promise<PDFDoc> {
    const dx = this.dx.sub('generatePdfFromTokens');
    dx.require({ tokens, fontFamily, fontSizePx, lineHeightPx }, [
      'tokens',
      'fontFamily',
      'fontSizePx',
      'lineHeightPx',
    ]);

    try {
      // Set tokens for page-based rendering
      this.setTokens(tokens);

      // Get page size and orient from global state
      const pageSizeId = (this.app.vscodeapis.getGlobalState('pageSizeId') || 'a4') as PageSizeId;
      const orient = (this.app.vscodeapis.getGlobalState('orient') || 'portrait') as
        | 'portrait'
        | 'landscape';

      dx.out(`Using page size: ${pageSizeId}, orient: ${orient} (from PaperPrinter preferences)`);

      // Create render options
      const renderOptions: RenderOptions = {
        fontFamily,
        fontSize: fontSizePx,
        lineHeight: lineHeightPx,
        theme: 'github-light', // Default theme for backward compatibility
        pageSizeId: pageSizeId,
        orient: orient,
      };

      // Generate the first page directly using generatePdfPage
      const pageTokens = this.extractTokensForPage(tokens, 1);
      const finalDoc = await this.generatePdfPage(pageTokens, renderOptions);

      // Add title if provided
      const marginLeft = 20;
      const marginTop = 20;

      if (title) {
        finalDoc.setFontSize(fontSizePts * 1.25);
        this.setTextColorFromWebColor(finalDoc, 'black');
        finalDoc.text(title, marginLeft, marginTop + 20);
        finalDoc.setFontSize(fontSizePts);
      }

      let y = title ? marginTop + 40 : marginTop + 20;
      const margin = marginLeft;

      // Calculate how many lines can fit on the page
      const bottomMarginPt = 36;
      const availableHeight = finalHeightPts - y - bottomMarginPt;
      const lineSpacingPt = lineHeightPts;
      const maxLines = Math.floor(availableHeight / lineSpacingPt);
      const linesToRender = Math.min(tokens.length, maxLines);

      dx.out(
        `Rendering ${linesToRender} of ${tokens.length} lines (max ${maxLines} lines fit on page)`
      );

      // Process each line of tokens (up to the limit)
      for (let i = 0; i < linesToRender; i++) {
        const line = tokens[i];
        let x = margin;

        // Process each token in the line
        for (const token of line) {
          const text = token.content;
          if (!text) continue;

          const color = token.color || '#000000';
          this.setTextColorFromWebColor(finalDoc, color);
          finalDoc.text(text, x, y);
          x += finalDoc.getTextWidth(text);
        }

        y += lineSpacingPt;
      }

      // Add truncation notice if content was cut off
      if (tokens.length > maxLines) {
        const remainingLines = tokens.length - maxLines;
        this.setTextColorFromWebColor(finalDoc, '#666666');
        finalDoc.setFontSize(fontSizePts - 2);
        finalDoc.text(`... (${remainingLines} more lines truncated)`, margin, y + 10);
        dx.out(`Content truncated: ${remainingLines} lines not rendered`);
      }

      dx.out(`PDF document created with ${linesToRender} lines rendered`);
      return this.createPDFDoc(finalDoc);
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Convert PDF document to HTML with scrollable PDF view
  embedPDFinHTML_OBSOLETE_DELETEME(pdfDoc: PDFDoc, title: string): string {
    const dx = this.dx.sub('embedPDFinHTML_OBSOLETE_DELETEME');
    dx.require({ pdfDoc, title }, ['pdfDoc', 'title']);

    try {
      // Generate a data URL from the PDF document
      const pdfDataUrl = pdfDoc.asDataUrl();
      dx.out(`PDF data URL generated: ${pdfDataUrl.substring(0, 50)}...`);

      // Load YAML templates and PDF.js library
      const pdfTemplates = this.yaml;
      const uiTemplates = this.app.ui.yaml;
      const pdfJsContent = this.app.os.fileRead('src/lib/pdf.min.js');

      dx.out(
        `PDF.js library loaded: ${pdfJsContent ? `${pdfJsContent.length} characters` : 'failed'}`
      );

      if (!pdfTemplates || !uiTemplates || !pdfJsContent) {
        throw new Error('Failed to load required templates or PDF.js library');
      }

      // Generate HTML using template with embedded resources
      // Escape single quotes in the data URL for JavaScript string literal
      const escapedPdfDataUrl = pdfDataUrl.replace(/'/g, "\\'");

      const html = this.app.templateDictReplace(pdfTemplates.pdf_html, {
        TITLE: title,
        PDF_DATA_URL: escapedPdfDataUrl,
        PDF_CSS: this.app.templateDictReplace(pdfTemplates.pdf_css, {
          BASE_CSS: uiTemplates.base_css,
        }),
        PDFJS_LIBRARY: pdfJsContent,
        PDF_JS: pdfTemplates.pdf_js,
        TOOLBAR: '{{TOOLBAR}}', // Placeholder for toolbar injection
      });

      dx.out(`HTML generated for PDF document with embedded resources`);
      return html;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF preview: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Helper: Get unit based on page size
  private getUnitForPageSize(pageSize: PageSizeId): 'mm' | 'in' {
    // US sizes use inches, metric sizes use mm
    const usSizes = ['letter', 'legal'];
    return usSizes.includes(pageSize) ? 'in' : 'mm';
  }

  // Helper: Get page dimensions based on size and orient
  private getPageDimensions(
    pageSize: PageSizeId,
    orient: 'portrait' | 'landscape'
  ): { width: number; height: number } {
    // Standard page dimensions - US sizes in inches, metric in mm
    const dimensions = {
      letter: { width: 8.5, height: 11 }, // inches
      legal: { width: 8.5, height: 14 }, // inches
      a3: { width: 297, height: 420 }, // mm
      a4: { width: 210, height: 297 }, // mm
      a5: { width: 148, height: 210 }, // mm
    };

    const baseDimensions = dimensions[pageSize];

    // Swap width/height for landscape
    if (orient === 'landscape') {
      return { width: baseDimensions.height, height: baseDimensions.width };
    }

    return baseDimensions;
  }

  // Helper: Convert hex color to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private async htmlToPdf(inputHtmlPath: string, outputPdfPath: string): Promise<void> {
    const dx = this.dx.sub('htmlToPdf');
    dx.require({ inputHtmlPath, outputPdfPath }, ['inputHtmlPath', 'outputPdfPath']);

    try {
      // For now, this method is deprecated in favor of direct PDF generation
      // This will be removed once we fully migrate to jsPDF approach
      dx.out(`DEPRECATED: htmlToPdf method called. Use generatePdfFromTokens instead.`);
      throw new Error(
        'htmlToPdf is deprecated. Use generatePdfFromTokens for direct PDF generation.'
      );
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // ============================================================================
  // PageRender Interface Implementation
  // ============================================================================

  /**
   * Set the tokens for page-based rendering
   * This must be called before using PageRender methods
   */
  setTokens(tokens: ThemedToken[][]): void {
    const dx = this.dx.sub('setTokens');
    this.currentTokens = tokens;
    // Don't calculate page breaks here - they'll be calculated dynamically in renderPage
    // based on the actual render options (font size, line height, etc.)
    this.pageBreaks = [];
    this.pageTotal = 0;
    dx.out(`Set tokens: ${tokens.length} lines (page breaks calculated dynamically)`);

    // Debug: Log the first few tokens to verify they're set correctly
    if (tokens.length > 0) {
      dx.out(`First token line: ${JSON.stringify(tokens[0].slice(0, 3))}`);
    }

    dx.done();
  }

  async renderPage(pageNumber: number, options: RenderOptions): Promise<PageData> {
    const dx = this.dx.sub('renderPage');
    dx.require({ pageNumber, options }, ['pageNumber', 'options']);

    try {
      if (!this.currentTokens) {
        const error: PageRenderError = {
          message: 'No tokens available for rendering. Call setTokens() first.',
          pageNumber,
          type: 'generation',
          timestamp: new Date(),
        };
        throw error;
      }

      // Calculate page breaks dynamically based on actual render options
      this.pageBreaks = this.calculatePageBreaks(this.currentTokens, options);
      this.pageTotal = this.pageBreaks.length;

      dx.out(`Page render requested: page ${pageNumber}, total pages: ${this.pageTotal}`);

      // Validate page number
      if (pageNumber < 1 || pageNumber > this.pageTotal) {
        const error: PageRenderError = {
          message: `Invalid page number: ${pageNumber}. Valid range: 1-${this.pageTotal}`,
          pageNumber,
          type: 'validation',
          timestamp: new Date(),
        };
        throw error;
      }

      // Note: options.fontSize and options.lineHeight are in pixels, will be converted to points in generatePdfPage
      // Extract tokens for this page
      const pageTokens = this.extractTokensForPage(this.currentTokens, pageNumber);

      // Generate single-page PDF
      const pdfDoc = await this.generatePdfPage(pageTokens, options);

      // Convert to data URL
      const dataUrl = pdfDoc.asDataUrl();

      // Get page dimensions
      const pageSize = this.getPageDimensions(options.pageSizeId, options.orient);
      const unit = this.getUnitForPageSize(options.pageSizeId);
      const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);

      // Convert dimensions to pixels for PageData (interface expects pixels)
      const widthPx = Math.round(this.ptsToPx(widthPts));
      const heightPx = Math.round(this.ptsToPx(heightPts));

      const pageData: PageData = {
        dataUrl,
        widthPx,
        heightPx,
        pageNumber,
      };

      dx.out(`Page ${pageNumber} rendered: ${widthPts}x${heightPts}pt`);
      return pageData;
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        // Re-throw PageRenderError as-is
        throw error;
      }

      // Wrap other errors as PageRenderError
      const pageRenderError: PageRenderError = {
        message: `Page generation failed: ${String(error)}`,
        pageNumber,
        type: 'generation',
        timestamp: new Date(),
      };
      throw pageRenderError;
    } finally {
      dx.done();
    }
  }

  async getPageTotal(): Promise<number> {
    const dx = this.dx.sub('getPageTotal');
    const total = this.pageTotal;
    dx.out(`Total pages: ${total}`);
    dx.done();
    return total;
  }

  async getPageSizePx(): Promise<{ widthPx: number; heightPx: number }> {
    const dx = this.dx.sub('getPageSizePx');

    try {
      // Get page size and orient from global state (same as generatePdfFromTokens)
      const pageSizeId = (this.app.vscodeapis.getGlobalState('pageSizeId') || 'a4') as PageSizeId;
      const orient = (this.app.vscodeapis.getGlobalState('orient') || 'portrait') as
        | 'portrait'
        | 'landscape';

      // Calculate page dimensions using actual settings
      const pageSize = this.getPageDimensions(pageSizeId, orient);
      const unit = this.getUnitForPageSize(pageSizeId);

      // Convert to pixels using existing pattern
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(
        pageSize.width,
        pageSize.height,
        unit
      );
      const pageWidthPx = Math.round(this.ptsToPx(pageWidthPts));
      const pageHeightPx = Math.round(this.ptsToPx(pageHeightPts));

      dx.out(`Page dimensions: ${pageWidthPx}x${pageHeightPx}px`);
      return { widthPx: pageWidthPx, heightPx: pageHeightPx };
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to get page dimensions: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // ============================================================================
  // Page-Based Generation Helper Methods
  // ============================================================================

  /**
   * Calculate page breaks based on content and page size constraints
   */
  private calculatePageBreaks(tokens: ThemedToken[][], options: RenderOptions): number[] {
    const dx = this.dx.sub('calculatePageBreaks');

    try {
      // Calculate how many lines fit per page using actual render options
      const pageSize = this.getPageDimensions(options.pageSizeId, options.orient);
      const unit = this.getUnitForPageSize(options.pageSizeId);
      const { heightPts } = this.pageSizeToPts(0, pageSize.height, unit);

      // Use actual line height from options (convert pixels to points)
      const marginTop = 20; // Top margin in points
      const marginBottom = 36; // Bottom margin in points
      const lineHeightPts = this.pxToPts(options.lineHeight);
      const availableHeight = heightPts - marginTop - marginBottom;
      const linesPerPage = Math.floor(availableHeight / lineHeightPts);

      // Calculate page breaks - always start with page 0
      const pageBreaks: number[] = [0];
      for (let i = linesPerPage; i < tokens.length; i += linesPerPage) {
        pageBreaks.push(i);
      }

      dx.out(
        `Calculated ${pageBreaks.length} page breaks for ${tokens.length} lines (${linesPerPage} lines/page, ${lineHeightPts}pt line height)`
      );
      return pageBreaks;
    } catch (error) {
      dx.out(`Error calculating page breaks: ${String(error)}`);
      // Fallback to single page
      return [0];
    } finally {
      dx.done();
    }
  }

  /**
   * Extract tokens for a specific page
   */
  private extractTokensForPage(tokens: ThemedToken[][], pageNumber: number): ThemedToken[][] {
    const dx = this.dx.sub('extractTokensForPage');

    try {
      const startLine = this.pageBreaks[pageNumber - 1] || 0;
      const endLine = this.pageBreaks[pageNumber] || tokens.length;

      const pageTokens = tokens.slice(startLine, endLine);
      dx.out(
        `Extracted page ${pageNumber}: lines ${startLine}-${endLine - 1} (${pageTokens.length} lines)`
      );
      return pageTokens;
    } catch (error) {
      dx.out(`Error extracting tokens for page ${pageNumber}: ${String(error)}`);
      return [];
    } finally {
      dx.done();
    }
  }

  /**
   * Generate a single-page PDF from tokens
   */
  private async generatePdfPage(tokens: ThemedToken[][], options: RenderOptions): Promise<PDFDoc> {
    const dx = this.dx.sub('generatePdfPage');
    dx.require({ tokens, options }, ['tokens', 'options']);

    try {
      // Get page dimensions
      const pageSize = this.getPageDimensions(options.pageSizeId, options.orient);
      const unit = this.getUnitForPageSize(options.pageSizeId);
      const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);

      // Create PDF document
      const doc = new jsPDF({
        orientation: options.orient,
        unit: 'pt',
        format: [widthPts, heightPts],
      });

      // Map font family to jsPDF supported fonts
      const jsPdfFont = this.mapFontFamilyToJsPDF(options.fontFamily, doc);
      doc.setFont(jsPdfFont, 'normal');

      // Convert fontSize from pixels to points for jsPDF
      const fontSizePts = this.pxToPts(options.fontSize);
      doc.setFontSize(fontSizePts);

      // Convert lineHeight from pixels to points for jsPDF
      const lineHeightPts = this.pxToPts(options.lineHeight);

      // Render tokens
      const marginLeft = 20;
      const marginTop = 20;
      let y = marginTop;
      const lineSpacing = lineHeightPts;

      for (const line of tokens) {
        let x = marginLeft;

        for (const token of line) {
          const text = token.content;
          if (!text) continue;

          const color = token.color || '#000000';
          this.setTextColorFromWebColor(doc, color);
          doc.text(text, x, y);
          x += doc.getTextWidth(text);
        }

        y += lineSpacing;
      }

      dx.out(`PDF page generated: ${tokens.length} lines`);
      return this.createPDFDoc(doc);
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF page: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }
}
