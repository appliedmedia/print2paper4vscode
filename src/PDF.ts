import type { App } from './App';
import type { PageSizeId_t, Orient_t } from './types/PaperPrinter_t';
import { kPageSizeId } from './types/PaperPrinter_t';
import type { PageRender, PageData, RenderOptions, PageRenderError } from './types/PageRender_t';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';
import { Coords } from './Coords';
import jsPDF from 'jspdf';
import { DocInfo_PDF } from './DocInfo_PDF';
import type { LanguageId_t } from './Stylize';

/**
 * PDF - Vector PDF generation and page rendering
 *
 * Creates vector PDFs from Shiki-highlighted tokens using jsPDF. Implements
 * PageRender interface for multi-page document rendering. Handles font sizing,
 * line wrapping, page breaks, margins, and theme-based color rendering.
 * Manages temporary PDF files and provides save/print/preview operations.
 *
 * @input app - Application instance
 * @output PDF documents (ArrayBuffer/DataURL), page-by-page rendering, file operations
 *
 * @example
 * const pdf = new PDF(app);
 * pdf.setTokensForPageRender(tokens, 'github-light');
 * const pageData = await pdf.renderPage(0);
 * const pdfDoc = await pdf.getCurrentPdfDoc();
 */
export class PDF implements PageRender {
  private static readonly kYaml = {
    pdf_html: '',
    pdf_css: '',
    pdf_js: '',
  } as const;

  private app: App;
  private tempPdfs: string[] = [];
  private dx: Diagnostics;
  private _yaml: Yaml<typeof PDF.kYaml>;
  private coords: Coords;

  // PageRender implementation state
  public pageTotal: number = 0;

  // Line-by-line rendering state - jsPDF now managed through docInfo.pdfDoc
  private currentX: number = 0;
  private currentY: number = 0;
  private currentLineHeight: number = 0;
  private currentRenderOptions: RenderOptions | null = null;

  // Header/footer styling
  private static readonly HEADER_FOOTER_COLOR = '#cccccc'; // Light gray

  // Page cache for reusing rendered pages
  private pageCache: Map<number, PageData> = new Map();

