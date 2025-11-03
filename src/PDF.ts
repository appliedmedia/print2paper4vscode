import type { App } from './App';
import type { PageSizeId_t, Orient_t, HeaderFooterPos_t } from './types/PaperPrinter_t';
import { kPageSizeId } from './types/PaperPrinter_t';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';
import { Coords } from './Coords';
import jsPDF from 'jspdf';
import { DocInfo_PDF } from './DocInfo_PDF';
import type { ThemedToken } from 'shiki';

type HeaderFooterRenderablePos = Exclude<HeaderFooterPos_t, 'none'>;

/**
 * PDF - Vector PDF generation and page rendering
 *
 * Creates vector PDFs from Shiki-highlighted tokens using jsPDF. Handles font sizing,
 * line wrapping, page breaks, margins, and theme-based color rendering.
 * Manages temporary PDF files and provides save/print/preview operations.
 *
 * @input app - Application instance
 * @output PDF documents (ArrayBuffer/DataURL), file operations
 *
 * @example
 * const pdf = new PDF(app);
 * const pdfDoc = await pdf.generatePdf();
 */
export class PDF {
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

  // Line-by-line rendering state - jsPDF now managed through docInfo.pdfDoc
  private currentX: number = 0;
  private currentY: number = 0;
  private currentLineHeight: number = 0;
  private lastPageBreakMetrics: { maxContentY: number; bottomMarginY: number } | null = null;

