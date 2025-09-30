import type { App } from './App';
import type { WebviewMessage, MessageHandler } from './types/UI_t';
import type { WebviewPanelId } from './VSCodeAPIs';
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

    try {
      const handlers = this.messageHandlers.get(msg.type);
      if (handlers && handlers.length > 0) {
        dx.out(`Found ${handlers.length} handlers for message type: ${msg.type}`);
        for (const handler of handlers) {
          await handler(msg);
        }
      } else {
        dx.out(`No handlers registered for message type: ${msg.type}`);
      }
    } catch (error) {
      dx.out(`Error handling message: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Show information message
  showInfoMessage(message: string): void {
    this.app.vscodeapis.showInformationMessage(message);
  }

  // Show error message
  showErrorMessage(message: string): void {
    this.app.vscodeapis.showErrorMessage(message);
  }

  // Show warning message
  showWarningMessage(message: string): void {
    this.app.vscodeapis.showWarningMessage(message);
  }

  // Create webview panel
  createWebviewPanel(title: string, html: string): WebviewPanelId {
    const panelId = this.app.vscodeapis.createWebviewPanel(title, html);
    this.currentPanelId = panelId;
    return panelId;
  }

  // Update webview panel with new HTML
  async updateWebviewPdf(pdf: jsPDF): Promise<void> {
    const dx = this.dx.sub('updateWebviewPdf');
    dx.require({ pdf }, ['pdf']);

    try {
      if (!this.currentPanelId) {
        throw new Error('No active webview panel to update');
      }

      // Convert PDF to data URL
      const pdfDataUrl = pdf.output('datauristring') as string;
      
      // Send message to webview to update PDF
      this.app.vscodeapis.postMessageToPanel(this.currentPanelId, {
        type: 'updatePdf',
        pdfDataUrl: pdfDataUrl
      });

      dx.out('PDF updated in webview');
    } catch (error) {
      dx.out(`Error updating webview PDF: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    const dx = this.dx.sub('addToolbar');
    dx.require({ html }, ['html']);

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.app.uimenumgr.getAllUIMenuHTML();
      
      // Inject toolbar into HTML
      const htmlWithToolbar = html.replace(
        '{{TOOLBAR}}',
        `<div class="toolbar">${menuHtml}</div>`
      );

      dx.out('Toolbar added to HTML');
      return htmlWithToolbar;
    } catch (error) {
      dx.out(`Error adding toolbar: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Convert HTML to webview panel
  async htmlToPanel(title: string, html: string): Promise<WebviewPanelId> {
    const dx = this.dx.sub('htmlToPanel');
    dx.require({ title, html }, ['title', 'html']);

    try {
      // Add toolbar to HTML
      const htmlWithToolbar = await this.addToolbar(html);
      
      // Create webview panel
      const panelId = this.createWebviewPanel(title, htmlWithToolbar);
      
      dx.out(`Created webview panel: ${title}`);
      return panelId;
    } catch (error) {
      dx.out(`Error creating webview panel: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Template dictionary replacement
  templateDictReplace(template: string, dict: Record<string, string>): string {
    return this.app.templateDictReplace(template, dict);
  }

  // Get base CSS
  getBaseCSS(): string {
    const baseTemplates = this.app.os.fileRead<{
      base_css: string;
    }>('src/UI.yaml');
    
    return baseTemplates?.base_css || '';
  }

  // Choose save location
  async chooseSaveLocation(defaultFilename: string): Promise<string | null> {
    const dx = this.dx.sub('chooseSaveLocation');
    
    try {
      const uri = await this.app.vscodeapis.showSaveDialog({
        defaultUri: this.app.vscodeapis.uriFromPath(defaultFilename),
        filters: {
          'PDF files': ['pdf']
        },
        title: 'Save PDF As'
      });
      
      if (uri) {
        const path = this.app.vscodeapis.uriToPath(uri);
        dx.out(`User chose save location: ${path}`);
        return path;
      } else {
        dx.out('User cancelled save dialog');
        return null;
      }
    } catch (error) {
      dx.out(`Error in save dialog: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Static utility method for console output
  static out(message: string): void {
    console.log(message);
  }
}