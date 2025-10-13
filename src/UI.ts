import type { App } from './App';
import type { PostMessage, MessageHandler } from './types/UI_t';
import type { WebviewPanelId } from './VSCodeAPIs';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';

// Global State Key types - UI-related persistent storage identifiers
export type GlobalStateKey_t =
  | 'pageSizeId'
  | 'orient'
  | 'marginId'
  | 'theme'
  | 'fontSizeId'
  | 'toolbarPosPx'
  | 'pageRenderCacheSize'
  | 'scrollDebounceMs'
  | 'maxCanvasPoolSize'
  | 'scrollableViewerEnabled'
  | 'autoScrollableViewerThreshold';

export const kGlobalStateKey: readonly GlobalStateKey_t[] = [
  'pageSizeId',
  'orient',
  'marginId',
  'theme',
  'fontSizeId',
  'toolbarPosPx',
  'pageRenderCacheSize',
  'scrollDebounceMs',
  'maxCanvasPoolSize',
  'scrollableViewerEnabled',
  'autoScrollableViewerThreshold'
] as const;

// Type guard for runtime validation
export function isGlobalStateKey(id: string): id is GlobalStateKey_t {
  return kGlobalStateKey.includes(id as GlobalStateKey_t);
}

export class UI {
  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;
  private _yaml: {
    base_css: string;
    toolbar_css: string;
    toolbar_js: string;
    toolbar_html: string;
  } = {
    base_css: '',
    toolbar_css: '',
    toolbar_js: '',
    toolbar_html: '',
  };

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UI');
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  get yaml() {
    // If already loaded, return it
    if (this._yaml.base_css) {
      return this._yaml;
    }

    // Load and cache the YAML
    const yaml = this.app.os.fileRead<{
      base_css: string;
      toolbar_css: string;
      toolbar_js: string;
      toolbar_html: string;
    }>('src/UI.yaml');

    if (!yaml) {
      throw new Error('Failed to load UI yaml');
    }

    // Cache it
    this._yaml = yaml;
    return this._yaml;
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
  async handleWebviewMessage(msg: PostMessage): Promise<void> {
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
  /** @deprecated Dead code, never called */
  async createWebviewPanel_OBSOLETE_DELETEME(title: string, html: string): Promise<WebviewPanelId> {
    const panelId = await this.app.vscodeapis.getOrCreateWebviewPanel(title, html, undefined);
    return panelId;
  }

  /** @deprecated Dead code, never called */
  async updateWebviewPdf_OBSOLETE_DELETEME(pdf: jsPDF): Promise<void> {
    const dx = this.dx.sub('updateWebviewPdf_OBSOLETE_DELETEME');
    dx.require({ pdf }, ['pdf']);
    throw new Error('Dead code - currentPanelId removed');
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    const dx = this.dx.sub('addToolbar');
    dx.require({ html }, ['html']);

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.app.uimenumgr.getAllUIMenuHTML();

      // Get toolbar templates from yaml getter
      const templates = this.yaml;

      // Inject toolbar into HTML using template
      const toolbarHtml = this.app.templateDictReplace(templates.toolbar_html, {
        TOOLBAR_CSS: templates.toolbar_css,
        TOOLBAR_JS: templates.toolbar_js,
        MENU_HTML: menuHtml,
      });

      const htmlWithToolbar = html.replace('{{TOOLBAR}}', toolbarHtml);

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
  /** @deprecated Dead code, never called */
  async htmlToPanel_OBSOLETE_DELETEME(title: string, html: string): Promise<WebviewPanelId> {
    const dx = this.dx.sub('htmlToPanel_OBSOLETE_DELETEME');
    dx.require({ title, html }, ['title', 'html']);

    try {
      // Add toolbar to HTML
      const htmlWithToolbar = await this.addToolbar(html);

      // Create webview panel
      const panelId = this.createWebviewPanel_OBSOLETE_DELETEME(title, htmlWithToolbar);

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
    return this.yaml.base_css;
  }

  // Choose save location
  async chooseSaveLocation(defaultFilename: string): Promise<string | null> {
    const dx = this.dx.sub('chooseSaveLocation');

    try {
      const uri = await this.app.vscodeapis.showSaveDialog({
        defaultUri: this.app.vscodeapis.uriFromPath(defaultFilename),
        filters: {
          'PDF files': ['pdf'],
        },
        title: 'Save PDF As',
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
