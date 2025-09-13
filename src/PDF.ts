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
      // Initialize PDF
      const doc = new jsPDF();

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

      // Process each line of tokens
      for (const line of tokens) {
        let x = margin;

        // Process each token in the line
        for (const token of line) {
          const text = token.content;
          if (!text) continue;

          // Get token color
          const color = token.color || '#000000';

          // Set color and draw text
          doc.setTextColor(color);
          doc.text(text, x, y, { lineHeightFactor: 1.0 });

          // Advance x position
          x += doc.getTextWidth(text);
        }

        y += fontSize * 0.4; // Tight line spacing
      }

      // Return PDF document pointer (in-memory)
      dx.out(`PDF document created in memory`);

      return doc;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // NEW: Convert PDF document to HTML
  pdfToHTML(pdfDoc: jsPDF, title: string): string {
    const dx = this.dx.sub('pdfToHTML');
    dx.require({ pdfDoc, title }, ['pdfDoc', 'title']);

    try {
      // Generate a data URL from the PDF document
      const pdfDataUrl = pdfDoc.output('datauristring') as string;
      dx.out(`PDF data URL generated: ${pdfDataUrl.substring(0, 50)}...`);

      // Load YAML templates and PDF.js library
      const pdfTemplates = this.app.os.fileRead<{
        pdf_viewer_html: string;
        pdf_css: string;
        pdf_viewer: string;
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
      const html = this.app.templateDictReplace(pdfTemplates.pdf_viewer_html, {
        TITLE: title,
        PDF_DATA_URL: pdfDataUrl,
        PDF_CSS: this.app.templateDictReplace(pdfTemplates.pdf_css, {
          BASE_CSS: uiTemplates.base_css,
        }),
        PDFJS_LIBRARY: pdfJsContent,
        PDF_VIEWER: pdfTemplates.pdf_viewer,
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
