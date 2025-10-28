import type { App } from './App';
import type { PageRender } from './types/PageRender_t';
import type { WebviewPanelId_t } from './VSCodeAPIs';
import type { PostMessage } from './types/UI_t';
import { UIScrollView, type ScrollOptions_t } from './UIScrollView';
import { UIMenuMgr } from './UIMenuMgr';
import { isMenuId, isMenuItemId } from './UIMenu';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';

/**
 * PDF Data for webview display
 */
export interface PDFData_t {
  arrayBuffer: ArrayBuffer;
  pageTotal: number;
  pageSizePx: {
    widthPx: number;
    heightPx: number;
  };
  title: string;
}

/**
 * UIWebView - Lightweight webview container that can create and manage different components
 * Acts as a flexible orchestrator for webview-related functionality
 */
export class UIWebView {
  private static readonly kYaml = {
    webview_html: '',
    webview_css: '',
    webview_js: '',
  } as const;

  private app: App;
  private dx: Diagnostics;
  private currentViewer: UIScrollView | null = null;
  private menuMgr: UIMenuMgr | null = null;
  private panelId: WebviewPanelId_t | null = null;
  private initialized: boolean = false;
  private handlersRegistered: boolean = false;
  private _yaml: Yaml<typeof UIWebView.kYaml>;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIWebView');
    this._yaml = new Yaml(app, 'src/UIWebView.yaml', UIWebView.kYaml);
  }

  get yaml() {
    return this._yaml.get();
  }

  init(): void {
    this.registerMessageHandlers();
  }

  /**
   * Create webview panel with menus and scroll view
   */
  async createPanel(pageRender: PageRender, options: ScrollOptions_t): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub('createPanel', true);
    dx.out(`🚀 DEBUG: UIWebView.createPanel starting`);
    dx.require({ pageRender, options }, ['pageRender', 'options']);

    try {
      if (this.initialized) {
        throw new Error('UIWebView already initialized');
      }

      // Set menu manager from app
      this.menuMgr = this.app.uimenumgr;

      // Create scroll view
      this.currentViewer = new UIScrollView(this.app, pageRender, options);

      // Generate HTML content from scroll view
      dx.out(`🚀 DEBUG: About to call generateContent`);
      const html = await this.currentViewer.generateContent();
      dx.out(`🚀 DEBUG: generateContent completed, HTML length: ${html.length}`);

      // Create or reuse webview panel
      const panelId = await this.app.vscodeapis.getOrCreateWebviewPanel(
        options.title || 'Document Viewer',
        html,
        this.panelId || undefined
      );
      this.panelId = panelId;

      // Set panel ID in scroll view
      this.currentViewer.setPanelId(panelId);

      // Note: Pre-rendering disabled - let scroll handler render pages on demand
      // This avoids coordinate transform issues and ensures fresh data

      this.initialized = true;
      dx.out(`Created webview panel: ${options.title || 'Document Viewer'}`);
      return panelId;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create webview panel: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Create and configure menu manager (for external use)
   */
  createMenus(): UIMenuMgr {
    const dx = this.dx.sub('createMenus');

    try {
      this.menuMgr = new UIMenuMgr(this.app);
      dx.out('Created menu manager');
      return this.menuMgr;
    } finally {
      dx.done();
    }
  }

  /**
   * Create scroll view with PageRender content (for external use)
   */
  async createScrollView(
    pageRender: PageRender,
    options: ScrollOptions_t
  ): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub('createScrollView');
    dx.require({ pageRender, options }, ['pageRender', 'options']);

    try {
      if (!this.menuMgr) {
        throw new Error('Menu manager not created. Call createMenus() first.');
      }

      this.currentViewer = new UIScrollView(this.app, pageRender, options);

      // Generate HTML content from scroll view
      const html = await this.currentViewer.generateContent();

      // Create or reuse webview panel
      const panelId = await this.app.vscodeapis.getOrCreateWebviewPanel(
        options.title || 'Document Viewer',
        html,
        this.panelId || undefined
      );
      this.panelId = panelId;

      // Set panel ID in scroll view
      this.currentViewer.setPanelId(panelId);

      dx.out(`Created scroll view: ${options.title || 'Document Viewer'}`);
      return panelId;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create scroll view: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update scroll view content with new PageRender
   */
  async updatePageRender(newPageRender: PageRender): Promise<void> {
    const dx = this.dx.sub('updatePageRender');

    try {
      if (this.currentViewer) {
        await this.currentViewer.updatePageRender(newPageRender);
        dx.out('Updated PageRender in scroll view');
      } else {
        dx.out('No active scroll view to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update PageRender: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update scroll view options (theme, font, page size, etc.)
   */
  async updateOptions(options: ScrollOptions_t): Promise<void> {
    const dx = this.dx.sub('updateOptions');

    try {
      if (this.currentViewer) {
        await this.currentViewer.updateOptions(options);
        dx.out('Updated scroll view options');
      } else {
        dx.out('No active scroll view to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update scroll view options: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Get the menu manager
   */
  getMenus(): UIMenuMgr | null {
    return this.menuMgr;
  }

  /**
   * Create webview panel with PDF (new simplified architecture)
   *
   * Takes PDF ArrayBuffer and generates HTML for PDF.js rendering.
   * The PDF is embedded as base64 data URL due to VS Code postMessage limitations.
   */
  async createPDFPanel(pdfData: PDFData_t): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub('createPDFPanel');
    dx.require({ pdfData }, ['pdfData']);

    try {
      // Validate PDF data - display error if invalid instead of falling back
      if (!pdfData.arrayBuffer) {
        throw new Error('pdfData.arrayBuffer is required');
      }
      if (!pdfData.pageTotal || pdfData.pageTotal < 1) {
        throw new Error(`pdfData.pageTotal must be at least 1, got ${pdfData.pageTotal}`);
      }
      if (!pdfData.pageSizePx?.widthPx || !pdfData.pageSizePx?.heightPx) {
        throw new Error(`pdfData.pageSizePx.widthPx and .heightPx are required`);
      }

      // Convert ArrayBuffer to base64 data URL (required for VS Code webview)
      const base64 = Buffer.from(pdfData.arrayBuffer).toString('base64');
      const pdf_data_url = `data:application/pdf;base64,${base64}`;

      // Generate HTML for PDF viewer
      const html = await this.generatePDFHTML(pdf_data_url, pdfData);

      // Add toolbar
      const htmlWithToolbar = await this.app.ui.addToolbar(html);

      // Create or reuse webview panel
      const panelId = await this.app.vscodeapis.getOrCreateWebviewPanel(
        pdfData.title,
        htmlWithToolbar,
        this.panelId || undefined
      );
      this.panelId = panelId;

      dx.out(`Created PDF panel: "${pdfData.title}" with ${pdfData.pageTotal} pages`);
      return panelId;
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create PDF panel: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for PDF viewer with embedded PDF
   */
  private async generatePDFHTML(pdf_data_url: string, pdfData: PDFData_t): Promise<string> {
    const dx = this.dx.sub('generatePDFHTML');

    try {
      // Load PDF.js library
      const pdfjs_library = this.app.os.fileRead('src/lib/pdf.min.js');
      if (!pdfjs_library) {
        throw new Error('Failed to load PDF.js library');
      }

      // Get templates
      const base_css = this.app.ui.yaml.base_css;
      const templates = this.yaml;

      // Create template dictionary
      const templateDict = {
        title: pdfData.title,
        page_total: pdfData.pageTotal.toString(),
        page_width_px: pdfData.pageSizePx.widthPx.toString(),
        page_height_px: pdfData.pageSizePx.heightPx.toString(),
        pdf_data_url,
        pdfjs_library,
        toolbar: '{{toolbar}}', // Placeholder for UI.addToolbar()
      };

      // Replace placeholders
      const webview_css = this.app.templateDictReplace(templates.webview_css, templateDict);
      const webview_js = this.app.templateDictReplace(templates.webview_js, templateDict);

      // Generate HTML
      return this.app.templateDictReplace(templates.webview_html, {
        base_css,
        webview_css,
        webview_js,
        ...templateDict,
      });
    } finally {
      dx.done();
    }
  }

  /**
   * Check if webview is currently active
   */
  isActive(): boolean {
    return this.currentViewer !== null && this.panelId !== null;
  }

  /**
   * Get current panel ID
   */
  getPanelId(): WebviewPanelId_t | null {
    return this.panelId;
  }

  /**
   * Cleanup webview resources
   */
  done(): void {
    const dx = this.dx.sub('done');

    try {
      if (this.currentViewer) {
        this.currentViewer.done();
        this.currentViewer = null;
      }

      // Remove panel from VSCodeAPIs map
      if (this.panelId) {
        this.app.vscodeapis.removePanel(this.panelId);
      }

      this.menuMgr = null;
      this.panelId = null;
      this.initialized = false;
      dx.out('Webview cleaned up');
    } finally {
      dx.done();
    }
  }

  /**
   * Register all webview message handlers
   */
  private registerMessageHandlers(): void {
    if (this.handlersRegistered) return;

    const messageHandlers = [
      { type: 'dragEnd', handler: this.handleDragEnd.bind(this) },
      { type: 'menuItemSelected', handler: this.handleMenuItemSelected.bind(this) },
      { type: 'print', handler: this.handlePrintMessage.bind(this) },
      { type: 'dx', handler: this.handleDxMessage.bind(this) },
      { type: 'requestPageRender', handler: this.handlePageRenderRequest.bind(this) },
    ];

    messageHandlers.forEach(({ type, handler }) => {
      this.app.ui.registerMessageHandler(type, handler);
    });

    this.handlersRegistered = true;
    this.dx.out('Webview message handlers registered');
  }

  /**
   * Handle toolbar drag end message
   */
  private async handleDragEnd(msg: PostMessage): Promise<void> {
    const dx = this.dx.sub('handleDragEnd');

    try {
      const left = msg.left;
      if (typeof left === 'number') {
        // Save toolbar position to global state
        this.app.vscodeapis.updateGlobalState('toolbarPosPx', left);
        dx.out(`Toolbar position saved: ${left}px`);
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle menu item selection message
   */
  private async handleMenuItemSelected(msg: PostMessage): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');

    try {
      const { menuId, itemId } = msg;
      if (typeof menuId === 'string' && typeof itemId === 'string') {
        dx.out(`Processing menu selection: menuId=${menuId}, itemId=${itemId}`);
        // Validate menuId (itemId is dynamic and can be any string - themes, page sizes, etc.)
        if (isMenuId(menuId)) {
          dx.out(`Validation passed, calling menuMgr.handleMenuItemSelected`);
          // Handle menu item selection through menu manager
          if (this.menuMgr) {
            await this.menuMgr.handleMenuItemSelected(menuId, itemId);
            dx.out(`Menu item selected: ${menuId}.${itemId}`);
          } else {
            dx.out(`ERROR: menuMgr is null!`);
          }
        } else {
          const msg = `Invalid menu ID: ${menuId}`;
          dx.out(msg);
          this.app.ui.showErrorMessage(msg);
          return;
        }
      } else {
        dx.out(`Invalid message format: menuId=${typeof menuId}, itemId=${typeof itemId}`);
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle print message
   */
  private async handlePrintMessage(msg: PostMessage): Promise<void> {
    const dx = this.dx.sub('handlePrintMessage');

    try {
      const { printType } = msg;
      if (typeof printType === 'string') {
        // Delegate to PaperPrinter for actual printing logic
        await this.app.paperprinter.handlePrintRequest(printType);
        dx.out(`Print request handled: ${printType}`);
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle diagnostic message from webview
   */
  private async handleDxMessage(msg: PostMessage): Promise<void> {
    const dx = this.dx.sub('dx'); // Every message has start/done if we debugOn here, too noisy.
    dx.require({ msg }, ['msg']);

    // Output webview diagnostic message via dx.out (forced debug on)
    if (msg.message) {
      dx.print(`[Webview] > ${msg.message}`); // Equivalent of dx.out() with debugOn
    } else {
      dx.print('Received dx message without message content');
    }
    dx.done();
  }

  /**
   * Handle page render request from scroll view
   */
  private async handlePageRenderRequest(msg: PostMessage): Promise<void> {
    const dx = this.dx.sub('handlePageRenderRequest');

    try {
      const pageNumber = msg.pageNumber;
      dx.out(`Received page render request for page ${pageNumber}`);

      if (typeof pageNumber !== 'number') {
        throw new Error('Invalid page number');
      }

      if (!this.currentViewer) {
        throw new Error('No active scroll view');
      }

      // Request page render through current viewer
      const pageData = await this.currentViewer.requestPageRender(pageNumber);

      // Send response back to webview
      if (this.panelId) {
        this.app.vscodeapis.postMessage(this.panelId, {
          type: 'pageRenderResponse',
          pageData: pageData,
        });
      }

      dx.out(`Page ${pageNumber} rendered and sent to webview`);
    } catch (error) {
      dx.out(`Error handling page render request: ${String(error)}`);

      // Send error response
      if (this.panelId) {
        this.app.vscodeapis.postMessage(this.panelId, {
          type: 'pageRenderError',
          pageNumber: msg.pageNumber || 0, // ADD THIS LINE
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
}

// end, UIWebView.ts
