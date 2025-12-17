import { VSCodeAPIs } from './VSCodeAPIs';
import { UI } from './UI';
import { PDF } from './PDF';
import { PaperPrinter } from './PaperPrinter';
import { Stylize } from './Stylize';
import { TabInspector } from './TabInspector';
import { OS } from './OS';
import { UIMenuMgr } from './UIMenuMgr';
import { UIWebView } from './UIWebView';
import { Coords } from './Coords';
import type { Diagnostics } from './Diagnostics';
import { Registry, type ComponentClass } from './Registry';
import { Persist } from './Persist';
import { Yaml } from './Yaml';
import { Utils, type ForceNumber_scalar_t, type ForceNumber_dict_t, type ForceNumbers_t } from './Utils';
import type { FnImport_t } from './types/Registry_t';
import type { ExtensionContext } from 'vscode';
import { kExtId } from './_entrypoint_extId_t';

// Re-export type aliases from Utils for backward compatibility
export type { ForceNumber_scalar_t, ForceNumber_dict_t, ForceNumbers_t } from './Utils';

/**
 * App - Main application container and component manager
 *
 * Central orchestrator for the Print2Paper4VSCode extension. Registry manages
 * lazy component creation. App provides shared utilities like template replacement.
 *
 * Components are created lazily by Registry when first accessed via use().
 * VSCodeAPIs is special - created by App with vscode/context, then registered.
 *
 * @input context - VS Code extension context
 * @input vscode - VS Code API module
 * @output Initialized component ecosystem, lifecycle management, template utilities
 *
 * @example
 * const app = new App({ context, vscode });
 * app.init();
 * // Components created lazily when accessed
 * const fn = app.reg.use('pdf.generatePdf');
 * await fn.pdf.generatePdf();
 */
export class App {
  // Namespace - References kExtId (single source of truth)
  public static readonly kNs = kExtId;
  public static readonly kNs_ = App.kNs + '_';
  
  // Instance properties for easy access
  public readonly ns = App.kNs;
  public readonly ns_ = App.kNs_;
  
  // Core infrastructure
  public readonly reg: Registry;
  private fn: FnImport_t;
  public readonly dx: Diagnostics;

  constructor(args: { context: ExtensionContext; vscode: typeof import('vscode') }) {
    const { context, vscode } = args;

    // Create Registry with all component classes
    // Registry bootstraps Diagnostics first, then creates components lazily
    // Special init params passed via 'init' dict for components needing extra args
    this.reg = new Registry({
      app: this,
      components: [
        Utils as unknown as ComponentClass, // Utility methods (templateDictReplace, forceNumber, etc.)
        VSCodeAPIs as unknown as ComponentClass,
        UI,
        PDF,
        PaperPrinter,
        Stylize,
        TabInspector,
        UIMenuMgr,
        UIWebView, // Singleton webview manager
        OS as unknown as ComponentClass, // OS has static create() factory
        Coords, // Singleton coordinate system
        Persist, // Persist singleton for shared state management
        Yaml, // Yaml factory (exposes create method)
      ],
      always: ['dx.sub'],
      init: {
        // Root Diagnostics name
        dx: { name: 'App' },
        // Utils needs namespace values
        utils: { ns: this.ns, ns_: this.ns_ },
        // VSCodeAPIs needs vscode and context at construction
        vscodeapis: { vscode, context },
      },
    });

    // Get our fn and dx - dx instance was created by Registry with name 'App'
    this.fn = this.reg.use();
    this.dx = this.reg.getInstance<Diagnostics>('dx')!;

    // Force VSCodeAPIs creation now - commands must register at activation
    this.reg.getInstance('vscodeapis');
  }


  /**
   * Cleanup all components
   */
  done(): void {
    this.reg.done();
    // dx is managed by Registry, will be cleaned up there
  }
}

// end, App.ts
