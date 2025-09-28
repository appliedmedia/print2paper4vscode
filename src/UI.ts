import type { App } from './App';
import type { WebviewMessage, MessageHandler } from './types/UI_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;
  private currentPanelId: WebviewPanelId | null = null; // Store the current panel ID for updates

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
}
