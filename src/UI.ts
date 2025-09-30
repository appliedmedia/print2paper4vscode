import type { App } from './App';
import type { WebviewMessage, MessageHandler } from './types/UI_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import type { PageRender, PageData, RenderOptions, PageMetadata } from './types/PageRender_t';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;
  public currentPanelId: WebviewPanelId | null = null; // Store the current panel ID for updates

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UI');
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  // Register a message handler for a specific message type
  registerMessageHandler(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  // Unregister a message handler
  unregisterMessageHandler(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Central message handling - routes messages to registered handlers
  async handleWebviewMessage(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handleWebviewMessage');
    dx.require({ msg }, ['msg']);
    dx.out(
      `Received message: type=${msg.type}, targetId=${msg.targetId}, parentId=${msg.parentId}`
    );

    if (!msg || !msg.type) {
      dx.out('Invalid message: missing type');
      dx.done();
      return;
    }

    const handlers = this.messageHandlers.get(msg.type);
    if (handlers) {
      dx.out(`Found ${handlers.length} handlers for type ${msg.type}`);
      for (const handler of handlers) {
        try {
          await handler(msg);
        } catch (error) {
          dx.out(`Error in message handler for ${msg.type}: ${error}`);
        }
      }
    } else {
      dx.out(`No handlers found for type ${msg.type}`);
    }
    dx.done();
  }

  // Create a webview panel with webview URI conversion
  async htmlToPanel(title: string, html: string): Promise<WebviewPanelId> {
    this.currentPanelId = await this.app.vscodeapis.getOrCreateWebviewPanel(
      title,
      html,
      this.currentPanelId || undefined
    );
    return this.currentPanelId;
  }

  // Choose save location for files
  async chooseSaveLocation(defaultFilename: string): Promise<string | null> {
    const dx = this.dx.sub('chooseSaveLocation');
    dx.require({ defaultFilename }, ['defaultFilename']);

    try {
      // Create default URI in home directory
      const homeDir = this.app.os.getDir_Home();
      const defaultPath = this.app.os.pathJoin(homeDir, defaultFilename);
      const defaultUri = this.app.vscodeapis.uriFromPath(defaultPath);

      // Show save dialog
      const fileUri = await this.app.vscodeapis.showSaveDialog({
        defaultUri: defaultUri,
        filters: {
          'PDF Files': ['pdf'],
        },
        title: 'Save PDF As...',
      });

      if (!fileUri) {
        dx.out('Save cancelled by user');
        return null;
      }

      const targetPath = this.app.vscodeapis.uriToPath(fileUri);
      dx.out(`User chose save location: ${targetPath}`);
      return targetPath;
    } catch (error) {
      dx.out(`Error choosing save location: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    this.dx.out('UI.addToolbar: Adding toolbar to HTML');

    // Read the toolbar template
    const toolbarYaml = this.app.os.fileRead<{
      toolbar_css: string;
      toolbar_js: string;
      toolbar_html: string;
    }>('src/UI.yaml');
    if (!toolbarYaml) throw new Error('Failed to load toolbar template');

    // Get menu components from UIMenuMgr
    const menuComponents = await this.app.uimenumgr.getMenuComponents();

    // Get saved toolbar position
    const toolbarPos = String(this.app.vscodeapis.getGlobalState<number>('toolbarPos') ?? 0);

    // Build toolbar with generic placeholders
    const toolbar = this.app.templateDictReplace(toolbarYaml.toolbar_html, {
      CSS: menuComponents.css,
      HTML: menuComponents.html,
      JS: menuComponents.js,
      TOOLBAR_CSS: toolbarYaml.toolbar_css,
      TOOLBAR_JS: toolbarYaml.toolbar_js,
      TOOLBAR_POS: toolbarPos,
    });

    // Replace toolbar placeholder in HTML using templateDictReplace
    return this.app.templateDictReplace(html, {
      TOOLBAR: toolbar,
    });
  }

  // Add toolbar to HTML content with webview URI conversion
  async addToolbarWithURIs(html: string, webviewPanelId: WebviewPanelId): Promise<string> {
    // First convert file paths to webview URIs
    const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, webviewPanelId);

    // Then add toolbar
    return await this.addToolbar(htmlWithURIs);
  }

  showInformationMessage(message: string): void {
    this.app.vscodeapis.showInformationMessage(message);
  }

  showWarningMessage(message: string): void {
    this.app.vscodeapis.showWarningMessage(message);
  }

  showErrorMessage(message: string): void {
    this.app.vscodeapis.showErrorMessage(message);
  }

  setStatusBarMessage(text: string, timeoutMs?: number): unknown {
    return this.app.vscodeapis.setStatusBarMessage(text, timeoutMs);
  }

  // Update the current webview panel with new HTML content
  async updateWebviewPanel(html: string): Promise<void> {
    if (!this.currentPanelId) return;
    const htmlWithToolbar = await this.addToolbarWithURIs(html, this.currentPanelId);
    this.app.vscodeapis.updatePanelHtml(this.currentPanelId, htmlWithToolbar);
  }

  async updateWebviewPdf(pdfDoc: jsPDF): Promise<void> {
    const dx = this.dx.sub('updateWebviewPdf');
    dx.out(`currentPanelId = ${this.currentPanelId}`);

    if (this.currentPanelId && pdfDoc) {
      // Generate PDF data URL directly from the jsPDF document
      const pdfDataUrl = pdfDoc.output('datauristring') as string;
      dx.out(`sending message with pdfDataUrl = ${pdfDataUrl.substring(0, 50)}...`);

      // Send message to webview to update PDF content only
      this.app.vscodeapis.postMessageToPanel(this.currentPanelId, {
        type: 'updatePdf',
        pdfDataUrl: pdfDataUrl,
      });
    } else {
      dx.out('no currentPanelId or pdfDoc');
    }
    dx.done();
  }

  out(message: string): void {
    console.log(message);
  }

  static out(message: string): void {
    console.log(message);
  }

  // ============================================================================
  // Scroll View Implementation
  // ============================================================================

  public scrollView: UIScrollView | null = null;

  /**
   * Create a scroll view with PageRender implementation
   */
  async createScrollView(pageRender: PageRender, options: ScrollOptions): Promise<WebviewPanelId> {
    const dx = this.dx.sub('createScrollView');
    dx.require({ pageRender, options }, ['pageRender', 'options']);

    try {
      // Create scroll view instance
      this.scrollView = new UIScrollView(this.app, pageRender, options);
      
      // Get page metadata
      const metadata = await pageRender.getPageMetadata();
      
      // Load scroll view templates
      const templates = this.loadScrollViewTemplates();
      
      // Generate HTML with scroll view
      const html = this.generateScrollViewHTML(templates, metadata, options);
      
      // Create webview panel
      const panelId = this.app.vscodeapis.createWebviewPanel(
        'Scroll View Document Viewer',
        html
      );
      
      // Set up message handling for scroll view
      this.setupScrollViewMessageHandling(panelId);
      
      // Store current panel ID
      this.currentPanelId = panelId;
      
      dx.out(`Created scroll view with ${metadata.totalPages} pages`);
      return panelId;

    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create scroll view: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update PageRender service for existing scroll view
   */
  async updatePageRender(newPageRender: PageRender): Promise<void> {
    const dx = this.dx.sub('updatePageRender');
    
    try {
      if (this.scrollView) {
        await this.scrollView.updatePageRender(newPageRender);
        dx.out('Updated PageRender service');
      } else {
        dx.out('No scroll view to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update PageRender: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update scroll view with new render options (theme, font, etc.)
   */
  async updateScrollView(options: Partial<ScrollOptions>): Promise<void> {
    const dx = this.dx.sub('updateScrollView');
    
    try {
      if (this.scrollView) {
        await this.scrollView.updateOptions(options);
        dx.out('Updated scroll view options');
      } else {
        dx.out('No scroll view to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update scroll view: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Destroy scrollable viewer and cleanup resources
   */
  destroyScrollView(): void {
    const dx = this.dx.sub('destroyScrollView');
    
    try {
      if (this.scrollView) {
        this.scrollView.destroy();
        this.scrollView = null;
        dx.out('Scroll view destroyed');
      }
    } catch (error) {
      dx.out(`Error destroying scroll view: ${String(error)}`);
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
        throw new Error('Failed to load scrollable viewer templates');
      }
      
      dx.out('Scrollable viewer templates loaded');
      return templates;
      
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to load scrollable templates: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for scroll view
   */
  private generateScrollViewHTML(
    templates: { scroll_html: string; scroll_css: string; scroll_js: string },
    metadata: PageMetadata,
    options: ScrollOptions
  ): string {
    const dx = this.dx.sub('generateScrollViewHTML');
    
    try {
      // Get configuration values
      const maxCanvases = this.app.vscodeapis.getMaxCanvasPoolSize();
      const scrollDebounceMs = this.app.vscodeapis.getScrollDebounceMs();
      const performanceMode = this.app.vscodeapis.getScrollPerformanceMode();
      
      // Generate HTML with template replacements
      const html = this.app.templateDictReplace(templates.scroll_html, {
        TITLE: options.title || 'Scrollable Document',
        BASE_CSS: this.getBaseCSS(),
        SCROLL_CSS: templates.scroll_css,
        SCROLL_JS: templates.scroll_js,
        TOTAL_PAGES: metadata.totalPages.toString(),
        MAX_CANVASES: maxCanvases.toString(),
        SCROLL_DEBOUNCE_MS: scrollDebounceMs.toString(),
        PERFORMANCE_MODE: performanceMode,
        TOOLBAR: '{{TOOLBAR}}' // Placeholder for toolbar injection
      });
      
      dx.out(`Generated scrollable HTML for ${metadata.totalPages} pages`);
      return html;
      
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to generate scrollable HTML: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Get base CSS for scrollable viewer
   */
  private getBaseCSS(): string {
    const baseTemplates = this.app.os.fileRead<{
      base_css: string;
    }>('src/UI.yaml');
    
    return baseTemplates?.base_css || '';
  }

  /**
   * Set up message handling for scroll view
   */
  private setupScrollViewMessageHandling(panelId: WebviewPanelId): void {
    const dx = this.dx.sub('setupScrollViewMessageHandling');
    
    try {
      // Register message handlers for scroll view
      this.registerMessageHandler('requestPageRender', async (msg) => {
        await this.handlePageRenderRequest(msg);
      });
      
      this.registerMessageHandler('scrollDiagnostic', async (msg) => {
        await this.handleScrollDiagnostic(msg);
      });
      
      dx.out('Scrollable viewer message handling set up');
      
    } catch (error) {
      dx.out(`Error setting up scrollable viewer message handling: ${String(error)}`);
    } finally {
      dx.done();
    }
  }

  /**
   * Handle page render request from webview
   */
  private async handlePageRenderRequest(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handlePageRenderRequest');
    dx.require({ msg }, ['msg']);
    
    try {
      if (!this.scrollView || !msg.pageNumber) {
        dx.out('No scrollable viewer or page number provided');
        return;
      }
      
      // Request page render from scrollable viewer
      const pageData = await this.scrollView.requestPageRender(msg.pageNumber);
      
      // Send response back to webview
      if (this.currentPanelId) {
        this.app.vscodeapis.postMessageToPanel(this.currentPanelId, {
          type: 'pageRenderResponse',
          pageData: pageData
        });
      }
      
      dx.out(`Page ${msg.pageNumber} rendered successfully`);
      
    } catch (error) {
      dx.out(`Page render failed: ${String(error)}`);
      
      // Send error back to webview
      if (this.currentPanelId && msg.pageNumber) {
        this.app.vscodeapis.postMessageToPanel(this.currentPanelId, {
          type: 'pageRenderError',
          error: {
            message: String(error),
            pageNumber: msg.pageNumber,
            type: 'generation',
            timestamp: new Date()
          },
          pageNumber: msg.pageNumber
        });
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle scroll diagnostic messages from webview
   */
  private async handleScrollDiagnostic(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handleScrollDiagnostic');
    
    try {
      if (msg.data) {
        dx.out(`Scroll diagnostic: ${JSON.stringify(msg.data)}`);
      }
    } catch (error) {
      dx.out(`Error handling scroll diagnostic: ${String(error)}`);
    } finally {
      dx.done();
    }
  }
}

// ============================================================================
// UIScrollView Class
// ============================================================================

interface ScrollOptions {
  title?: string;
  pageSize?: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  orient?: 'portrait' | 'landscape';
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  theme?: string;
}

class UIScrollView {
  private app: App;
  private pageRender: PageRender;
  private options: ScrollOptions;
  private dx: Diagnostics;
  private pageCache: Map<number, PageData> = new Map();
  private renderQueue: Set<number> = new Set();

  constructor(app: App, pageRender: PageRender, options: ScrollOptions) {
    this.app = app;
    this.pageRender = pageRender;
    this.options = options;
    this.dx = app.dx.create('UIScrollView');
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
   * Update scrollable viewer options and bust cache
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
      if (this.app.ui.currentPanelId) {
        this.app.vscodeapis.postMessageToPanel(this.app.ui.currentPanelId, {
          type: 'clearAllPages'
        });
      }
      
      dx.out('Scrollable viewer options updated, cache cleared');
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
      
      // Check if already in render queue
      if (this.renderQueue.has(pageNumber)) {
        dx.out(`Page ${pageNumber} already in render queue`);
        // Wait for render to complete
        return new Promise((resolve, reject) => {
          const checkCache = () => {
            if (this.pageCache.has(pageNumber)) {
              resolve(this.pageCache.get(pageNumber)!);
            } else if (!this.renderQueue.has(pageNumber)) {
              reject(new Error(`Page ${pageNumber} render failed`));
            } else {
              setTimeout(checkCache, 100);
            }
          };
          checkCache();
        });
      }
      
      // Add to render queue
      this.renderQueue.add(pageNumber);
      
      try {
        // Create render options
        const renderOptions: RenderOptions = {
          fontFamily: this.options.fontFamily || 'Courier',
          fontSize: this.options.fontSize || 12,
          lineHeight: this.options.lineHeight || 1.2,
          theme: this.options.theme || 'github-light',
          pageSize: this.options.pageSize || 'a4',
          orient: this.options.orient || 'portrait'
        };
        
        // Render page
        const pageData = await this.pageRender.pageRender(pageNumber, renderOptions);
        
        // Cache the result
        this.pageCache.set(pageNumber, pageData);
        
        dx.out(`Page ${pageNumber} rendered and cached`);
        return pageData;
        
      } finally {
        // Remove from render queue
        this.renderQueue.delete(pageNumber);
      }
      
    } catch (error) {
      dx.out(`Page ${pageNumber} render failed: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Destroy scrollable viewer and cleanup resources
   */
  destroy(): void {
    const dx = this.dx.sub('destroy');
    
    try {
      this.pageCache.clear();
      this.renderQueue.clear();
      dx.out('Scrollable viewer destroyed');
    } finally {
      dx.done();
    }
  }
}
