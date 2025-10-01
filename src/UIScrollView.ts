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
  fontSize?: number;
  lineHeight?: number;
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

  constructor(app: App, pageRender: PageRender, options: ScrollOptions, menuMgr: UIMenuMgr) {
    this.app = app;
    this.pageRender = pageRender;
    this.options = options;
    this.menuMgr = menuMgr;
    this.dx = app.dx.create('UIScrollView');
  }

  /**
   * Create the scroll view webview panel
   */
  async create(): Promise<WebviewPanelId> {
    const dx = this.dx.sub('create');
    
    try {
      // Get page metadata
      const metadata = await this.pageRender.getPageMetadata();
      
      // Load scroll view templates
      const templates = this.loadScrollViewTemplates();
      
      // Generate HTML with scroll view
      const html = await this.generateScrollViewHTML(templates, metadata, this.options);
      
      // Create webview panel
      this.panelId = this.app.vscodeapis.createWebviewPanel(
        'Scroll View Document Viewer',
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
          type: 'clearAllPages'
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
          fontSize: this.options.fontSize || 12,
          lineHeight: this.options.lineHeight || 1.5,
          theme: this.options.theme || 'github-light',
          pageSize: this.options.pageSize || 'a4',
          orient: this.options.orient || 'portrait'
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
   * Destroy scroll view and cleanup resources
   */
  destroy(): void {
    const dx = this.dx.sub('destroy');
    
    try {
      this.pageCache.clear();
      this.renderQueue.clear();
      this.panelId = null;
      dx.out('Scroll view destroyed');
    } finally {
      dx.done();
    }
  }

  /**
   * Load scroll view templates from UI.yaml
   */
  private loadScrollViewTemplates(): {
    scroll_html: string;
    scroll_css: string;
    scroll_js: string;
  } {
    const dx = this.dx.sub('loadScrollViewTemplates');
    
    try {
      const templates = this.app.os.fileRead<{
        scroll_html: string;
        scroll_css: string;
        scroll_js: string;
      }>('src/UI.yaml');
      
      if (!templates) {
        throw new Error('Failed to load scroll view templates');
      }
      
      return templates;
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for scroll view
   */
  private async generateScrollViewHTML(
    templates: { scroll_html: string; scroll_css: string; scroll_js: string },
    metadata: PageMetadata,
    options: ScrollOptions
  ): Promise<string> {
    const dx = this.dx.sub('generateScrollViewHTML');
    
    try {
      // Get configuration values
      const maxCanvases = this.app.vscodeapis.getMaxCanvasPoolSize();
      const scrollDebounceMs = this.app.vscodeapis.getScrollDebounceMs();
      const performanceMode = this.app.vscodeapis.getScrollPerformanceMode();
      
      // Create template dictionary
      const templateDict = {
        PAGE_TOTAL: metadata.pageTotal.toString(),
        MAX_CANVASES: maxCanvases.toString(),
        SCROLL_DEBOUNCE_MS: scrollDebounceMs.toString(),
        PERFORMANCE_MODE: performanceMode,
        TOOLBAR: await this.generateToolbarHTML()
      };
      
      // Replace placeholders in templates
      const html = this.app.templateDictReplace(templates.scroll_html, templateDict);
      const css = this.app.templateDictReplace(templates.scroll_css, templateDict);
      const js = this.app.templateDictReplace(templates.scroll_js, templateDict);
      
      // Combine into final HTML
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scroll View Document Viewer</title>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
        </html>
      `;
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
      return menuHtml;
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
      this.app.ui.registerMessageHandler('requestPageRender', async (msg) => {
        await this.handlePageRenderRequest(msg);
      });
      
      this.app.ui.registerMessageHandler('scrollDiagnostic', async (msg) => {
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
          pageData: pageData
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
            timestamp: new Date()
          }
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