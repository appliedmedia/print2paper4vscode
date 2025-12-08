/**
 * PaperPrinter - Main Extension Controller
 *
 * Orchestrates PDF generation, menu management, and UI interactions for the
 * Print2Paper VS Code extension. Handles document printing, page layout,
 * zoom controls, and menu state persistence.
 *
 * Key Responsibilities:
 * - Coordinate PDF generation via DocInfo_PDF
 * - Manage all UI menus (page size, margins, headers/footers, zoom)
 * - Handle zoom functionality and keyboard shortcuts
 * - Persist user preferences and menu selections
 * - Generate and update webview content
 *
 * @module src/PaperPrinter
 */

import type { Registry } from './Registry';
import type { UI_t } from './UI';
import type { PersistValue_t } from './Persist';
import type { contextDict_t } from './types/UI_t';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
  type iconSlotTriad_t,
  type iconSlotTriad_main_t,
} from './UIMenu';
import { UIWebView } from './UIWebView';
import { DocInfo_PaperPrinter } from './DocInfo_PaperPrinter';
import type { LanguageId_t } from './Stylize';
import { YamlInstance } from './Yaml';
import { kEmptyNoPersist } from './Persist';
import {
  type PageSizeIdMenuItems_t,
  type MarginIdMenuItems_t,
  type HeaderFooterPos_t,
  type HeaderFooterSubmenu_t,
  type UIMenuItemValueFxn_t,
  kPageSizeId,
  kOrient,
  kMarginId,
  kHeaderFooter,
  kHeaderFooterMenuIds,
  kFontSizeId,
  kPrint,
  kPageSizeIdById,
  kMarginIdById,
  kHeaderFooterMenuItemsById,
  kHeader,
  kFooter,
  kPage,
  kTheme,
  kZoomOut,
  kZoomIn,
  kZoomLevel,
  kMenus,
} from './types/PaperPrinter_t';

// Type for theme menu items returned by stylize.getThemes()
type ThemeMenuItem_t = {
  id: string;
  displayName: string;
};

/**
 * PaperPrinter - Main print workflow orchestrator
 *
 * Orchestrates the complete print workflow: tab inspection, content extraction,
 * syntax highlighting, menu creation, webview display, and print operations.
 * Creates all menus (Print, Page, Theme, Font) and handles user interactions.
 * Manages document state and coordinates between PDF, Stylize, and UI components.
 *
 * @input app - Application instance
 * @output Complete print workflow, interactive webview, menu system, print operations
 *
 * @example
 * const printer = new PaperPrinter(app);
 * await printer.handlePrintCommandFromVSCode();
 */
export class PaperPrinter {
  static readonly id = 'paperprinter';

  private static readonly kYaml = {
    icon_box_portrait_svg: '',
    icon_orient_figure_svg: '',
    icon_orient_portrait_svg: '',
    icon_orient_landscape_svg: '',
    icon_margin_none_svg: '',
    icon_margin_normal_svg: '',
    icon_margin_wide_svg: '',
  } as const;

  private reg: Registry;
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: YamlInstance<typeof PaperPrinter.kYaml>;

  private _docInfo: DocInfo_PaperPrinter;

