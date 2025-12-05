/**
 * UI - User Interface Manager
 *
 * Manages the main VS Code webview panel and toolbar for the Print2Paper extension.
 * Handles webview creation, toolbar positioning, zoom level persistence, and
 * communication between extension and webview.
 *
 * Features:
 * - Webview panel creation and lifecycle management
 * - Toolbar position persistence and validation
 * - Zoom level persistence
 * - Message passing between extension and webview
 *
 * @module src/UI
 */

import type { Registry } from './Registry';
import type { SendToExt_t, MessageHandler_t } from './types/UI_t';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { YamlInstance } from './Yaml';
import type { Persist, Persist_t } from './Persist';
import { kMenuId } from './UIMenu';

// UI persist keys - union of menu IDs and toolbar position
export const kUI = [...kMenuId, 'toolbar_pos', 'zoomLevel_value'] as const;

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
  static readonly id = 'ui';
  private static readonly kYaml = {
    base_css: '',
    toolbar_css: '',
    toolbar_js: '',
    toolbar_html: '',
  } as const;

  // Toolbar positioning constants
  private static readonly kToolbar_pos_min_px = 8;
  private static readonly kToolbar_pos_max_px = 5120; // Reasonable max for 5K displays

  private reg: Registry;
  private fn: FnImport_t;
  private messageHandlers: Map<string, MessageHandler_t[]> = new Map();
  private dx: Diagnostics;
  private _yaml: YamlInstance<typeof UI.kYaml>;
  public persist: Persist;

  // Typed accessor for uimenumgr singleton
  private get uimenumgr() { return this.reg.getInstance<import('./UIMenuMgr').UIMenuMgr>('uimenumgr')!; }

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'vscodeapis.showInformationMessage',
      'vscodeapis.showErrorMessage',
      'vscodeapis.showWarningMessage',
      'vscodeapis.showSaveDialog',
      'vscodeapis.uriFromPath',
      'vscodeapis.uriToPath',
      'yaml.create',
      'persist.use',
      'utils.templateDictReplace'
    );
    this.dx = this.fn.dx.sub({ name: 'UI' });
    
    // Create per-instance Yaml via factory, access shared Persist singleton
    this._yaml = this.fn.yaml.create({ filePath: 'src/UI.yaml', dataStruct: UI.kYaml });
    this.persist = this.fn.persist.use();
    this.persist.register('toolbar_pos');
  }

  done(): void {
    this.dx.done();
  }

  get yaml() {
    return this._yaml.get();
  }

  // Register a message handler for a specific message type
  registerMessageHandler(args: { messageType: string; handler: MessageHandler_t }): void {
    const dx = this.dx.sub({ name: 'registerMessageHandler' });
    dx.require(args, ['messageType', 'handler']);
    const { messageType, handler } = args;
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
    dx.done();
  }

  // Unregister a message handler
  unregisterMessageHandler(args: { messageType: string; handler: MessageHandler_t }): void {
    const dx = this.dx.sub({ name: 'unregisterMessageHandler' });
    dx.require(args, ['messageType', 'handler']);
    const { messageType, handler } = args;
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Central message handling - routes messages to registered handlers
  async handleWebviewMessage(msg: SendToExt_t): Promise<void> {
    const dx = this.dx.sub({ name: 'handleWebviewMessage' });
    dx.require({ msg }, ['msg']);
    dx.out(`Received message: type=${msg.type}`);

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
    this.fn.vscodeapis.showInformationMessage(message);
  }

  // Show error message
  showErrorMessage(message: string): void {
    this.fn.vscodeapis.showErrorMessage(message);
  }

  // Show warning message
  showWarningMessage(message: string): void {
    this.fn.vscodeapis.showWarningMessage(message);
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    const dx = this.dx.sub({ name: 'addToolbar' });
    dx.require({ html }, ['html']);

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.uimenumgr.getUIMenus_HTML();

      // Get menu CSS and JS
      const uiMenuCss = this.uimenumgr.getUIMenus_CSS();
      const uiMenuJs = this.uimenumgr.getUIMenus_JS();

      // Get toolbar templates from yaml getter
      const templates = this.yaml;

      // Get toolbar position, validate it's within bounds, else use default
      // Note: VS Code extensions run in Node.js and don't have access to window dimensions.
      // Client-side code in toolbar_js/yaml dynamically clamps to actual window.innerWidth.
      let toolbar_pos = Number(this.persist.get('toolbar_pos'));
      if (
        isNaN(toolbar_pos) ||
        toolbar_pos < UI.kToolbar_pos_min_px ||
        toolbar_pos >= UI.kToolbar_pos_max_px
      ) {
        toolbar_pos = UI.kToolbar_pos_min_px;
      }

      // Replace toolbar_pos in toolbar_css before combining with menu CSS
      const toolbarCssWithPos = templates.toolbar_css.replace(
        '{{toolbar_pos}}',
        toolbar_pos.toString()
      );

      // Replace toolbar positioning constant in toolbar_js
      const toolbarJsWithConstants = templates.toolbar_js.replace(
        /\{\{toolbar_pos_min_px\}\}/g,
        UI.kToolbar_pos_min_px.toString()
      );

      // Inject toolbar into HTML using template
      const toolbarHtml = this.fn.utils.templateDictReplace(templates.toolbar_html, {
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
    return this.fn.utils.templateDictReplace(template, dict);
  }

  // Get base CSS
  getBaseCSS(): string {
    return this.yaml.base_css;
  }

  // Choose save location
  async chooseSaveLocation(defaultFilename: string): Promise<string | null> {
    const dx = this.dx.sub({ name: 'chooseSaveLocation' });

    try {
      const uri = await this.fn.vscodeapis.showSaveDialog({
        defaultUri: this.fn.vscodeapis.uriFromPath(defaultFilename),
        filters: {
          'PDF files': ['pdf'],
        },
        title: 'Save PDF As',
      });

      if (uri) {
        const path = this.fn.vscodeapis.uriToPath(uri);
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
