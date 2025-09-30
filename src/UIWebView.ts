import type { App } from './App';
import type { PageRender, PageData, PageMetadata } from './types/PageRender_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import { UIScrollView } from './UIScrollView';
import { Diagnostics } from './Diagnostics';

// WebView options interface
export interface WebViewOptions {
  title?: string;
  pageSize?: 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
  orient?: 'portrait' | 'landscape';
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  theme?: string;
}

/**
 * UIWebView - Manages webview panels and content rendering
 * Acts as an abstraction layer between PaperPrinter and specific viewer implementations
 */
export class UIWebView {
  private app: App;
  private dx: Diagnostics;
  private currentViewer: UIScrollView | null = null;
  private panelId: WebviewPanelId | null = null;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIWebView');
  }

  /**
   * Create a webview panel with PageRender content
   */
  async createWebView(pageRender: PageRender, options: WebViewOptions): Promise<WebviewPanelId> {
    const dx = this.dx.sub('createWebView');
    dx.require({ pageRender, options }, ['pageRender', 'options']);

    try {
      // For now, always use scroll view (can be extended to support other viewer types)
      this.currentViewer = new UIScrollView(this.app, pageRender, options);
      this.panelId = await this.currentViewer.create();
      
      // Store current panel ID in UI for message handling
      this.app.ui.currentPanelId = this.panelId;
      
      dx.out(`Created webview panel: ${options.title || 'Document Viewer'}`);
      return this.panelId;

    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to create webview: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update webview content with new PageRender
   */
  async updatePageRender(newPageRender: PageRender): Promise<void> {
    const dx = this.dx.sub('updatePageRender');
    
    try {
      if (this.currentViewer) {
        await this.currentViewer.updatePageRender(newPageRender);
        dx.out('Updated PageRender in webview');
      } else {
        dx.out('No active webview to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update PageRender: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Update webview options (theme, font, page size, etc.)
   */
  async updateOptions(options: Partial<WebViewOptions>): Promise<void> {
    const dx = this.dx.sub('updateOptions');
    
    try {
      if (this.currentViewer) {
        await this.currentViewer.updateOptions(options);
        dx.out('Updated webview options');
      } else {
        dx.out('No active webview to update');
      }
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update webview options: ${String(error)}`);
      throw error;
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
      this.panelId = null;
      dx.out('Webview destroyed');
    } finally {
      dx.done();
    }
  }
}