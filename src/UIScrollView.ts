import type { App } from './App';
import type { PageRender, PageData, PageMetadata } from './types/PageRender_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import type { WebviewMessage } from './types/UI_t';
import { UIMenuMgr } from './UIMenuMgr';
import { Diagnostics } from './Diagnostics';

// ScrollOptions interface
interface ScrollOptions {
  title?: string;
  pageSize?: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  orient?: 'portrait' | 'landscape';
  fontFamily?: string;
  fontSizePx?: number; // fontSize in pixels
  lineHeightPx?: number; // lineHeight in pixels
  theme?: string;
}

/**
 * UIScrollView - Handles scroll view document viewing with virtual scrolling
 */
export class UIScrollView {
  private app: App;
  private pageRender: PageRender;
  private options: ScrollOptions;
  private dx: Diagnostics;
  private pageCache: Map<number, PageData> = new Map();
  private renderQueue: Set<number> = new Set();
  private panelId: WebviewPanelId | null = null;
  private menuMgr: UIMenuMgr;
  private _yaml: {
    scroll_html: string;
    scroll_css: string;
    scroll_js: string;
  } | null = null;

  constructor(app: App, pageRender: PageRender, options: ScrollOptions, menuMgr: UIMenuMgr) {
    this.app = app;
    this.pageRender = pageRender;
    this.options = options;
    this.menuMgr = menuMgr;
    this.dx = app.dx.create('UIScrollView');
  }

  get yaml() {
    // If already loaded, return it
    if (this._yaml) {
      return this._yaml;
    }

    // Load and cache the YAML
    const yaml = this.app.os.fileRead<{
      scroll_html: string;
      scroll_css: string;
      scroll_js: string;
    }>('src/UIScrollView.yaml');

    if (!yaml) {
      throw new Error('Failed to load UIScrollView yaml');
    }

    // Cache it
    this._yaml = yaml;
    return this._yaml;
  }

  /**
   * Create the scroll view webview panel
   */
  async create(): Promise<WebviewPanelId> {
    const dx = this.dx.sub('create');

    try {
      // Get page metadata
      const metadata = await this.pageRender.getPageMetadata();

      // Get scroll view templates from yaml getter
      const templates = this.yaml;

      // Get base CSS from UI yaml getter
      const baseCss = this.app.ui.yaml.base_css;

      // Add base_css to templates
      const templatesWithBaseCss = { ...templates, base_css: baseCss };

      // Generate HTML with scroll view
      const html = await this.generateScrollViewHTML(templatesWithBaseCss, metadata, this.options);

      // Create webview panel
      this.panelId = this.app.vscodeapis.createWebviewPanel(
        this.options.title || 'Scrollable Document',
        html
      );

      // Set up message handling for scroll view
      this.setupScrollViewMessageHandling(this.panelId);

      // Store current panel ID in UI
      this.app.ui.currentPanelId = this.panelId;

      dx.out(`Created scroll view with ${metadata.pageTotal} pages`);
      return this.panelId;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create scroll view: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
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

      // Notify webview to clear all rendered pages
      if (this.panelId) {
        this.app.vscodeapis.postMessageToPanel(this.panelId, {
          type: 'clearAllPages',
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
        // Render the page
        const pageData = await this.pageRender.pageRender(pageNumber, {
          fontFamily: this.options.fontFamily || 'Courier New',
          fontSize: this.options.fontSizePx || 12, // fontSize in pixels - will be converted to points in PDF generation
          lineHeight: this.options.lineHeightPx || 18, // lineHeight in pixels - will be converted to points in PDF generation
          theme: this.options.theme || 'github-light',
          pageSize: this.options.pageSize || 'a4',
          orient: this.options.orient || 'portrait',
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
    metadata: PageMetadata,
    options: ScrollOptions
  ): Promise<string> {
    const dx = this.dx.sub('generateScrollViewHTML');

    try {
      // Get configuration values
      const maxCanvases = this.app.vscodeapis.getMaxCanvasPoolSize();
      const scrollDebounceMs = this.app.vscodeapis.getScrollDebounceMs();

      // Create template dictionary
      const templateDict = {
        PAGE_TOTAL: metadata.pageTotal.toString(),
        TOTAL_PAGES: metadata.pageTotal.toString(), // Also provide TOTAL_PAGES for HTML template
        MAX_CANVASES: maxCanvases.toString(),
        SCROLL_DEBOUNCE_MS: scrollDebounceMs.toString(),
        TOOLBAR: await this.generateToolbarHTML(),
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
      const menuHtml = await this.menuMgr.getAllUIMenuHTML();

      // Get toolbar templates from UI yaml getter
      const templates = this.app.ui.yaml;

      // Load UIMenu CSS for proper menu styling
      const uiMenuCss = this.menuMgr.getAllUIMenuCSS();

      // Generate full toolbar HTML with CSS and JS
      return this.app.templateDictReplace(templates.toolbar_html, {
        TOOLBAR_CSS: templates.toolbar_css + '\n' + uiMenuCss, // Include UIMenu CSS
        CSS: templates.base_css, // Use base_css from templates
        HTML: menuHtml, // This matches {{HTML}} in toolbar_html
        TOOLBAR_JS: templates.toolbar_js,
        JS: '', // No additional JS needed for scrollable viewer
      });
    } finally {
      dx.done();
    }
  }

  /**
   * Set up message handling for scroll view
   */
  private setupScrollViewMessageHandling(panelId: WebviewPanelId): void {
    const dx = this.dx.sub('setupScrollViewMessageHandling');

    try {
      // Register message handlers for scroll view
      this.app.ui.registerMessageHandler('requestPageRender', async msg => {
        await this.handlePageRenderRequest(msg);
      });

      this.app.ui.registerMessageHandler('scrollDiagnostic', async msg => {
        await this.handleScrollDiagnostic(msg);
      });

      dx.out('Scroll view message handlers registered');
    } finally {
      dx.done();
    }
  }

  /**
   * Handle page render request from webview
   */
  private async handlePageRenderRequest(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handlePageRenderRequest');

    try {
      const pageNumber = msg.pageNumber;
      if (typeof pageNumber !== 'number') {
        throw new Error('Invalid page number');
      }

      // Request page render
      const pageData = await this.requestPageRender(pageNumber);

      // Send response back to webview
      if (this.panelId) {
        this.app.vscodeapis.postMessageToPanel(this.panelId, {
          type: 'pageRenderResponse',
          pageData: pageData,
        });
      }

      dx.out(`Page ${pageNumber} rendered and sent to webview`);
    } catch (error) {
      dx.out(`Error handling page render request: ${String(error)}`);

      // Send error response
      if (this.panelId) {
        this.app.vscodeapis.postMessageToPanel(this.panelId, {
          type: 'pageRenderError',
          error: {
            message: String(error),
            pageNumber: msg.pageNumber || 0,
            type: 'generation',
            timestamp: new Date(),
          },
        });
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle scroll diagnostic from webview
   */
  private async handleScrollDiagnostic(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handleScrollDiagnostic');

    try {
      dx.out(`Scroll diagnostic: ${JSON.stringify(msg.data)}`);
    } finally {
      dx.done();
    }
  }
}
