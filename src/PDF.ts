import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import * as puppeteer from 'puppeteer';

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

  async printWithPreview(renderedHtmlContent: string, descriptiveName?: string): Promise<void> {
    const dx = this.dx.sub('printWithPreview');
    dx.require({ renderedHtmlContent }, ['renderedHtmlContent']);
    
    try {
      const { tempHtmlPath, outputPdfPath } = this.preparePaths(
        renderedHtmlContent,
        descriptiveName
      );
      await this.htmlToPdf(tempHtmlPath, outputPdfPath);
      this.trackTempPdf(outputPdfPath);
      await this.app.os.fileOpenPrintDialog(outputPdfPath);
      dx.out('Opened PDF in Preview app');
    } catch (error) {
      dx.out(`Error in print with preview: ${error}`);
      throw error;
    }
    dx.done();
  }

  async printDirectly(renderedHtmlContent: string, descriptiveName?: string): Promise<void> {
    try {
      const { tempHtmlPath, outputPdfPath } = this.preparePaths(
        renderedHtmlContent,
        descriptiveName
      );
      await this.htmlToPdf(tempHtmlPath, outputPdfPath);
      this.trackTempPdf(outputPdfPath);
      // Minimal AppleScript via Finder print
      await this.app.os.filePrint(outputPdfPath);
      this.dx.out('Sent PDF to printer via Finder');
    } catch (error) {
      this.dx.print(`Error in print directly: ${String(error)}`);
      throw error;
    }
  }

  async saveAsPDF(renderedHtmlContent: string, descriptiveName?: string): Promise<void> {
    try {
      const { tempHtmlPath, outputPdfPath } = this.preparePaths(
        renderedHtmlContent,
        descriptiveName
      );
      await this.htmlToPdf(tempHtmlPath, outputPdfPath);
      this.trackTempPdf(outputPdfPath);
      const downloads = this.app.os.getDownloadsDirectory();
      this.app.os.ensureDir(downloads);
      const targetPath = this.app.os.pathJoin(downloads, this.app.os.pathBasename(outputPdfPath));
      this.app.os.fileCopy(outputPdfPath, targetPath);
      await this.app.os.fileReveal(targetPath);
      this.dx.out(`Saved PDF to ${targetPath}`);
    } catch (error) {
      this.dx.print(`Error in save as PDF: ${String(error)}`);
      throw error;
    }
  }

  private preparePaths(
    html: string,
    descriptiveName: string | undefined
  ): { tempHtmlPath: string; outputPdfPath: string } {
    const tempDir = this.app.vscodeapis.getTempDirectory();
    this.app.os.ensureDir(tempDir);
    const safeName = this.app.os.sanitizeFileName(descriptiveName || 'print_output');
    const stamp = this.app.os.dateAsYYYYMMDDHHMMSS();
    const tempHtmlPath = this.app.os.pathJoin(tempDir, `${stamp}_${safeName}.html`);
    this.app.os.fileWrite(tempHtmlPath, html);
    const outputPdfPath = this.app.os.pathJoin(tempDir, `${stamp}_${safeName}.pdf`);
    return { tempHtmlPath, outputPdfPath };
  }

  private trackTempPdf(p: string): void {
    if (!p) return;
    this.tempPdfs.push(p);
  }

  private async htmlToPdf(inputHtmlPath: string, outputPdfPath: string): Promise<void> {
    const dx = this.dx.sub('htmlToPdf');
    dx.require({ inputHtmlPath, outputPdfPath }, ['inputHtmlPath', 'outputPdfPath']);
    
    let browser;
    try {
      // Get platform-specific Puppeteer configuration
      const launchOptions = this.app.os.getPuppeteerLaunchOptions();
      
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      
      // Load the HTML file
      const htmlContent = this.app.os.fileRead(inputHtmlPath);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with platform-specific options
      const pdfOptions = this.app.os.getPuppeteerPdfOptions();
      pdfOptions.path = outputPdfPath;
      
      await page.pdf(pdfOptions);
      dx.out(`PDF generated successfully: ${outputPdfPath}`);
      
    } catch (error) {
      dx.out(`Error generating PDF: ${error}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    dx.done();
  }
}
