import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';

/**
 * PDF Data for UIPDFScrollView
 *
 * Contains the PDF ArrayBuffer and metadata needed for rendering in PDF.js
 */
export interface PDFData_t {
  /** PDF document as ArrayBuffer */
  arrayBuffer: ArrayBuffer;
  /** Total number of pages in the PDF */
  pageTotal: number;
  /** Page dimensions in pixels */
  pageSizePx: {
    widthPx: number;
    heightPx: number;
  };
  /** Title for the document */
  title: string;
}

/**
 * UIPDFScrollView - PDF document viewer using PDF.js for rendering
 *
 * Displays PDFs These in the webview using PDF.js library for client-side rendering.
 * Unlike UIScrollView which renders individual pages, this class delivers the complete
 * PDF ArrayBuffer to PDF.js and lets it handle page rendering internally.
 *
 * Key architectural principle: One PDF is generated from tokenization and reused for
 * webview display, printing, and saving. There's no separation between "PDF for webview"
 * and "PDF for printing".
 *
 * @input app - Application instance
 * @input pdfData - PDF document data (ArrayBuffer, page count, dimensions)
 * @output HTML/CSS/JS for PDF.js webview, PDF rendering, zoom, navigation
 *
 * @example
 * const pdfViewer = new UIPDFScrollView(app, {
 *   arrayBuffer: pdfArrayBuffer,
 *   pageTotal: 5,
 *   pageSizePx: { widthPx: 794, heightPx: 1123 },
 *   title: 'My Document'
 * });
 * const html = await pdfViewer.generateContent();
 */
export class UIPDFScrollView {
  private static readonly kYaml = {
    pdfscroll_html: '',
    pdfscroll_css: '',
    pdfscroll_js: '',
  } as const;

  private app: App;
  private pdfData: PDFData_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof UIPDFScrollView.kYaml>;

  constructor(app: App, pdfData: PDFData_t) {
    this.app = app;
    this.pdfData = pdfData;
    this.dx = app.dx.create('UIPDFScrollView');
    this._yaml = new Yaml(app, 'src/UIPDFScrollView.yaml', UIPDFScrollView.kYaml);

    // Validate PDF data - display error if invalid instead of falling back
    // Because this is a highly constrained VSCode Plug-in, if any core variable
    // or piece doesn't have a reasonable representation of the data it embodies,
    // we choose to display an error to the user over trying to coerce or fallback.
    // This makes debugging much easier.
    if (!pdfData.arrayBuffer) {
      throw new Error('UIPDFScrollView: pdfData.arrayBuffer is required');
    }
    if (!pdfData.pageTotal || pdfData.pageTotal < 1) {
      throw new Error(`UIPDFScrollView: pdfData.pageTotal must be at least 1, got ${pdfData.pageTotal}`);
    }
    if (!pdfData.pageSizePx?.widthPx || !pdfData.pageSizePx?.heightPx) {
      throw new Error(
        `UIPDFScrollView: pdfData.pageSizePx.widthPx and .heightPx are required, got ${JSON.stringify(pdfData.pageSizePx)}`
      );
    }
  }

  get yaml() {
    return this._yaml.get();
  }

  /**
   * Generate HTML content for the PDF viewer
   *
   * Returns complete HTML that includes:
   * 1. PDF.js library embedded in <script> tag
   * 2. PDF data embedded as base64 data URL in the page
   * 3. JavaScript initialization code that tells PDF.js to render the PDF
   *
   * **Why base64 data URL?** VS Code's postMessage API cannot pass ArrayBuffer
   * or binary data between extension and webview. The PDF ArrayBuffer must be
   * converted to a base64 data URL and embedded in the HTML string. This is a
   * one-time conversion - the PDF is still generated once from tokenization and
   * this same ArrayBuffer is used for printing and saving.
   *
   * This HTML is what gets displayed in the VS Code webview. The webview receives
   * a complete self-contained HTML document that has everything it needs to render
   * the PDF client-side without additional requests to the extension host.
   */
  async generateContent(): Promise<string> {
    const dx = this.dx.sub('generateContent');
    
    try {
      // Convert ArrayBuffer to base64 data URL for embedding in HTML
      // This allows the PDF data to be embedded directly in the HTML string
      const base64 = Buffer.from(this.pdfData.arrayBuffer).toString('base64');
      const pdfDataUrl = `data:application/pdf;base64,${base64}`;

      // Get PDF scroll view templates from yaml
      const templates = this.yaml;

      // Get base CSS from UI yaml
      const baseCss = this.app.ui.yaml.base_css;

      // Add base_css to templates
      const templatesWithBaseCss = { ...templates, base_css: baseCss };

      // Generate HTML with PDF viewer
      const html = await this.generatePDFViewerHTML(templatesWithBaseCss, pdfDataUrl);

      dx.out(`Generated PDF viewer content for "${this.pdfData.title}" with ${this.pdfData.pageTotal} pages`);
      return html;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate PDF viewer content: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for PDF viewer
   */
  private async generatePDFViewerHTML(
    templates: { pdfscroll_html: string; pdfscroll_css: string; pdfscroll_js: string; base_css: string },
    pdfDataUrl: string
  ): Promise<string> {
    const dx = this.dx.sub('generatePDFViewerHTML');

    try {
      // Load PDF.js library
      const pdfJsContent = this.app.os.fileRead('src/lib/pdf.min.js');
      dx.out(`PDF.js library loaded: ${pdfJsContent ? `${pdfJsContent.length} characters` : 'failed'}`);

      if (!pdfJsContent) {
        throw new Error('Failed to load PDF.js library');
      }

      // Create template dictionary
      const templateDict = {
        title: this.pdfData.title,
        pageTotal: this.pdfData.pageTotal.toString(),
        pageWidthPx: this.pdfData.pageSizePx.widthPx.toString(),
        pageHeightPx: this.pdfData.pageSizePx.heightPx.toString(),
        pdfDataUrl: pdfDataUrl,
        pdfjsLibrary: pdfJsContent,
        toolbar: await this.generateToolbarHTML(),
      };

      // Replace placeholders in templates
      const css = this.app.templateDictReplace(templates.pdfscroll_css, templateDict);
      const js = this.app.templateDictReplace(templates.pdfscroll_js, templateDict);

      // Generate HTML
      return this.app.templateDictReplace(templates.pdfscroll_html, {
        baseCss: templates.base_css,
        pdfscrollCss: css,
        pdfscrollJs: js,
        ...templateDict,
      });
    } finally {
      dx.done();
    }
  }

  /**
   * Generate toolbar HTML
   */
  private async generateToolbarHTML(): Promise<string> {
    const dx = this.dx.sub('generateToolbarHTML');

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.app.uimenumgr.getAllUIMenuHTML();

      // Get toolbar templates from UI yaml
      const templates = this.app.ui.yaml;

      // Load UIMenu CSS and JS
      const uiMenuCss = this.app.uimenumgr.getAllUIMenuCSS();
      const uiMenuJs = this.app.uimenumgr.getAllUIMenuJS();

      // Generate full toolbar HTML with CSS and JS
      return this.app.templateDictReplace(templates.toolbar_html, {
        toolbarCss: templates.toolbar_css + '\n' + uiMenuCss,
        baseCss: templates.base_css,
        menuHtml,
        toolbarJs: templates.toolbar_js + '\n' + uiMenuJs,
        additionalJs: '', // No additional JS needed for PDF viewer
      });
    } finally {
      dx.done();
    }
  }
}

// end, UIPDFScrollView.ts

