import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
  type iconSlotTriad_t,
} from './UIMenu';
import { UIWebView } from './UIWebView';
import { DocInfo_PDF } from './DocInfo_PDF';
import { DocInfo_PaperPrinter } from './DocInfo_PaperPrinter';
import type { LanguageId_t } from './Stylize';
import { Yaml } from './Yaml';
import { kEmptyNoPersist } from './Persist';
import {
  type PageSizeIdMenuItems_t,
  type OrientMenuItems_t,
  type MarginIdMenuItems_t,
  type FontSizeIdMenuItems_t,
  type HeaderFooterPos_t,
  type HeaderFooterSubmenu_t,
  type PrintMenuItems_t,
  type PageMenuItems_t,
  kPageSizeId,
  kOrient,
  kMarginId,
  kHeaderFooter,
  kHeaderFooterMenuIds,
  kFontSizeId,
  kPrint,
  kPageSizeIdById,
  kMarginIdById,
  kHeaderFooterSubmenuById,
  kPageMenuItemsById,
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
  private static readonly kYaml = {
    icon_box_portrait_svg: '',
    icon_orient_figure_svg: '',
    icon_orient_portrait_svg: '',
    icon_orient_landscape_svg: '',
    icon_margin_none_svg: '',
    icon_margin_minimal_svg: '',
    icon_margin_normal_svg: '',
    icon_margin_wide_svg: '',
  } as const;

  private app: App;
  private pdfDoc: DocInfo_PDF | null = null; // In-memory PDF document (DocInfo_PDF abstraction)
  private uiwebview: UIWebView | null = null;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof PaperPrinter.kYaml>;

  public docInfo: DocInfo_PaperPrinter;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('PaperPrinter');

    // Initialize docInfo
    this.docInfo = new DocInfo_PaperPrinter(app);

    // Initialize YAML loader
    this._yaml = new Yaml(app, 'src/PaperPrinter.yaml', PaperPrinter.kYaml);
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  get yaml() {
    return this._yaml.get();
  }

  // Computed line height from font size
  get lineHeightPx(): number {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const fontSizeId = this.app.uimenumgr.getValueForSelectedByMenuId(kFontSizeId.id);
    return parseInt(fontSizeId || kFontSizeId.alt, 10) * editorTypo.sizeToHeightRatio;
  }

  /**
   * Handle print request from UIWebView
   */
  async handlePrintRequest(printType: string): Promise<void> {
    const dx = this.dx.sub('handlePrintRequest');

    try {
      await this.generatePdf();
      if (!this.pdfDoc) {
        dx.error('Failed to generate PDF');
        return;
      }

      if (printType === 'preview')
        await this.app.pdf.printWithPreview(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
      else if (printType === 'direct')
        await this.app.pdf.printDirectly(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
      else if (printType === 'save')
        await this.app.pdf.saveAsPDF(this.pdfDoc, this.docInfo.printTitle || 'Print Output');

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
      const category = this.app.tabinspector.detectActiveTabCategory();
      if (category === 'preview') {
        // TODO: Handle preview tab capture - need to extract raw code from HTML
        // or implement HTML-to-PDF conversion for preview tabs
        this.dx.error(
          'Printing from preview tabs is not yet supported with the new PDF architecture'
        );
        return;
      }

      const info = this.app.tabinspector.getEditorSelectionOrAll();
      if (!info || !info.text || !info.languageId) {
        this.dx.error('No active editor or content found');
        return;
      }

      this.docInfo.rawCode = info.text.trim();
      this.docInfo.languageId = info.languageId as LanguageId_t;
      const selection = this.app.vscodeapis.getActiveTextEditor()?.selection;
      let printableLabel = info.name;
      if (selection && !selection.isEmpty) {
        const start = selection.start.line + 1;
        const end = selection.end.line + 1;
        printableLabel =
          start === end ? `Line ${start} of ${info.name}` : `Lines ${start}-${end} of ${info.name}`;
      }
      this.docInfo.printTitle = printableLabel;

      // Create menus if they don't exist yet (needed before accessing theme menu)
      this.createMenus();

      // Initialize theme choice if not set yet
      const currentTheme = this.app.uimenumgr.getValueForSelectedByMenuId(kTheme.id);
      if (!currentTheme) {
        this.app.uimenumgr.setPersistForMenuId(kTheme.id, this.app.vscodeapis.getActiveThemeId());
      }

      // Initialize header/footer content defaults from docInfo if not persisted
      // Also sync docInfo from persisted values if they differ
      for (const menuId of kHeaderFooterMenuIds) {
        const persistedValue = this.app.uimenumgr.getValueForSelectedByMenuId(menuId);
        const docInfoValue = this.app.pdf.docInfo[menuId as keyof typeof this.app.pdf.docInfo] as
          | HeaderFooterSubmenu_t
          | typeof kHeaderFooter.none
          | undefined;

        if (persistedValue === undefined) {
          // No persisted value - initialize from docInfo if it has a value
          if (docInfoValue && docInfoValue !== kHeaderFooter.none) {
            this.app.uimenumgr.setPersistForMenuId(menuId, docInfoValue);
          } else {
            // Default to 'none' if no value set
            this.app.uimenumgr.setPersistForMenuId(menuId, kHeaderFooter.none);
            (
              this.app.pdf.docInfo as unknown as Record<
                string,
                HeaderFooterSubmenu_t | typeof kHeaderFooter.none
              >
            )[menuId] = kHeaderFooter.none;
          }
        } else if (persistedValue === kHeaderFooter.none) {
          // Persisted value is 'none' - sync docInfo to 'none'
          if (docInfoValue !== kHeaderFooter.none) {
            (
              this.app.pdf.docInfo as unknown as Record<
                string,
                HeaderFooterSubmenu_t | typeof kHeaderFooter.none
              >
            )[menuId] = kHeaderFooter.none;
          }
        } else if (docInfoValue !== persistedValue) {
          // Sync docInfo from persisted value (cast needed since persistedValue is string)
          (
            this.app.pdf.docInfo as unknown as Record<
              string,
              HeaderFooterSubmenu_t | typeof kHeaderFooter.none
            >
          )[menuId] = persistedValue as HeaderFooterSubmenu_t;
        }
      }

      // Generate PDF
      await this.generatePdf();

      // Validate we have a PDF document
      if (!this.pdfDoc) {
        throw new Error('PDF document not generated');
      }

      // Create webview and initialize message handlers
      this.uiwebview = new UIWebView(this.app);
      this.uiwebview.init();

      // Display PDF in webview panel (passes DocInfo_PDF, UIWebView extracts data)
      await this.uiwebview.displayPdfPanel(this.pdfDoc, `Print: ${printableLabel}`);

      this.dx.out(`Opened webview for ${printableLabel}`);
    } catch (error) {
      this.dx.error(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current font family
   */
  private getCurrentFontFamily(): string {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return editorTypo.fontFamily;
  }

  private async generatePdf(): Promise<void> {
    const dx = this.dx.sub('generatePdf');

    try {
      // Get current settings
      const fontSizeValue = this.app.uimenumgr.getValueForSelectedByMenuId(kFontSizeId.id);
      const fontSize = parseInt(fontSizeValue || kFontSizeId.alt, 10);
      dx.out(`PDF GENERATION: Using font size ${fontSize}px`);
      const theme = (this.app.uimenumgr.getValueForSelectedByMenuId(kTheme.id) ||
        kTheme.alt) as string;

      // Validate and normalize pageSizeId - use lookup table, fall back to default if invalid
      const rawPageSizeId = this.app.uimenumgr.getValueForSelectedByMenuId(kPageSizeId.id);
      const pageSizeId: PageSizeIdMenuItems_t =
        rawPageSizeId && rawPageSizeId in kPageSizeIdById
          ? (rawPageSizeId as PageSizeIdMenuItems_t)
          : (kPageSizeId.alt as PageSizeIdMenuItems_t);

      // Validate and normalize orient - clamp to valid values, fall back to default if invalid
      const rawOrient = this.app.uimenumgr.getValueForSelectedByMenuId(kOrient.id);
      const orient: 'portrait' | 'landscape' =
        rawOrient === 'portrait' || rawOrient === 'landscape'
          ? rawOrient
          : (kOrient.alt as 'portrait' | 'landscape');

      // Validate and normalize marginId - use lookup table, fall back to default if invalid
      const rawMarginId = this.app.uimenumgr.getValueForSelectedByMenuId(kMarginId.id);
      const marginId: MarginIdMenuItems_t =
        rawMarginId && rawMarginId in kMarginIdById
          ? (rawMarginId as MarginIdMenuItems_t)
          : (kMarginId.alt as MarginIdMenuItems_t);

      // Sync header/footer content from persistence
      for (const menuId of kHeaderFooterMenuIds) {
        const persistedValue = this.app.uimenumgr.getValueForSelectedByMenuId(menuId);
        // Only sync if there's a persisted value - otherwise keep docInfo defaults
        if (persistedValue !== undefined) {
          (
            this.app.pdf.docInfo as unknown as Record<
              string,
              HeaderFooterSubmenu_t | typeof kHeaderFooter.none
            >
          )[menuId] = persistedValue as HeaderFooterSubmenu_t | typeof kHeaderFooter.none;
        }
      }

      // Set properties on PDF's docInfo
      this.app.pdf.docInfo.fontFamily = this.getCurrentFontFamily();
      this.app.pdf.docInfo.fontSizePx = fontSize;
      this.app.pdf.docInfo.lineHeightPx = this.lineHeightPx;
      this.app.pdf.docInfo.theme = theme;
      this.app.pdf.docInfo.pageSizeId = pageSizeId;
      this.app.pdf.docInfo.orient = orient;
      this.app.pdf.docInfo.marginId = marginId;

      // Set document content
      this.app.pdf.docInfo.code = this.docInfo.rawCode;
      this.app.pdf.docInfo.languageId = this.docInfo.languageId;
      this.app.pdf.docInfo.title = this.docInfo.printTitle;

      // Generate complete PDF during tokenization (unified approach)
      dx.out(`Generating complete PDF with unified tokenize + build approach`);

      // Generate the complete PDF in one pass
      this.pdfDoc = await this.app.pdf.generatePdf();

      // Log PDF object creation for reuse verification (Stage 4.3)
      const pdfObjectId = this.pdfDoc ? `pdfDoc@${this.pdfDoc.instanceId}` : 'null';
      dx.out(`PDF object created: ${pdfObjectId} (reused for webview, print, save)`);
      dx.out(
        `PDF object reuse verification: Same object will be used for webview display and print/save operations`
      );

      dx.out(`PDF generation complete: ${this.pdfDoc.pageTotal} pages using unified approach`);
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
    if (this.app.uimenumgr.getAllMenus().length > 0) {
      return;
    }

    // Menu configs - use shared kMenus array
    const menus = kMenus;

    // Build menu configs from constants
    const menuConfigs: Array<{
      id: MenuId_t | string;
      displayName: string;
      iconSlot: string;
      isFlyout: boolean;
      menuItems: () => UIMenuItem_t[];
      flyoutMenuItemIds: readonly string[];
      selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>;
    }> = menus.map(menuConst => {
      const methodName = menuConst.methodName || menuConst.displayName;
      return {
        id: menuConst.id,
        displayName: menuConst.displayName,
        iconSlot: menuConst.icon,
        isFlyout: menuConst.isFlyout,
        menuItems: (this[`menuItems_${methodName}` as keyof this] as () => UIMenuItem_t[]).bind(
          this
        ),
        flyoutMenuItemIds: menuConst.flyoutMenuItemIds,
        selectionHandler: (
          this[`handleSelection_${methodName}` as keyof this] as (
            menuId: MenuId_t,
            menuItemId: MenuItemId_t
          ) => Promise<HandleSelection_t>
        ).bind(this),
      };
    });

    // Add header/footer position menus (these don't have constants)
    kHeaderFooterMenuIds.forEach(menuId => {
      const [, pos] = menuId.split('_') as [string, HeaderFooterPos_t];
      menuConfigs.push({
        id: menuId as MenuId_t,
        displayName: kHeaderFooterMenuItemsById[pos].displayName as string,
        iconSlot: '',
        isFlyout: true,
        menuItems: this.menuItems_HeaderFooterContent.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_HeaderFooter.bind(this),
      });
    });

    menuConfigs.forEach(config => {
      this.dx.out(`Creating menu: ${config.id} with iconSlot: ${config.iconSlot}`);

      // Special handling for zoomLevel menu - add text_edit widget
      let iconSlotTriad: iconSlotTriad_t;
      if (config.id === 'zoomLevel') {
        iconSlotTriad = {
          begin: ` `,
          main: `text_edit: {"width": "3ch", "constraints_regex": "^\\\\d+$", "value_min": ${kZoomLevel.min * 100}, "value_max": ${kZoomLevel.max * 100}}`,
          end: `▼`,
        };
      } else if (config.id === 'zoomOut') {
        iconSlotTriad = {
          begin: ` `,
          main: config.iconSlot,
          end: ``,
        };
      } else {
        iconSlotTriad = {
          begin: ``,
          main: config.iconSlot,
          end: ``,
        };
      }

      const menu = this.app.uimenumgr.createMenu(
        config.id as MenuId_t,
        config.displayName,
        iconSlotTriad,
        config.isFlyout,
        config.menuItems,
        [...config.flyoutMenuItemIds],
        config.selectionHandler
      );
      this.app.uimenumgr.addMenu(menu);
    });
  }

  // Build list methods for each menu type
  private menuItems_Print(): UIMenuItem_t[] {
    return kPrint.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));
  }

  private menuItems_Theme(): UIMenuItem_t[] {
    const themes = this.app.stylize.getThemes();

    return themes.map(theme => {
      // UIMenu.ts will handle default selection marker in displayName
      return {
        id: theme.id,
        displayName: theme.displayName,
        iconSlot: ``,
        iconSlot_prefix: ``,
        iconSlot_suffix: ``,
      };
    });
  }

  private menuItems_Text(): UIMenuItem_t[] {
    const dx = this.dx.sub('menuItems_Text');
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const editorSize = editorTypo.fontSize;
    dx.out(`editorSize = ${editorSize}`);

    // Use centralized const as base - single source of truth for font sizes
    const sizeOptions: UIMenuItem_t[] = kFontSizeId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
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
      sizeOptions.unshift({ id: String(editorSize), displayName: `${editorSize}px`, iconSlot: ``, iconSlot_prefix: ``, iconSlot_suffix: `` });
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
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));

    // Page submenu references (Size, Orient, Margin)
    const pageSubmenus = [kPageSizeId.id, kOrient.id, kMarginId.id].map(id => {
      if (id === kPageSizeId.id)
        return { id: id as MenuItemId_t, displayName: kPageSizeId.displayName, iconSlot: ``, iconSlot_prefix: ``, iconSlot_suffix: `` };
      if (id === kOrient.id) return { id: id as MenuItemId_t, displayName: kOrient.displayName, iconSlot: ``, iconSlot_prefix: ``, iconSlot_suffix: `` };
      return { id: id as MenuItemId_t, displayName: kMarginId.displayName, iconSlot: ``, iconSlot_prefix: ``, iconSlot_suffix: `` };
    });

    return [...headerFooterMenus, ...pageSubmenus] as UIMenuItem_t[];
  }

  private menuItems_PageSizeId(): UIMenuItem_t[] {
    // Use centralized const - single source of truth for page sizes
    return kPageSizeId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));
  }

  private menuItems_Orient(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return kOrient.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: this.app.templateDictReplace(item.displayName, this.yaml),
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));
  }

  private menuItems_MarginId(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return kMarginId.menuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: this.app.templateDictReplace(item.displayName, this.yaml),
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));
  }

  private menuItems_Header(): UIMenuItem_t[] {
    // Return position flyouts: ←, ↔, →
    return kHeaderFooter.menuItems.map(item => ({
      id: `header_${item.id}` as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    })) as UIMenuItem_t[];
  }

  private menuItems_Footer(): UIMenuItem_t[] {
    // Return position flyouts: ←, ↔, →
    return kHeaderFooter.menuItems.map(item => ({
      id: `footer_${item.id}` as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    })) as UIMenuItem_t[];
  }

  private menuItems_HeaderFooterContent(): UIMenuItem_t[] {
    // Return content choices: title, #, total, #+total
    // Note: No "None" option - clicking the selected item again will deselect it
    return kHeaderFooter.subMenuItems.map(item => ({
      id: item.id as MenuItemId_t,
      displayName: item.displayName,
      iconSlot: ``,
      iconSlot_prefix: ``,
      iconSlot_suffix: ``,
    }));
  }

  private menuItems_ZoomLevel(): UIMenuItem_t[] {
    // Format shortcuts using OS-specific key mappings
    return kZoomLevel.menuItems.map(item => {
      let displayName: string = item.displayName;
      
      // Add shortcut to displayName if it exists
      // Use template replacement for platform-specific key display
      if ('shortcut' in item && item.shortcut) {
        // Replace "Ctrl/Cmd +" with template variable for OS-specific replacement
        const shortcutTemplate = item.shortcut.replace(/Ctrl\/Cmd\s*\+\s*/g, '{{os-ctrl-cmd}}+');
        const shortcut = this.app.os.dictReplace(shortcutTemplate);
        displayName = `${displayName} ${shortcut}`;
      }
      
      const menuItem: UIMenuItem_t = {
        id: item.id as MenuItemId_t,
        displayName: displayName as string,
        iconSlot: ``,
        iconSlot_prefix: ``,
        iconSlot_suffix: ``,
      };
      
      // Add value property if it exists (for numeric zoom levels)
      if ('value' in item && item.value !== undefined) {
        (menuItem as any).value = item.value;
      }
      
      return menuItem;
    });
  }

  private menuItems_ZoomOut(): UIMenuItem_t[] {
    // Zoom out has no menu items - it's just a button
    return [];
  }

  private menuItems_ZoomIn(): UIMenuItem_t[] {
    // Zoom in has no menu items - it's just a button
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
    const dx = this.dx.sub('regenerateAndUpdateWebview');
    try {
      // Reset PDF caches and state
      this.app.pdf.resetCaches();

      // Regenerate PDF with current settings
      await this.generatePdf();

      // Validate we have a PDF document
      if (!this.pdfDoc) {
        throw new Error('PDF document not generated');
      }

      // Update webview with new PDF (same logic as initial display)
      if (this.uiwebview) {
        dx.out('Updating webview with new PDF...');

        // Display PDF in webview (reuses existing panel)
        const tabName = this.docInfo.printTitle || 'Document';
        void this.uiwebview.displayPdfPanel(this.pdfDoc, `Print: ${tabName}`);
      } else {
        dx.out('No webview to update');
      }
    } catch (error) {
      dx.error(`Error regenerating PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  private async handleSelection_Print(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Print');
    let id = kEmptyNoPersist;
    let value: string | number | boolean = kEmptyNoPersist;
    // defaultId will return empty id, empty value,

    if (menuItemId !== UIMenu.defaultId()) {
      dx.out(`Print action: ${String(menuItemId)}`);
      await this.generatePdf();

      if (this.pdfDoc) {
        try {
          if (menuItemId === 'preview') {
            dx.out('Printing with preview...');
            await this.app.pdf.printWithPreview(
              this.pdfDoc,
              this.docInfo.printTitle || 'Print Output'
            );
          } else if (menuItemId === 'direct') {
            dx.out('Printing directly...');
            await this.app.pdf.printDirectly(
              this.pdfDoc,
              this.docInfo.printTitle || 'Print Output'
            );
          } else if (menuItemId === 'save') {
            dx.out('Saving as PDF...');
            await this.app.pdf.saveAsPDF(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
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
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_HeaderFooter');

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
        // Get current value for this position
        const currentValue = this.app.pdf.docInfo[menuId as keyof typeof this.app.pdf.docInfo] as
          | HeaderFooterSubmenu_t
          | typeof kHeaderFooter.none
          | undefined;

        // Toggle behavior: if clicking the same item that's already selected, deselect it (set to 'none')
        if (currentValue === menuItemId) {
          id = kHeaderFooter.none;
          value = kHeaderFooter.none;
        } else {
          id = String(menuItemId);
          value = menuItemId as HeaderFooterSubmenu_t;
        }

        // Persist the value (including 'none') - docInfo will be synced in generatePdf()
        this.app.uimenumgr.setPersistForMenuId(menuId, value);
        void this.regenerateAndUpdateWebview();
      }
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Theme(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Theme');

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the theme ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.app.vscodeapis.getActiveThemeId();
      const availableThemes = this.app.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || kTheme.alt;
      id = currentEditorTheme || fallbackTheme;
      value = id; // value is the theme ID
      dx.out(`returning editor theme: ${id}`);
    } else {
      // Update theme
      dx.out(`updating theme to ${menuItemId}`);
      this.app.uimenumgr.setPersistForMenuId(kTheme.id, menuItemId);
      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Text(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Text');

    let id = menuItemId; // If we're here, someone picked a valid menu item, we don't need to be so overly checking
    let value: string | number | boolean = id; // In this case, the value is the fontSizePx which happens to be the id

    if (menuItemId === UIMenu.defaultId()) {
      // Return the actual editor font size for default selection
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      id = String(editorTypo.fontSize);
      value = id;
    } else {
      this.app.uimenumgr.setPersistForMenuId(kFontSizeId.id, menuItemId);
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
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_PageSizeId');

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the page size ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return locale-based default page size (letter for US/CA/MX, a4 for rest)
      const locale = this.app.os.getLocale();
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
      this.app.uimenumgr.setPersistForMenuId(kPageSizeId.id, menuItemId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Orient(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Orient');

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the orient ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the default orientation (always portrait)
      id = 'portrait';
      value = id; // value is the orientation
    } else {
      // Update orientation
      this.app.uimenumgr.setPersistForMenuId(kOrient.id, menuItemId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_MarginId(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_MarginId');
    const defaultMarginId: MarginIdMenuItems_t = 'normal';

    let id = menuItemId;
    let value: string | number | boolean = id; // value is the margin ID

    if (menuItemId === UIMenu.defaultId()) {
      // Return the default margin (always normal)
      id = defaultMarginId;
      value = id; // value is the margin ID
      dx.out(`returning default margin: ${id}`);
    } else {
      this.app.uimenumgr.setPersistForMenuId(kMarginId.id, menuItemId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_ZoomLevel(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_ZoomLevel');

    let id = menuItemId;
    let value: string | number | boolean = menuItemId;

    if (menuItemId === UIMenu.defaultId()) {
      // Return default zoom level (100% = 1.0)
      id = '1.00';
      value = 1.0;
    } else {
      // Find the menu item to get its value property
      const menuItem = kZoomLevel.menuItems.find(item => item.id === menuItemId);
      
      if (menuItemId === 'fitPage' || menuItemId === 'fitWidth') {
        // Special actions - persist as-is
        value = menuItemId;
      } else if (menuItem && 'value' in menuItem && menuItem.value !== undefined) {
        // Use value property from menu item
        value = menuItem.value as number;
      } else {
        // Fallback: parse zoom level from id (e.g., "1.00" -> 1.0)
        const scale = parseFloat(menuItemId);
        // Validate scale is within valid range
        if (!isNaN(scale) && scale >= kZoomLevel.min && scale <= kZoomLevel.max) {
          value = scale;
        } else {
          dx.out(`Invalid zoom scale: ${scale}, ignoring`);
          value = Number(kZoomLevel.alt); // Default to alt value
          id = kZoomLevel.alt;
        }
      }
      // Persist zoom level - webview will handle the actual zoom change via menuItemSelected message
      this.app.uimenumgr.setPersistForMenuId(kZoomLevel.id, menuItemId);
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_ZoomOut(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_ZoomOut');
    // Zoom out button clicked - webview will handle via menuItemSelected message
    dx.done();
    return { id: 'zoomOut', value: 'zoomOut' };
  }

  private async handleSelection_ZoomIn(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t
  ): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_ZoomIn');
    // Zoom in button clicked - webview will handle via menuItemSelected message
    dx.done();
    return { id: 'zoomIn', value: 'zoomIn' };
  }

  // Removed CSS hacks; rely on theme overrides
}

// end, PaperPrinter.ts
