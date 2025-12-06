import type { Registry } from './Registry';
import type { WebviewPanelId_t } from './VSCodeAPIs';
import type {
  SendToExt_t,
  SendToExt_dragEnd,
  SendToExt_menuItemSelected,
  SendToExt_dx,
  MessageHandler_t,
} from './types/UI_t';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { YamlInstance } from './Yaml';
import { kZoomLevel, kZoomIn, kZoomOut } from './types/PaperPrinter_t';

/**
 * PDF Data for webview display
 */
export interface PDFData_t {
  arrayBuffer: ArrayBuffer;
  pageTotal: number;
  pageSizePx: {
    widthPx: number;
    heightPx: number;
  };
  title: string;
}

/**
 * UIWebView - Lightweight webview container that can create and manage different components
 * Acts as a flexible orchestrator for webview-related functionality
 */
export class UIWebView {
  static readonly id = 'uiwebview';
  private static readonly kYaml = {
    webview_html: '',
    webview_css: '',
    webview_js: '',
  } as const;

  private reg: Registry;
  private fn: FnImport_t;
  private dx: Diagnostics;
  private panelId: WebviewPanelId_t | null = null;
  private handlersRegistered: boolean = false;
  private _yaml: YamlInstance<typeof UIWebView.kYaml>;

  // Bound handler references for proper registration/unregistration
  private readonly handleDragEndBound: MessageHandler_t;
  private readonly handleMenuItemSelectedBound: MessageHandler_t;
  private readonly handleDxMessageBound: MessageHandler_t;

