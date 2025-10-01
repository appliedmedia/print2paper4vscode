import type { App } from './App';
import type { PageRender, PageData, PageMetadata } from './types/PageRender_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import { UIScrollView } from './UIScrollView';
import { UIMenuMgr } from './UIMenuMgr';
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
  private panelId: WebviewPanelId | null = null;
  private initialized: boolean = false;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIWebView');
  }

  /**
   * Initialize webview with menus and scroll view
   */
  async init(pageRender: PageRender, options: any, menus: UIMenuMgr): Promise<WebviewPanelId> {
    const dx = this.dx.sub('init');
    dx.require({ pageRender, options, menus }, ['pageRender', 'options', 'menus']);

    try {
      if (this.initialized) {
        throw new Error('UIWebView already initialized');
      }

      // Set menu manager
      this.menuMgr = menus;

      // Create scroll view
      this.currentViewer = new UIScrollView(this.app, pageRender, options, this.menuMgr);
      this.panelId = await this.currentViewer.create();
      
      // Store current panel ID in UI for message handling
      this.app.ui.currentPanelId = this.panelId;
      
      this.initialized = true;
      dx.out(`Initialized webview: ${options.title || 'Document Viewer'}`);
      return this.panelId;

    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to initialize webview: ${String(error)}`);
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
  async createScrollView(pageRender: PageRender, options: any): Promise<WebviewPanelId> {
    const dx = this.dx.sub('createScrollView');
    dx.require({ pageRender, options }, ['pageRender', 'options']);

    try {
      if (!this.menuMgr) {
        throw new Error('Menu manager not created. Call createMenus() first.');
      }

      this.currentViewer = new UIScrollView(this.app, pageRender, options, this.menuMgr);
      this.panelId = await this.currentViewer.create();
      
      // Store current panel ID in UI for message handling
      this.app.ui.currentPanelId = this.panelId;
      
      dx.out(`Created scroll view: ${options.title || 'Document Viewer'}`);
      return this.panelId;

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
  async updateOptions(options: any): Promise<void> {
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
  getPanelId(): WebviewPanelId | null {
    return this.panelId;
  }

  /**
   * Destroy webview and cleanup resources
   */
  destroy(): void {
    const dx = this.dx.sub('destroy');
    
    try {
      if (this.currentViewer) {
        this.currentViewer.destroy();
        this.currentViewer = null;
      }
      this.menuMgr = null;
      this.panelId = null;
      this.initialized = false;
      dx.out('Webview destroyed');
    } finally {
      dx.done();
    }
  }
}