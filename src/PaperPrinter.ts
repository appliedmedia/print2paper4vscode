import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';
import { UIMenu } from './UIMenu';
import { UIWebView } from './UIWebView';
import type { PDFDoc } from './types/PDF_t';
import type { PageRender } from './types/PageRender_t';
import type { GlobalStateKey } from './types/globalState_t';

// Page size type and order definition
export type PageSizeId = 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
export const PAGE_SIZE_IDS: PageSizeId[] = ['letter', 'legal', 'a3', 'a4', 'a5'];

// Margin level type and lookup table
export type MarginId = 'none' | 'minimal' | 'normal' | 'wide';
export const MARGIN_IDS = {
  none: 0,      // 0pts
  minimal: 5,   // ~7px
  normal: 15,   // ~20px  
  wide: 30      // ~40px
} as const;

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private pdfDoc: PDFDoc | null = null; // In-memory PDF document (PDFDoc abstraction)
  private rawCode: string = '';
  private languageId: string = '';
  private uiwebview: UIWebView | null = null;
  private printTitle: string = 'Printable';
  private dx: Diagnostics;

  private currentThemeChoice: string | undefined;


  public docInfo = {
    // Document content
    rawCode: '',
    languageId: '',
    printTitle: 'Printable',
    
    // User preferences (persisted in global state)
    persist_themeChoice: undefined,
    persist_fontSizePx: 12,
    persist_pageSizeId: 'a4' as PageSizeId,
    persist_orient: 'portrait' as const,
    persist_marginId: 'normal' as 'none' | 'minimal' | 'normal' | 'wide'
  };

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
    icon_margin_wide_svg: ''
  };

  constructor(app: App) {
    this.app = app;
    this.clipboardCapture = new ClipboardCapture(app);
    this.dx = app.dx.create('PaperPrinter');
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
    
    return this._yaml;
  }

  // Clever setter that updates both local and global state
  private localGlobalUpdate(container: any, varName: string, value: any) {
    const persistKey = `persist_${varName}`;
    container[persistKey] = value;
    this.app.vscodeapis.updateGlobalState(varName as GlobalStateKey, value);
  }

  // Getters that read from global state - callers know it's persistent
  get persist_themeChoice() {
    return this.docInfo.persist_themeChoice || this.app.vscodeapis.getActiveThemeId();
  }
  
  set persist_themeChoice(value: string) {
    this.localGlobalUpdate(this.docInfo, 'themeChoice', value);
  }
  
  get persist_fontSizePx() {
    return this.docInfo.persist_fontSizePx || 12;
  }
  
  set persist_fontSizePx(value: number) {
    this.localGlobalUpdate(this.docInfo, 'fontSizePx', value);
  }
  
  get persist_pageSizeId() {
    return this.docInfo.persist_pageSizeId || 'a4';
  }
  
  set persist_pageSizeId(value: PageSizeId) {
    this.localGlobalUpdate(this.docInfo, 'pageSizeId', value);
  }
  
  get persist_orient() {
    return this.docInfo.persist_orient || 'portrait';
  }
  
  set persist_orient(value: 'portrait' | 'landscape') {
    this.localGlobalUpdate(this.docInfo, 'orient', value);
  }
  
  get persist_marginId() {
    return this.docInfo.persist_marginId || 'normal';
  }
  
  set persist_marginId(value: 'none' | 'minimal' | 'normal' | 'wide') {
    this.localGlobalUpdate(this.docInfo, 'marginId', value);
  }

  // Computed line height from font size
  get lineHeightPx(): number {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return this.persist_fontSizePx * editorTypo.sizeToHeightRatio;
  }

  // Get margin in points from margin ID
  getMarginPts(marginId: MarginId): number {
    return MARGIN_IDS[marginId];
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
        await this.app.pdf.printWithPreview(this.pdfDoc, this.printTitle || 'Print Output');
      else if (printType === 'direct')
        await this.app.pdf.printDirectly(this.pdfDoc, this.printTitle || 'Print Output');
      else if (printType === 'save')
        await this.app.pdf.saveAsPDF(this.pdfDoc, this.printTitle || 'Print Output');

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

      this.rawCode = info.text;
      this.languageId = info.languageId;
      const selection = this.app.vscodeapis.getActiveTextEditor()?.selection;
      let printableLabel = info.name;
      if (selection && !selection.isEmpty) {
        const start = selection.start.line + 1;
        const end = selection.end.line + 1;
        printableLabel =
          start === end ? `Line ${start} of ${info.name}` : `Lines ${start}-${end} of ${info.name}`;
      }
      this.printTitle = printableLabel;

      // Initialize theme choice if not set yet
      if (!this.currentThemeChoice) {
        this.currentThemeChoice = this.app.vscodeapis.getActiveThemeId();
      }
      this.pdfDoc = await this.app.stylize.styleToPdf(info.text, info.languageId, {
        title: this.printTitle,
        theme: this.currentThemeChoice,
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
    this.printTitle = tabName;

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
        pageSizeId: this.pageSizeId,
        orient: this.orient,
        fontFamily: this.getCurrentFontFamily(),
        fontSizePx: this.persist_fontSizePx,
        lineHeightPx: this.lineHeightPx,
        theme: this.currentThemeChoice,
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
    const marginPts = this.getMarginPts(this.persist_marginId);
    
    // Store the new PDF document
    this.pdfDoc = await this.app.stylize.styleToPdf(this.rawCode, this.languageId, {
      fontSize: this.persist_fontSizePx,
      lineHeight: this.lineHeightPx,
      title: this.printTitle,
      theme: this.currentThemeChoice,
      marginPts: marginPts,
    });
  }

  // ES6 getter/setter pattern for page size
  get pageSizeId(): PageSizeId {
    // Get from global state with locale-based fallback
    const savedPageSizeId = this.app.vscodeapis.getGlobalState('pageSizeId');
    if (savedPageSizeId) {
      return savedPageSizeId as PageSizeId;
    }

    // Fallback to locale-based default
    const locale = this.app.vscodeapis.getLocale() || '  ';
    const parts = locale.split(/[-_]/);
    const region = parts.pop()?.toUpperCase() || '';
    const letterRegions = ['US', 'CA', 'MX', '419'];
    const isLetterSize = letterRegions.includes(region);
    return isLetterSize ? 'letter' : 'a4';
  }

  set pageSizeId(value: PageSizeId) {
    this.app.vscodeapis.updateGlobalState('pageSizeId', value);
  }

  // ES6 getter/setter pattern for orient
  get orient(): 'portrait' | 'landscape' {
    // Get from global state with portrait fallback
    return (this.app.vscodeapis.getGlobalState('orient') || 'portrait') as 'portrait' | 'landscape';
  }

  set orient(value: 'portrait' | 'landscape') {
    this.app.vscodeapis.updateGlobalState('orient', value);
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
        flyoutMenuItemIds: ['size', 'orient', 'margin'],
        selectionHandler: this.handleSelection_Page.bind(this),
      },
      {
        id: 'size',
        displayName: 'Size',
        icon: '', // submenu indicated by no icon, see Page > Size
        isFlyout: true,
        menuItems: this.menuItems_pageSizeId.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_pageSizeId.bind(this),
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
        id: 'margin',
        displayName: 'Margin',
        icon: '', // submenu indicated by no icon, see Page > Margin
        isFlyout: true,
        menuItems: this.menuItems_Margin.bind(this),
        flyoutMenuItemIds: [],
        selectionHandler: this.handleSelection_Margin.bind(this),
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
        id: 'text',
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
        config.id,
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
    const pageSizeLabels: Record<PageSizeId, string> = {
      letter: 'Letter (8.5" × 11")',
      legal: 'Legal (8.5" × 14")',
      a3: 'A3 (297mm × 420mm)',
      a4: 'A4 (210mm × 297mm)',
      a5: 'A5 (148mm × 210mm)',
    };

    return PAGE_SIZE_IDS.map(size => ({ id: size, displayName: pageSizeLabels[size] }));
  }

  private menuItems_Orient(): UIMenuItem[] {
    const yaml = this.yaml;
    
    return [
      { id: 'portrait', displayName: `${yaml.icon_orient_portrait_svg} Portrait` },
      { id: 'landscape', displayName: `${yaml.icon_orient_landscape_svg} Landscape` },
    ];
  }

  private menuItems_Margin(): UIMenuItem[] {
    const yaml = this.yaml;
    
    return [
      { id: 'none', displayName: `${yaml.icon_margin_none_svg} None` },
      { id: 'minimal', displayName: `${yaml.icon_margin_minimal_svg} Minimal` },
      { id: 'normal', displayName: `${yaml.icon_margin_normal_svg} Normal` },
      { id: 'wide', displayName: `${yaml.icon_margin_wide_svg} Wide` }
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
            theme: this.currentThemeChoice,
            fontSizePx: this.persist_fontSizePx,
            lineHeightPx: this.lineHeightPx,
            pageSizeId: this.pageSizeId,
            orient: this.orient,
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
      await this.app.pdf.printWithPreview(this.pdfDoc, this.printTitle || 'Print Output');
    else if (selectedId === 'direct')
      await this.app.pdf.printDirectly(this.pdfDoc, this.printTitle || 'Print Output');
    else if (selectedId === 'save')
      await this.app.pdf.saveAsPDF(this.pdfDoc, this.printTitle || 'Print Output');
    // TODO: Re-render webview - need access to panel
    return ''; // action handled
  }

  private async handleSelection_Theme(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Theme');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.app.vscodeapis.getActiveThemeId();
      const availableThemes = this.app.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || 'github-light';
      const result = currentEditorTheme || fallbackTheme;
      dx.out(`returning editor theme: ${result}`);
      dx.done();
      return result;
    }

    // Update theme
    dx.out(`updating theme to ${selectedId}`);
    this.currentThemeChoice = selectedId;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected theme for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update theme: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  private async handleSelection_Text(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Text');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the actual editor font size for default selection
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      const editorSize = String(editorTypo.fontSize);
      dx.out(`returning editor size: ${editorSize}`);
      dx.done();
      return editorSize;
    }

    // Update font size
    const fontSize = parseInt(selectedId, 10);
    if (isNaN(fontSize)) {
      dx.done();
      return '';
    }

    dx.out(`updating fontSize to ${fontSize}`);
    this.persist_fontSizePx = fontSize;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected size for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update font size: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  private async handleSelection_Page(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Page');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current page size for default selection
      const currentPageSizeId = this.pageSizeId;
      dx.out(`returning current page size: ${currentPageSizeId}`);
      dx.done();
      return currentPageSizeId;
    }

    // Update page size
    if (!PAGE_SIZE_IDS.includes(selectedId as PageSizeId)) {
      dx.done();
      return '';
    }

    dx.out(`updating page size to ${selectedId}`);
    this.pageSizeId = selectedId as PageSizeId;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected size for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update page size: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  private async handleSelection_pageSizeId(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_pageSizeId');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current page size for default selection
      const currentPageSizeId = this.pageSizeId;
      dx.out(`returning current page size: ${currentPageSizeId}`);
      dx.done();
      return currentPageSizeId;
    }

    // Update page size
    if (!PAGE_SIZE_IDS.includes(selectedId as PageSizeId)) {
      dx.done();
      return '';
    }

    dx.out(`updating page size to ${selectedId}`);
    this.pageSizeId = selectedId as PageSizeId;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected size for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update page size: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  private async handleSelection_Orient(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Orient');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current orient for default selection
      const currentOrient = this.orient;
      dx.out(`returning current orient: ${currentOrient}`);
      dx.done();
      return currentOrient;
    }

    // Update orientation
    if (selectedId !== 'portrait' && selectedId !== 'landscape') {
      dx.done();
      return '';
    }

    dx.out(`updating orient to ${selectedId}`);
    this.orient = selectedId;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected orient for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update orientation: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  private async handleSelection_Margin(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Margin');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current margin for default selection
      const currentMargin = this.persist_marginId;
      dx.out(`returning current margin: ${currentMargin}`);
      dx.done();
      return currentMargin;
    }

    // Update margin
    if (!['none', 'minimal', 'normal', 'wide'].includes(selectedId)) {
      dx.done();
      return '';
    }

    dx.out(`updating margin to ${selectedId}`);
    this.persist_marginId = selectedId as MarginId;

    // Regenerate everything
    try {
      await this.regenerateAndUpdateWebview();
      dx.done();
      return selectedId; // Return the selected margin for checkmark
    } catch (error) {
      this.app.ui.showErrorMessage(`Failed to update margin: ${String(error)}`);
      dx.done();
      return '';
    }
  }

  // Removed CSS hacks; rely on theme overrides
}
