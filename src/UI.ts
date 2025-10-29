import type { App } from './App';
import type { PostMessage, MessageHandler } from './types/UI_t';
import { Diagnostics } from './Diagnostics';
import { Yaml } from './Yaml';
import { Persist, type Persist_t } from './Persist';
import { kMenuId } from './UIMenu';

// UI persist keys - union of menu IDs and toolbar position
export const kUI = [...kMenuId, 'toolbar_pos'] as const;

export type UI_t = (typeof kUI)[number];

/**
 * UI - User interface utilities and message handling
 *
 * Provides VS Code UI integration including error/info messages, save dialogs,
 * message handler registration/dispatch, and YAML-based toolbar/CSS generation.
 * Acts as central hub for webview-to-extension communication.
 *
 * @input app - Application instance
 * @output UI dialogs, message routing, toolbar HTML/CSS/JS from templates
 *
 * @example
 * const ui = new UI(app);
 * ui.showErrorMessage('Something fucked up');
 * ui.onMessage('menuItemSelected', async (data) => { ... });
 * const toolbar = ui.getToolbarHTML();
 */
export class UI {
  private static readonly kYaml = {
    base_css: '',
    toolbar_css: '',
    toolbar_js: '',
    toolbar_html: '',
  } as const;

  // Toolbar positioning constants
  private static readonly kToolbarMinLeftPx = 8;

  private app: App;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private dx: Diagnostics;
  private _yaml: Yaml<typeof UI.kYaml>;
  public persist: Persist & Persist_t;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UI');
    this._yaml = new Yaml(app, 'src/UI.yaml', UI.kYaml);
    
    // Initialize persist for toolbar position
    this.persist = new Persist(app) as Persist & Persist_t;
    this.persist.register('toolbar_pos');
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  get yaml() {
    return this._yaml.get();
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

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    const dx = this.dx.sub('addToolbar');
    dx.require({ html }, ['html']);

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.app.uimenumgr.getAllUIMenuHTML();

      // Get menu CSS and JS
      const uiMenuCss = this.app.uimenumgr.getAllUIMenuCSS();
      const uiMenuJs = this.app.uimenumgr.getAllUIMenuJS();

      // Get toolbar templates from yaml getter
      const templates = this.yaml;

      // Get saved toolbar position from persist, validate default if needed
      // Prefer existing value, migrate legacy key if present, then clamp
      let toolbarPos = await this.persist.validateDefault<number>('toolbar_pos', async () => {
        // Check for legacy key first
        const legacyPos = this.app.vscodeapis.getGlobalState('toolbarPosPx');
        if (typeof legacyPos === 'number' && Number.isFinite(legacyPos)) {
          return legacyPos;
        }
        return UI.kToolbarMinLeftPx;
      });
      if (!Number.isFinite(toolbarPos)) toolbarPos = UI.kToolbarMinLeftPx;
      if (toolbarPos < UI.kToolbarMinLeftPx) toolbarPos = UI.kToolbarMinLeftPx;

      // Replace toolbar_pos in toolbar_css before combining with menu CSS
      const toolbarCssWithPos = templates.toolbar_css.replace('{{toolbar_pos}}', toolbarPos.toString());

      // Replace toolbar_min_left_px in toolbar_js
      const toolbarJsWithConstants = templates.toolbar_js.replace(/\{\{toolbar_min_left_px\}\}/g, UI.kToolbarMinLeftPx.toString());

      // Inject toolbar into HTML using template
      const toolbarHtml = this.app.templateDictReplace(templates.toolbar_html, {
        toolbarCss: toolbarCssWithPos + '\n' + uiMenuCss,
        baseCss: templates.base_css,
        menuHtml,
        toolbarJs: toolbarJsWithConstants + '\n' + uiMenuJs,
        additionalJs: '',
      });

      const htmlWithToolbar = html.replace('{{toolbar}}', toolbarHtml);

      dx.out('Toolbar added to HTML');
      return htmlWithToolbar;
    } catch (error) {
      dx.out(`Error adding toolbar: ${String(error)}`);
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

// end, UI.ts
