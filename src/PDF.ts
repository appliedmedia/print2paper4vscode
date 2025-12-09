import type { Registry } from './Registry';
import type {
  PageSizeIdMenuItems_t,
  OrientMenuItems_t,
  HeaderFooterPos_t,
  HeaderFooterSubmenu_t,
} from './types/PaperPrinter_t';
import { kPageSizeIdById, kHeaderFooterSubmenuById, kHeaderFooter } from './types/PaperPrinter_t';
import type { MenuId_t } from './UIMenu';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { YamlInstance } from './Yaml';
import { Coords } from './Coords';
import jsPDF from 'jspdf';
import { DocInfo_PDF } from './DocInfo_PDF';
import type { ThemedToken } from 'shiki';
import { parse, type HTMLElement, type Node, NodeType } from 'node-html-parser';
import type { LanguageId_t } from './Stylize';

type HeaderFooterRenderablePos = HeaderFooterPos_t;

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
  static readonly id = 'pdf';
  private static readonly kYaml = {
    pdf_html: '',
    pdf_css: '',
    pdf_js: '',
  } as const;

  private reg: Registry;
  private fn: FnImport_t;
  private tempPdfs: string[] = [];
  private dx: Diagnostics;
  private _yaml: YamlInstance<typeof PDF.kYaml>;

  // Line-by-line rendering state - jsPDF now managed through docInfo.pdfDoc
  private currentX: number = 0;
  private currentY: number = 0;
  private currentLineHeight: number = 0;
  private lastPageBreakMetrics: { maxContentY: number; bottomMarginY: number } | null = null;

  // Header/footer styling
  private static readonly HEADER_FOOTER_COLOR = '#cccccc'; // Light gray

  // PDF document information (private, accessed via docInfo() method)
  private _docInfo: DocInfo_PDF;

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    this.fn = this.reg.use(
      'ui.showErrorMessage',
      'ui.chooseSaveLocation',
      'coords.pdfPtsToCssPx',
      'coords.cssPxToPdfPts',
      'os.dateAsYYYYMMDDHHMMSS',
      'os.sanitizeFileName',
      'os.fileDelete',
      'os.ensureDir',
      'os.pathJoin',
      'os.fileWrite',
      'os.fileOpenPrintDialog',
      'os.filePrint',
      'os.pathDirname',
      'os.fileReveal',
      'vscodeapis.getDir_Temp',
      'vscodeapis.getEditorTypography',
      'vscodeapis.getConfiguration',
      'stylize.tokenize',
      'yaml.create',
      'utils.templateDictReplace',
      'utils.hasContent',
      'uimenumgr.getMenuItemIdSelected'
    );
    this.dx = this.fn.dx.sub({ name: 'PDF' });
    this._docInfo = DocInfo_PDF.create({ reg: this.reg });
    this._yaml = this.fn.yaml.create({ filePath: 'src/PDF.yaml', dataStruct: PDF.kYaml });
    
    // All initialization happens here - no separate init() needed
    this.tempPdfs = [];
  }

  yaml() {
    return this._yaml.get();
  }
  

  /**
   * Get the PDF document info
   */
  docInfo(): DocInfo_PDF {
    return this._docInfo;
  }

  /**
   * Check if PDF is ready for printing/saving
   */
  readyToPrint(): boolean {
    return this.docInfo().pdfDoc !== null;
  }

  /**
   * Get the total number of pages in the document
   */
  getPageTotal(): number {
    return this.docInfo().pageTotal;
  }

  /**
   * Invalidate all PDF caches and reset state
   * Called when regenerating PDF after menu changes
   */
  resetCaches(): void {
    const dx = this.dx.sub({ name: 'invalidateAllCaches' });
    try {
      // Reset PDF document
      this.docInfo().pdfDoc = null;

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
        this.fn.os.fileDelete(p);
      } catch {
        /* ignore */
      }
    }
    this.tempPdfs = [];
    this.dx.done();
  }

  async printWithPreview(descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub({ name: 'printWithPreview' });

    try {
      if (!this.readyToPrint()) {
        dx.error('PDF document not generated');
        throw new Error('PDF document not generated');
      }
      const pdfBuffer = this.docInfo().asArrayBuffer();
      dx.out(
        `Using PDF ArrayBuffer for printWithPreview (${pdfBuffer.byteLength} bytes)`
      );

      // Generate filename with timestamp
      const timestamp = this.fn.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.fn.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.fn.vscodeapis.getDir_Temp();
      this.fn.os.ensureDir(tempDir);
      const tempPdfPath = this.fn.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
      this.fn.os.fileWrite({ filePath: tempPdfPath, content: Buffer.from(pdfBuffer) });

      this.trackTempPdf(tempPdfPath);
      await this.fn.os.fileOpenPrintDialog(tempPdfPath);
      dx.out('Opened PDF in Preview app');
    } catch (error) {
      dx.out(`Error in print with preview: ${error}`);
      throw error;
    }
    dx.done();
  }

  async printDirectly(descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub({ name: 'printDirectly' });
    try {
      if (!this.readyToPrint()) {
        dx.error('PDF document not generated');
        throw new Error('PDF document not generated');
      }
      const pdfBuffer = this.docInfo().asArrayBuffer();
      dx.out(
        `Using PDF ArrayBuffer for printDirectly (${pdfBuffer.byteLength} bytes)`
      );

      // Generate filename with timestamp
      const timestamp = this.fn.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.fn.os.sanitizeFileName(descriptiveName || 'print_output');
      const filename = `${timestamp}_${safeName}.pdf`;

      // Save PDF to temp directory
      const tempDir = this.fn.vscodeapis.getDir_Temp();
      this.fn.os.ensureDir(tempDir);
      const tempPdfPath = this.fn.os.pathJoin(tempDir, filename);

      // Write PDF document to temp file
      this.fn.os.fileWrite({ filePath: tempPdfPath, content: Buffer.from(pdfBuffer) });

      this.trackTempPdf(tempPdfPath);
      // Send PDF to printer
      await this.fn.os.filePrint(tempPdfPath);
      dx.out('Sent PDF to printer');
    } catch (error) {
      this.fn.ui.showErrorMessage(`Failed to print PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  async saveAsPDF(descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub({ name: 'saveAsPDF' });
    try {
      if (!this.readyToPrint()) {
        dx.error('PDF document not generated');
        throw new Error('PDF document not generated');
      }
      const pdfBuffer = this.docInfo().asArrayBuffer();
      dx.out(
        `Using PDF ArrayBuffer for saveAsPDF (${pdfBuffer.byteLength} bytes)`
      );

      // Generate default filename with timestamp
      const timestamp = this.fn.os.dateAsYYYYMMDDHHMMSS();
      const safeName = this.fn.os.sanitizeFileName(descriptiveName || 'print_output');
      const defaultFilename = `${timestamp}_${safeName}.pdf`;

      // Ask user for save location using UI method
      const targetPath = await this.fn.ui.chooseSaveLocation(defaultFilename);

      if (!targetPath) {
        dx.out('Save cancelled by user');
        return;
      }

      // Ensure directory exists
      const targetDir = this.fn.os.pathDirname(targetPath);
      this.fn.os.ensureDir(targetDir);

      // Save PDF document directly to chosen location
      this.fn.os.fileWrite({ filePath: targetPath, content: Buffer.from(pdfBuffer) });

      // Track file for cleanup (optional)
      this.trackTempPdf(targetPath);

      // Reveal file in file explorer
      await this.fn.os.fileReveal(targetPath);

      dx.out(`Saved PDF document to ${targetPath}`);
    } catch (error) {
      this.fn.ui.showErrorMessage(`Failed to save PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  private trackTempPdf(p: string): void {
    if (!p) return;
    this.tempPdfs.push(p);
  }

  // Map font family to jsPDF built-in fonts
  private mapFontFamilyToJsPDF(fontFamily: string, doc: jsPDF): string {
    const dx = this.dx.sub({ name: 'mapFontFamilyToJsPDF' });

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

  /**
   * Render tokenized or HTML content to PDF
   * Handles both tokens (syntax highlighting) and HTML (rendered markdown)
   * Assumes setupPdf() has already been called
   */
  async render(result: { tokens?: ThemedToken[][]; html?: string }): Promise<void> {
    const dx = this.dx.sub({ name: 'render' });

    try {
      if (result.html) {
        // HTML rendering path (rendered markdown)
        dx.out('Rendering HTML to PDF');
        await this.renderFromHTML(result.html);
      } else if (result.tokens) {
        // Tokenized path (syntax highlighting)
        dx.out(`Rendering ${result.tokens.length} tokenized lines to PDF`);
        this.renderFromTokens(result.tokens);
      } else {
        dx.error('No tokens or HTML to render');
        throw new Error('No tokens or HTML to render');
      }

      dx.out('Content rendered to PDF');
    } catch (error) {
      dx.error(`Failed to render: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // UNIFIED: Generate complete PDF
  // Caller should set docInfo properties (code, languageId, title, fontFamily, fontSizePx, theme, etc.) before calling this
  async generatePdf(args?: { useRenderedMd?: boolean; document?: any }): Promise<void> {
    const dx = this.dx.sub({ name: 'generatePdf' });
    dx.require({ code: this.docInfo().code, languageId: this.docInfo().languageId }, [
      'code',
      'languageId',
    ]);

    try {
      // Setup PDF document
      this.setupPdf();

      // Add header and footer to first page
      this.addHeaderAndFooter();

      // Tokenize or render to HTML
      const result = await this.fn.stylize.tokenize({
        code: this.docInfo().code,
        languageId: this.docInfo().languageId,
        theme: this.docInfo().theme,
        useRenderedMd: args?.useRenderedMd,
        document: args?.document
      });

      // Render content to PDF
      await this.render(result);

      // Finish the PDF (re-renders headers/footers with correct page totals)
      this.finishPdf();

      dx.out(`Generated complete PDF with ${this.docInfo().pageTotal} pages`);
    } catch (error) {
      dx.error(`Failed to generate complete PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Helper: Get unit based on page size
  // Uses centralized unit from PaperPrinter_t.ts
  private getUnitForPageSize(pageSize: PageSizeIdMenuItems_t): 'mm' | 'in' {
    // Get unit from centralized constant (single source of truth)
    const unit = kPageSizeIdById[pageSize].unit;
    return unit === 'inches' ? 'in' : 'mm';
  }

  // Helper: Get page dimensions based on size and orient
  // Uses centralized dimensions from PaperPrinter_t.ts - single source of truth
  private getPageDimensions(
    pageSize: PageSizeIdMenuItems_t,
    orient: OrientMenuItems_t
  ): { width: number; height: number } {
    // Get dimensions from centralized const object (id ? metadata)
    const metadata = kPageSizeIdById[pageSize];

    // Swap width/height for landscape
    if (orient === 'landscape') {
      return { width: metadata.height, height: metadata.width };
    }

    return { width: metadata.width, height: metadata.height };
  }

  async getPageSizePx(): Promise<{ widthPx: number; heightPx: number }> {
    const dx = this.dx.sub({ name: 'getPageSizePx' });

    try {
      // Prefer actual PDF dimensions if available
      if (this.docInfo().pdfDoc) {
        const pageWidthPts = (this.docInfo().pdfDoc as any).getPageWidth();
        const pageHeightPts = (this.docInfo().pdfDoc as any).getPageHeight();
        const pageWidthPx = Math.round(this.fn.coords.pdfPtsToCssPx(pageWidthPts));
        const pageHeightPx = Math.round(this.fn.coords.pdfPtsToCssPx(pageHeightPts));
        dx.out(`Page dimensions (from PDF): ${pageWidthPx}x${pageHeightPx}px`);
        return { widthPx: pageWidthPx, heightPx: pageHeightPx };
      }

      // Fallback to configured size if no PDF yet
      // Get current selections from menu system (defaults already handled by persist/menu system)
      const menuKeys = ['pageSizeId', 'orient'] as const;
      const selections: Record<string, string | undefined> = {};
      for (const key of menuKeys) {
        selections[key] = this.fn.uimenumgr.getMenuItemIdSelected(key);
      }
      
      const pageSizeId = selections.pageSizeId as PageSizeIdMenuItems_t;
      const orient = selections.orient as 'portrait' | 'landscape';
      const pageSize = this.getPageDimensions(pageSizeId, orient);
      const unit = this.getUnitForPageSize(pageSizeId);
      const { widthPts: pageWidthPts, heightPts: pageHeightPts } = this.pageSizeToPts(
        pageSize.width,
        pageSize.height,
        unit
      );
      const pageWidthPx = Math.round(this.fn.coords.pdfPtsToCssPx(pageWidthPts));
      const pageHeightPx = Math.round(this.fn.coords.pdfPtsToCssPx(pageHeightPts));
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
    const dx = this.dx.sub({ name: 'setupPdf' });

    try {
      // Get page dimensions
      const pageSize = this.getPageDimensions(this.docInfo().pageSizeId, this.docInfo().orient);
      const unit = this.getUnitForPageSize(this.docInfo().pageSizeId);
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
      this.docInfo().pdfDoc = new jsPDF({
        orientation: this.docInfo().orient,
        unit: 'pt',
        format: [pageWidthPts, pageHeightPts],
      });

      // Map font family to jsPDF supported fonts
      const docInfo = this.docInfo();
      const jsPdfFont = this.mapFontFamilyToJsPDF(docInfo.fontFamily, docInfo.pdfDoc!);
      docInfo.pdfDoc!.setFont(jsPdfFont, 'normal');

      // Convert fontSize from pixels to points for jsPDF, clamping to minimum of 8pt
      const px = docInfo.fontSizePx ?? 12;
      const fontSizePts = this.fn.coords.cssPxToPdfPts(Math.max(8, px));
      docInfo.fontSizePts = fontSizePts;
      docInfo.pdfDoc!.setFontSize(fontSizePts);
      dx.out(`PDF font size set: ${px}px -> ${fontSizePts}pt`);

      // Convert lineHeight from pixels to points for jsPDF
      this.currentLineHeight = this.fn.coords.cssPxToPdfPts(this.docInfo().lineHeightPx);
      this.docInfo().lineHeightPts = this.currentLineHeight;

      // Set initial position using docInfo margins
      // jsPDF uses top-left origin: Y=0 at top, Y increases downward
      const marginsPts = this.docInfo().marginPts;
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
        `PDF document setup: ${this.docInfo().pageSizeId} ${this.docInfo().orient}, ${fontSizePts}pt font, ${this.currentLineHeight}pt line height`
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
    if (!this.docInfo().pdfDoc) {
      return text.length;
    }

    const maxX = leftMargin + availableWidth;
    let widthSoFar = 0;

    // Quick check: if entire text fits, return it all
    const pdfDoc = this.docInfo().pdfDoc!;
    const fullWidth = pdfDoc.getTextWidth(text);
    if (currentXPos + fullWidth <= maxX) {
      return text.length;
    }

    // Character-by-character search to find exact break point
    let bestFit = 0;
    for (let i = 0; i < text.length; i++) {
      const charWidth = pdfDoc.getTextWidth(text[i]);
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
   * Render tokens to PDF (for code with syntax highlighting)
   * @param tokens - 2D array from Shiki: tokens[lineIndex][tokenIndex]
   */
  public renderFromTokens(tokens: ThemedToken[][]): void {
    const dx = this.dx.sub({ name: 'renderFromTokens' });
    
    try {
      // Initialize jsPDF document check
      if (!this.docInfo().pdfDoc) {
        dx.error('PDF document not initialized. Call setupPdf() first.');
        throw new Error('PDF document not initialized. Call setupPdf() first.');
      }

      // Get available width for line wrapping using docInfo
      const pageSize = this.getPageDimensions(this.docInfo().pageSizeId, this.docInfo().orient);
      const unit = this.getUnitForPageSize(this.docInfo().pageSizeId);
      const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
      const marginsPts = this.docInfo().marginPts;
      const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;

      // Iterate through all lines
      for (let lineNumber = 0; lineNumber < tokens.length; lineNumber++) {
        const lineTokens = tokens[lineNumber];
        
        // Each line starts at left margin, same Y position
        let xPos = marginsPts.leftMarginPts;
        let yPos = this.currentY; // Start at current Y position for this line

        dx.out(`Rendering line ${lineNumber} at Y position: ${yPos}`);

        // Process each token in the line
        for (const token of lineTokens) {
          const color = token.color || '#000000';
          let content = token.content;

          if (content) {
            // Set color for this token
            this.setTextColorFromWebColor(this.docInfo().pdfDoc!, color);

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
              const portionWidth = this.docInfo().pdfDoc!.getTextWidth(portionToRender);

              dx.out(`Rendering text "${portionToRender}" at (${xPos}, ${yPos})`);
              if (lineNumber < 3) {
                dx.out(
                  `First few lines - Line ${lineNumber}, Token portion: "${portionToRender}", Position: (${xPos}, ${yPos})`
                );
              }
              this.docInfo().pdfDoc!.text(portionToRender, xPos, yPos);

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
      }
      
      dx.out(`Rendered ${tokens.length} lines to PDF`);
    } catch (error) {
      dx.out(`Error rendering tokens: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Get font info from markdown preview settings or editor settings
   */
  private getMarkdownFontInfo(): { fontFamily: string; fontSize: number } {
    // Get markdown preview settings (these control what user sees in MD preview)
    const mdConfig = this.fn.vscodeapis.getConfiguration('markdown');
    const mdFontFamily = mdConfig.get('preview.fontFamily') as string | undefined;
    const mdFontSize = mdConfig.get('preview.fontSize') as number | undefined;
    
    // Use markdown preview settings, or fall back to editor settings
    const editorTypo = this.fn.vscodeapis.getEditorTypography();
    const fontFamily = mdFontFamily || editorTypo.fontFamily;
    const fontSize = mdFontSize || editorTypo.fontSize;
    
    return { fontFamily, fontSize };
  }

  /**
   * Extract font info from HTML element's style attribute
   * Returns null if no style info found
   */
  private getFontFromElementStyle(element: HTMLElement): { fontFamily?: string; fontSize?: number } | null {
    const style = element.getAttribute('style');
    if (!style) return null;
    
    const result: { fontFamily?: string; fontSize?: number } = {};
    
    // Parse font-family from style
    const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/i);
    if (fontFamilyMatch) {
      result.fontFamily = fontFamilyMatch[1].trim().replace(/['"]/g, '');
    }
    
    // Parse font-size from style
    const fontSizeMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)(px|pt|em)/i);
    if (fontSizeMatch) {
      const size = parseFloat(fontSizeMatch[1]);
      const unit = fontSizeMatch[2];
      
      if (unit === 'px') {
        result.fontSize = size;
      } else if (unit === 'pt') {
        result.fontSize = size * (96 / 72); // Convert pt to px
      } else if (unit === 'em') {
        const baseFontInfo = this.getMarkdownFontInfo();
        result.fontSize = size * baseFontInfo.fontSize;
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Render HTML-formatted markdown to PDF
   * Uses VS Code's markdown renderer output
   * 
   * NOTE: This method is async to support code block rendering which requires
   * asynchronous tokenization via Shiki.
   */
  async renderFromHTML(html: string): Promise<void> {
    const dx = this.dx.sub({ name: 'renderFromHTML' });
    
    try {
      const root = parse(html);
      
      for (const element of root.childNodes) {
        if (element.nodeType === NodeType.ELEMENT_NODE) {
          await this.renderHTMLElement(element as HTMLElement);
        }
      }
      
      dx.out('Rendered HTML to PDF');
    } finally {
      dx.done();
    }
  }

  /**
   * HTML element handlers - maps tag name to render function
   * Handlers can be async to support operations like code tokenization
   */
  private readonly htmlElementHandlers: Record<string, (element: HTMLElement) => void | Promise<void>> = {
    'h1': (el) => this.renderHeading(el, 1),
    'h2': (el) => this.renderHeading(el, 2),
    'h3': (el) => this.renderHeading(el, 3),
    'h4': (el) => this.renderHeading(el, 4),
    'h5': (el) => this.renderHeading(el, 5),
    'h6': (el) => this.renderHeading(el, 6),
    'p': (el) => this.renderParagraph(el),
    'ul': (el) => this.renderList(el),
    'ol': (el) => this.renderList(el),
    'pre': (el) => this.renderCodeBlock(el),
    'blockquote': (el) => this.renderBlockquote(el),
    'hr': () => this.renderHorizontalRule(),
  };

  /**
   * Render a single HTML element
   * Supports both sync and async handlers
   */
  private async renderHTMLElement(element: HTMLElement): Promise<void> {
    const dx = this.dx.sub({ name: 'renderHTMLElement' });
    
    const handler = this.htmlElementHandlers[element.tagName.toLowerCase()];
    if (handler) {
      await handler(element);
    } else {
      dx.out(`Unknown element: ${element.tagName}`);
    }
    
    dx.done();
  }

  /**
   * Render heading element
   */
  private renderHeading(element: HTMLElement, level: number): void {
    const pdfDoc = this.docInfo().pdfDoc;
    if (!pdfDoc) return;
    
    // Try to get font from element style first
    const styleFont = this.getFontFromElementStyle(element);
    
    // Fall back to markdown preview settings
    const baseFontInfo = this.getMarkdownFontInfo();
    
    const fontFamily = styleFont?.fontFamily || baseFontInfo.fontFamily;
    const fontSize = styleFont?.fontSize || baseFontInfo.fontSize;
    
    // Calculate heading size if not specified in style
    let headingSize: number;
    if (styleFont?.fontSize) {
      headingSize = this.fn.coords.cssPxToPdfPts(styleFont.fontSize);
    } else {
      const sizeMultipliers = [2.0, 1.5, 1.25, 1.1, 1.0, 0.9];
      const multiplier = sizeMultipliers[level - 1] || 1.0;
      headingSize = this.fn.coords.cssPxToPdfPts(fontSize * multiplier);
    }
    
    // Spacing based on level
    const spacingBefore = Math.max(12 - level * 2, 4);
    const spacingAfter = Math.max(6 - level, 2);
    
    // Add spacing before
    this.currentY += spacingBefore;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Set heading font
    const jsPdfFont = this.mapFontFamilyToJsPDF(fontFamily, pdfDoc);
    pdfDoc.setFont(jsPdfFont, 'bold');
    pdfDoc.setFontSize(headingSize);
    
    // Render text with wrapping (reuse existing logic)
    this.renderTextContent(element.text);
    
    // Add spacing after
    this.currentY += spacingAfter;
    
    // Reset to normal font
    pdfDoc.setFontSize(this.docInfo().fontSizePts);
    pdfDoc.setFont(jsPdfFont, 'normal');
  }

  /**
   * Render paragraph with inline formatting
   */
  private renderParagraph(element: HTMLElement): void {
    if (!this.docInfo().pdfDoc) return;
    
    // Process inline content (text, bold, italic, code, etc.)
    this.renderInlineContent(element);
    
    // Move to next line with spacing
    this.currentY += this.currentLineHeight;
    this.currentX = this.docInfo().marginPts.leftMarginPts;
    this.currentY += 6; // Paragraph spacing
    
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
  }

  /**
   * Inline element handlers - maps tag name to render function
   */
  private getInlineElementHandlers(): Record<string, (element: HTMLElement, savedFont: any) => void> {
    return {
      'strong': (el, savedFont) => {
        const styleFont = this.getFontFromElementStyle(el);
        const fontName = styleFont?.fontFamily 
          ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo().pdfDoc!)
          : savedFont.fontName;
        
        this.docInfo().pdfDoc!.setFont(fontName, 'bold');
        this.renderTextContent(el.text);
        this.docInfo().pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
      },
      'b': (el, savedFont) => {
        const styleFont = this.getFontFromElementStyle(el);
        const fontName = styleFont?.fontFamily 
          ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo().pdfDoc!)
          : savedFont.fontName;
        
        this.docInfo().pdfDoc!.setFont(fontName, 'bold');
        this.renderTextContent(el.text);
        this.docInfo().pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
      },
      'em': (el, savedFont) => {
        const styleFont = this.getFontFromElementStyle(el);
        const fontName = styleFont?.fontFamily 
          ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo().pdfDoc!)
          : savedFont.fontName;
        
        this.docInfo().pdfDoc!.setFont(fontName, 'italic');
        this.renderTextContent(el.text);
        this.docInfo().pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
      },
      'i': (el, savedFont) => {
        const styleFont = this.getFontFromElementStyle(el);
        const fontName = styleFont?.fontFamily 
          ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo().pdfDoc!)
          : savedFont.fontName;
        
        this.docInfo().pdfDoc!.setFont(fontName, 'italic');
        this.renderTextContent(el.text);
        this.docInfo().pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
      },
      'code': (el, savedFont) => {
        const styleFont = this.getFontFromElementStyle(el);
        let monoFontFamily: string;
        
        if (styleFont?.fontFamily) {
          monoFontFamily = styleFont.fontFamily;
        } else {
          const editorTypo = this.fn.vscodeapis.getEditorTypography();
          monoFontFamily = editorTypo.fontFamily;
        }
        
        const monoFont = this.mapFontFamilyToJsPDF(monoFontFamily, this.docInfo().pdfDoc!);
        this.docInfo().pdfDoc!.setFont(monoFont, 'normal');
        this.renderTextContent(el.text);
        this.docInfo().pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
      },
    };
  }

  /**
   * Render inline content (handles bold, italic, code, etc.)
   */
  private renderInlineContent(element: HTMLElement): void {
    if (!this.docInfo().pdfDoc) return;
    
    const inlineHandlers = this.getInlineElementHandlers();
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        // Plain text
        this.renderTextContent(child.text);
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const savedFont = this.docInfo().pdfDoc!.getFont();
        
        const handler = inlineHandlers[el.tagName.toLowerCase()];
        if (handler) {
          handler(el, savedFont);
        } else {
          // Recursively process unknown inline elements
          this.renderInlineContent(el);
        }
      }
    }
  }

  /**
   * Render text content with character wrapping
   * REUSES existing character wrapping logic from renderFromTokens
   */
  private renderTextContent(text: string): void {
    if (!this.docInfo().pdfDoc || !text) return;
    
    const marginsPts = this.docInfo().marginPts;
    const pageSize = this.getPageDimensions(this.docInfo().pageSizeId, this.docInfo().orient);
    const unit = this.getUnitForPageSize(this.docInfo().pageSizeId);
    const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;
    
    let content = text;
    
    while (content.length > 0) {
      // REUSE existing findCharacterBreakPoint - same logic as tokens!
      const charsToRender = this.findCharacterBreakPoint(
        content,
        this.currentX,
        marginsPts.leftMarginPts,
        availableWidth
      );
      
      if (charsToRender === 0) {
        // Wrap to next line
        this.currentY += this.currentLineHeight;
        this.currentX = marginsPts.leftMarginPts;
        if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
        continue;
      }
      
      const portion = content.substring(0, charsToRender);
      this.docInfo().pdfDoc!.text(portion, this.currentX, this.currentY);
      this.currentX += this.docInfo().pdfDoc!.getTextWidth(portion);
      content = content.substring(charsToRender);
    }
  }

  /**
   * Render list (ul or ol)
   */
  private renderList(element: HTMLElement): void {
    const pdfDoc = this.docInfo().pdfDoc;
    if (!pdfDoc) return;
    
    const isOrdered = element.tagName.toLowerCase() === 'ol';
    let itemNumber = 1;
    const indentSize = 20; // Points
    
    const items = element.querySelectorAll('li');
    for (const item of items) {
      // Render prefix (bullet or number)
      const prefix = isOrdered ? `${itemNumber}. ` : '• ';
      
      // Save position for indent
      const savedLeftMargin = this.docInfo().marginPts.leftMarginPts;
      this.docInfo().marginPts.leftMarginPts += indentSize;
      this.currentX = this.docInfo().marginPts.leftMarginPts;
      
      // Render prefix
      pdfDoc.text(prefix, this.currentX, this.currentY);
      this.currentX += pdfDoc.getTextWidth(prefix);
      
      // Render item content
      this.renderInlineContent(item);
      
      // Move to next line
      this.currentY += this.currentLineHeight;
      this.currentX = this.docInfo().marginPts.leftMarginPts;
      this.currentY += 3; // Item spacing
      
      if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
      
      // Restore margin
      this.docInfo().marginPts.leftMarginPts = savedLeftMargin;
      
      if (isOrdered) itemNumber++;
    }
    
    // Add spacing after list
    this.currentY += 6;
  }

  /**
   * Render code block with syntax highlighting
   * REUSES existing Shiki tokenization!
   */
  private async renderCodeBlock(element: HTMLElement): Promise<void> {
    const pdfDoc = this.docInfo().pdfDoc;
    if (!pdfDoc) return;
    
    const codeElement = element.querySelector('code');
    if (!codeElement) return;
    
    const code = codeElement.text;
    const classAttr = codeElement.getAttribute('class') || '';
    const langClass = classAttr.split(' ').find((c: string) => c.startsWith('language-'));
    const lang = langClass ? langClass.replace('language-', '') : 'plaintext';
    
    // Add spacing before
    this.currentY += 6;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Save left margin and indent
    const savedLeftMargin = this.docInfo().marginPts.leftMarginPts;
    this.docInfo().marginPts.leftMarginPts += 20;
    this.currentX = this.docInfo().marginPts.leftMarginPts;
    
    // REUSE existing Shiki tokenization!
    const result = await this.fn.stylize.tokenize({
      code,
      languageId: lang as LanguageId_t,
      theme: this.docInfo().theme
    });
    
    if (!result.tokens) {
      return; // No tokens to render
    }
    
    const tokens = result.tokens;
    
    // Set monospace font
    const editorTypo = this.fn.vscodeapis.getEditorTypography();
    const monoFont = this.mapFontFamilyToJsPDF(editorTypo.fontFamily, pdfDoc);
    const savedFont = pdfDoc.getFont();
    const savedSize = pdfDoc.getFontSize();
    
    pdfDoc.setFont(monoFont, 'normal');
    pdfDoc.setFontSize(savedSize * 0.9);
    
    // REUSE existing renderFromTokens - pass all tokens at once!
    this.renderFromTokens(tokens);
    
    // Restore font
    pdfDoc.setFont(savedFont.fontName, savedFont.fontStyle);
    pdfDoc.setFontSize(savedSize);
    
    // Restore margin
    this.docInfo().marginPts.leftMarginPts = savedLeftMargin;
    this.currentX = savedLeftMargin;
    
    // Add spacing after
    this.currentY += 6;
  }

  /**
   * Render blockquote with indentation
   */
  private renderBlockquote(element: HTMLElement): void {
    // Save left margin and indent
    const savedLeftMargin = this.docInfo().marginPts.leftMarginPts;
    this.docInfo().marginPts.leftMarginPts += 20;
    this.currentX = this.docInfo().marginPts.leftMarginPts;
    
    // Add spacing before
    this.currentY += 6;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Render children
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        this.renderHTMLElement(child as HTMLElement);
      }
    }
    
    // Restore margin
    this.docInfo().marginPts.leftMarginPts = savedLeftMargin;
    this.currentX = savedLeftMargin;
    
    // Add spacing after
    this.currentY += 6;
  }

  /**
   * Render horizontal rule
   */
  private renderHorizontalRule(): void {
    const doc = this.docInfo().pdfDoc;
    if (!doc) return;
    
    const marginsPts = this.docInfo().marginPts;
    const pageSize = this.getPageDimensions(this.docInfo().pageSizeId, this.docInfo().orient);
    const unit = this.getUnitForPageSize(this.docInfo().pageSizeId);
    const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;
    
    this.currentY += 6; // Spacing before
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Draw line - setDrawColor expects RGB values or a single string
    doc.setDrawColor(204, 204, 204); // RGB for #cccccc
    doc.line(
      marginsPts.leftMarginPts,
      this.currentY,
      marginsPts.leftMarginPts + availableWidth,
      this.currentY
    );
    
    this.currentY += 6; // Spacing after
  }

  private computePageBreakMetrics(): { maxContentY: number; bottomMarginY: number } {
    const pageSize = this.getPageDimensions(this.docInfo().pageSizeId, this.docInfo().orient);
    const unit = this.getUnitForPageSize(this.docInfo().pageSizeId);
    const { heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = this.docInfo().marginPts;

    const footerFontSizePts = 8;
    const footerY = heightPts - margins.bottomMarginPts + 5;
    const footerTop = footerY - footerFontSizePts;
    const footerSpacing = 3;

    const maxContentY = footerTop - footerSpacing - this.currentLineHeight;
    const bottomMarginY = heightPts - margins.bottomMarginPts;

    return { maxContentY, bottomMarginY };
  }

  private shouldBreakPage(yPos: number): boolean {
    if (!this.docInfo().pdfDoc) {
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
    if (!this.docInfo().pdfDoc) {
      return;
    }

    this.lastPageBreakMetrics = null;

    const margins = this.docInfo().marginPts;

    this.docInfo().pdfDoc!.addPage();

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
   * Uses position-based content settings from docInfo
   * Each position (left, center, right) can have: title, page, total, pageTotal, or null
   */
  private addHeaderAndFooter(): void {
    const docInfo = this.docInfo();
    if (!docInfo.pdfDoc) {
      return;
    }
    const pdfDoc = docInfo.pdfDoc;

    // Get document title from docInfo (PaperPrinter copies printTitle into docInfo.title)
    const docTitle = docInfo.title || 'Document';

    const pageNumber = docInfo.pageNumber;
    const pageTotal = docInfo.pageTotal;

    // Get page dimensions and margins
    const pageSize = this.getPageDimensions(docInfo.pageSizeId, docInfo.orient);
    const unit = this.getUnitForPageSize(docInfo.pageSizeId);
    const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const margins = docInfo.marginPts;

    // Set small font for header/footer
    const originalFontSizePx = docInfo.fontSizePx;
    pdfDoc.setFontSize(8); // points
    this.setTextColorFromWebColor(pdfDoc, PDF.HEADER_FOOTER_COLOR);

    // Helper function to format content based on element type using templates
    const formatContent = (
      element: HeaderFooterSubmenu_t | typeof kHeaderFooter.none | null,
      position: 'begin' | 'middle' | 'end'
    ): string | null => {
      if (!element || element === kHeaderFooter.none) return null;

      // Validate element is a valid key in kHeaderFooterSubmenuById
      if (!(element in kHeaderFooterSubmenuById)) {
        this.dx.error(`Invalid header/footer element: ${element}`);
        return null;
      }

      const template = kHeaderFooterSubmenuById[element].template;
      const templateDict: Record<string, string> = {
        title: docTitle,
        '#': String(pageNumber),
        pageTotal: String(pageTotal),
      };

      // Replace template variables
      const formatted = this.fn.utils.templateDictReplace(template, templateDict);

      // Return null if pageTotal is needed but is 0
      if ((element === 'total' || element === 'pageTotal') && pageTotal === 0) {
        return null;
      }

      return formatted;
    };

    // Build header elements by position
    const headerElements: Record<HeaderFooterRenderablePos, string[]> = {
      begin: [],
      middle: [],
      end: [],
    };

    // Read header/footer values from persist (single source of truth)
    const getHeaderFooterValue = (
      menuId: MenuId_t
    ): HeaderFooterSubmenu_t | typeof kHeaderFooter.none => {
      const value = this.fn.uimenumgr.getMenuItemIdSelected(menuId);
      return (value as HeaderFooterSubmenu_t | typeof kHeaderFooter.none) || kHeaderFooter.none;
    };
    // Process header positions
    const headerBeginContent = formatContent(getHeaderFooterValue('header_begin'), 'begin');
    if (headerBeginContent) headerElements.begin.push(headerBeginContent);

    const headerMiddleContent = formatContent(getHeaderFooterValue('header_middle'), 'middle');
    if (headerMiddleContent) headerElements.middle.push(headerMiddleContent);

    const headerEndContent = formatContent(getHeaderFooterValue('header_end'), 'end');
    if (headerEndContent) headerElements.end.push(headerEndContent);

    // Build footer elements by position
    const footerElements: Record<HeaderFooterRenderablePos, string[]> = {
      begin: [],
      middle: [],
      end: [],
    };

    // Process footer positions
    const footerBeginContent = formatContent(getHeaderFooterValue('footer_begin'), 'begin');
    if (footerBeginContent) footerElements.begin.push(footerBeginContent);

    const footerMiddleContent = formatContent(getHeaderFooterValue('footer_middle'), 'middle');
    if (footerMiddleContent) footerElements.middle.push(footerMiddleContent);

    const footerEndContent = formatContent(getHeaderFooterValue('footer_end'), 'end');
    if (footerEndContent) footerElements.end.push(footerEndContent);

    // Render header
    const headerY = margins.topMarginPts - 5;
    this.renderHeaderFooterElements(headerElements, headerY, widthPts, margins);

    // Render footer
    const footerY = heightPts - margins.bottomMarginPts + 5;
    this.renderHeaderFooterElements(footerElements, footerY, widthPts, margins);

    // Restore original font size
    pdfDoc.setFontSize(this.fn.coords.cssPxToPdfPts(originalFontSizePx));
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
    if (!this.docInfo().pdfDoc) {
      return;
    }

    // Combine elements at each position with " | " separator
    const beginText = elements.begin.join(' | ');
    const middleText = elements.middle.join(' | ');
    const endText = elements.end.join(' | ');

    const pdfDoc = this.docInfo().pdfDoc!;
    
    // Render begin (left) position
    if (beginText) {
      pdfDoc.text(beginText, margins.leftMarginPts, y);
    }

    // Render middle position
    if (middleText) {
      const middleWidth = pdfDoc.getTextWidth(middleText);
      const middleX = (widthPts - middleWidth) / 2;
      pdfDoc.text(middleText, middleX, y);
    }

    // Render end (right) position
    if (endText) {
      const endWidth = pdfDoc.getTextWidth(endText);
      const endX = widthPts - margins.rightMarginPts - endWidth;
      pdfDoc.text(endText, endX, y);
    }
  }

  /**
   * Add header/footer to all pages after PDF generation is complete
   * Called after page total is known, so we can render totals correctly
   */
  private renderPageTotals(): void {
    const dx = this.dx.sub({ name: 'renderPageTotals' });

    try {
      if (!this.docInfo().pdfDoc) {
        return;
      }

      const totalPages = this.docInfo().pageTotal;

      // Re-render headers and footers on all pages now that we know the total
      const pdfDoc = this.docInfo().pdfDoc!;
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        pdfDoc.setPage(pageNum);
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
  public finishPdf(): void {
    const dx = this.dx.sub({ name: 'finishPdf' });

    try {
      if (!this.docInfo().pdfDoc) {
        dx.error('No PDF document to finish');
        throw new Error('No PDF document to finish');
      }

      // Add page totals to all pages now that we know the total
      this.renderPageTotals();

      dx.out(
        `PDF FINALIZED: ${this.docInfo().pageTotal} pages with ${this.docInfo().fontSizePx}px font`
      );
    } catch (error) {
      dx.out(`Error finishing PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }
}

// end, PDF.ts