  // PDF document information
  public docInfo: DocInfo_PDF;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('PDF');
    this.coords = new Coords(app);
    this.docInfo = new DocInfo_PDF(app);
    this._yaml = new Yaml(app, 'src/PDF.yaml', PDF.kYaml);
  }

  get yaml() {
    return this._yaml.get();
  }

  init(): void {
    this.tempPdfs = [];
    this.pageTotal = 0;
    this.coords.init();
  }

  /**
   * Invalidate all PDF caches and reset state
   * Called when regenerating PDF after menu changes
   */
  invalidateAllCaches(): void {
    const dx = this.dx.sub('invalidateAllCaches');
    try {
      // Clear page cache
      this.pageCache.clear();

      // Reset PDF document
      this.docInfo.pdfDoc = null;

      // Reset rendering state
      this.currentX = 0;
      this.currentY = 0;
      this.currentLineHeight = 0;
      this.currentRenderOptions = null;

      // Reset page total
      this.pageTotal = 0;

      dx.out('All PDF caches invalidated and state reset');
    } finally {
      dx.done();
    }
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
    this.coords.done();
    this.dx.done();
  }

  async printWithPreview(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void> {
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

  async printDirectly(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void> {
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

  async saveAsPDF(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void> {
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

    // Step 2: Remove everythin`g` that isn't a-z, space, or comma
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

  // UNIFIED: Generate complete PDF during tokenization
  async generatePdf(
    code: string,
    languageId: string,
    options: RenderOptions,
    title?: string
  ): Promise<DocInfo_PDF> {
    const dx = this.dx.sub('generatePdf');
    dx.require({ code, languageId, options }, ['code', 'languageId', 'options']);

    try {
      // Setup PDF document for line-by-line rendering
      this.setupPdf(options);

      // Add header and footer to first page
      this.addHeaderAndFooter();

      // Add title if provided
      if (title) {
        const marginsPts = this.docInfo.marginPts;
        this.docInfo.pdfDoc!.setFontSize(this.coords.cssPxToPdfPts(options.fontSizePx) * 1.25);
        this.setTextColorFromWebColor(this.docInfo.pdfDoc!, 'black');
        this.docInfo.pdfDoc!.text(title, marginsPts.leftMarginPts, marginsPts.topMarginPts + 20);
        this.docInfo.pdfDoc!.setFontSize(this.coords.cssPxToPdfPts(options.fontSizePx));
      }

      // Tokenize and build complete PDF in one pass
      await this.app.stylize.tokenize(
        code,
        languageId as LanguageId_t,
        options.theme,
        1, // pageBegin - render all pages
        0, // pageEnd - 0 means all pages
        (pageNum, lineNum, htmlData) => {
          this.renderByLine(pageNum, lineNum, htmlData);
        }
      );

      // Finish the PDF and get the final document
      const pdfDoc = this.finishPdf();

      // Store the generated PDF for page extraction
      // Note: pdfDoc is a DocInfo_PDF wrapper, but we need the raw jsPDF for renderContent
      // We'll store it in a separate property

      dx.out(`Generated complete PDF with ${pdfDoc.getNumberOfPages()} pages`);
      return pdfDoc;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate complete PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Helper: Get unit based on page size
  // Uses centralized unit from PaperPrinter_t.ts
  private getUnitForPageSize(pageSize: PageSizeId_t): 'mm' | 'in' {
    // Get unit from centralized constant (single source of truth)
    const unit = kPageSizeId[pageSize].unit;
    return unit === 'inches' ? 'in' : 'mm';
  }

  // Helper: Get page dimensions based on size and orient
  // Uses centralized dimensions from PaperPrinter_t.ts - single source of truth
  private getPageDimensions(
    pageSize: PageSizeId_t,
    orient: Orient_t
  ): { width: number; height: number } {
    // Get dimensions from centralized const object (id → metadata)
    const metadata = kPageSizeId[pageSize];

    // Swap width/height for landscape
    if (orient === 'landscape') {
      return { width: metadata.height, height: metadata.width };
    }

    return { width: metadata.width, height: metadata.height };
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

  async renderContent(
    pageNumber: number,
    lineBegin: number,
    lineEnd: number,
    options: RenderOptions
  ): Promise<PageData> {
    const dx = this.dx.sub('renderContent');
    dx.require({ pageNumber, lineBegin, lineEnd, options }, [
      'pageNumber',
      'lineBegin',
      'lineEnd',
      'options',
    ]);

    try {
      if (!this.docInfo.pdfDoc) {
        const error: PageRenderError = {
          message: 'No complete PDF available. Call generatePdf() first.',
          pageNumber: 0,
          type: 'generation',
          timestamp: new Date(),
        };
        throw error;
      }

      // Create cache key based on page number and relevant options
      const cacheKey = `${pageNumber}-${options.pageSizeId}-${options.orient}`;
      
      // Check if we have cached data for this page
      if (this.pageCache.has(pageNumber)) {
        const cachedData = this.pageCache.get(pageNumber)!;
        dx.out(`Returning cached page data for page ${pageNumber}`);
        return cachedData;
      }

      // Get page dimensions
      const pageSize = this.getPageDimensions(options.pageSizeId, options.orient);
      const unit = this.getUnitForPageSize(options.pageSizeId);
      const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);

      // For now, return the complete PDF data URL
      // TODO: Implement proper page extraction when jsPDF supports it
      const pageData: PageData = {
        pageNumber: pageNumber,
        dataUrl: this.docInfo.pdfDoc.output('dataurlstring') as string,
        widthPx: this.coords.pdfPtsToCssPx(widthPts),
        heightPx: this.coords.pdfPtsToCssPx(heightPts),
      };

      // Cache the page data
      this.pageCache.set(pageNumber, pageData);
      dx.out(`Rendered and cached content from complete PDF for page ${pageNumber}`);
      return pageData;
    } catch (error) {
      const pageError: PageRenderError = {
        message: `Failed to render content lines ${lineBegin}-${lineEnd}: ${String(error)}`,
        pageNumber: 0,
        type: 'generation',
        timestamp: new Date(),
      };
      throw pageError;
    } finally {
      dx.done();
    }
  }

  async getPageTotal(): Promise<number> {
    const dx = this.dx.sub('getPageTotal');
    const total = this.pageTotal;
    dx.out(`WEBVIEW: Requesting page total = ${total}`);
    dx.done();
    return total;
  }

  async getPageSizePx(): Promise<{ widthPx: number; heightPx: number }> {
    const dx = this.dx.sub('getPageSizePx');

    try {
      // Prefer actual PDF dimensions if available
      if (this.docInfo.pdfDoc) {
        const pageWidthPts = this.docInfo.pdfDoc.getPageWidth();
        const pageHeightPts = this.docInfo.pdfDoc.getPageHeight();
        const pageWidthPx = Math.round(this.coords.pdfPtsToCssPx(pageWidthPts));
        const pageHeightPx = Math.round(this.coords.pdfPtsToCssPx(pageHeightPts));
        dx.out(`Page dimensions (from PDF): ${pageWidthPx}x${pageHeightPx}px`);
        return { widthPx: pageWidthPx, heightPx: pageHeightPx };
      }
      
      // Fallback to configured size if no PDF yet
      const pageSizeId = (this.app.uimenumgr.getValueForSelectedByMenuId('pageSizeId') || 'a4') as PageSizeId_t;
      const orient = (this.app.uimenumgr.getValueForSelectedByMenuId('orient') || 'portrait') as 'portrait' | 'landscape';
      const pageSize = this.getPageDimensions(pageSizeId, orient);
      const unit = this.getUnitForPageSize(pageSizeId);
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
      const pageWidthPx = Math.round(this.coords.pdfPtsToCssPx(pageWidthPts));
      const pageHeightPx = Math.round(this.coords.pdfPtsToCssPx(pageHeightPts));
      dx.out(`Page dimensions (from config): ${pageWidthPx}x${pageHeightPx}px`);
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
   * Setup PDF document for line-by-line rendering
   * Must be called before renderByLine()
   */
  public setupPdf(options: RenderOptions): void {
    const dx = this.dx.sub('setupPdf');

    try {
      // Store render options for later use
      this.currentRenderOptions = options;

      // Initialize rendering state

      // Get page dimensions
      const pageSize = this.getPageDimensions(options.pageSizeId, options.orient);
      const unit = this.getUnitForPageSize(options.pageSizeId);
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(
        pageSize.width,
        pageSize.height,
        unit
      );

      // Create PDF document
      // ⚠️ CRITICAL: COORDINATE SYSTEM WARNING ⚠️
      // jsPDF uses TOP-LEFT origin: Y=0 at TOP, Y increases DOWNWARD
      // This is DIFFERENT from standard PDF coordinate system!
      // - Y=0 is at the TOP of the page
      // - Y increases as we go DOWN the page
      // - To move down: ADD to Y
      // - To move up: SUBTRACT from Y
      //
      // PDF.js (used in webview) also uses TOP-LEFT origin for viewer interface:
      // - PDF Content Rendering: Bottom-left origin (standard PDF)
      // - Viewer Interface/Canvas: Top-left origin (web standard)
      // - We use the VIEWER INTERFACE system, which matches jsPDF!
      // - This ensures consistent coordinates between PDF generation and webview display
      this.docInfo.pdfDoc = new jsPDF({
        orientation: options.orient,
        unit: 'pt',
        format: [pageWidthPts, pageHeightPts],
      });

      // Map font family to jsPDF supported fonts
      const jsPdfFont = this.mapFontFamilyToJsPDF(options.fontFamily, this.docInfo.pdfDoc);
      this.docInfo.pdfDoc.setFont(jsPdfFont, 'normal');

      // Convert fontSize from pixels to points for jsPDF, clamping to minimum of 8pt
      const px = options.fontSizePx ?? 12;
      const fontSizePts = this.coords.cssPxToPdfPts(Math.max(8, px));
      this.docInfo.pdfDoc.setFontSize(fontSizePts);
      dx.out(`PDF font size set: ${px}px -> ${fontSizePts}pt`);

      // Convert lineHeight from pixels to points for jsPDF
      this.currentLineHeight = this.coords.cssPxToPdfPts(options.lineHeightPx);

      // Set initial position using docInfo margins
      // jsPDF uses top-left origin: Y=0 at top, Y increases downward
      const marginsPts = this.docInfo.marginPts;
      // Start at the left margin for X position
      this.currentX = marginsPts.leftMarginPts;
      // Start at the top margin + line height for Y position to account for text baseline
      // Text is positioned by its baseline, so we need to add line height
      this.currentY = marginsPts.topMarginPts + this.currentLineHeight;

      dx.out(
        `Initial position: (${this.currentX}, ${this.currentY}) (leftMargin=${marginsPts.leftMarginPts}, topMargin=${marginsPts.topMarginPts})`
      );
      dx.out(`jsPDF coordinate system: Y=0 at top, Y increases downward`);
      dx.out(`Starting at top margin, will move DOWN by adding to Y`);

      dx.out(
        `PDF document setup: ${options.pageSizeId} ${options.orient}, ${fontSizePts}pt font, ${this.currentLineHeight}pt line height`
      );
      dx.out(
        `Page dimensions: ${pageWidthPts}x${pageHeightPts}pts, margins: top=${marginsPts.topMarginPts}, bottom=${marginsPts.bottomMarginPts}, left=${marginsPts.leftMarginPts}, right=${marginsPts.rightMarginPts}`
      );
      dx.out(`Initial position: (${this.currentX}, ${this.currentY})`);
    } catch (error) {
      dx.out(`Error setting up PDF document: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Render one line of HTML into PDF content
   * Called by Stylize's optPerLineHandler callback for line-by-line rendering
   */
  public renderByLine(pageNumber: number, lineNumber: number, htmlData: string): void {
    const dx = this.dx.sub('renderByLine');

    try {
      // Initialize jsPDF document on first line
      if (!this.docInfo.pdfDoc || !this.currentRenderOptions) {
        throw new Error('PDF document not initialized. Call setupPdf() first.');
      }

      // Headers and footers will be added after PDF generation is complete

      // Parse HTML spans and render each token with its color
      const spanRegex = /<span style="color: ([^"]+)">([^<]*)<\/span>/g;
      let match;
      let xPos = this.currentX;
      let yPos = this.currentY; // Start at current Y position for this line

      dx.out(`Rendering line ${lineNumber} at Y position: ${yPos}`);

      // Get available width for line wrapping using docInfo
      const pageSize = this.getPageDimensions(
        this.currentRenderOptions.pageSizeId,
        this.currentRenderOptions.orient
      );
      const unit = this.getUnitForPageSize(this.currentRenderOptions.pageSizeId);
      const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
      const marginsPts = this.docInfo.marginPts;
      const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;

      while ((match = spanRegex.exec(htmlData)) !== null) {
        const color = match[1];
        const content = match[2];

        if (content) {
          // Set color for this token
          this.setTextColorFromWebColor(this.docInfo.pdfDoc, color);

          // Check if text fits on current line
          const textWidth = this.docInfo.pdfDoc.getTextWidth(content);
          if (xPos + textWidth > marginsPts.leftMarginPts + availableWidth) {
            // Text doesn't fit, wrap to next line
            // jsPDF: Y increases downward, so we move DOWN by adding
            yPos += this.currentLineHeight;
            xPos = marginsPts.leftMarginPts;
          }

          // Render text at current position
          dx.out(`Rendering text "${content}" at (${xPos}, ${yPos})`);
          if (lineNumber < 3) {
            dx.out(
              `First few lines - Line ${lineNumber}, Token: "${content}", Position: (${xPos}, ${yPos})`
            );
          }
          this.docInfo.pdfDoc.text(content, xPos, yPos);

          // Advance x position
          xPos += textWidth;
        }
      }

      // Advance y position by lineHeight for next line
      // jsPDF: Y increases downward, so we move DOWN by adding
      const oldY = this.currentY;
      this.currentY = this.currentY + this.currentLineHeight;
      dx.out(
        `Line ${lineNumber} complete: Y moved from ${oldY} to ${this.currentY} (down by ${this.currentLineHeight})`
      );

      // Check if we need a new page
      const pageSizeForBreak = this.getPageDimensions(
        this.currentRenderOptions.pageSizeId,
        this.currentRenderOptions.orient
      );
      const unitForBreak = this.getUnitForPageSize(this.currentRenderOptions.pageSizeId);
      const { heightPts: pageHeightPtsForBreak } = this.pageSizeToPts(
        pageSizeForBreak.width,
        pageSizeForBreak.height,
        unitForBreak
      );
      const marginsPtsForBreak = this.docInfo.marginPts;
      // Calculate available height for content (not used in current logic but kept for reference)
      // const availableHeight =
      //   pageHeightPtsForBreak -
      //   marginsPtsForBreak.topMarginPts -
      //   marginsPtsForBreak.bottomMarginPts;

      // jsPDF: Y increases downward, so we check if we've gone too far down
      if (this.currentY > pageHeightPtsForBreak - marginsPtsForBreak.bottomMarginPts) {
        // Need a new page
        dx.out(
          `Page break at line ${lineNumber}: currentY=${this.currentY} > bottomMargin=${pageHeightPtsForBreak - marginsPtsForBreak.bottomMarginPts}`
        );
        this.docInfo.pdfDoc.addPage();
        this.currentY = marginsPtsForBreak.topMarginPts + this.currentLineHeight;
        this.currentX = marginsPtsForBreak.leftMarginPts;

        // Page break added
        dx.out(`Added page break at line ${lineNumber + 1}`);

        // Add header and footer to new page
        this.addHeaderAndFooter();
      }

      dx.out(
        `Rendered line ${lineNumber} on page ${pageNumber}: "${htmlData.substring(0, 50)}..."`
      );
    } catch (error) {
      dx.out(`Error rendering line ${lineNumber}: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Add header and footer to current page
   */
  private addHeaderAndFooter(): void {
    if (!this.docInfo.pdfDoc || !this.currentRenderOptions) {
      return;
    }

    // Get document title from paperprinter's docInfo
    const docTitle = this.app.paperprinter.docInfo.printTitle || 'Document';

    // Get current page info
    const pageInfo = this.docInfo.pdfDoc.getCurrentPageInfo();
    const currentPage = pageInfo.pageNumber;
    // Use pageTotal if available (set after complete generation), otherwise use current count
    // const totalPages = this.pageTotal || this.docInfo.pdfDoc.getNumberOfPages();

    // Get page dimensions and margins
    const pageSize = this.getPageDimensions(
      this.currentRenderOptions.pageSizeId,
      this.currentRenderOptions.orient
    );
    const unit = this.getUnitForPageSize(this.currentRenderOptions.pageSizeId);
    const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = this.docInfo.marginPts;

    // Set small font for header/footer
    // Store current font size (we know it from currentRenderOptions)
    const originalFontSize = this.currentRenderOptions.fontSizePx;
    this.docInfo.pdfDoc.setFontSize(8);
    this.setTextColorFromWebColor(this.docInfo.pdfDoc, PDF.HEADER_FOOTER_COLOR);

    // Header - centered at top, within margin area
    // jsPDF uses top-left origin: Y=0 at top, Y increases downward
    const headerY = margins.topMarginPts - 5; // Within top margin
    const headerText = docTitle;
    const headerWidth = this.docInfo.pdfDoc.getTextWidth(headerText);
    const headerX = (widthPts - headerWidth) / 2;
    this.docInfo.pdfDoc.text(headerText, headerX, headerY);

    // Footer - centered at bottom, within margin area
    const footerY = heightPts - margins.bottomMarginPts + 5; // Within bottom margin
    // Just show "Page N of " - page total will be added later
    const footerText = `Page ${currentPage} of `;
    const footerWidth = this.docInfo.pdfDoc.getTextWidth(footerText);
    const footerX = (widthPts - footerWidth) / 2;
    this.docInfo.pdfDoc.text(footerText, footerX, footerY);

    // Side page number removed - only show in footer

    // Restore original font size
    this.docInfo.pdfDoc.setFontSize(originalFontSize);
  }

  /**
   * Add page totals to all pages after PDF generation is complete
   */
  private renderPageTotals(): void {
    const dx = this.dx.sub('renderPageTotals');

    try {
      if (!this.docInfo.pdfDoc || !this.currentRenderOptions) {
        return;
      }

      const totalPages = this.docInfo.pdfDoc.getNumberOfPages();

      // Add page total to each page as the last content
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        this.docInfo.pdfDoc.setPage(pageNum);
        this.addPageTotalToCurrentPage();
      }

      dx.out(`Added page totals to ${totalPages} pages`);
    } catch (error) {
      dx.out(`Error adding page totals: ${error}`);
    } finally {
      dx.done();
    }
  }

  /**
   * Add page total as the last content on the current page
   */
  private addPageTotalToCurrentPage(): void {
    if (!this.docInfo.pdfDoc || !this.currentRenderOptions) {
      return;
    }

    // Get page dimensions and margins
    const pageSize = this.getPageDimensions(
      this.currentRenderOptions.pageSizeId,
      this.currentRenderOptions.orient
    );
    const unit = this.getUnitForPageSize(this.currentRenderOptions.pageSizeId);
    const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = this.docInfo.marginPts;

    // Get current page info
    const pageInfo = this.docInfo.pdfDoc.getCurrentPageInfo();
    const currentPage = pageInfo.pageNumber;

    // Set small font for page total
    const originalFontSize = this.currentRenderOptions.fontSizePx;
    this.docInfo.pdfDoc.setFontSize(8);
    this.setTextColorFromWebColor(this.docInfo.pdfDoc, PDF.HEADER_FOOTER_COLOR);

    // Add page total right after "Page N of " text
    const footerY = heightPts - margins.bottomMarginPts + 5;
    const pageTotalText = `${this.pageTotal}`;

    // Position it right after the "Page N of " text
    const footerText = `Page ${currentPage} of `;
    const footerWidth = this.docInfo.pdfDoc.getTextWidth(footerText);
    const footerX = (widthPts - footerWidth) / 2;
    const pageTotalX = footerX + footerWidth;

    this.docInfo.pdfDoc.text(pageTotalText, pageTotalX, footerY);

    // Restore original font size
    this.docInfo.pdfDoc.setFontSize(originalFontSize);
  }

  /**
   * Finalize PDF and reset state
   * Returns complete multi-page PDFDoc
   */
  public finishPdf(): DocInfo_PDF {
    const dx = this.dx.sub('finishPdf');

    try {
      if (!this.docInfo.pdfDoc) {
        throw new Error('No PDF document to finish');
      }

      // Set page total from the generated PDF
      this.pageTotal = this.docInfo.pdfDoc.getNumberOfPages();

      // Add page totals to all pages now that we know the total
      this.renderPageTotals();

      dx.out(
        `PDF FINALIZED: ${this.pageTotal} pages with ${this.currentRenderOptions?.fontSizePx}px font`
      );
      return this.docInfo;
    } catch (error) {
      dx.out(`Error finishing PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }
}

// end, PDF.ts
