import type { App } from './App';
import type { WebviewMessage, MessageHandler } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;

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
  createWebviewPanel(title: string, html: string): unknown {
    const panel = this.app.vscodeapis.createWebviewPanel(title, html);
    this.app.vscodeapis.setupMessageHandling(panel);
    return panel;
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    // Read the UI.yaml template for the toolbar
    const toolbarYaml = this.app.os.readExtensionYaml<{ toolbar_html: string }>('src/UI.yaml');

    // Replace template variables using UIMenuMgr - UI doesn't know what these represent
    const uimenuHtml = await this.app.uimenumgr.getAllUIMenuHTML();
    const uimenuJs = this.app.uimenumgr.getAllUIMenuJS();



    // Get saved toolbar position
    const toolbarLeft = this.app.vscodeapis.getGlobalState<number>('toolbarLeft');

    const toolbar = this.app.templateDictReplace(toolbarYaml.toolbar_html, {
      UIMENU_HTML: uimenuHtml,
      UIMENU_JS: uimenuJs,
      TOOLBAR_LEFT: toolbarLeft !== undefined ? String(toolbarLeft) : 'undefined',
    });



    // Inject toolbar before closing body tag
    return html.replace('</body>', `${toolbar}</body>`);
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

  out(message: string): void {
    console.log(message);
  }

  static out(message: string): void {
    console.log(message);
  }
}
