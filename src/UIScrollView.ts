import type { App } from './App';
import type { PageRender, PageData } from './types/PageRender_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import type { PageSizeId_t, Orient_t, MarginId_t } from './types/PaperPrinter_t';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';

// ScrollOptions interface - uses centralized types from PaperPrinter_t.ts
export interface ScrollOptions {
  title?: string;
  pageSizeId?: PageSizeId_t;
  orient?: Orient_t;
  fontFamily?: string;
  fontSizePx?: number; // fontSize in pixels
  lineHeightPx?: number; // lineHeight in pixels
  theme?: string;
  marginId?: MarginId_t;
}

/**
 * UIScrollView - Virtual scrolling document viewer with canvas pooling
 *
 * Renders multi-page documents using virtual scrolling and canvas pooling for
 * performance. Manages page cache, render queue, and scroll-synchronized canvas
 * updates. Generates HTML/CSS/JS for webview display from YAML templates.
 *
 * @input app - Application instance
 * @input pageRender - PageRender interface for page-by-page rendering
 * @input options - Display options (theme, font, page size, orientation)
 * @output Virtual scrolling HTML/CSS/JS, page rendering, scroll handling
 *
 * @example
 * const scrollView = new UIScrollView(app, pdfRenderer, {
 *   title: 'Document',
 *   theme: 'github-light',
 *   fontSizePx: 12
 * });
 * const html = await scrollView.getHTML();
 */
export class UIScrollView {
  private static readonly kYaml = {
    scroll_html: '',
    scroll_css: '',
    scroll_js: '',
  } as const;

  private readonly CONFIG = {
    MAX_CANVAS_POOL_SIZE: 7, // Number of canvas elements for virtual scrolling
    SCROLL_DEBOUNCE_MS: 16, // ~60fps, syncs with requestAnimationFrame
  };

  private app: App;
  private pageRender: PageRender;
  private options: ScrollOptions;
  private dx: Diagnostics;
  private pageCache: Map<number, PageData> = new Map();
  private renderQueue: Set<number> = new Set();
  private panelId: WebviewPanelId | null = null;
  private _yaml: Yaml<typeof UIScrollView.kYaml>;

  constructor(app: App, pageRender: PageRender, options: ScrollOptions) {
    this.app = app;
    this.pageRender = pageRender;
    this.options = options;
    this.dx = app.dx.create('UIScrollView');
    this._yaml = new Yaml(app, 'src/UIScrollView.yaml', UIScrollView.kYaml);
  }

  get yaml() {
    return this._yaml.get();
  }

