"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const VSCodeAPIs_1 = require("./VSCodeAPIs");
const UI_1 = require("./UI");
const PDF_1 = require("./PDF");
const PaperPrinter_1 = require("./PaperPrinter");
const Stylize_1 = require("./Stylize");
const TabInspector_1 = require("./TabInspector");
const OS_1 = require("./OS");
const UIMenuMgr_1 = require("./UIMenuMgr");
const UIWebView_1 = require("./UIWebView");
const Coords_1 = require("./Coords");
const Registry_1 = require("./Registry");
const Persist_1 = require("./Persist");
const Yaml_1 = require("./Yaml");
const Utils_1 = require("./Utils");
const _entrypoint_extId_t_1 = require("./_entrypoint_extId_t");
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
class App {
    // Namespace - References kExtId (single source of truth)
    static kNs = _entrypoint_extId_t_1.kExtId;
    static kNs_ = App.kNs + '_';
    // Instance properties for easy access
    ns = App.kNs;
    ns_ = App.kNs_;
    // Core infrastructure
    reg;
    fn;
    dx;
    // Lazy accessors for components (for backwards compatibility during migration)
    get vscodeapis() { return this.reg.getInstance('vscodeapis'); }
    get ui() { return this.reg.getInstance('ui'); }
    get pdf() { return this.reg.getInstance('pdf'); }
    get paperprinter() { return this.reg.getInstance('paperprinter'); }
    get stylize() { return this.reg.getInstance('stylize'); }
    get tabinspector() { return this.reg.getInstance('tabinspector'); }
    get os() { return this.reg.getInstance('os'); }
    get uimenumgr() { return this.reg.getInstance('uimenumgr'); }
    get coords() { return this.reg.getInstance('coords'); }
    get uiwebview() { return this.reg.getInstance('uiwebview'); }
    constructor(args) {
        const { context, vscode } = args;
        // Create Registry with all component classes
        // Registry bootstraps Diagnostics first, then creates components lazily
        // Special init params passed via 'init' dict for components needing extra args
        this.reg = new Registry_1.Registry({
            app: this,
            components: [
                Utils_1.Utils, // Utility methods (templateDictReplace, forceNumber, etc.)
                VSCodeAPIs_1.VSCodeAPIs,
                UI_1.UI,
                PDF_1.PDF,
                PaperPrinter_1.PaperPrinter,
                Stylize_1.Stylize,
                TabInspector_1.TabInspector,
                UIMenuMgr_1.UIMenuMgr,
                UIWebView_1.UIWebView, // Singleton webview manager
                OS_1.OS, // OS has static create() factory
                Coords_1.Coords, // Singleton coordinate system
                Persist_1.Persist, // Persist singleton for shared state management
                Yaml_1.Yaml, // Yaml factory (exposes create method)
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
        this.dx = this.reg.getInstance('dx');
        // Force VSCodeAPIs creation now - commands must register at activation
        this.reg.getInstance('vscodeapis');
    }
    /**
     * Cleanup all components
     */
    done() {
        this.reg.done();
        // dx is managed by Registry, will be cleaned up there
    }
}
exports.App = App;
// end, App.ts
//# sourceMappingURL=App.js.map