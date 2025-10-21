import type { App } from './App';
import type { PageRender } from './types/PageRender_t';
import type { WebviewPanelId_t } from './VSCodeAPIs';
import type { PostMessage } from './types/UI_t';
import { UIScrollView, type ScrollOptions } from './UIScrollView';
import { UIMenuMgr } from './UIMenuMgr';
import { isMenuId, isMenuItemId } from './UIMenu';
import { Diagnostics } from './Diagnostics';

/**
 * UIWebView - Lightweight webview container that can create and manage different components
 * Acts as a flexible orchestrator for webview-related functionality
 */
export class UIWebView {
  private app: App;
  private dx: Diagnostics;
  private currentViewer: UIScrollView | null = null;
  private menuMgr: UIMenuMgr | null = null;
  private panelId: WebviewPanelId_t | null = null;
  private initialized: boolean = false;
  private handlersRegistered: boolean = false;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIWebView');
  }

  init(): void {
    this.registerMessageHandlers();
  }

  /**
   * Create webview panel with menus and scroll view
   */
  async createPanel(pageRender: PageRender, options: ScrollOptions): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub('createPanel');
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
   * Pre-render initial pages for faster display
   */
  private async preRenderInitialPages(
    pageRender: PageRender,
    options: ScrollOptions
  ): Promise<void> {
    const dx = this.dx.sub('preRenderInitialPages');

    try {
      // Pre-render is no longer needed with unified approach
      // The complete PDF is generated during tokenization
      dx.out(`Pre-render not needed with unified approach`);
      return;
    } catch (error) {
      dx.out(`Pre-render failed: ${String(error)}`);
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
    options: ScrollOptions
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
  async updateOptions(options: ScrollOptions): Promise<void> {
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
        // Validate both menuId and itemId before proceeding
        if (isMenuId(menuId) && isMenuItemId(itemId)) {
          dx.out(`Validation passed, calling menuMgr.handleMenuItemSelected`);
          // Handle menu item selection through menu manager
          if (this.menuMgr) {
            await this.menuMgr.handleMenuItemSelected(menuId, itemId);
            dx.out(`Menu item selected: ${menuId}.${itemId}`);
          } else {
            dx.out(`ERROR: menuMgr is null!`);
          }
        } else {
          const msg = `Invalid menu selection: ${menuId}.${itemId}`;
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
