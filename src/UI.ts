import type { App } from './App';
import type { WebviewMessage, MessageHandler } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;
  private currentWebviewPanel: any = null; // Reference to current webview panel

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

    if (!msg || !msg.type) return;

    const handlers = this.messageHandlers.get(msg.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(msg);
        } catch (error) {
          dx.out(`Error in message handler for ${msg.type}: ${error}`);
        }
      }
    }
    dx.done();
  }

  // Create a webview panel with message handling set up
  htmlToWebViewPanel(title: string, html: string): any {
    const panel = this.app.vscodeapis.createWebviewPanel(title, html);
    this.app.vscodeapis.setupMessageHandling(panel);
    return panel;
  }

  // Create a webview panel with webview URI conversion
  async htmlToWebViewPanelWithURIs(title: string, html: string): Promise<any> {
    // Create panel first
    const panel = this.app.vscodeapis.createWebviewPanel(title, '');
    this.app.vscodeapis.setupMessageHandling(panel);

    // Convert relative src paths to webview URIs
    const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, panel);

    // Update panel with converted HTML
    panel.webview.html = htmlWithURIs;

    // Store reference to current panel
    this.currentWebviewPanel = panel;
    return panel;
  }

  // Create a webview panel and update HTML with webview URIs
  async createWebviewWithURIs(title: string, pdfDoc: any, tabName: string): Promise<any> {
    // First create the panel
    const panel = this.app.vscodeapis.createWebviewPanel(title, '');
    this.app.vscodeapis.setupMessageHandling(panel);

    // Generate PDF embed HTML
    const pdfHtml = this.app.pdf.embedPDFinHTML(pdfDoc, `Printable: ${tabName}`);

    // Convert file paths to webview URIs in the HTML
    this.dx.out('UI.ts: About to call htmlSrcPathToURI');
    const htmlWithURIs = this.app.os.htmlSrcPathToURI(pdfHtml, panel);
    this.dx.out('UI.ts: htmlSrcPathToURI completed');

    // Add toolbar to the HTML
    const htmlWithToolbar = await this.addToolbar(htmlWithURIs);

    // Update the panel with the final HTML
    panel.webview.html = htmlWithToolbar;

    return panel;
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
    // Read the UI.yaml template for the toolbar
    const toolbarYaml = this.app.os.fileRead<{
      toolbar_css: string;
      toolbar_js: string;
      toolbar_html: string;
    }>('src/UI.yaml');
    if (!toolbarYaml) throw new Error('Failed to load toolbar template');

    // Replace template variables using UIMenuMgr - UI doesn't know what these represent
    const uimenuHtml = await this.app.uimenumgr.getAllUIMenuHTML();
    const uimenuJs = this.app.uimenumgr.getAllUIMenuJS();

    // Get saved toolbar position
    const toolbarLeft = this.app.vscodeapis.getGlobalState<number>('toolbarLeft');

    const toolbar = this.app.templateDictReplace(toolbarYaml.toolbar_html, {
      TOOLBAR_CSS: toolbarYaml.toolbar_css,
      TOOLBAR_JS: toolbarYaml.toolbar_js,
      UIMENU_HTML: uimenuHtml,
      UIMENU_JS: uimenuJs,
      TOOLBAR_LEFT: toolbarLeft !== undefined ? String(toolbarLeft) : 'undefined',
    });

    // Inject toolbar before closing body tag
    return html.replace('</body>', `${toolbar}</body>`);
  }

  // Add toolbar to HTML content with webview URI conversion
  async addToolbarWithURIs(html: string, webviewPanel: any): Promise<string> {
    // First convert file paths to webview URIs
    const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, webviewPanel);

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
    if (this.currentWebviewPanel) {
      const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, this.currentWebviewPanel);
      const htmlWithToolbar = await this.addToolbar(htmlWithURIs);
      this.currentWebviewPanel.webview.html = htmlWithToolbar;
    }
  }

  async updatePdfContentOnly(html: string): Promise<void> {
    if (this.currentWebviewPanel) {
      // Extract just the PDF data URL from the HTML
      const pdfDataUrlMatch = html.match(/initPdfViewer\('([^']+)'\)/);
      if (pdfDataUrlMatch) {
        const pdfDataUrl = pdfDataUrlMatch[1];
        // Send message to webview to update PDF content only
        this.currentWebviewPanel.webview.postMessage({
          type: 'updatePdf',
          pdfDataUrl: pdfDataUrl,
        });
      }
    }
  }

  out(message: string): void {
    console.log(message);
  }

  static out(message: string): void {
    console.log(message);
  }
}
