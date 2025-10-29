import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
} from './UIMenu';
import { UIWebView } from './UIWebView';
import { DocInfo_PDF } from './DocInfo_PDF';
import type { PageRender, RenderOptions } from './types/PageRender_t';
import { DocInfo_PaperPrinter } from './DocInfo_PaperPrinter';
import type { LanguageId_t } from './Stylize';
import type { Persist_t } from './Persist';
import { Yaml } from './Yaml';
import {
  type PageSizeId_t,
  type Orient_t,
  type MarginId_t,
  type FontSizeId_t,
  kPageSizeId,
  kOrient,
  kMarginId,
  kFontSizeId,
  kPageSizeId_alt,
  kOrient_alt,
  kMarginId_alt,
  kFontSizeId_alt,
  kTheme_alt,
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
    const fontSizeId = this.app.uimenumgr.getValueForSelectedByMenuId('fontSizeId');
    return parseInt(fontSizeId || kFontSizeId_alt, 10) * editorTypo.sizeToHeightRatio;
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
      const themeMenu = this.app.uimenumgr.getMenuById('theme');
      const currentTheme = this.app.uimenumgr.getValueForSelectedByMenuId('theme');
      if (!currentTheme) {
        this.app.uimenumgr.setPersistForMenuId('theme', this.app.vscodeapis.getActiveThemeId());
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
      const fontSizeValue = this.app.uimenumgr.getValueForSelectedByMenuId('fontSizeId');
      const fontSize = parseInt(fontSizeValue || kFontSizeId_alt, 10);
      dx.out(`PDF GENERATION: Using font size ${fontSize}px`);
      const theme = (this.app.uimenumgr.getValueForSelectedByMenuId('theme') ||
        kTheme_alt) as string;
      const pageSizeId = (this.app.uimenumgr.getValueForSelectedByMenuId('pageSizeId') ||
        kPageSizeId_alt) as PageSizeId_t;
      const orient = (this.app.uimenumgr.getValueForSelectedByMenuId('orient') || kOrient_alt) as
        | 'portrait'
        | 'landscape';
      const marginId = (this.app.uimenumgr.getValueForSelectedByMenuId('marginId') ||
        kMarginId_alt) as MarginId_t;

      // Create render options
      const options: RenderOptions = {
        fontFamily: this.getCurrentFontFamily(),
        fontSizePx: fontSize,
        lineHeightPx: this.lineHeightPx,
        theme,
        pageSizeId,
        orient,
        marginId,
      };

      // Generate complete PDF during tokenization (unified approach)
      dx.out(`Generating complete PDF with unified tokenize + build approach`);

      // Generate the complete PDF in one pass
      this.pdfDoc = await this.app.pdf.generatePdf(
        this.docInfo.rawCode,
        this.docInfo.languageId,
        options
      );

      dx.out(`PDF generation complete: ${this.pdfDoc.getPageTotal()} pages using unified approach`);
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

    const menuConfigs = [
      {
        id: 'print',
        displayName: 'Print',
        icon: '🖨',
        isFlyout: false,
        menuItems: this.menuItems_Print.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_Print.bind(this),
      },
      {
        id: 'page',
        displayName: 'Page',
        icon: '📄',
        isFlyout: false,
        menuItems: this.menuItems_Page.bind(this),
        flyoutMenuItemIds: ['pageSizeId', 'orient', 'marginId'],
        selectionHandler: this.handleSelection_Page.bind(this),
      },
      {
        id: 'pageSizeId',
        displayName: 'Size',
        icon: '', // submenu indicated by no icon, see Page > Size
        isFlyout: true,
        menuItems: this.menuItems_pageSizeId.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_PageSizeId.bind(this),
      },
      {
        id: 'orient',
        displayName: 'Orient',
        icon: '', // submenu indicated by no icon, see Page > Orient
        isFlyout: true,
        menuItems: this.menuItems_Orient.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_Orient.bind(this),
      },
      {
        id: 'marginId',
        displayName: 'Margin',
        icon: '', // submenu indicated by no icon, see Page > Margin
        isFlyout: true,
        menuItems: this.menuItems_MarginId.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_MarginId.bind(this),
      },
      {
        id: 'theme',
        displayName: 'Theme',
        icon: '🎨',
        isFlyout: false,
        menuItems: this.menuItems_Theme.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_Theme.bind(this),
      },
      {
        id: 'fontSizeId',
        displayName: 'Text',
        icon: 'Tt',
        isFlyout: false,
        menuItems: this.menuItems_Text.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_Text.bind(this),
      },
    ];

    menuConfigs.forEach(config => {
      this.dx.out(`Creating menu: ${config.id} with icon: ${config.icon}`);
      const menu = this.app.uimenumgr.createMenu(
        config.id as MenuId_t,
        config.displayName,
        config.icon,
        config.isFlyout,
        config.menuItems,
        config.flyoutMenuItemIds,
        config.selectionHandler
      );
      this.app.uimenumgr.addMenu(menu);
      this.dx.out(`Added menu: ${config.id}`);
    });

    // Debug: show what menus were created
    const allMenus = this.app.uimenumgr.getAllMenus();
    this.dx.out(`Total menus created: ${allMenus.length}`);
    allMenus.forEach(menu => {
      this.dx.out(`Menu: ${menu.id}, Icon: ${menu.icon}, DisplayName: ${menu.displayName}`);
    });
  }

  // Build list methods for each menu type
  private menuItems_Print(): UIMenuItem_t[] {
    return [
      { id: 'preview', displayName: 'Print with Preview' },
      { id: 'direct', displayName: 'Print' },
      { id: 'save', displayName: 'Save as PDF' },
    ];
  }

  private menuItems_Theme(): UIMenuItem_t[] {
    const themes = this.app.stylize.getThemes();

    return themes.map(theme => {
      // No need to add 📝 here, UIMenu.ts will handle it based on default selection
      return {
        id: theme.id,
        displayName: theme.displayName,
      };
    });
  }

  private menuItems_Text(): UIMenuItem_t[] {
    const dx = this.dx.sub('menuItems_Text');
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const editorSize = editorTypo.fontSize;
    dx.out(`editorSize = ${editorSize}`);

    // Use centralized const as base - single source of truth for font sizes
    const sizeOptions: UIMenuItem_t[] = (Object.keys(kFontSizeId) as FontSizeId_t[]).map(id => ({
      id,
      displayName: kFontSizeId[id].displayName,
    }));

    // Check if editor size already exists in the list
    const existingEditorOption = sizeOptions.find(option => option.id === String(editorSize));

    if (existingEditorOption) {
      dx.out(`Editor size ${editorSize} already exists in list`);
      // Editor size already exists - no need to add 📝 here, UIMenu.ts will handle it
      // existingEditorOption.displayName stays as is
    } else {
      dx.out(`Editor size ${editorSize} not in list, adding it`);
      // Editor size not in list - add it at the top without 📝 suffix
      sizeOptions.unshift({ id: String(editorSize), displayName: `${editorSize}px` });
    }

    dx.out(
      `Generated ${sizeOptions.length} menu items: ${sizeOptions.map(item => item.id).join(', ')}`
    );
    dx.done();
    return sizeOptions;
  }

  private menuItems_Page(): UIMenuItem_t[] {
    return [
      // Size submenu reference (id must match the actual menu id)
      { id: 'pageSizeId', displayName: 'Size' },
      // Orientation submenu reference
      { id: 'orient', displayName: 'Orient' },
      // Margin submenu reference (id must match the actual menu id)
      { id: 'marginId', displayName: 'Margin' },
    ];
  }

  private menuItems_pageSizeId(): UIMenuItem_t[] {
    // Use centralized const - single source of truth for page sizes
    return (Object.keys(kPageSizeId) as PageSizeId_t[]).map(id => ({
      id,
      displayName: kPageSizeId[id].displayName,
    }));
  }

  private menuItems_Orient(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return (Object.keys(kOrient) as Orient_t[]).map(id => ({
      id,
      displayName: this.app.templateDictReplace(kOrient[id].displayName, this.yaml),
    }));
  }

  private menuItems_MarginId(): UIMenuItem_t[] {
    // Use centralized const with template replacement for SVG icons
    return (Object.keys(kMarginId) as MarginId_t[]).map(id => ({
      id,
      displayName: this.app.templateDictReplace(kMarginId[id].displayName, this.yaml),
    }));
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

  private async handleSelection_Print(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Print');
    let id = '';
    let value: string | number | boolean = '';
    // defaultId will return empty id, empty value,

    if (selectedId !== UIMenu.defaultId()) {
      dx.out(`Print action: ${selectedId}`);
      await this.generatePdf();

      if (this.pdfDoc) {
        try {
          if (selectedId === 'preview') {
            dx.out('Printing with preview...');
            await this.app.pdf.printWithPreview(
              this.pdfDoc,
              this.docInfo.printTitle || 'Print Output'
            );
          } else if (selectedId === 'direct') {
            dx.out('Printing directly...');
            await this.app.pdf.printDirectly(
              this.pdfDoc,
              this.docInfo.printTitle || 'Print Output'
            );
          } else if (selectedId === 'save') {
            dx.out('Saving as PDF...');
            await this.app.pdf.saveAsPDF(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
          }
          dx.out(`Print action ${selectedId} completed successfully`);
        } catch (error) {
          dx.error(`Print action ${selectedId} failed: ${error}`);
        }
      } else {
        dx.out('No PDF document available for printing');
      }
    }

    return { id, value };
  }

  private async handleSelection_Theme(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Theme');

    let id = selectedId;
    let value: string | number | boolean = id; // value is the theme ID

    if (selectedId === UIMenu.defaultId()) {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.app.vscodeapis.getActiveThemeId();
      const availableThemes = this.app.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || kTheme_alt;
      id = currentEditorTheme || fallbackTheme;
      value = id; // value is the theme ID
      dx.out(`returning editor theme: ${id}`);
    } else {
      // Update theme
      dx.out(`updating theme to ${selectedId}`);
      this.app.uimenumgr.setPersistForMenuId('theme', selectedId);
      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Text(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Text');

    let id = selectedId; // If we're here, someone picked a valid menu item, we don't need to be so overly checking
    let value: string | number | boolean = id; // In this case, the value is the fontSizePx which happens to be the id

    if (selectedId === UIMenu.defaultId()) {
      // Return the actual editor font size for default selection
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      id = String(editorTypo.fontSize);
      value = id;
    } else {
      this.app.uimenumgr.setPersistForMenuId('fontSizeId', selectedId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Page(/* selectedId: string */): Promise<HandleSelection_t> {
    // Page menu is just a flyout parent - no default selection
    return { id: '', value: '' };
  }

  private async handleSelection_PageSizeId(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_PageSizeId');

    let id = selectedId;
    let value: string | number | boolean = id; // value is the page size ID

    if (selectedId === UIMenu.defaultId()) {
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
      this.app.uimenumgr.setPersistForMenuId('pageSizeId', selectedId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_Orient(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_Orient');

    let id = selectedId;
    let value: string | number | boolean = id; // value is the orient ID

    if (selectedId === UIMenu.defaultId()) {
      // Return the default orientation (always portrait)
      id = 'portrait';
      value = id; // value is the orientation
    } else {
      // Update orientation
      this.app.uimenumgr.setPersistForMenuId('orient', selectedId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  private async handleSelection_MarginId(selectedId: MenuItemId_t): Promise<HandleSelection_t> {
    const dx = this.dx.sub('handleSelection_MarginId');
    const defaultMarginId: MarginId_t = 'normal';

    let id = selectedId;
    let value: string | number | boolean = id; // value is the margin ID

    if (selectedId === UIMenu.defaultId()) {
      // Return the default margin (always normal)
      id = defaultMarginId;
      value = id; // value is the margin ID
      dx.out(`returning default margin: ${id}`);
    } else {
      this.app.uimenumgr.setPersistForMenuId('marginId', selectedId);
      void this.regenerateAndUpdateWebview();
    }

    dx.done();
    return { id, value };
  }

  // Removed CSS hacks; rely on theme overrides
}

// end, PaperPrinter.ts