  // Typed accessors for singleton components
  private get pdf() { return this.reg.getInstance<import('./PDF').PDF>('pdf')!; }
  private get ui() { return this.reg.getInstance<import('./UI').UI>('ui')!; }
  private get uimenumgr() { return this.reg.getInstance<import('./UIMenuMgr').UIMenuMgr>('uimenumgr')!; }

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'vscodeapis.getOrCreateWebviewPanel',
      'vscodeapis.removePanel',
      'os.fileRead',
      'yaml.create',
      'persist.set',
      'utils.forceNumber',
      'utils.templateDictReplace'
    );
    this.dx = this.fn.dx.sub({ name: 'UIWebView' });
    this._yaml = this.fn.yaml.create({ filePath: 'src/UIWebView.yaml', dataStruct: UIWebView.kYaml });

    // Bind handlers once in constructor to maintain same reference
    this.handleDragEndBound = this.handleDragEnd.bind(this) as MessageHandler_t;
    this.handleMenuItemSelectedBound = this.handleMenuItemSelected.bind(this) as MessageHandler_t;
    this.handleDxMessageBound = this.handleDxMessage.bind(this) as MessageHandler_t;
    
    // All initialization happens here - no separate init() needed
    this.registerMessageHandlers();
  }

  get yaml() {
    return this._yaml.get();
  }

  /**
   * Create and configure menu manager (for external use)
   * @deprecated Menu manager should be accessed via this.reg.getInstance('uimenumgr')!
   */
  createMenus() {
    const dx = this.dx.sub({ name: 'createMenus' });

    try {
      // Menu manager is always available via this.reg.getInstance('uimenumgr')!
      dx.out('Returning app menu manager');
      return this.reg.getInstance('uimenumgr')!;
    } finally {
      dx.done();
    }
  }

  /**
   * Get the menu manager
   * @deprecated Use this.reg.getInstance('uimenumgr')! directly
   */
  getMenus() {
    return this.reg.getInstance('uimenumgr')!;
  }

  /**
   * Display PDF in webview panel (new simplified architecture)
   *
   * Accepts either PDFData_t or DocInfo_PDF - extracts data and converts on the fly.
   * Creates new panel on first call, updates existing panel on subsequent calls.
   * The PDF is embedded as base64 data URL due to VS Code postMessage limitations.
   */
  async displayPdfPanel(): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub({ name: 'displayPdfPanel' });

    // Use DocInfo_PDF directly from app.pdf.docInfo
    const docInfo = this.pdf.docInfo;

    if (!docInfo.pdfDoc) {
      dx.error('PDF document not generated');
      throw new Error('PDF document not generated');
    }

    // Extract data and use jsPDF's native data URL format
    const pdfData: PDFData_t = {
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
      dx.out(
        `PDF object usage: Using PDF ArrayBuffer for webview display (${pdfData.arrayBuffer.byteLength} bytes)`
      );

      // Generate HTML for PDF viewer
      const html = await this.generatePDFHTML(pdf_data_url, pdfData);

      // Add toolbar
      const htmlWithToolbar = await this.ui.addToolbar(html);

      // Create or reuse webview panel
      const panelId = await this.fn.vscodeapis.getOrCreateWebviewPanel({
        title: pdfData.title,
        html: htmlWithToolbar,
        existingPanelId: this.panelId || undefined,
      });
      this.panelId = panelId;

      dx.out(`Created PDF panel: "${pdfData.title}" with ${pdfData.pageTotal} pages`);
      return panelId;
    } catch (error) {
      dx.error(`Failed to create PDF panel: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  /**
   * Generate HTML for PDF viewer with embedded PDF
   */
  private async generatePDFHTML(pdf_data_url: string, pdfData: PDFData_t): Promise<string> {
    const dx = this.dx.sub({ name: 'generatePDFHTML' });

    try {
      // Load PDF.js library
      const pdfjs_library = this.fn.os.fileRead({ path: 'src/lib/pdf.min.js' });
      if (!pdfjs_library) {
        dx.error('Failed to load PDF.js library');
        throw new Error('Failed to load PDF.js library');
      }

      // Get templates
      const base_css = this.ui.yaml.base_css;
      const templates = this.yaml;

      // Get zoom level from zoomLevel menu persist
      const zoomMenuItemId =
        this.uimenumgr.getMenuItemIdSelected(kZoomLevel.id) || kZoomLevel.altId;
      const rawZoom = this.uimenumgr.getValueForMenuItemId({ menuId: kZoomLevel.id, menuItemId: zoomMenuItemId });
      // Coerce to number (forceNumber always returns valid number or 0)
      const coercedZoom = this.fn.utils.forceNumber(rawZoom);
      // Use coerced value if finite and positive, otherwise fall back to hardcoded default
      const pdf_zoom_level =
        Number.isFinite(coercedZoom) && coercedZoom > 0 ? coercedZoom : kZoomLevel.altValue;

      // Create template dictionary
      const templateDict = {
        title: pdfData.title,
        page_total: pdfData.pageTotal.toString(),
        page_width_px: pdfData.pageSizePx.widthPx.toString(),
        page_height_px: pdfData.pageSizePx.heightPx.toString(),
        pdf_data_url,
        pdfjs_library,
        pdf_zoom_level: pdf_zoom_level.toString(),
        zoomLevel_min: kZoomLevel.min.toString(),
        zoomLevel_max: kZoomLevel.max.toString(),
        zoomLevel_stepAmount: kZoomLevel.stepAmount.toString(),
        zoomLevel_in_shortcutCode: kZoomIn.shortcutCode,
        zoomLevel_out_shortcutCode: kZoomOut.shortcutCode,
        zoomLevel_menuItems: JSON.stringify(
          kZoomLevel.menuItems.map(item => ({
            id: item.id,
            displayName: item.displayName,
            value: 'value' in item && typeof item.value !== 'function' ? item.value : undefined,
            shortcutCode: 'shortcutCode' in item ? item.shortcutCode : undefined,
          }))
        ),
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
    } finally {
      dx.done();
    }
  }

  /**
   * Check if webview is currently active
   */
  isActive(): boolean {
    return this.panelId !== null;
  }

  /**
   * Get current panel ID
   */
  getPanelId(): WebviewPanelId_t | null {
    return this.panelId;
  }

  /**
   * Cleanup webview resources
   */
  done(): void {
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
          this.ui.unregisterMessageHandler({ messageType: type, handler });
        });

        this.handlersRegistered = false;
      }

      // Remove panel from VSCodeAPIs map
      if (this.panelId) {
        this.fn.vscodeapis.removePanel(this.panelId);
      }

      this.panelId = null;
      dx.out('Webview cleaned up');
    } finally {
      dx.done();
    }
  }

  /**
   * Register all webview message handlers
   */
  private registerMessageHandlers(): void {
    if (this.handlersRegistered) return;

    const messageHandlers = [
      { type: 'dragEnd', handler: this.handleDragEndBound },
      { type: 'menuItemSelected', handler: this.handleMenuItemSelectedBound },
      { type: 'dx', handler: this.handleDxMessageBound },
    ];

    messageHandlers.forEach(({ type, handler }) => {
      this.ui.registerMessageHandler({ messageType: type, handler });
    });

    this.handlersRegistered = true;
    this.dx.out('Webview message handlers registered');
  }

  /**
   * Handle toolbar drag end message
   */
  private async handleDragEnd(msg: SendToExt_dragEnd): Promise<void> {
    const dx = this.dx.sub({ name: 'handleDragEnd' });

    try {
      const left = msg.left;
      if (typeof left === 'number') {
        // Save toolbar position via persist
        this.fn.persist.set('toolbar_pos', left);
        dx.out(`Toolbar position saved: ${left}px`);
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Handle menu item selection message
   */
  private async handleMenuItemSelected(msg: SendToExt_menuItemSelected): Promise<void> {
    const { menuId, menuItemId, contextDict } = msg;
    // Forward to UIMenuMgr for handling
    await this.uimenumgr.handleMenuItemSelected(menuId, menuItemId, contextDict);
  }

  /**
   * Handle diagnostic message from webview
   */
  private async handleDxMessage(msg: SendToExt_dx): Promise<void> {
    const dx = this.dx.sub({ name: 'dx' }); // Every message has start/done if we debugOn here, too noisy.
    dx.require({ msg }, ['msg']);

    // Output webview diagnostic message via dx.out (forced debug on)
    if (msg.message) {
      dx.print(`[Webview] > ${msg.message}`); // Equivalent of dx.out() with debugOn
    } else {
      dx.print('Received dx message without message content');
    }
    dx.done();
  }
}

// end, UIWebView.ts
