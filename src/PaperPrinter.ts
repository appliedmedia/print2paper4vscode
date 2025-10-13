import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';
import { UIMenu, type MenuId_t } from './UIMenu';
import { UIWebView } from './UIWebView';
import type { PDFDoc } from './types/PDF_t';
import type { PageRender } from './types/PageRender_t';
import { DocInfo_PaperPrinter, type MarginId_t } from './DocInfo_PaperPrinter';
import type { LanguageId_t } from './Stylize';

// Page size type and order definition
export type PageSizeId_t = 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
export const kPageSizeIds: PageSizeId_t[] = ['letter', 'legal', 'a3', 'a4', 'a5'];

// Margin type and order definition
export const kMarginIds: MarginId_t[] = ['none', 'minimal', 'normal', 'wide'];

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private pdfDoc: PDFDoc | null = null; // In-memory PDF document (PDFDoc abstraction)
  private uiwebview: UIWebView | null = null;
  private dx: Diagnostics;

  public docInfo: DocInfo_PaperPrinter;

  private _yaml: {
    icon_orient_portrait_svg: string;
    icon_orient_landscape_svg: string;
    icon_margin_none_svg: string;
    icon_margin_minimal_svg: string;
    icon_margin_normal_svg: string;
    icon_margin_wide_svg: string;
  } = {
    icon_orient_portrait_svg: '',
    icon_orient_landscape_svg: '',
    icon_margin_none_svg: '',
    icon_margin_minimal_svg: '',
    icon_margin_normal_svg: '',
    icon_margin_wide_svg: '',
  };

  constructor(app: App) {
    this.app = app;
    this.clipboardCapture = new ClipboardCapture(app);
    this.dx = app.dx.create('PaperPrinter');

    // Initialize docInfo
    this.docInfo = new DocInfo_PaperPrinter(app);
  }

  init(): void {
    this.clipboardCapture.init();
  }

  done(): void {
    this.clipboardCapture.done();
    this.dx.done();
  }

  get yaml() {
    // If already loaded, return it
    if (this._yaml?.icon_orient_portrait_svg) {
      return this._yaml;
    }

    // Load and parse YAML file
    const yaml = this.app.os.fileRead<{
      icon_orient_portrait_svg: string;
      icon_orient_landscape_svg: string;
      icon_margin_none_svg: string;
      icon_margin_minimal_svg: string;
      icon_margin_normal_svg: string;
      icon_margin_wide_svg: string;
    }>('src/PaperPrinter.yaml');

    // Cache it if loaded successfully
    if (yaml) {
      this._yaml = yaml;
    }

    // Return cached value or empty object with default values
    return (
      this._yaml || {
        icon_orient_portrait_svg: '',
        icon_orient_landscape_svg: '',
      }
    );
  }

  // Computed line height from font size
  get lineHeightPx(): number {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const menu = this.app.uimenumgr.getMenuById('fontSizeId');
    return parseInt(menu.persist.fontSizeId || '12', 10) * editorTypo.sizeToHeightRatio;
  }

  // Public façade to decouple TabInspector from internal fields
  async capturePreviewHtml(): Promise<string | null> {
    return this.clipboardCapture.captureAndConvert();
  }

  /**
   * Handle print request from UIWebView
   */
  async handlePrintRequest(printType: string): Promise<void> {
    const dx = this.dx.sub('handlePrintRequest');

    try {
      if (!this.pdfDoc) return;
      void (await this.generatePdf());

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
  async handleFirstPrintCommand(): Promise<void> {
    try {
      const category = this.app.tabinspector.detectActiveTabCategory();
      if (category === 'preview') {
        // TODO: Handle preview tab capture - need to extract raw code from HTML
        // or implement HTML-to-PDF conversion for preview tabs
        this.app.ui.showErrorMessage(
          'Printing from preview tabs is not yet supported with the new PDF architecture'
        );
        return;
      }

      const info = this.app.tabinspector.getEditorSelectionOrAll();
      if (!info || !info.text || !info.languageId) {
        this.app.ui.showErrorMessage('No active editor or content found');
        return;
      }

      this.docInfo.rawCode = info.text;
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

      // Initialize theme choice if not set yet
      const themeMenu = this.app.uimenumgr.getMenuById('theme');
      if (!themeMenu.persist.theme) {
        themeMenu.persist.theme = this.app.vscodeapis.getActiveThemeId();
      }
      this.pdfDoc = await this.app.stylize.styleToPdf(info.text, this.docInfo.languageId, {
        title: this.docInfo.printTitle,
        theme: themeMenu.persist.theme || 'github-light',
      });
      await this.openPrintPrepAndPrompt(printableLabel);
    } catch (error) {
      this.dx.out(`Error handling print: ${error}`);
      this.app.ui.showErrorMessage(
        `Print failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async openPrintPrepAndPrompt(tabName: string): Promise<void> {
    this.docInfo.printTitle = tabName;

    // Create menus and register message handlers when we actually need them
    this.createMenus();

    // Always use webview (handles both single and multiple pages)
    await this.openWebView(tabName);
  }

  /**
   * Open webview (handles both single and multiple pages)
   */
  private async openWebView(tabName: string): Promise<void> {
    const dx = this.dx.sub('openWebView');

    try {
      // Generate PDF (styleToPdf already sets tokens internally)
      await this.generatePdf();

      // Construct PageRender implementation
      const pageRender: PageRender = {
        renderPage: (pageNumber, options) => this.app.pdf.renderPage(pageNumber, options),
        getPageTotal: () => this.app.pdf.getPageTotal(),
        getPageSizePx: () => this.app.pdf.getPageSizePx(),
      };

      // ScrollView options
      const options = {
        title: `Print: ${tabName}`,
        pageSizeId: this.docInfo.persist.pageSizeId as 'letter' | 'legal' | 'a3' | 'a4' | 'a5',
        orient: this.docInfo.persist.orient as 'portrait' | 'landscape',
        fontFamily: this.getCurrentFontFamily(),
        fontSizePx: parseInt(this.docInfo.persist.fontSizeId || '12', 10),
        lineHeightPx: this.lineHeightPx,
        theme: this.docInfo.persist.theme,
      };

      // Create webview and initialize message handlers
      this.uiwebview = new UIWebView(this.app);
      this.uiwebview.init();

      // Create webview panel with page renderer and options
      await this.uiwebview.createPanel(pageRender, options);

      dx.out(`Opened webview for ${tabName}`);
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to open webview: ${String(error)}`);
      throw error;
    } finally {
      dx.done();
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
    // Store the new PDF document
    this.pdfDoc = await this.app.stylize.styleToPdf(this.docInfo.rawCode, this.docInfo.languageId, {
      fontSize: parseInt(this.docInfo.persist.fontSizeId || '12', 10),
      lineHeight: this.lineHeightPx,
      title: this.docInfo.printTitle,
      theme: this.docInfo.persist.theme,
    });
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
        selectionHandler: this.handleSelection_Page.bind(this),
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
  private menuItems_Print(): UIMenuItem[] {
    return [
      { id: 'preview', displayName: 'Print with Preview' },
      { id: 'direct', displayName: 'Print' },
      { id: 'save', displayName: 'Save as PDF' },
    ];
  }

  private menuItems_Theme(): UIMenuItem[] {
    const themes = this.app.stylize.getThemes();

    return themes.map(theme => {
      // No need to add 📝 here, UIMenu.ts will handle it based on default selection
      return {
        id: theme.id,
        displayName: theme.displayName,
      };
    });
  }

  private menuItems_Text(): UIMenuItem[] {
    const dx = this.dx.sub('menuItems_Text');
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const editorSize = editorTypo.fontSize;
    dx.out(`editorSize = ${editorSize}`);

    // Create base size options
    const sizeOptions = [
      { id: '8', displayName: '8px' },
      { id: '9', displayName: '9px' },
      { id: '10', displayName: '10px' },
      { id: '12', displayName: '12px' },
      { id: '14', displayName: '14px' },
      { id: '18', displayName: '18px' },
      { id: '24', displayName: '24px' },
    ];

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

  private menuItems_Page(): UIMenuItem[] {
    return [
      // Size submenu reference
      { id: 'size', displayName: 'Size' },
      // Orientation submenu reference
      { id: 'orient', displayName: 'Orient' },
      // Margin submenu reference
      { id: 'margin', displayName: 'Margin' },
    ];
  }

  private menuItems_pageSizeId(): UIMenuItem[] {
    const pageSizeLabels: Record<PageSizeId_t, string> = {
      letter: 'Letter (8.5" × 11")',
      legal: 'Legal (8.5" × 14")',
      a3: 'A3 (297mm × 420mm)',
      a4: 'A4 (210mm × 297mm)',
      a5: 'A5 (148mm × 210mm)',
    };

    return kPageSizeIds.map(size => ({ id: size, displayName: pageSizeLabels[size] }));
  }

  private menuItems_Orient(): UIMenuItem[] {
    const yaml = this.yaml;

    return [
      { id: 'portrait', displayName: `${yaml.icon_orient_portrait_svg} Portrait` },
      { id: 'landscape', displayName: `${yaml.icon_orient_landscape_svg} Landscape` },
    ];
  }

  private menuItems_MarginId(): UIMenuItem[] {
    return [
      { id: 'none', displayName: 'None (0pt)', icon: this.yaml.icon_margin_none_svg },
      { id: 'minimal', displayName: 'Minimal (5pt)', icon: this.yaml.icon_margin_minimal_svg },
      { id: 'normal', displayName: 'Normal (15pt)', icon: this.yaml.icon_margin_normal_svg },
      { id: 'wide', displayName: 'Wide (30pt)', icon: this.yaml.icon_margin_wide_svg },
    ];
  }

  // Selection handler methods for each menu type
  /**
   * Regenerate PDF and update webview after any option change
   * This is the ONLY place that should regenerate PDFs for menu changes
   */
  private async regenerateAndUpdateWebview(): Promise<void> {
    const dx = this.dx.sub('regenerateAndUpdateWebview');

    try {
      // Regenerate PDF with current settings
      await this.generatePdf();

      // Update PageRender with regenerated PDF
      const pageRender: PageRender = {
        renderPage: this.app.pdf.renderPage.bind(this.app.pdf),
        getPageTotal: this.app.pdf.getPageTotal.bind(this.app.pdf),
        getPageSizePx: this.app.pdf.getPageSizePx.bind(this.app.pdf),
      };

      // Update webview if it exists
      if (this.uiwebview) {
        try {
          await this.uiwebview.updatePageRender(pageRender);
          await this.uiwebview.updateOptions({
            theme: this.docInfo.persist.theme,
            fontSizePx: parseInt(this.docInfo.persist.fontSizeId || '12', 10),
            lineHeightPx: this.lineHeightPx,
            pageSizeId: this.docInfo.persist.pageSizeId as 'letter' | 'legal' | 'a3' | 'a4' | 'a5',
            orient: this.docInfo.persist.orient as 'portrait' | 'landscape',
          });
          dx.out('Webview updated with new configuration');
        } catch (error) {
          this.app.ui.showErrorMessage(`Failed to update webview: ${String(error)}`);
        }
      }

      dx.out('PDF regenerated successfully');
    } catch (error) {
      dx.out(`Error regenerating PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  private async handleSelection_Print(selectedId: string): Promise<string> {
    if (selectedId === UIMenu.defaultId()) {
      return ''; // Print menu has no default selection
    }
    if (!this.pdfDoc) return '';
    void (await this.generatePdf());
    if (selectedId === 'preview')
      await this.app.pdf.printWithPreview(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
    else if (selectedId === 'direct')
      await this.app.pdf.printDirectly(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
    else if (selectedId === 'save')
      await this.app.pdf.saveAsPDF(this.pdfDoc, this.docInfo.printTitle || 'Print Output');
    // TODO: Re-render webview - need access to panel
    return ''; // action handled
  }

  private async handleSelection_Theme(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Theme');
    dx.out(`selectedId = ${selectedId}`);

    let result = '';

    if (selectedId === UIMenu.defaultId()) {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.app.vscodeapis.getActiveThemeId();
      const availableThemes = this.app.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || 'github-light';
      result = currentEditorTheme || fallbackTheme;
      dx.out(`returning editor theme: ${result}`);
    } else {
      // Update theme
      dx.out(`updating theme to ${selectedId}`);
      const menu = this.app.uimenumgr.getMenuById('theme');
      menu.persist.theme = selectedId;

      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
      result = selectedId;
    }

    dx.done();
    return result;
  }

  private async handleSelection_Text(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Text');
    dx.out(`selectedId = ${selectedId}`);

    let result = '';

    if (selectedId === UIMenu.defaultId()) {
      // Return the actual editor font size for default selection
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      result = String(editorTypo.fontSize);
      dx.out(`returning editor size: ${result}`);
    } else {
      // Update font size
      const fontSize = parseInt(selectedId, 10);
      if (!isNaN(fontSize)) {
        dx.out(`updating fontSize to ${fontSize}`);
        const menu = this.app.uimenumgr.getMenuById('fontSizeId');
        if (menu) {
          (menu.persist as any).text = fontSize;
        }

        // Regenerate everything (fire and forget)
        void this.regenerateAndUpdateWebview();
        result = selectedId;
      }
    }

    dx.done();
    return result;
  }

  private async handleSelection_Page(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Page');
    dx.out(`selectedId = ${selectedId}`);

    let result = '';

    if (selectedId === UIMenu.defaultId()) {
      // Return locale-based default page size (letter for US/CA/MX, a4 for rest)
      const locale = this.app.vscodeapis.getLocale() || '  ';
      const parts = locale.split(/[-_]/);
      const region = parts.pop()?.toUpperCase() || '';
      const letterRegions = ['US', 'CA', 'MX', '419'];
      const isLetterSize = letterRegions.includes(region);
      result = isLetterSize ? 'letter' : 'a4';
      dx.out(`returning locale-based default page size: ${result}`);
    } else if (kPageSizeIds.includes(selectedId as PageSizeId_t)) {
      // Update page size
      dx.out(`updating page size to ${selectedId}`);
      const menu = this.app.uimenumgr.getMenuById('pageSizeId');
      if (menu) {
        (menu.persist as any).pageSizeId = selectedId as PageSizeId_t;
      }

      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
      result = selectedId;
    }

    dx.done();
    return result;
  }

  private async handleSelection_Orient(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Orient');
    dx.out(`selectedId = ${selectedId}`);

    let result = '';

    if (selectedId === UIMenu.defaultId()) {
      // Return the default orientation (always portrait)
      result = 'portrait';
      dx.out(`returning default orient: ${result}`);
    } else if (selectedId === 'portrait' || selectedId === 'landscape') {
      // Update orientation
      dx.out(`updating orient to ${selectedId}`);
      const menu = this.app.uimenumgr.getMenuById('orient');
      if (menu) {
        (menu.persist as any).orient = selectedId;
      }

      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
      result = selectedId;
    }

    dx.done();
    return result;
  }

  private async handleSelection_MarginId(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Margin');
    let newMarginId: string = selectedId;

    if (selectedId === UIMenu.defaultId()) {
      // Return the default margin (always normal)
      newMarginId = 'normal';
      dx.out(`returning default margin: ${newMarginId}`);
    } else if (kMarginIds.includes(selectedId as MarginId_t)) {
      dx.out(`updating margin to ${selectedId}`);

      // Update persistent margin selection via UIMenu
      const menu = this.app.uimenumgr.getMenuById('marginId');
      if (menu) {
        (menu.persist as any).marginId = selectedId as MarginId_t;
      }

      // Regenerate everything (fire and forget)
      void this.regenerateAndUpdateWebview();
      newMarginId = selectedId;
    } else {
      newMarginId = '';
    }

    dx.done();
    return newMarginId;
  }

  // Removed CSS hacks; rely on theme overrides
}
