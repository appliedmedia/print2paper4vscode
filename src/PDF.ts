import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import { jsPDF } from 'jspdf';

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

  // NEW: Generate PDF directly from Shiki tokens
  async generatePdfFromTokens(
    tokens: any[][],
    fontFamily: string,
    fontSize: number,
    lineHeight: number,
    title?: string
  ): Promise<string> {
    const dx = this.dx.sub('generatePdfFromTokens');
    dx.require({ tokens, fontFamily, fontSize, lineHeight }, ['tokens', 'fontFamily', 'fontSize', 'lineHeight']);
    
    try {
      // Initialize PDF
      const doc = new jsPDF();
      
      // Set font
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(fontSize);
      
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
          const rgb = this.hexToRgb(color);
          
          // Set color and draw text
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(text, x, y);
          
          // Advance x position
          x += doc.getTextWidth(text);
        }
        
        y += lineHeight;
      }
      
      // Save PDF to temp directory
      const tempDir = this.app.vscodeapis.getTempDirectory();
      this.app.os.ensureDir(tempDir);
      const timestamp = this.app.os.dateAsYYYYMMDDHHMMSS();
      const pdfPath = this.app.os.pathJoin(tempDir, `${timestamp}_${title || 'code'}.pdf`);
      
      doc.save(pdfPath);
      dx.out(`PDF saved to: ${pdfPath}`);
      
      return pdfPath;
      
    } catch (error) {
      dx.out(`Error in generatePdfFromTokens: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // NEW: Display PDF in VS Code web view with canvas rendering
  displayPdfToVSCodeWebView_deprecated(pdfPath: string, title: string): string {
    const dx = this.dx.sub('displayPdfToVSCodeWebView');
    dx.require({ pdfPath, title }, ['pdfPath', 'title']);
    
    try {
      const webViewHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }
    
    .menu-bar {
      background: #2d2d30;
      color: #cccccc;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #3e3e42;
    }
    
    .menu-item {
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 3px;
      transition: background-color 0.2s;
    }
    
    .menu-item:hover {
      background-color: #3e3e42;
    }
    
    .pdf-container {
      position: relative;
      width: 100%;
      height: calc(100vh - 41px);
      overflow: auto;
      background: white;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
    }
    
    #pdf-canvas {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border: 1px solid #ddd;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #666;
      font-size: 16px;
    }
    
    .error {
      color: #d73a49;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="menu-bar">
    <div class="menu-item" onclick="printPdf()">🖨️ Print</div>
    <div class="menu-item" onclick="downloadPdf()">💾 Save</div>
    <div class="menu-item" onclick="refreshPdf()">🔄 Refresh</div>
    <div style="margin-left: auto; font-size: 14px;">${title}</div>
  </div>
  
  <div class="pdf-container">
    <div id="loading" class="loading">Loading PDF...</div>
    <canvas id="pdf-canvas" style="display: none;"></canvas>
    <div id="error" class="error" style="display: none;"></div>
  </div>

  <script>
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let scale = 1.5;
    let canvas = document.getElementById('pdf-canvas');
    let ctx = canvas.getContext('2d');
    
    function renderPage(num) {
      pageRendering = true;
      pdfDoc.getPage(num).then(function(page) {
        let viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        let renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        let renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });
    }
    
    function queueRenderPage(num) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }
    
    function loadPdf() {
      const loading = document.getElementById('loading');
      const canvas = document.getElementById('pdf-canvas');
      const error = document.getElementById('error');
      
      pdfjsLib.getDocument('${pdfPath}').promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        loading.style.display = 'none';
        canvas.style.display = 'block';
        renderPage(pageNum);
      }).catch(function(err) {
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = 'Error loading PDF: ' + err.message;
      });
    }
    
    function printPdf() {
      if (pdfDoc) {
        window.print();
      }
    }
    
    function downloadPdf() {
      if (pdfDoc) {
        const link = document.createElement('a');
        link.href = '${pdfPath}';
        link.download = '${title}.pdf';
        link.click();
      }
    }
    
    function refreshPdf() {
      loadPdf();
    }
    
    // Load PDF when page loads
    loadPdf();
  </script>
</body>
</html>`;
      
      dx.out(`Web view HTML generated for PDF: ${pdfPath}`);
      return webViewHtml;
      
    } catch (error) {
      dx.out(`Error generating web view: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Helper: Convert hex color to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private async htmlToPdf(inputHtmlPath: string, outputPdfPath: string): Promise<void> {
    const dx = this.dx.sub('htmlToPdf');
    dx.require({ inputHtmlPath, outputPdfPath }, ['inputHtmlPath', 'outputPdfPath']);
    
    try {
      // For now, this method is deprecated in favor of direct PDF generation
      // This will be removed once we fully migrate to jsPDF approach
      dx.out(`DEPRECATED: htmlToPdf method called. Use generatePdfFromTokens instead.`);
      throw new Error('htmlToPdf is deprecated. Use generatePdfFromTokens for direct PDF generation.');
      
    } catch (error) {
      dx.out(`Error generating PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }
}
