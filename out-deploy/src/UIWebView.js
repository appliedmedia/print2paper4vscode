"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIWebView = void 0;
const PaperPrinter_t_1 = require("./types/PaperPrinter_t");
/**
 * UIWebView - Lightweight webview container that can create and manage different components
 * Acts as a flexible orchestrator for webview-related functionality
 */
class UIWebView {
    static id = 'uiwebview';
    static kYaml = {
        webview_html: '',
        webview_css: '',
        webview_js: '',
    };
    reg;
    fn;
    dx;
    panelId = null;
    handlersRegistered = false;
    _yaml;
    // Bound handler references for proper registration/unregistration
    handleDragEndBound;
    handleMenuItemSelectedBound;
    handleDxMessageBound;
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('vscodeapis.getOrCreateWebviewPanel', 'vscodeapis.removePanel', 'os.fileRead', 'yaml.create', 'persist.set', 'utils.forceNumber', 'utils.templateDictReplace', 'uimenumgr.getMenuItemIdSelected', 'uimenumgr.getValueForMenuItemId', 'uimenumgr.handleMenuItemSelected', 'pdf.docInfo', 'ui.addToolbar', 'ui.registerMessageHandler', 'ui.unregisterMessageHandler', 'ui.yaml');
        this.dx = this.fn.dx.sub({ name: 'UIWebView' });
        this._yaml = this.fn.yaml.create({ filePath: 'src/UIWebView.yaml', dataStruct: UIWebView.kYaml });
        // Bind handlers once in constructor to maintain same reference
        this.handleDragEndBound = this.handleDragEnd.bind(this);
        this.handleMenuItemSelectedBound = this.handleMenuItemSelected.bind(this);
        this.handleDxMessageBound = this.handleDxMessage.bind(this);
        // All initialization happens here - no separate init() needed
        this.registerMessageHandlers();
    }
    yaml() {
        return this._yaml.get();
    }
    /**
     * Display PDF in webview panel (new simplified architecture)
     *
     * Accepts either PDFData_t or DocInfo_PDF - extracts data and converts on the fly.
     * Creates new panel on first call, updates existing panel on subsequent calls.
     * The PDF is embedded as base64 data URL due to VS Code postMessage limitations.
     */
    async displayPdfPanel() {
        const dx = this.dx.sub({ name: 'displayPdfPanel' });
        // Use DocInfo_PDF directly from app.pdf.docInfo()
        const docInfo = this.fn.pdf.docInfo();
        if (!docInfo.pdfDoc) {
            dx.error('PDF document not generated');
            throw new Error('PDF document not generated');
        }
        // Extract data and use jsPDF's native data URL format
        const pdfData = {
            arrayBuffer: docInfo.asArrayBuffer(),
            pageTotal: docInfo.pageTotal,
            pageSizePx: docInfo.pageSizePx,
            title: docInfo.title || 'PDF Document',
        };
        // Use jsPDF's native data URL format
        const pdf_data_url = docInfo.asDataUrl();
        dx.require({ pdfData }, ['pdfData']);
        try {
            // Validate PDF data - display error if invalid instead of falling back
            if (!pdfData.arrayBuffer) {
                dx.error('pdfData.arrayBuffer is required');
                throw new Error('pdfData.arrayBuffer is required');
            }
            if (!pdfData.pageTotal || pdfData.pageTotal < 1) {
                dx.error(`pdfData.pageTotal must be at least 1, got ${pdfData.pageTotal}`);
                throw new Error(`pdfData.pageTotal must be at least 1, got ${pdfData.pageTotal}`);
            }
            if (!pdfData.pageSizePx?.widthPx || !pdfData.pageSizePx?.heightPx) {
                dx.error(`pdfData.pageSizePx.widthPx and .heightPx are required`);
                throw new Error(`pdfData.pageSizePx.widthPx and .heightPx are required`);
            }
            // Log PDF object usage for webview (Stage 4.3)
            dx.out(`PDF object usage: Using PDF ArrayBuffer for webview display (${pdfData.arrayBuffer.byteLength} bytes)`);
            // Generate HTML for PDF viewer
            const html = await this.generatePDFHTML(pdf_data_url, pdfData);
            // Add toolbar
            const htmlWithToolbar = await this.fn.ui.addToolbar(html);
            // Create or reuse webview panel
            const panelId = await this.fn.vscodeapis.getOrCreateWebviewPanel({
                title: pdfData.title,
                html: htmlWithToolbar,
                existingPanelId: this.panelId || undefined,
            });
            this.panelId = panelId;
            dx.out(`Created PDF panel: "${pdfData.title}" with ${pdfData.pageTotal} pages`);
            return panelId;
        }
        catch (error) {
            dx.error(`Failed to create PDF panel: ${String(error)}`);
            throw error;
        }
        finally {
            dx.done();
        }
    }
    /**
     * Generate HTML for PDF viewer with embedded PDF
     */
    async generatePDFHTML(pdf_data_url, pdfData) {
        const dx = this.dx.sub({ name: 'generatePDFHTML' });
        try {
            // Load PDF.js library
            const pdfjs_library = this.fn.os.fileRead({ path: 'src/lib/pdf.min.js' });
            if (!pdfjs_library) {
                dx.error('Failed to load PDF.js library');
                throw new Error('Failed to load PDF.js library');
            }
            // Get templates
            const base_css = this.fn.ui.yaml().base_css;
            const templates = this.yaml();
            // Get zoom level from zoomLevel menu persist
            const zoomMenuItemId = this.fn.uimenumgr.getMenuItemIdSelected(PaperPrinter_t_1.kZoomLevel.id) || PaperPrinter_t_1.kZoomLevel.altId;
            const rawZoom = this.fn.uimenumgr.getValueForMenuItemId({ menuId: PaperPrinter_t_1.kZoomLevel.id, menuItemId: zoomMenuItemId });
            // Coerce to number (forceNumber always returns valid number or 0)
            const coercedZoom = this.fn.utils.forceNumber(rawZoom);
            // Use coerced value if finite and positive, otherwise fall back to hardcoded default
            const pdf_zoom_level = Number.isFinite(coercedZoom) && coercedZoom > 0 ? coercedZoom : PaperPrinter_t_1.kZoomLevel.altValue;
            // Create template dictionary
            const templateDict = {
                title: pdfData.title,
                page_total: pdfData.pageTotal.toString(),
                page_width_px: pdfData.pageSizePx.widthPx.toString(),
                page_height_px: pdfData.pageSizePx.heightPx.toString(),
                pdf_data_url,
                pdfjs_library,
                pdf_zoom_level: pdf_zoom_level.toString(),
                zoomLevel_min: PaperPrinter_t_1.kZoomLevel.min.toString(),
                zoomLevel_max: PaperPrinter_t_1.kZoomLevel.max.toString(),
                zoomLevel_stepAmount: PaperPrinter_t_1.kZoomLevel.stepAmount.toString(),
                zoomLevel_in_shortcutCode: PaperPrinter_t_1.kZoomIn.shortcutCode,
                zoomLevel_out_shortcutCode: PaperPrinter_t_1.kZoomOut.shortcutCode,
                zoomLevel_menuItems: JSON.stringify(PaperPrinter_t_1.kZoomLevel.menuItems.map(item => ({
                    id: item.id,
                    displayName: item.displayName,
                    value: 'value' in item && typeof item.value !== 'function' ? item.value : undefined,
                    shortcutCode: 'shortcutCode' in item ? item.shortcutCode : undefined,
                }))),
                toolbar: '{{toolbar}}', // Placeholder for UI.addToolbar()
            };
            // Replace placeholders
            const webview_css = this.fn.utils.templateDictReplace(templates.webview_css, templateDict);
            const webview_js = this.fn.utils.templateDictReplace(templates.webview_js, templateDict);
            // Generate HTML
            return this.fn.utils.templateDictReplace(templates.webview_html, {
                base_css,
                webview_css,
                webview_js,
                ...templateDict,
            });
        }
        finally {
            dx.done();
        }
    }
    /**
     * Check if webview is currently active
     */
    isActive() {
        return this.panelId !== null;
    }
    /**
     * Get current panel ID
     */
    getPanelId() {
        return this.panelId;
    }
    /**
     * Cleanup webview resources
     */
    done() {
        const dx = this.dx.sub({ name: 'done' });
        try {
            // Unregister message handlers
            if (this.handlersRegistered) {
                const messageHandlers = [
                    { type: 'dragEnd', handler: this.handleDragEndBound },
                    { type: 'menuItemSelected', handler: this.handleMenuItemSelectedBound },
                    { type: 'dx', handler: this.handleDxMessageBound },
                ];
                messageHandlers.forEach(({ type, handler }) => {
                    this.fn.ui.unregisterMessageHandler({ messageType: type, handler });
                });
                this.handlersRegistered = false;
            }
            // Remove panel from VSCodeAPIs map
            if (this.panelId) {
                this.fn.vscodeapis.removePanel(this.panelId);
            }
            this.panelId = null;
            dx.out('Webview cleaned up');
        }
        finally {
            dx.done();
        }
    }
    /**
     * Register all webview message handlers
     */
    registerMessageHandlers() {
        if (this.handlersRegistered)
            return;
        const messageHandlers = [
            { type: 'dragEnd', handler: this.handleDragEndBound },
            { type: 'menuItemSelected', handler: this.handleMenuItemSelectedBound },
            { type: 'dx', handler: this.handleDxMessageBound },
        ];
        messageHandlers.forEach(({ type, handler }) => {
            this.fn.ui.registerMessageHandler({ messageType: type, handler });
        });
        this.handlersRegistered = true;
        this.dx.out('Webview message handlers registered');
    }
    /**
     * Handle toolbar drag end message
     */
    async handleDragEnd(msg) {
        const dx = this.dx.sub({ name: 'handleDragEnd' });
        try {
            const left = msg.left;
            if (typeof left === 'number') {
                // Save toolbar position via persist
                this.fn.persist.set('toolbar_pos', left);
                dx.out(`Toolbar position saved: ${left}px`);
            }
        }
        finally {
            dx.done();
        }
    }
    /**
     * Handle menu item selection message
     */
    async handleMenuItemSelected(msg) {
        const { menuId, menuItemId, contextDict } = msg;
        // Forward to UIMenuMgr for handling
        await this.fn.uimenumgr.handleMenuItemSelected(menuId, menuItemId, contextDict);
    }
    /**
     * Handle diagnostic message from webview
     */
    async handleDxMessage(msg) {
        const dx = this.dx.sub({ name: 'dx' }); // Every message has start/done if we debugOn here, too noisy.
        dx.require({ msg }, ['msg']);
        // Output webview diagnostic message via dx.out (forced debug on)
        if (msg.message) {
            dx.print(`[Webview] > ${msg.message}`); // Equivalent of dx.out() with debugOn
        }
        else {
            dx.print('Received dx message without message content');
        }
        dx.done();
    }
}
exports.UIWebView = UIWebView;
// end, UIWebView.ts
//# sourceMappingURL=UIWebView.js.map