  /**
   * Generate HTML content for the scroll view
   */
  async generateContent(): Promise<string> {
    const dx = this.dx.sub('generateContent');

    try {
      // Get page total and dimensions
      const pageTotal = await this.pageRender.getPageTotal();
      const dimensions = await this.pageRender.getPageSizePx();

      // Get scroll view templates from yaml getter
      const templates = this.yaml;

      // Get base CSS from UI yaml getter
      const baseCss = this.app.ui.yaml.base_css;

      // Add base_css to templates
      const templatesWithBaseCss = { ...templates, base_css: baseCss };

      // Generate HTML with scroll view
      const html = await this.generateScrollViewHTML(templatesWithBaseCss, pageTotal, dimensions);

      dx.out(`Generated scroll view content with ${pageTotal} pages`);
      return html;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate scroll view content: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Set the panel ID after panel creation
   */
  setPanelId(panelId: WebviewPanelId): void {
    this.panelId = panelId;
  }

  /**
   * Update PageRender service
   */
  async updatePageRender(newPageRender: PageRender): Promise<void> {
    const dx = this.dx.sub('updatePageRender');

    try {
      this.pageRender = newPageRender;
      this.pageCache.clear();
      this.renderQueue.clear();
      dx.out('PageRender service updated');
    } finally {
      dx.done();
    }
  }

  /**
   * Update scroll view options and bust cache
   */
  async updateOptions(newOptions: Partial<ScrollOptions>): Promise<void> {
    const dx = this.dx.sub('updateOptions');

    try {
      // Update options
      this.options = { ...this.options, ...newOptions };

      // Bust all cached pages since render options changed
      this.pageCache.clear();
      this.renderQueue.clear();

      // Notify webview to clear all rendered pages and update page total
      if (this.panelId) {
        this.app.vscodeapis.postMessage(this.panelId, {
          type: 'clearAllPages',
        });

        // Trigger a full PDF reload
        this.app.vscodeapis.postMessage(this.panelId, {
          type: 'updatePdf',
          pdfDataUrl: '', // Empty to trigger reload
        });
      }

      dx.out('Scroll view options updated, cache cleared');
    } finally {
      dx.done();
    }
  }

  /**
   * Request page render
   */
  async requestPageRender(pageNumber: number): Promise<PageData> {
    const dx = this.dx.sub('requestPageRender');
    dx.require({ pageNumber }, ['pageNumber']);

    try {
      // Check cache first
      if (this.pageCache.has(pageNumber)) {
        dx.out(`Page ${pageNumber} found in cache`);
        return this.pageCache.get(pageNumber)!;
      }

      // Check if already rendering
      if (this.renderQueue.has(pageNumber)) {
        dx.out(`Page ${pageNumber} already in render queue`);
        // Wait for it to complete
        while (this.renderQueue.has(pageNumber)) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return this.pageCache.get(pageNumber)!;
      }

      // Add to render queue
      this.renderQueue.add(pageNumber);

      try {
        // Render the page content (unified approach doesn't need line ranges)
        const pageData = await this.pageRender.renderContent(pageNumber, 0, 0, {
          fontFamily: this.options.fontFamily || 'Courier New',
          fontSizePx: this.options.fontSizePx || 12, // fontSize in pixels - will be converted to points in PDF generation
          lineHeightPx: this.options.lineHeightPx || 18, // lineHeight in pixels - will be converted to points in PDF generation
          theme: this.options.theme || 'github-light',
          pageSizeId: this.options.pageSizeId || 'a4',
          orient: this.options.orient || 'portrait',
          marginId: this.options.marginId || 'normal',
        });

        // Cache the result
        this.pageCache.set(pageNumber, pageData);
        dx.out(`Page ${pageNumber} rendered and cached`);

        return pageData;
      } finally {
        // Remove from render queue
        this.renderQueue.delete(pageNumber);
      }
    } catch (error) {
      dx.out(`Error rendering page ${pageNumber}: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Cleanup scroll view resources
   */
  done(): void {
    const dx = this.dx.sub('done');

    try {
      this.pageCache.clear();
      this.renderQueue.clear();
      this.panelId = null;
      dx.out('Scroll view cleaned up');
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for scroll view
   */
  private async generateScrollViewHTML(
    templates: { scroll_html: string; scroll_css: string; scroll_js: string; base_css: string },
    pageTotal: number,
    pageSizePx: { widthPx: number; heightPx: number }
    /* options: ScrollOptions */
  ): Promise<string> {
    const dx = this.dx.sub('generateScrollViewHTML');

    try {
      // Load PDF.js library
      // ⚠️ CRITICAL: PDF.js COORDINATE SYSTEM ⚠️
      // PDF.js has TWO coordinate systems:
      // - PDF Content Rendering: Bottom-left origin (standard PDF)
      // - Viewer Interface/Canvas: Top-left origin (web standard)
      // We use the VIEWER INTERFACE system for canvas rendering
      // This matches jsPDF's coordinate system (top-left origin, Y increases downward)
      const pdfJsContent = this.app.os.fileRead('src/lib/pdf.min.js');
      dx.out(
        `PDF.js library loaded: ${pdfJsContent ? `${pdfJsContent.length} characters` : 'failed'}`
      );

      // Create template dictionary
      const templateDict = {
        PAGE_TOTAL: pageTotal.toString(),
        TOTAL_PAGES: pageTotal.toString(), // Also provide TOTAL_PAGES for HTML template
        MAX_CANVASES: this.CONFIG.MAX_CANVAS_POOL_SIZE.toString(),
        SCROLL_DEBOUNCE_MS: this.CONFIG.SCROLL_DEBOUNCE_MS.toString(),
        PAGE_WIDTH_PX: pageSizePx.widthPx.toString(),
        PAGE_HEIGHT_PX: pageSizePx.heightPx.toString(),
        TOOLBAR: await this.generateToolbarHTML(),
        PDFJS_LIBRARY: pdfJsContent || '',
      };

      // Replace placeholders in templates
      const css = this.app.templateDictReplace(templates.scroll_css, templateDict);
      const js = this.app.templateDictReplace(templates.scroll_js, templateDict);

      // Use the scroll_html template instead of hardcoded HTML
      return this.app.templateDictReplace(templates.scroll_html, {
        TITLE: this.options.title || 'Scrollable Document',
        BASE_CSS: templates.base_css,
        SCROLL_CSS: css,
        SCROLL_JS: js,
        ...templateDict, // Include all template variables
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
      // Get menu HTML from the provided UIMenuMgr
      const menuHtml = await this.app.uimenumgr.getAllUIMenuHTML();

      // Get toolbar templates from UI yaml getter
      const templates = this.app.ui.yaml;

      // Load UIMenu CSS and JS for proper menu styling and functionality
      const uiMenuCss = this.app.uimenumgr.getAllUIMenuCSS();
      const uiMenuJs = this.app.uimenumgr.getAllUIMenuJS();

      // Generate full toolbar HTML with CSS and JS
      return this.app.templateDictReplace(templates.toolbar_html, {
        TOOLBAR_CSS: templates.toolbar_css + '\n' + uiMenuCss, // Include UIMenu CSS
        CSS: templates.base_css, // Use base_css from templates
        HTML: menuHtml, // This matches {{HTML}} in toolbar_html
        TOOLBAR_JS: templates.toolbar_js + '\n' + uiMenuJs, // Include UIMenu JS
        JS: '', // No additional JS needed for scrollable viewer
      });
    } finally {
      dx.done();
    }
  }
}

// end, UIScrollView.ts
