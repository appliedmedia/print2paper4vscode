import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';
import type { ThemedToken } from 'shiki';

export class PDF {
  private app: App;
  private tempPdfs: string[] = [];
  private dx: Diagnostics;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('PDF');
  }

  init(): void {
    this.tempPdfs = [];
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

  async printWithPreview(pdfDoc: jsPDF, descriptiveName?: string): Promise<void> {
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
      const pdfBuffer = pdfDoc.output('arraybuffer') as ArrayBuffer;
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

  async printDirectly(pdfDoc: jsPDF, descriptiveName?: string): Promise<void> {
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
      const pdfBuffer = pdfDoc.output('arraybuffer') as ArrayBuffer;
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

  async saveAsPDF(pdfDoc: jsPDF, descriptiveName?: string): Promise<void> {
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
      const pdfBuffer = pdfDoc.output('arraybuffer') as ArrayBuffer;
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
   * Normalize color for jsPDF compatibility
   * Removes alpha channel and ensures proper hex format
   */
  private normalizeColorForJsPDF(color: string): string {
    // Remove alpha channel if present (e.g., #FFFFFF5C -> #FFFFFF)
    if (color.length === 9 && color.startsWith('#')) {
      return color.substring(0, 7);
    }

    // Ensure it's a valid hex color
    if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
      return color;
    }

    // Default to black if invalid
    return '#000000';
  }

  // NEW: Generate PDF directly from Shiki tokens
  async generatePdfFromTokens(
    tokens: ThemedToken[][],
    fontFamily: string,
    fontSize: number,
    lineHeight: number,
    title?: string
  ): Promise<jsPDF> {
    const dx = this.dx.sub('generatePdfFromTokens');
    dx.require({ tokens, fontFamily, fontSize, lineHeight }, [
      'tokens',
      'fontFamily',
      'fontSize',
      'lineHeight',
    ]);

    try {
      // Get page size and orientation from PaperPrinter (handles saved preferences + locale fallback)
      const pageSize = this.app.paperprinter.getCurrentPageSize();
      const orientation = this.app.paperprinter.getCurrentOrientation();

      dx.out(
        `Using page size: ${pageSize}, orientation: ${orientation} (from PaperPrinter preferences)`
      );

      // Calculate required height based on content
      const lineSpacing = fontSize * 0.4; // Tight line spacing
      const titleHeight = title ? 40 : 20; // Space for title + margin
      const bottomMargin = 20;
      const contentHeight = tokens.length * lineSpacing;
      const totalHeight = titleHeight + contentHeight + bottomMargin;

      // Ensure height doesn't exceed jsPDF limit (14400 user units)
      // Convert to appropriate unit based on page size
      const unit = this.getUnitForPageSize(pageSize);
      const maxHeight = unit === 'in' ? 200 : 14400; // 200 inches or 14400mm
      const pageHeight = Math.min(totalHeight, maxHeight);

      dx.out(
        `Calculated page height: ${pageHeight}${unit} (${tokens.length} lines × ${lineSpacing}${unit} spacing)`
      );

      if (totalHeight > maxHeight) {
        dx.out(
          `WARNING: Content height ${totalHeight}${unit} exceeds jsPDF limit ${maxHeight}${unit}, truncating`
        );
      }

      // Get page dimensions based on size and orientation
      const pageDimensions = this.getPageDimensions(pageSize, orientation);

      // Initialize PDF with user's page size, orientation, and calculated height
      const doc = new jsPDF({
        orientation,
        unit,
        format: [pageDimensions.width, pageHeight], // Width from format, height calculated
      });

      // Map font family to jsPDF supported fonts
      const jsPdfFont = this.mapFontFamilyToJsPDF(fontFamily, doc);
      dx.out(`Mapped font '${fontFamily}' to jsPDF font '${jsPdfFont}'`);

      // Set font
      doc.setFont(jsPdfFont, 'normal');
      doc.setFontSize(fontSize);
      dx.out(`Using font: ${jsPdfFont}, size: ${fontSize}, line spacing: ${fontSize * 0.4}`);

      // Add title if provided
      if (title) {
        doc.setFontSize(fontSize + 2);
        doc.text(title, 20, 20);
        doc.setFontSize(fontSize);
      }

      let y = title ? 40 : 20;
      const margin = 20;

      // Calculate how many lines can fit on the page
      const availableHeight = pageHeight - y - bottomMargin;
      const maxLines = Math.floor(availableHeight / lineSpacing);
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

          // Get token color and normalize it for jsPDF
          const color = token.color || '#000000';
          const normalizedColor = this.normalizeColorForJsPDF(color);

          // Set color and draw text
          doc.setTextColor(normalizedColor);
          doc.text(text, x, y);

          // Advance x position
          x += doc.getTextWidth(text);
        }

        y += lineSpacing;
      }

      // Add truncation notice if content was cut off
      if (tokens.length > maxLines) {
        const remainingLines = tokens.length - maxLines;
        doc.setTextColor('#666666');
        doc.setFontSize(fontSize - 2);
        doc.text(`... (${remainingLines} more lines truncated)`, margin, y + 10);
        dx.out(`Content truncated: ${remainingLines} lines not rendered`);
      }

      // Return PDF document pointer (in-memory)
      dx.out(`PDF document created in memory with continuous scrolling`);

      return doc;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Convert PDF document to HTML with scrollable PDF view
  embedPDFinHTML(pdfDoc: jsPDF, title: string): string {
    const dx = this.dx.sub('embedPDFinHTML');
    dx.require({ pdfDoc, title }, ['pdfDoc', 'title']);

    try {
      // Generate a data URL from the PDF document
      const pdfDataUrl = pdfDoc.output('datauristring') as string;
      dx.out(`PDF data URL generated: ${pdfDataUrl.substring(0, 50)}...`);

      // Load YAML templates and PDF.js library
      const pdfTemplates = this.app.os.fileRead<{
        pdf_html: string;
        pdf_css: string;
        pdf_js: string;
      }>('src/PDF.yaml');

      const uiTemplates = this.app.os.fileRead<{
        base_css: string;
      }>('src/UI.yaml');

      const pdfJsContent = this.app.os.fileRead('src/lib/pdf.min.js');

      dx.out(
        `PDF.js library loaded: ${pdfJsContent ? `${pdfJsContent.length} characters` : 'failed'}`
      );

      if (!pdfTemplates || !uiTemplates || !pdfJsContent) {
        throw new Error('Failed to load required templates or PDF.js library');
      }

      // Generate HTML using template with embedded resources
      const html = this.app.templateDictReplace(pdfTemplates.pdf_html, {
        TITLE: title,
        PDF_DATA_URL: pdfDataUrl,
        PDF_CSS: this.app.templateDictReplace(pdfTemplates.pdf_css, {
          BASE_CSS: uiTemplates.base_css,
        }),
        PDFJS_LIBRARY: pdfJsContent,
        PDF_JS: pdfTemplates.pdf_js,
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
  private getUnitForPageSize(pageSize: 'a4' | 'letter' | 'legal' | 'a3' | 'a5'): 'mm' | 'in' {
    // US sizes use inches, metric sizes use mm
    const usSizes = ['letter', 'legal'];
    return usSizes.includes(pageSize) ? 'in' : 'mm';
  }

  // Helper: Get page dimensions based on size and orientation
  private getPageDimensions(
    pageSize: 'a4' | 'letter' | 'legal' | 'a3' | 'a5',
    orientation: 'portrait' | 'landscape'
  ): { width: number; height: number } {
    // Standard page dimensions - US sizes in inches, metric in mm
    const dimensions = {
      a4: { width: 210, height: 297 }, // mm
      letter: { width: 8.5, height: 11 }, // inches
      legal: { width: 8.5, height: 14 }, // inches
      a3: { width: 297, height: 420 }, // mm
      a5: { width: 148, height: 210 }, // mm
    };

    const baseDimensions = dimensions[pageSize];

    // Swap width/height for landscape
    if (orientation === 'landscape') {
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
}