  /**
   * Get the PaperPrinter document info
   */
  docInfo(): DocInfo_PaperPrinter {
    return this._docInfo;
  }

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'vscodeapis.getActiveTextEditor',
      'vscodeapis.getEditorTypography',
      'vscodeapis.renderMarkdownToHtml',
      'tabinspector.detectActiveTabCategory',
      'tabinspector.getEditorSelectionOrAll',
      'stylize.getThemes',
      'os.dictReplace',
      'os.getLocale',
      'os.getEditorWindowBounds',
      'os.screenshotWindow',
      'os.fileOpenPrintDialog',
      'ui.showQuickPick',
      'yaml.create',
      'utils.templateDictReplace',
      'utils.forceNumber',
      'utils.hasContent',
      'uimenumgr.getMenuItemIdSelected',
      'uimenumgr.getValueForMenuItemId',
      'uimenumgr.getValueForMenuItemIdSelected',
      'uimenumgr.setValueForPersistIdOnMenuId',
      'uimenumgr.getUIMenus',
      'uimenumgr.createMenu',
      'uimenumgr.addMenu',
      'uiwebview.displayPdfPanel',
      'pdf.docInfo',
      'pdf.readyToPrint',
      'pdf.getPageTotal',
      'pdf.printWithPreview',
      'pdf.printDirectly',
      'pdf.saveAsPDF',
      'pdf.generatePdf',
      'pdf.resetCaches',
      'pdf.setupPdf',
      'pdf.addHeaderAndFooter',
      'pdf.renderFromHTML',
      'pdf.finishPdf'
    );
    this.dx = this.fn.dx.sub({ name: 'PaperPrinter' });

    // Initialize docInfo
    this._docInfo = DocInfo_PaperPrinter.create({ reg: this.reg });

    // Initialize YAML loader via Registry factory
    this._yaml = this.fn.yaml.create({ filePath: 'src/PaperPrinter.yaml', dataStruct: PaperPrinter.kYaml });
  }

  done(): void {
    this.dx.done();
  }

  yaml() {
    return this._yaml.get();
  }

  // Computed line height from font size
  get lineHeightPx(): number {
    const editorTypo = this.fn.vscodeapis.getEditorTypography();
    const fontSizeId = this.fn.uimenumgr.getMenuItemIdSelected(kFontSizeId.id);
    return parseInt(fontSizeId || kFontSizeId.altId, 10) * editorTypo.sizeToHeightRatio;
  }

  /**
   * Handle print request from UIWebView
   */
  async handlePrintRequest(printType: string): Promise<void> {
    const dx = this.dx.sub({ name: 'handlePrintRequest' });

    try {
      await this.generatePdf();
      if (!this.fn.pdf.readyToPrint()) {
        dx.error('Failed to generate PDF');
        return;
      }

      if (printType === 'preview')
        await this.fn.pdf.printWithPreview(this.docInfo().printTitle || 'Print Output');
      else if (printType === 'direct')
        await this.fn.pdf.printDirectly(this.docInfo().printTitle || 'Print Output');
      else if (printType === 'save')
        await this.fn.pdf.saveAsPDF(this.docInfo().printTitle || 'Print Output');

      dx.out(`Print request handled: ${printType}`);
    } finally {
      dx.done();
    }
  }

  /**
   * Handles print command - automatically detects selection vs document
   */
  async handlePrintCommandFromVSCode(): Promise<void> {
    try {
      const category = this.fn.tabinspector.detectActiveTabCategory();
      if (category === 'preview') {
        // Preview tabs: screenshot and print
        await this.handlePreviewTabPrint();
        return;
      }

      const info = this.fn.tabinspector.getEditorSelectionOrAll();
      if (!info || !info.text || !info.languageId) {
        this.dx.error('No active editor or content found');
        return;
      }

      this.docInfo().rawCode = info.text.trim();
      this.docInfo().languageId = info.languageId as LanguageId_t;
      const selection = this.fn.vscodeapis.getActiveTextEditor()?.selection;
      let printableLabel = info.name;
      if (selection && !selection.isEmpty) {
        const start = selection.start.line + 1;
        const end = selection.end.line + 1;
        printableLabel =
          start === end ? `Line ${start} of ${info.name}` : `Lines ${start}-${end} of ${info.name}`;
      }
      this.docInfo().printTitle = printableLabel;

      // Create menus if they don't exist yet
      this.createMenus();

      // Generate PDF
      await this.generatePdf();

      // Validate we have a PDF document
      if (!this.fn.pdf.readyToPrint()) {
        this.dx.error('PDF document not generated');
        throw new Error('PDF document not generated');
      }

      // Display PDF in webview panel using singleton UIWebView
      // (uses this.fn.pdf.docInfo() directly, including title)
      await this.fn.uiwebview.displayPdfPanel();

      this.dx.out(`Opened webview for ${printableLabel}`);
    } catch (error) {
      this.dx.error(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current font family
   */
  private getCurrentFontFamily(): string {
    const editorTypo = this.fn.vscodeapis.getEditorTypography();
    return editorTypo.fontFamily;
  }

  private async generatePdf(): Promise<void> {
    const dx = this.dx.sub({ name: 'generatePdf' });

    try {
      // Get current settings
      const fontSizeValue = this.fn.uimenumgr.getMenuItemIdSelected(kFontSizeId.id);
      const fontSize = parseInt(fontSizeValue || kFontSizeId.altId, 10);
      dx.out(`PDF GENERATION: Using font size ${fontSize}px`);
      const theme = (this.fn.uimenumgr.getMenuItemIdSelected(kTheme.id) || kTheme.altId) as string;

      // Validate and normalize pageSizeId - use lookup table, fall back to default if invalid
      const rawPageSizeId = this.fn.uimenumgr.getMenuItemIdSelected(kPageSizeId.id);
      const pageSizeId: PageSizeIdMenuItems_t =
        rawPageSizeId && rawPageSizeId in kPageSizeIdById
          ? (rawPageSizeId as PageSizeIdMenuItems_t)
          : (kPageSizeId.altId as PageSizeIdMenuItems_t);

      // Validate and normalize orient - clamp to valid values, fall back to default if invalid
      const rawOrient = this.fn.uimenumgr.getMenuItemIdSelected(kOrient.id);
      const orient: 'portrait' | 'landscape' =
        rawOrient === 'portrait' || rawOrient === 'landscape'
          ? rawOrient
          : (kOrient.altId as 'portrait' | 'landscape');

      // Validate and normalize marginId - use lookup table, fall back to default if invalid
      const rawMarginId = this.fn.uimenumgr.getMenuItemIdSelected(kMarginId.id);
      const marginId: MarginIdMenuItems_t =
        rawMarginId && rawMarginId in kMarginIdById
          ? (rawMarginId as MarginIdMenuItems_t)
          : (kMarginId.altId as MarginIdMenuItems_t);

      // Set properties on PDF's docInfo
      this.fn.pdf.docInfo().fontFamily = this.getCurrentFontFamily();
      this.fn.pdf.docInfo().fontSizePx = fontSize;
      this.fn.pdf.docInfo().lineHeightPx = this.lineHeightPx;
      this.fn.pdf.docInfo().theme = theme;
      this.fn.pdf.docInfo().pageSizeId = pageSizeId;
      this.fn.pdf.docInfo().orient = orient;
      this.fn.pdf.docInfo().marginId = marginId;

      // Set document content
      this.fn.pdf.docInfo().code = this.docInfo().rawCode;
      this.fn.pdf.docInfo().languageId = this.docInfo().languageId;
      this.fn.pdf.docInfo().title = this.docInfo().printTitle;

      // Branch based on content type and useRenderedMd flag
      if (this.docInfo().languageId === 'markdown' && this.docInfo().useRenderedMd) {
        // Rendered markdown mode: Get HTML from VS Code markdown API
        dx.out(`Generating PDF from rendered markdown HTML`);
        const editor = this.fn.vscodeapis.getActiveTextEditor();
        if (!editor) throw new Error('No active editor');
        
        const html = await this.fn.vscodeapis.renderMarkdownToHtml({
          markdown: this.docInfo().rawCode,
          document: editor.document
        });
        
        // Setup PDF for HTML rendering
        this.fn.pdf.setupPdf();
        this.fn.pdf.addHeaderAndFooter();
        
        // Render HTML to PDF
        this.fn.pdf.renderFromHTML(html);
        
        // Finish PDF
        this.fn.pdf.finishPdf();
      } else {
        // Raw source mode: Tokenize with Shiki (works for all languages including markdown)
        dx.out(`Generating complete PDF with unified tokenize + build approach`);
        await this.fn.pdf.generatePdf();
      }

      dx.out(
        `PDF generation complete: ${this.fn.pdf.getPageTotal()} pages`
      );
    } catch (error) {
      dx.out(`Error in generatePdf: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // Create menus when needed for the webview
  private createMenus(): void {
    // Avoid duplicates across multiple openings
    if (this.fn.uimenumgr.getUIMenus().length > 0) {
      return;
    }

    // Menu configs - use shared kMenus array
    const menus = kMenus;

    // Build menu configs from constants
    const menuConfigs: Array<{
      id: MenuId_t | string;
      displayName: string;
      iconSlotTriad: iconSlotTriad_t;
      isFlyout: boolean;
      menuItems: () => UIMenuItem_t[];
      flyoutMenuItemIds: readonly string[];
      selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>;
    }> = menus.map(menuConst => {
      const methodName = menuConst.methodName || menuConst.displayName;
      return {
        id: menuConst.id,
        displayName: menuConst.displayName,
        iconSlotTriad: (menuConst as { iconSlotTriad: iconSlotTriad_t }).iconSlotTriad,
        isFlyout: menuConst.isFlyout,
        menuItems: (this[`menuItems_${methodName}` as keyof this] as () => UIMenuItem_t[]).bind(
          this
        ),
        flyoutMenuItemIds: menuConst.flyoutMenuItemIds,
        selectionHandler: ((
          menuId: MenuId_t,
          menuItemId: MenuItemId_t,
          contextDict?: contextDict_t
        ) => {
          const handler = this[`handleSelection_${methodName}` as keyof this] as (
            args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
          ) => Promise<HandleSelection_t>;
          return handler.call(this, { menuId, menuItemId });
        }).bind(this),
      };
    });

    // Add header/footer position menus (these don't have constants)
    kHeaderFooterMenuIds.forEach(menuId => {
      const [, pos] = menuId.split('_') as [string, HeaderFooterPos_t];
      menuConfigs.push({
        id: menuId as MenuId_t,
        displayName: kHeaderFooterMenuItemsById[pos].displayName as string,
        iconSlotTriad: { begin: '', main: '', end: '' },
        isFlyout: true,
        menuItems: this.menuItems_HeaderFooterContent.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: ((
          menuId: MenuId_t,
          menuItemId: MenuItemId_t,
          contextDict?: contextDict_t
        ) => {
          return this.handleSelection_HeaderFooter({ menuId, menuItemId });
        }).bind(this),
      });
    });

    menuConfigs.forEach(config => {
      this.dx.out(
        `Creating menu: ${config.id} with iconSlotTriad: ${JSON.stringify(config.iconSlotTriad)}`
      );

      const menu = this.fn.uimenumgr.createMenu({
        id: config.id as MenuId_t,
        displayName: config.displayName,
        iconSlotTriad: config.iconSlotTriad,
        isFlyout: config.isFlyout,
        menuItems: config.menuItems,
        flyoutMenuItemIds: [...config.flyoutMenuItemIds],
        selectionHandler: config.selectionHandler
      });
      this.fn.uimenumgr.addMenu(menu);
    });
  }

  // Build list methods for each menu type
  private menuItems_Print(): UIMenuItem_t[] {
    return kPrint.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));
  }

  private menuItems_Theme(): UIMenuItem_t[] {
    const themes = this.fn.stylize.getThemes();

    return themes.map((theme: ThemeMenuItem_t) => {
      // UIMenu.ts will handle default selection marker in displayName
      return {
        id: theme.id,
        displayName: theme.displayName,
        iconSlotTriad: { begin: '', main: '', end: '' },
      };
    });
  }

  private menuItems_Text(): UIMenuItem_t[] {
    const dx = this.dx.sub({ name: 'menuItems_Text' });
    const editorTypo = this.fn.vscodeapis.getEditorTypography();
    const editorSize = editorTypo.fontSize;
    dx.out(`editorSize = ${editorSize}`);

    // Use centralized const as base - single source of truth for font sizes
    const sizeOptions: UIMenuItem_t[] = kFontSizeId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));

    // Check if editor size already exists in the list
    const existingEditorOption = sizeOptions.find(option => option.id === String(editorSize));

    if (existingEditorOption) {
      dx.out(`Editor size ${editorSize} already exists in list`);
      // Editor size already exists - UIMenu.ts will handle default selection marker in displayName
      // existingEditorOption.displayName stays as is
    } else {
      dx.out(`Editor size ${editorSize} not in list, adding it`);
      // Editor size not in list - add it at the top without default selection marker
      sizeOptions.unshift({
        id: String(editorSize),
        displayName: `${editorSize}px`,
        iconSlotTriad: { begin: '', main: '', end: '' },
      });
    }

    dx.out(
      `Generated ${sizeOptions.length} menu items: ${sizeOptions.map(item => item.id).join(', ')}`
    );
    dx.done();
    return sizeOptions;
  }

  private menuItems_Page(): UIMenuItem_t[] {
    // Header and Footer menus (which have their own flyouts) - now first
    const headerFooterMenus = [kHeader.id, kFooter.id].map(id => ({
      id: id as MenuItemId_t,
      displayName: id === kHeader.id ? kHeader.displayName : kFooter.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));

    // Page submenu references (Size, Orient, Margin)
    const pageSubmenus = [kPageSizeId.id, kOrient.id, kMarginId.id].map(id => {
      if (id === kPageSizeId.id)
        return {
          id: id as MenuItemId_t,
          displayName: kPageSizeId.displayName,
          iconSlotTriad: { begin: '', main: '', end: '' },
        };
      if (id === kOrient.id)
        return {
          id: id as MenuItemId_t,
          displayName: kOrient.displayName,
          iconSlotTriad: { begin: '', main: '', end: '' },
        };
      return {
        id: id as MenuItemId_t,
        displayName: kMarginId.displayName,
        iconSlotTriad: { begin: '', main: '', end: '' },
      };
    });

    return [...headerFooterMenus, ...pageSubmenus] as UIMenuItem_t[];
  }

  private menuItems_PageSizeId(): UIMenuItem_t[] {
    // Use centralized const - single source of truth for page sizes
    return kPageSizeId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));
  }

  private menuItems_Orient(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return kOrient.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: this.fn.utils.templateDictReplace(item.displayName, this.yaml()),
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));
  }

  private menuItems_MarginId(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return kMarginId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: this.fn.utils.templateDictReplace(item.displayName, this.yaml()),
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));
  }

  private menuItems_Header(): UIMenuItem_t[] {
    // Return position flyouts: ←, ↔, →
    return kHeaderFooter.menuItems.map(item => ({
      id: `header_${item.id}` as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    })) as UIMenuItem_t[];
  }

  private menuItems_Footer(): UIMenuItem_t[] {
    // Return position flyouts: ←, ↔, →
    return kHeaderFooter.menuItems.map(item => ({
      id: `footer_${item.id}` as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    })) as UIMenuItem_t[];
  }

  private menuItems_HeaderFooterContent(): UIMenuItem_t[] {
    // Return content choices: title, #, total, #+total
    // Note: No "None" option - clicking the selected item again will deselect it
    return kHeaderFooter.subMenuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlotTriad: { begin: '', main: '', end: '' },
    }));
  }

  private menuItems_ZoomLevel(): UIMenuItem_t[] {
    // Return static menu items only
    // The text_edit widget in the button shows the current value
    // No need to dynamically add custom zoom levels to the dropdown
    return kZoomLevel.menuItems.map(item => {
      const itemId = item.id;
      let shortcut: string | undefined;

      // Process shortcut if it exists
      if ('shortcut' in item && item.shortcut) {
        // Replace "Ctrl/Cmd +" with template variable for OS-specific replacement
        const shortcutTemplate = item.shortcut.replace(/Ctrl\/Cmd\s*\+\s*/g, '{{os-ctrl-cmd}}+');
        shortcut = this.fn.os.dictReplace(shortcutTemplate);
      }

      const menuItem: UIMenuItem_t = {
        id: itemId as MenuItemId_t,
        displayName: item.displayName,
        iconSlotTriad: { begin: '', main: '', end: '' },
        shortcutCode: 'shortcutCode' in item ? item.shortcutCode : undefined,
        shortcut: shortcut,
      };

      // Add value property if it exists - polymorphic type supports multiple use cases:
      // 1. Literal number: value: 1.0 (static zoom level like 100%)
      // 2. Literal string: value: "title" (for headers/footers - though not used in zoom menu)
      // 3. Resolver function: value: (dict) => ... (dynamic values like fitWidth, fitPage)
      //
      // Resolver functions receive validated UIMenuItemDict_t with all required keys present
      // and return number | string | undefined. No defensive checks needed in resolvers.
      // Type checked at compile time via constants definition.
      if ('value' in item && item.value !== undefined) {
        const value = item.value;
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'function') {
          menuItem.value = value as number | string | UIMenuItemValueFxn_t;
        } else {
          this.dx.error(`Invalid zoom level value type: ${typeof value} for item ${itemId}`);
        }
      }

      return menuItem;
    });
  }

  private menuItems_ZoomInOut(): UIMenuItem_t[] {
    // Zoom in/out buttons have no menu items - they're just buttons
    return [];
  }

  // Selection handler methods for each menu type
  /**
   * Regenerate PDF and update webview after any option change
   * This is the ONLY place that should regenerate PDFs for menu changes
   *
   * IN-PLACE REGENERATION STRATEGY:
   * 1. Invalidate all PDF caches and reset state
   * 2. Regenerate the PDF from scratch with new settings
   * 3. Update the webview's PageRender with new PDF
   * 4. Send clearAllPages to force webview to reload all pages
   *
   * This avoids the jarring flash of closing/reopening the webview.
   * The key fix: clearAllPages now clears db.pdfDocs cache in webview.
   */
  private async regenerateAndUpdateWebview(): Promise<void> {
    const dx = this.dx.sub({ name: 'regenerateAndUpdateWebview' });
    try {
      // Reset PDF caches and state
      this.fn.pdf.resetCaches();

      // Regenerate PDF with current settings
      await this.generatePdf();

      // Validate we have a PDF document
      if (!this.fn.pdf.readyToPrint()) {
        this.dx.error('PDF document not generated');
        throw new Error('PDF document not generated');
      }

      // Update webview with new PDF (same logic as initial display)
      // UIWebView is a singleton, displayPdfPanel() will update existing panel if already open
      dx.out('Updating webview with new PDF...');

      // Display PDF in webview (reuses existing panel, uses title from docInfo)
      void this.fn.uiwebview.displayPdfPanel();
    } catch (error) {
      dx.error(`Error regenerating PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  private async handleSelection_Print(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_Print' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;
    let id = kEmptyNoPersist;
    let value: string | number | boolean = kEmptyNoPersist;
    // defaultId will return empty id, empty value,

    if (menuItemId !== UIMenu.defaultId()) {
      dx.out(`Print action: ${String(menuItemId)}`);
      await this.generatePdf();

      if (this.fn.pdf.readyToPrint()) {
        try {
          if (menuItemId === 'preview') {
            dx.out('Printing with preview...');
            await this.fn.pdf.printWithPreview(this.docInfo().printTitle || 'Print Output');
          } else if (menuItemId === 'direct') {
            dx.out('Printing directly...');
            await this.fn.pdf.printDirectly(this.docInfo().printTitle || 'Print Output');
          } else if (menuItemId === 'save') {
            dx.out('Saving as PDF...');
            await this.fn.pdf.saveAsPDF(this.docInfo().printTitle || 'Print Output');
          }
          dx.out(`Print action ${String(menuItemId)} completed successfully`);
        } catch (error) {
          dx.error(`Print action ${String(menuItemId)} failed: ${error}`);
        }
      } else {
        dx.out('No PDF document available for printing');
      }
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Header() /* menuId: MenuId_t, menuItemId: MenuItemId_t */
  : Promise<HandleSelection_t> {
    // Header menu doesn't have direct selections, just opens flyouts
    return { id: kEmptyNoPersist, value: kEmptyNoPersist };
  }

  private async handleSelection_Footer() /* menuId: MenuId_t, menuItemId: MenuItemId_t */
  : Promise<HandleSelection_t> {
    // Footer menu doesn't have direct selections, just opens flyouts
    return { id: kEmptyNoPersist, value: kEmptyNoPersist };
  }

  private async handleSelection_HeaderFooter(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_HeaderFooter' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;

    // Default return values
    let id: string = kEmptyNoPersist;
    let value: string | number | boolean = kEmptyNoPersist;

    // Only handle header/footer position menus
    if (menuId.startsWith('header_') || menuId.startsWith('footer_')) {
      // Handle default case - return calculated default value based on position
      if (menuItemId === UIMenu.defaultId()) {
        // Calculate default based on DocInfo_PDF defaults:
        // header_middle: 'title', footer_middle: 'pageTotal', all others: kHeaderFooter.none
        if (menuId === 'header_middle') {
          id = 'title';
        } else if (menuId === 'footer_middle') {
          id = 'pageTotal';
        } else {
          id = kHeaderFooter.none;
        }
        value = id;
      } else {
        // Get current value from persist
        const currentValue = this.fn.uimenumgr.getMenuItemIdSelected(menuId) || kHeaderFooter.none;

        // Toggle behavior: if clicking the same item that's already selected, deselect it (set to 'none')
        if (currentValue === menuItemId) {
          id = kHeaderFooter.none;
          value = kHeaderFooter.none;
        } else {
          id = String(menuItemId);
          value = menuItemId as HeaderFooterSubmenu_t;
        }

        // Persist the value (including 'none')
        this.fn.uimenumgr.setValueForPersistIdOnMenuId({
          menuId,
          persistId: menuId as UI_t,
          value: value as PersistValue_t
        });
        void this.regenerateAndUpdateWebview();
      }
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Theme(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_Theme' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the theme ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.fn.vscodeapis.getActiveThemeId();
      const availableThemes = this.fn.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || kTheme.altId;
      id = currentEditorTheme || fallbackTheme;
      value = id; // value is the theme ID
      dx.out(`returning editor theme: ${id}`);
    } else {
      // Update theme
      dx.out(`updating theme to ${menuItemId}`);
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kTheme.id,
        persistId: kTheme.id as UI_t,
        value: menuItemId as PersistValue_t
      });
      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Text(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_Text' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;

    let id = menuItemId; // If we're here, someone picked a valid menu item, we don't need to be so overly checking
    let value: string | number | boolean = id; // In this case, the value is the fontSizePx which happens to be the id

    if (menuItemId === UIMenu.defaultId()) {
      // Return the actual editor font size for default selection
      const editorTypo = this.fn.vscodeapis.getEditorTypography();
      id = String(editorTypo.fontSize);
      value = id;
    } else {
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kFontSizeId.id,
        persistId: kFontSizeId.id as UI_t,
        value: menuItemId as PersistValue_t
      });
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Page() /* menuId: MenuId_t, menuItemId: MenuItemId_t */
  : Promise<HandleSelection_t> {
    // Page menu is just a flyout parent - no default selection
    return { id: kEmptyNoPersist, value: kEmptyNoPersist };
  }

  private async handleSelection_PageSizeId(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_PageSizeId' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the page size ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return locale-based default page size (letter for US/CA/MX, a4 for rest)
      const locale = this.fn.os.getLocale();
      dx.out(`Locale detected: ${locale}`);

      const parts = locale.split(/[-_]/);
      const region = parts.pop()?.toUpperCase() || '';
      dx.out(`Region parsed: ${region}`);

      const letterRegions = ['US', 'CA', 'MX', '419'];
      const isLetterSize = letterRegions.includes(region);
      dx.out(`Is letter size region? ${isLetterSize}`);

      id = isLetterSize ? 'letter' : 'a4';
      value = id; // value is the page size ID
      dx.out(`Returning locale-based default page size: ${id}`);
    } else {
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kPageSizeId.id,
        persistId: kPageSizeId.id as UI_t,
        value: menuItemId as PersistValue_t
      });
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Orient(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_Orient' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the orient ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the default orientation (always portrait)
      id = 'portrait';
      value = id; // value is the orientation
    } else {
      // Update orientation
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kOrient.id,
        persistId: kOrient.id as UI_t,
        value: menuItemId as PersistValue_t
      });
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_MarginId(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_MarginId' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;
    const defaultMarginId: MarginIdMenuItems_t = 'normal';

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the margin ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the default margin (always normal)
      id = defaultMarginId;
      value = id; // value is the margin ID
      dx.out(`returning default margin: ${id}`);
    } else {
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kMarginId.id,
        persistId: kMarginId.id as UI_t,
        value: menuItemId as PersistValue_t
      });
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  /**
   * Helper: Update text_edit widget value for zoom level
   * Saves to persistId so text_edit can display the current zoom value
   * @param zoomValue - The zoom scale value (e.g., 1.18)
   */
  private zoomLevel_setTextEdit(zoomValue: number): void {
    const dx = this.dx.sub({ name: 'zoomLevel_setTextEdit' });
    if (this.fn.utils.hasContent(zoomValue)) {
      const menuId = kZoomLevel.id;
      const triadMain: iconSlotTriad_main_t = kZoomLevel.iconSlotTriad.main;
      const persistId = triadMain.persistId;
      if (persistId) {
        const persistValue = this.fn.utils.forceNumber(zoomValue) as PersistValue_t;
        this.fn.uimenumgr.setValueForPersistIdOnMenuId({ menuId, persistId, value: persistValue });
        dx.out(`Saved ${persistValue} to menu[${menuId}].persist[${persistId}]`);
      }
    }
    dx.done();
  }

  /**
   * Handle zoom level selection from dropdown or text edit input
   *
   * Supports:
   * - Predefined zoom levels (e.g., "1.00" for 100%)
   * - Text edit input: percentage values (e.g., "150") or scale (e.g., "1.50")
   * - Special actions: "fitPage", "fitWidth" with {{calc:...}} templates
   *
   * Architecture:
   * - Always persists menuItemId (not the value)
   * - Value lookup handles: menu item values, calc templates, numeric parsing
   * - fitPage/fitWidth use {{calc:...}} templates evaluated with viewport dimensions
   */
  private async handleSelection_ZoomLevel(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_ZoomLevel' });
    dx.out(`ZoomLevel selection: menuItemId=${menuItemId}`);

    let id: MenuItemId_t = menuItemId;
    let value: string | number | boolean = this.fn.uimenumgr.getValueForMenuItemId({ menuId, menuItemId });

    if (menuItemId === UIMenu.defaultId()) {
      // Return default zoom level (100% = 1.0) - no side effects!
      id = '1.00';
      value = 1.0;
      // Do NOT persist or regenerate - this is just a query for the default value
    } else {
      // Save menuItemId to menu.persist[menuId] for tracking which item is selected
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId,
        persistId: menuId as UI_t,
        value: menuItemId as PersistValue_t
      });

      // Save actual zoom value to persistId (zoomLevel_setTextEdit handles this)
      this.zoomLevel_setTextEdit(this.fn.utils.forceNumber(value));
      void this.regenerateAndUpdateWebview();
    }
    dx.done();
    return { id, value };
  }

  /**
   * Handle zoom adjustment (in/out) button clicks
   *
   * Shared handler for both zoom in and zoom out buttons.
   * Direction is determined by menuId: zoomOut = -1, zoomIn = +1
   */
  private async handleSelection_ZoomInOut(
    args: { menuId: MenuId_t; menuItemId: MenuItemId_t }
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub({ name: 'handleSelection_ZoomInOut' });
    dx.require(args, ['menuId', 'menuItemId']);
    const { menuId, menuItemId } = args;
    let id = '';
    let value: string | number | boolean = '';

    // Buttons have no default - only process actual clicks
    if (menuItemId !== UIMenu.defaultId()) {
      // Determine direction from menuId with explicit error handling
      let direction: number;
      if (menuId === kZoomOut.id) {
        direction = -1;
      } else if (menuId === kZoomIn.id) {
        direction = +1;
      } else {
        dx.error(`Unknown menuId: ${menuId}. Expected ${kZoomOut.id} or ${kZoomIn.id}`);
        dx.done();
        return { id, value };
      }

      // Get current zoom value with proper validation
      const rawZoom = this.fn.uimenumgr.getValueForMenuItemIdSelected(kZoomLevel.id);
      const currentZoom = this.fn.utils.forceNumber(rawZoom);
      
      // Validate currentZoom is numeric; fall back to altValue if not
      if (Number.isNaN(currentZoom) || currentZoom === 0) {
        dx.out(`Invalid currentZoom (${rawZoom}), using altValue: ${kZoomLevel.altValue}`);
        const fallbackZoom = Number(kZoomLevel.altValue);
        if (Number.isNaN(fallbackZoom)) {
          dx.error(`altValue is also invalid: ${kZoomLevel.altValue}`);
          dx.done();
          return { id, value };
        }
      }
      
      const validCurrentZoom = Number.isNaN(currentZoom) || currentZoom === 0 
        ? Number(kZoomLevel.altValue) 
        : currentZoom;
      
      dx.out(`${menuId}: currentZoom=${validCurrentZoom}, direction=${direction}`);

      // Apply stepAmount in the specified direction, clamp to min/max
      // Note: * 100 / 100 rounds to 2 decimals to avoid floating-point precision errors (e.g., 0.1 + 0.2 = 0.30000000000004)
      const adjustment = direction * kZoomLevel.stepAmount;
      const newZoom = Math.max(
        kZoomLevel.min,
        Math.min(kZoomLevel.max, Math.round((validCurrentZoom + adjustment) * 100) / 100)
      );
      dx.out(`${menuId}: newZoom=${newZoom}`);

      // Persist the new zoom level (custom value - menuItemId = menuId)
      this.fn.uimenumgr.setValueForPersistIdOnMenuId({
        menuId: kZoomLevel.id,
        persistId: kZoomLevel.id as UI_t,
        value: kZoomLevel.id as PersistValue_t
      });
      this.zoomLevel_setTextEdit(newZoom);
      void this.regenerateAndUpdateWebview();

      id = menuId;
      value = newZoom;
    }

    dx.done();
    return { id, value };
  }

  /**
   * Handle preview tab printing via screenshot
   */
  private async handlePreviewTabPrint(): Promise<void> {
    const dx = this.dx.sub({ name: 'handlePreviewTabPrint' });
    
    try {
      const message = 'Due to VS Code\'s implementation of private data in Preview tabs, ' +
                      'they cannot be printed except via screenshot. Do that?';
      
      const choice = await this.fn.ui.showQuickPick([
        { label: 'Take Screenshot & Print', value: 'yes' },
        { label: 'Cancel', value: 'no' }
      ]);
      
      if (choice === 'yes') {
        await this.screenshotAndPrint();
      }
    } finally {
      dx.done();
    }
  }

  /**
   * Screenshot editor window and print
   */
  private async screenshotAndPrint(): Promise<void> {
    const dx = this.dx.sub({ name: 'screenshotAndPrint' });
    
    try {
      // Try to get window bounds (works for Cursor, VS Code, etc.)
      let bounds = await this.fn.os.getEditorWindowBounds();
      
      // If bounds unavailable, fall back to full screen
      if (!bounds) {
        dx.out('Window bounds unavailable, using full screen screenshot');
        bounds = undefined; // screenshotWindow will use full screen
      }
      
      // Take screenshot (window bounds or full screen)
      const screenshotPath = await this.fn.os.screenshotWindow(bounds);
      
      // Print screenshot using existing print workflow
      await this.fn.os.fileOpenPrintDialog(screenshotPath);
    } finally {
      dx.done();
    }
  }

  // Removed CSS hacks; rely on theme overrides
}

// end, PaperPrinter.ts
