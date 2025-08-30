import type { App } from './App';

// Webview message types - defines the contract between frontend UI and backend
export type WebviewMessage = {
  type: 'dragStart' | 'dragMove' | 'dragEnd' | 'menu' | 'print' | 'menuItemSelected';
  clientX?: number;
  startLeft?: number;
  value?: string;
  targetId?: string;
  parentId?: string;
  x?: number;
  y?: number;
};

// Message handler callback type
export type MessageHandler = (msg: WebviewMessage) => Promise<void> | void;

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  init(): void {}

  done(): void {}

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
    if (!msg || !msg.type) return;

    const handlers = this.messageHandlers.get(msg.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(msg);
        } catch (error) {
          this.debugOut(`Error in message handler for ${msg.type}: ${error}`, 'error', 'UI');
        }
      }
    }
  }

  // Create a webview panel with message handling set up
  createWebviewPanel(title: string, html: string): any {
    const panel = this.app.vscodeapis.createWebviewPanel(title, html);
    this.setupWebviewMessageHandling(panel);
    return panel;
  }

  // Add toolbar to HTML content
  addToolbar(html: string): string {
    // Read the UI.yaml template for the toolbar
    const toolbarYaml = this.app.os.readExtensionYaml<{ toolbar_html: string }>('src/UI.yaml');

    // Replace template variables using UIMenuMgr - UI doesn't know what these represent
    const toolbar = this.app.templateDictReplace(toolbarYaml.toolbar_html, {
      UIMENU_HTML: this.app.uimenumgr.getAllUIMenuHTML(),
      UIMENU_JS: this.app.uimenumgr.getAllUIMenuJS(),
    });

    // Inject toolbar before closing body tag
    return html.replace('</body>', `${toolbar}</body>`);
  }

  // Set up webview message handling for a panel
  setupWebviewMessageHandling(panel: any): void {
    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      await this.handleWebviewMessage(msg);
    });
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

  debugOut(
    message: unknown,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    context?: string,
    data?: unknown
  ): void {
    this.app.os.debugOut(message, level, context, data);
  }

  static debugOut(
    message: unknown,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    context?: string,
    data?: unknown
  ): void {
    const ts = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    const formatData = (data: unknown): string => {
      try {
        return typeof data === 'string' ? data : JSON.stringify(data);
      } catch {
        return String(data);
      }
    };
    const base = formatData(message);
    const extra = data === undefined ? '' : ` | ${formatData(data)}`;
    const line = `${ts} ${level.toUpperCase()} ${ctx}${base}${extra}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else if (level === 'debug') {
      if (console.debug) console.debug(line);
      else console.log(line);
    } else console.log(line);
  }
}
