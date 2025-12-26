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
import { kToolbar } from './types/UI_t';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { YamlInstance } from './Yaml';
import { kMenuId } from './types/UIMenu_t';
import { kZoomLevel } from './types/PaperPrinter_t';

// UI persist key constants
export const kLastSaveDir = 'lastSaveDir' as const;

// UI persist keys - union of menu IDs and toolbar position
export const kUI = [...kMenuId, kToolbar.pos.persistId, kZoomLevel.iconSlotTriad.main.persistId!, kLastSaveDir] as const;

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


  private reg: Registry;
  private fn: FnImport_t;
  private messageHandlers: Map<string, MessageHandler_t[]> = new Map();
  private dx: Diagnostics;
  private _yaml: YamlInstance<typeof UI.kYaml>;

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
      'persist.get',
      'persist.set',
      'utils.templateDictReplace',
      'uimenumgr.getUIMenus_HTML',
      'uimenumgr.getUIMenus_CSS',
      'uimenumgr.getUIMenus_JS',
      'os.pathJoin',
      'os.pathDirname',
      'os.getDir_Documents'
    );
    this.dx = this.fn.dx.sub({ name: 'UI' });
    
    // Create per-instance Yaml via factory
    this._yaml = this.fn.yaml.create({ filePath: 'src/UI.yaml', dataStruct: UI.kYaml });
  }

  /**
   * Get the UI yaml data
   */
  yaml() {
    return this._yaml.get();
  }

  done(): void {
    this.dx.done();
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
  async showInfoMessage(message: string, ...items: string[]): Promise<string | undefined> {
    return await this.fn.vscodeapis.showInformationMessage(message, ...items);
  }

  // Show error message
  async showErrorMessage(message: string, ...items: string[]): Promise<string | undefined> {
    return await this.fn.vscodeapis.showErrorMessage(message, ...items);
  }

  // Show warning message
  async showWarningMessage(message: string, ...items: string[]): Promise<string | undefined> {
    return await this.fn.vscodeapis.showWarningMessage(message, ...items);
  }

  // Add toolbar to HTML content
  async addToolbar(html: string): Promise<string> {
    const dx = this.dx.sub({ name: 'addToolbar' });
    dx.require({ html }, ['html']);

    try {
      // Get menu HTML from UIMenuMgr
      const menuHtml = await this.fn.uimenumgr.getUIMenus_HTML();

      // Get menu CSS and JS
      const uiMenuCss = this.fn.uimenumgr.getUIMenus_CSS();
      const uiMenuJs = this.fn.uimenumgr.getUIMenus_JS();

      // Get toolbar templates from yaml method
      const templates = this.yaml();

      // Get toolbar position, validate it's within bounds, else use default
      // Note: VS Code extensions run in Node.js and don't have access to window dimensions.
      // Client-side code in toolbar_js/yaml dynamically clamps to actual window.innerWidth.
      let toolbar_pos = Number(this.fn.persist.get(kToolbar.pos.persistId));
      if (
        isNaN(toolbar_pos) ||
        toolbar_pos < kToolbar.pos.min_px ||
        toolbar_pos >= kToolbar.pos.max_px
      ) {
        toolbar_pos = kToolbar.pos.min_px;
      }

      // Replace toolbar_pos in toolbar_css before combining with menu CSS
      const toolbarCssWithPos = templates.toolbar_css.replace(
        '{{toolbar_pos}}',
        toolbar_pos.toString()
      );

      // Replace toolbar positioning constant in toolbar_js
      const toolbarJsWithConstants = templates.toolbar_js.replace(
        /\{\{toolbar_pos_min_px\}\}/g,
        kToolbar.pos.min_px.toString()
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
    return this.yaml().base_css;
  }

  // Choose save location
  async chooseSaveLocation(defaultFilename: string, defaultDir?: string): Promise<string | null> {
    const dx = this.dx.sub({ name: 'chooseSaveLocation' });

    try {
      // Use provided defaultDir, or last saved dir, or Documents dir
      let targetDir = defaultDir;
      if (!targetDir) {
        const lastSaveDir = this.fn.persist.get(kLastSaveDir);
        targetDir = lastSaveDir || this.fn.os.getDir_Documents();
      }

      const defaultPath = this.fn.os.pathJoin(targetDir, defaultFilename);

      const uri = await this.fn.vscodeapis.showSaveDialog({
        defaultUri: this.fn.vscodeapis.uriFromPath(defaultPath),
        filters: {
          'PDF files': ['pdf'],
        },
        title: 'Save PDF As',
      });

      if (uri) {
        const path = this.fn.vscodeapis.uriToPath(uri);
        
        // Save the directory for next time
        const savedDir = this.fn.os.pathDirname(path);
        this.fn.persist.set(kLastSaveDir, savedDir);
        
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
    // Use console.log for static method (no dx instance available)
    // This is intentional for static utility method
    console.log(message);
  }
}

// end, UI.ts
