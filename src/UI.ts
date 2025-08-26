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
  addToolbar(html: string, app: App): string {
    // Recompute available themes at render time
    const editorTypo = app.vscodeapis.getEditorTypography();
    // Get all light themes suitable for printing with editor theme at top
    const themeList = app.stylize.getThemes('light|bright|day', 'top');

    // Generate menu HTML using YAML templates
    const yaml = app.os.readExtensionYaml<{ ui_menu_item: string }>('src/UIMenu.yaml');

    const generateMenuItems = (items: Array<{ id: string; label: string }>) => {
      return items
        .map(item =>
          app.templateDictReplace(yaml.ui_menu_item, {
            ITEM_ID: item.id,
            ITEM_LABEL: item.label,
          })
        )
        .join('\n          ');
    };

    const printMenuItems = generateMenuItems([
      { id: 'preview', label: 'Print with Preview' },
      { id: 'direct', label: 'Print' },
      { id: 'save', label: 'Save as PDF' },
    ]);

    const textMenuItems = generateMenuItems([
      { id: 'editor', label: `Editor (${editorTypo.fontSize}px)` },
      { id: '9', label: '9 px' },
      { id: '10', label: '10 px' },
      { id: '12', label: '12 px' },
      { id: '14', label: '14 px' },
      { id: '18', label: '18 px' },
      { id: '24', label: '24 px' },
    ]);

    const themeMenuItems = generateMenuItems(
      themeList.map(theme => ({ id: theme.id, label: theme.label }))
    );

    // TODO: Generate the complete toolbar HTML using YAML templates
    // For now, return the content with a placeholder
    return html;
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