  // Header/footer styling
  private static readonly HEADER_FOOTER_COLOR = '#cccccc'; // Light gray

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
    this.coords.init();
  }

  /**
   * Get the total number of pages in the document
   */
  async getPageTotal(): Promise<number> {
    return this.docInfo.pageTotal;
  }

  /**
   * Invalidate all PDF caches and reset state
   * Called when regenerating PDF after menu changes
   */
  resetCaches(): void {
    const dx = this.dx.sub('invalidateAllCaches');
    try {
      // Reset PDF document
      this.docInfo.pdfDoc = null;

      // Reset rendering state
      this.currentX = 0;
      this.currentY = 0;
      this.currentLineHeight = 0;
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
      // Log PDF object usage for printing (Stage 4.3)
      const pdfBuffer = pdfDoc.asArrayBuffer();
      dx.out(`PDF object usage: Using PDF ArrayBuffer for printWithPreview (${pdfBuffer.byteLength} bytes)`);

      // Generate filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.app.vscodeapis.getDir_Temp();
      this.app.os.ensureDir(tempDir);
      const tempPdfPath = this.app.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
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
    const dx = this.dx.sub('printDirectly');
    try {
      // Log PDF object usage for printing (Stage 4.3)
      const pdfBuffer = pdfDoc.asArrayBuffer();
      dx.out(`PDF object usage: Using PDF ArrayBuffer for printDirectly (${pdfBuffer.byteLength} bytes)`);

      // Generate filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.app.vscodeapis.getDir_Temp();
      this.app.os.ensureDir(tempDir);
      const tempPdfPath = this.app.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
      this.app.os.fileWrite(tempPdfPath, Buffer.from(new Uint8Array(pdfBuffer)));

      this.trackTempPdf(tempPdfPath);
      // Send PDF to printer
      await this.app.os.filePrint(tempPdfPath);
      dx.out('Sent PDF to printer');
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to print PDF: ${String(error)}`);
      throw error;
    }
  }

  async saveAsPDF(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub('saveAsPDF');
    try {
      // Log PDF object usage for saving (Stage 4.3)
      const pdfBuffer = pdfDoc.asArrayBuffer();
      dx.out(`PDF object usage: Using PDF ArrayBuffer for saveAsPDF (${pdfBuffer.byteLength} bytes)`);

      // Generate default filename with timestamp
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
      const defaultFilename = `${timestamp}_${safeName}.pdf`;

      // Ask user for save location using UI method
      const targetPath = await this.app.ui.chooseSaveLocation(defaultFilename);

      if (!targetPath) {
        dx.out('Save cancelled by user');
        return;
      }

      // Ensure directory exists
      const targetDir = this.app.os.pathDirname(targetPath);
      this.app.os.ensureDir(targetDir);

      // Save PDF document directly to chosen location
      this.app.os.fileWrite(targetPath, Buffer.from(new Uint8Array(pdfBuffer)));

      // Track file for cleanup (optional)
      this.trackTempPdf(targetPath);

      // Reveal file in file explorer
      await this.app.os.fileReveal(targetPath);

      dx.out(`Saved PDF document to ${targetPath}`);
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
  // Caller should set docInfo properties (code, languageId, title, fontFamily, fontSizePx, theme, etc.) before calling this
  async generatePdf(): Promise<DocInfo_PDF> {
    const dx = this.dx.sub('generatePdf');
    dx.require({ code: this.docInfo.code, languageId: this.docInfo.languageId }, [
      'code',
      'languageId',
    ]);

    try {
      // Setup PDF document for line-by-line rendering (uses docInfo properties)
      this.setupPdf();

      // Add header and footer to first page
      this.addHeaderAndFooter();

      // Tokenize and build complete PDF in one pass
      await this.app.stylize.tokenize(
        this.docInfo.code,
        this.docInfo.languageId,
        this.docInfo.theme,
        1, // pageBegin - render all pages
        0 // pageEnd - 0 means all pages
      );

      // Finish the PDF and get the final document
      const pdfDoc = this.finishPdf();

      // Store the generated PDF for page extraction
      // Note: pdfDoc is a DocInfo_PDF wrapper, but we need the raw jsPDF for renderContent
      // We'll store it in a separate property

      dx.out(`Generated complete PDF with ${pdfDoc.pageTotal} pages`);
      return pdfDoc;
    } catch (error) {
      dx.error(`Failed to generate complete PDF: ${String(error)}`);
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
    // Get dimensions from centralized const object (id ? metadata)
    const metadata = kPageSizeId[pageSize];

    // Swap width/height for landscape
    if (orient === 'landscape') {
      return { width: metadata.height, height: metadata.width };
    }

    return { width: metadata.width, height: metadata.height };
  }

  async getPageSizePx(): Promise<{ widthPx: number; heightPx: number }> {
    const dx = this.dx.sub('getPageSizePx');

    try {
      // Prefer actual PDF dimensions if available
      if (this.docInfo.pdfDoc) {
        const pageWidthPts = (this.docInfo.pdfDoc as any).getPageWidth();
        const pageHeightPts = (this.docInfo.pdfDoc as any).getPageHeight();
        const pageWidthPx = Math.round(this.coords.pdfPtsToCssPx(pageWidthPts));
        const pageHeightPx = Math.round(this.coords.pdfPtsToCssPx(pageHeightPts));
        dx.out(`Page dimensions (from PDF): ${pageWidthPx}x${pageHeightPx}px`);
        return { widthPx: pageWidthPx, heightPx: pageHeightPx };
      }

      // Fallback to configured size if no PDF yet
      const pageSizeId = (this.app.uimenumgr.getValueForSelectedByMenuId('pageSizeId') ||
        'a4') as PageSizeId_t;
      const orient = (this.app.uimenumgr.getValueForSelectedByMenuId('orient') || 'portrait') as
        | 'portrait'
        | 'landscape';
      const pageSize = this.getPageDimensions(pageSizeId, orient);
      const unit = this.getUnitForPageSize(pageSizeId);
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(
        pageSize.width,
        pageSize.height,
        unit
      );
      const pageWidthPx = Math.round(this.coords.pdfPtsToCssPx(pageWidthPts));
      const pageHeightPx = Math.round(this.coords.pdfPtsToCssPx(pageHeightPts));
      dx.out(`Page dimensions (from config): ${pageWidthPx}x${pageHeightPx}px`);
      return { widthPx: pageWidthPx, heightPx: pageHeightPx };
    } catch (error) {
      dx.error(`Failed to get page dimensions: ${String(error)}`);
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
   * Uses properties from docInfo (set before calling this method)
   */
  public setupPdf(): void {
    const dx = this.dx.sub('setupPdf');

    try {
      // Get page dimensions
      const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
      const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(
        pageSize.width,
        pageSize.height,
        unit
      );

      // Create PDF document
      // ?? CRITICAL: COORDINATE SYSTEM WARNING ??
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
        orientation: this.docInfo.orient,
        unit: 'pt',
        format: [pageWidthPts, pageHeightPts],
      });

      // Map font family to jsPDF supported fonts
      const jsPdfFont = this.mapFontFamilyToJsPDF(this.docInfo.fontFamily, this.docInfo.pdfDoc);
      this.docInfo.pdfDoc.setFont(jsPdfFont, 'normal');

      // Convert fontSize from pixels to points for jsPDF, clamping to minimum of 8pt
      const px = this.docInfo.fontSizePx ?? 12;
      const fontSizePts = this.coords.cssPxToPdfPts(Math.max(8, px));
      this.docInfo.fontSizePts = fontSizePts;
      this.docInfo.pdfDoc.setFontSize(fontSizePts);
      dx.out(`PDF font size set: ${px}px -> ${fontSizePts}pt`);

      // Convert lineHeight from pixels to points for jsPDF
      this.currentLineHeight = this.coords.cssPxToPdfPts(this.docInfo.lineHeightPx);
      this.docInfo.lineHeightPts = this.currentLineHeight;

      // Set initial position using docInfo margins
      // jsPDF uses top-left origin: Y=0 at top, Y increases downward
      const marginsPts = this.docInfo.marginPts;
      // Start at the left margin for X position
      this.currentX = marginsPts.leftMarginPts;

      // Header - positioned within top margin area
      // With base 0.4 inch margin, header is always safely positioned
      const headerFontSizePts = 8;
      const headerY = marginsPts.topMarginPts - 5; // Position header within margin (5pts from top edge of margin)
      const headerBottom = headerY + headerFontSizePts;
      const headerSpacing = 3; // Small spacing between header and content
      this.currentY = headerBottom + headerSpacing + this.currentLineHeight;

      dx.out(
        `Initial position: (${this.currentX}, ${this.currentY}) (leftMargin=${marginsPts.leftMarginPts}, topMargin=${marginsPts.topMarginPts})`
      );
      dx.out(`jsPDF coordinate system: Y=0 at top, Y increases downward`);
      dx.out(`Starting at top margin, will move DOWN by adding to Y`);

      dx.out(
        `PDF document setup: ${this.docInfo.pageSizeId} ${this.docInfo.orient}, ${fontSizePts}pt font, ${this.currentLineHeight}pt line height`
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
   * Find the character position where text should wrap based on available width
   * Returns the number of characters that fit on the current line
   */
  private findCharacterBreakPoint(
    text: string,
    currentXPos: number,
    leftMargin: number,
    availableWidth: number
  ): number {
    if (!this.docInfo.pdfDoc) {
      return text.length;
    }

    const maxX = leftMargin + availableWidth;
    let widthSoFar = 0;

    // Quick check: if entire text fits, return it all
    const fullWidth = this.docInfo.pdfDoc.getTextWidth(text);
    if (currentXPos + fullWidth <= maxX) {
      return text.length;
    }

    // Character-by-character search to find exact break point
    let bestFit = 0;
    for (let i = 0; i < text.length; i++) {
      const charWidth = this.docInfo.pdfDoc.getTextWidth(text[i]);
      if (currentXPos + widthSoFar + charWidth > maxX) {
        // This character would exceed the line, break before it
        break;
      }
      widthSoFar += charWidth;
      bestFit = i + 1;
    }

    return bestFit;
  }

  /**
   * Render tokenized line content into PDF document
   * Called by tokenizer to add content to PDF as tokens are processed
   */
  public renderTokenizedLine(lineNumber: number, tokens: ThemedToken[]): void {
    const dx = this.dx.sub('renderTokenizedLine');

    try {
      // Initialize jsPDF document on first line
      if (!this.docInfo.pdfDoc) {
        throw new Error('PDF document not initialized. Call setupPdf() first.');
      }

      // Get available width for line wrapping using docInfo
      const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
      const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
      const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
      const marginsPts = this.docInfo.marginPts;
      const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;

      // Each line starts at left margin, same Y position
      let xPos = marginsPts.leftMarginPts;
      let yPos = this.currentY; // Start at current Y position for this line

      dx.out(`Rendering line ${lineNumber} at Y position: ${yPos}`);

      // Process each token in the line
      for (const token of tokens) {
        const color = token.color || '#000000';
        let content = token.content;

        if (content) {
          // Set color for this token
          this.setTextColorFromWebColor(this.docInfo.pdfDoc!, color);

          // Process content character by character to wrap at proper line length
          while (content.length > 0) {
            // Find how many characters fit on current line
            const charsToRender = this.findCharacterBreakPoint(
              content,
              xPos,
              marginsPts.leftMarginPts,
              availableWidth
            );

            if (charsToRender === 0) {
              // Current position is at or beyond line end, wrap to next line
              yPos += this.currentLineHeight;
              xPos = marginsPts.leftMarginPts;

              if (this.shouldBreakPage(yPos)) {
                const bottomMargin = this.lastPageBreakMetrics?.bottomMarginY ?? 0;
                dx.out(
                  `Page break during wrapping at line ${lineNumber}: yPos=${yPos} > bottomMargin=${bottomMargin}`
                );
                this.addPageBreak();
                yPos = this.currentY;
                xPos = this.currentX;
              }
              continue; // Try again with new line position
            }

            // Render the portion that fits
            const portionToRender = content.substring(0, charsToRender);
            const portionWidth = this.docInfo.pdfDoc!.getTextWidth(portionToRender);

            dx.out(`Rendering text "${portionToRender}" at (${xPos}, ${yPos})`);
            if (lineNumber < 3) {
              dx.out(
                `First few lines - Line ${lineNumber}, Token portion: "${portionToRender}", Position: (${xPos}, ${yPos})`
              );
            }
            this.docInfo.pdfDoc!.text(portionToRender, xPos, yPos);

            // Advance x position
            xPos += portionWidth;

            // Remove rendered portion from content
            content = content.substring(charsToRender);
          }
        }
      }

      // Update current position to reflect actual end position after wrapping
      // Note: We don't update currentX here because each line starts at left margin
      this.currentY = yPos;

      // Advance y position by lineHeight for next line
      // jsPDF: Y increases downward, so we move DOWN by adding
      const oldY = this.currentY;
      this.currentY = this.currentY + this.currentLineHeight;

      // Reset X to left margin for next line
      this.currentX = marginsPts.leftMarginPts;
      dx.out(
        `Line ${lineNumber} complete: Y moved from ${oldY} to ${this.currentY} (down by ${this.currentLineHeight})`
      );

      if (this.shouldBreakPage(this.currentY)) {
        const bottomMargin = this.lastPageBreakMetrics?.bottomMarginY ?? 0;
        dx.out(
          `Page break at line ${lineNumber}: currentY=${this.currentY} > bottomMargin=${bottomMargin}`
        );
        this.addPageBreak();
        dx.out(`Added page break at line ${lineNumber + 1}`);
      }

      dx.out(`Rendered line ${lineNumber}`);
    } catch (error) {
      dx.out(`Error rendering line ${lineNumber}: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  private computePageBreakMetrics(): { maxContentY: number; bottomMarginY: number } {
    const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
    const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
    const { heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = this.docInfo.marginPts;

    const footerFontSizePts = 8;
    const footerY = heightPts - margins.bottomMarginPts + 5;
    const footerTop = footerY - footerFontSizePts;
    const footerSpacing = 3;

    const maxContentY = footerTop - footerSpacing - this.currentLineHeight;
    const bottomMarginY = heightPts - margins.bottomMarginPts;

    return { maxContentY, bottomMarginY };
  }

  private shouldBreakPage(yPos: number): boolean {
    if (!this.docInfo.pdfDoc) {
      return false;
    }

    if (this.currentLineHeight <= 0) {
      return false;
    }

    const metrics = this.computePageBreakMetrics();
    this.lastPageBreakMetrics = metrics;

    return yPos > metrics.maxContentY;
  }

  private addPageBreak(): void {
    if (!this.docInfo.pdfDoc) {
      return;
    }

    this.lastPageBreakMetrics = null;

    const margins = this.docInfo.marginPts;

    this.docInfo.pdfDoc.addPage();

    const headerFontSizePts = 8;
    const headerY = margins.topMarginPts - 5;
    const headerBottom = headerY + headerFontSizePts;
    const headerSpacing = 3;

    this.currentY = headerBottom + headerSpacing + this.currentLineHeight;
    this.currentX = margins.leftMarginPts;

    this.addHeaderAndFooter();
  }

  /**
   * Add header and footer to current page
   * Uses positioning settings from docInfo to place elements at left, center, or right
   * Combines elements at the same position with " | " separator
   */
  private addHeaderAndFooter(): void {
    if (!this.docInfo.pdfDoc) {
      return;
    }

    // Get document title from paperprinter's docInfo
    const docTitle = this.app.paperprinter.docInfo.printTitle || 'Document';

    // Get current page info
    const pageInfo = this.docInfo.pdfDoc.getCurrentPageInfo();
    const currentPage = pageInfo.pageNumber;
    const pageTotal = this.docInfo.pageTotal;

    // Get page dimensions and margins
    const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
    const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
    const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = this.docInfo.marginPts;

    // Set small font for header/footer
    const originalFontSizePx = this.docInfo.fontSizePx;
    this.docInfo.pdfDoc.setFontSize(8); // points
    this.setTextColorFromWebColor(this.docInfo.pdfDoc, PDF.HEADER_FOOTER_COLOR);

    // Build header elements by position
    const headerElements: Record<HeaderFooterRenderablePos, string[]> = {
      begin: [],
      center: [],
      end: [],
    };

    // Helper functions to validate positions
    const isValidPos = (pos: string): pos is HeaderFooterPos_t => {
      return pos === 'begin' || pos === 'center' || pos === 'end' || pos === 'none';
    };

    const isRenderablePos = (pos: HeaderFooterPos_t): pos is HeaderFooterRenderablePos => {
      return pos !== 'none';
    };

    const pushElement = (
      elements: Record<HeaderFooterRenderablePos, string[]>,
      pos: HeaderFooterPos_t,
      text: string
    ): void => {
      if (isValidPos(pos) && isRenderablePos(pos)) {
        elements[pos].push(text);
      }
    };

    // Handle Title
    pushElement(headerElements, this.docInfo.header_title, docTitle);

    // Handle Page and Total - combine if at same position
    const headerPagePos = this.docInfo.header_page;
    const headerTotalPos = this.docInfo.header_total;
    if (
      isValidPos(headerPagePos) &&
      isValidPos(headerTotalPos) &&
      headerPagePos === headerTotalPos &&
      isRenderablePos(headerPagePos) &&
      pageTotal > 0
    ) {
      // Combine: "Page X of Y"
      pushElement(headerElements, headerPagePos, `Page ${currentPage} of ${pageTotal}`);
    } else {
      // Separate handling
      pushElement(headerElements, headerPagePos, `Page ${currentPage}`);
      if (pageTotal > 0) {
        pushElement(headerElements, headerTotalPos, `${pageTotal} Pages`);
      }
    }

    // Build footer elements by position
    const footerElements: Record<HeaderFooterRenderablePos, string[]> = {
      begin: [],
      center: [],
      end: [],
    };

    // Handle Title
    pushElement(footerElements, this.docInfo.footer_title, docTitle);

    // Handle Page and Total - combine if at same position
    const footerPagePos = this.docInfo.footer_page;
    const footerTotalPos = this.docInfo.footer_total;
    if (
      isValidPos(footerPagePos) &&
      isValidPos(footerTotalPos) &&
      footerPagePos === footerTotalPos &&
      isRenderablePos(footerPagePos) &&
      pageTotal > 0
    ) {
      // Combine: "Page X of Y"
      pushElement(footerElements, footerPagePos, `Page ${currentPage} of ${pageTotal}`);
    } else {
      // Separate handling
      pushElement(footerElements, footerPagePos, `Page ${currentPage}`);
      if (pageTotal > 0) {
        pushElement(footerElements, footerTotalPos, `${pageTotal} Pages`);
      }
    }

    // Render header
    const headerY = margins.topMarginPts - 5;
    this.renderHeaderFooterElements(headerElements, headerY, widthPts, margins);

    // Render footer
    const footerY = heightPts - margins.bottomMarginPts + 5;
    this.renderHeaderFooterElements(footerElements, footerY, widthPts, margins);

    // Restore original font size
    this.docInfo.pdfDoc.setFontSize(this.coords.cssPxToPdfPts(originalFontSizePx));
  }

  /**
   * Render header or footer elements at their positions
   */
  private renderHeaderFooterElements(
    elements: Record<HeaderFooterRenderablePos, string[]>,
    y: number,
    widthPts: number,
    margins: { leftMarginPts: number; rightMarginPts: number }
  ): void {
    if (!this.docInfo.pdfDoc) {
      return;
    }

    // Combine elements at each position with " | " separator
    const beginText = elements.begin.join(' | ');
    const centerText = elements.center.join(' | ');
    const endText = elements.end.join(' | ');

    // Render begin (left) position
    if (beginText) {
      this.docInfo.pdfDoc.text(beginText, margins.leftMarginPts, y);
    }

    // Render center position
    if (centerText) {
      const centerWidth = this.docInfo.pdfDoc.getTextWidth(centerText);
      const centerX = (widthPts - centerWidth) / 2;
      this.docInfo.pdfDoc.text(centerText, centerX, y);
    }

    // Render end (right) position
    if (endText) {
      const endWidth = this.docInfo.pdfDoc.getTextWidth(endText);
      const endX = widthPts - margins.rightMarginPts - endWidth;
      this.docInfo.pdfDoc.text(endText, endX, y);
    }
  }

  /**
   * Add header/footer to all pages after PDF generation is complete
   * Called after page total is known, so we can render totals correctly
   */
  private renderPageTotals(): void {
    const dx = this.dx.sub('renderPageTotals');

    try {
      if (!this.docInfo.pdfDoc) {
        return;
      }

      const totalPages = this.docInfo.pageTotal;

      // Re-render headers and footers on all pages now that we know the total
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        this.docInfo.pdfDoc.setPage(pageNum);
        this.addHeaderAndFooter();
      }

      dx.out(`Added headers/footers to ${totalPages} pages`);
    } catch (error) {
      dx.out(`Error adding headers/footers: ${error}`);
    } finally {
      dx.done();
    }
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

      // Add page totals to all pages now that we know the total
      this.renderPageTotals();

      dx.out(
        `PDF FINALIZED: ${this.docInfo.pageTotal} pages with ${this.docInfo.fontSizePx}px font`
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
