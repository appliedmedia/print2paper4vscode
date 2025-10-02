import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { WebviewMessage } from './types/UI_t';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';
import { UIMenu } from './UIMenu';
import { UIWebView } from './UIWebView';
import jsPDF from 'jspdf';

// Page size type and order definition
export type PageSize = 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
export const PAGE_SIZES: PageSize[] = ['letter', 'legal', 'a3', 'a4', 'a5'];

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private pdfRendered: jsPDF | null = null; // In-memory PDF document
  private lastRawCode: string | null = null;
  private lastLanguageId: string | null = null;
  private currentWebView: UIWebView | null = null;
  private printTitle: string = 'Printable';
  private dx: Diagnostics;

  private currentThemeChoice: string | undefined;

  private currentFontSize: number = 12; // Default to 12px


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
      if (!this.pdfRendered) return;
      void (await this.generatePdf());
      
      if (printType === 'preview')
        await this.app.pdf.printWithPreview(this.pdfRendered, this.printTitle || 'Print Output');
      else if (printType === 'direct')
        await this.app.pdf.printDirectly(this.pdfRendered, this.printTitle || 'Print Output');
      else if (printType === 'save')
        await this.app.pdf.saveAsPDF(this.pdfRendered, this.printTitle || 'Print Output');
        
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
      if (!info) {
        this.app.ui.showErrorMessage('No active editor found');
        return;
      }

      this.lastRawCode = info.text;
      this.lastLanguageId = info.languageId;
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
      this.pdfRendered = await this.app.stylize.styleToPdf(info.text, info.languageId, {
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
      // Generate PDF and set tokens for page-based rendering
      await this.generatePdf();
      
      // Set tokens in PDF for page-based rendering
      if (this.lastRawCode && this.lastLanguageId) {
        const tokens = await this.app.stylize.getTokens(this.lastRawCode, this.lastLanguageId, {
          theme: this.currentThemeChoice
        });
        this.app.pdf.setTokens(tokens);
      }
      
      // Create webview options
      const fontSizePx = this.computeFontSizePx(); // fontSize in pixels
      const lineHeightPx = this.computeLineHeightPx(fontSizePx); // lineHeight in pixels
      const scrollViewOptions = {
        title: tabName,
        pageSize: this.pageSize,
        orient: this.orient,
        fontFamily: this.getCurrentFontFamily(),
        fontSizePx: fontSizePx, // fontSize in pixels - will be converted to points in PDF generation
        lineHeightPx: lineHeightPx, // lineHeight in pixels - will be converted to points in PDF generation
        theme: this.currentThemeChoice
      };
      
      // Create webview and initialize with everything upfront
      this.currentWebView = new UIWebView(this.app);
      this.currentWebView.init(); // Initialize message handlers
      
      // Initialize webview with menus and scroll view
      const panelId = await this.currentWebView.initWebview(this.app.pdf, scrollViewOptions, this.app.uimenumgr);
      
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


  private async generatePdf(): Promise<string> {
    // If we have raw code, regenerate with theme overrides
    if (this.lastRawCode && this.lastLanguageId) {
      const sizePx = this.computeFontSizePx();
      const lhPx = this.computeLineHeightPx(sizePx);
      const newPdfDoc = await this.app.stylize.styleToPdf(this.lastRawCode, this.lastLanguageId, {
        fontSize: sizePx,
        lineHeight: lhPx,
        title: this.printTitle,
        theme: this.currentThemeChoice,
      });
      // Store the new PDF document
      this.pdfRendered = newPdfDoc;
      // Convert PDF to HTML
      return this.app.pdf.embedPDFinHTML(newPdfDoc, this.printTitle);
    }
    // For existing PDF document, convert to HTML
    return this.app.pdf.embedPDFinHTML(this.pdfRendered!, this.printTitle);
  }

  private computeFontSizePx(): number {
    return this.currentFontSize;
  }

  private computeLineHeightPx(fontSize: number): number {
    // Calculate line height proportionally based on VS Code's line height ratio
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return fontSize * editorTypo.sizeToHeightRatio;
  }

  // ES6 getter/setter pattern for page size
  get pageSize(): PageSize {
    // Get from global state with locale-based fallback
    const savedPageSize = this.app.vscodeapis.getGlobalState('pageSize');
    if (savedPageSize) {
      return savedPageSize as PageSize;
    }
    
    // Fallback to locale-based default
    const locale = this.app.vscodeapis.getLocale() || '  ';
    const parts = locale.split(/[-_]/);
    const region = parts.pop().toUpperCase();
    const letterRegions = ['US', 'CA', 'MX', '419'];
    const isLetterSize = letterRegions.includes(region);
    return isLetterSize ? 'letter' : 'a4';
  }

  set pageSize(value: PageSize) {
    this.app.vscodeapis.updateGlobalState('pageSize', value);
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
        flyoutMenuItemIds: ['orient'],
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
    const pageSizeLabels: Record<PageSize, string> = {
      letter: 'Letter (8.5" × 11")',
      legal: 'Legal (8.5" × 14")',
      a3: 'A3 (297mm × 420mm)',
      a4: 'A4 (210mm × 297mm)',
      a5: 'A5 (148mm × 210mm)',
    };

    return [
      // Orientation submenu reference
      { id: 'orient', displayName: 'Orient' },
      // Page sizes in consistent order
      ...PAGE_SIZES.map(size => ({ id: size, displayName: pageSizeLabels[size] })),
    ];
  }

  private menuItems_Orient(): UIMenuItem[] {
    const yaml = this.app.os.fileRead<{
      portrait_icon: string;
      landscape_icon: string;
    }>('src/PaperPrinter.yaml');

    if (!yaml) {
      throw new Error('Failed to load PaperPrinter template');
    }

    return [
      { id: 'portrait', displayName: '{{svg:portrait_icon}} Portrait' },
      { id: 'landscape', displayName: '{{svg:landscape_icon}} Landscape' },
    ];
  }

  // Selection handler methods for each menu type
  private async handleSelection_Print(selectedId: string): Promise<string> {
    if (selectedId === UIMenu.defaultId()) {
      return ''; // Print menu has no default selection
    }
    if (!this.pdfRendered) return '';
    void (await this.generatePdf());
    if (selectedId === 'preview')
      await this.app.pdf.printWithPreview(this.pdfRendered, this.printTitle || 'Print Output');
    else if (selectedId === 'direct')
      await this.app.pdf.printDirectly(this.pdfRendered, this.printTitle || 'Print Output');
    else if (selectedId === 'save')
      await this.app.pdf.saveAsPDF(this.pdfRendered, this.printTitle || 'Print Output');
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

    dx.out(`updating theme to ${selectedId}`);
    this.currentThemeChoice = selectedId;

    // Update webview with new theme
    dx.out(`updating webview with new theme`);
    if (this.currentWebView) {
      try {
        await this.currentWebView.updateOptions({ theme: selectedId });
      } catch (error) {
        this.app.ui.showErrorMessage(`Failed to update theme: ${String(error)}`);
      }
    }

    dx.done();
    return selectedId; // Return the selected theme for checkmark
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

    // Update font size mode
    const fontSize = parseInt(selectedId, 10);
    if (!isNaN(fontSize)) {
      dx.out(`updating fontSize to ${fontSize}`);
      this.currentFontSize = fontSize;

      // Update webview with new font size
      dx.out(`updating webview with new font size`);
      if (this.currentWebView) {
        try {
          await this.currentWebView.updateOptions({ 
            fontSizePx: fontSize, // fontSize in pixels - will be converted to points in PDF generation
            lineHeightPx: this.computeLineHeightPx(fontSize) // lineHeight in pixels - will be converted to points in PDF generation
          });
        } catch (error) {
          this.app.ui.showErrorMessage(`Failed to update font size: ${String(error)}`);
        }
      }

      dx.done();
      return selectedId; // Return the selected size for checkmark
    }

    dx.done();
    return ''; // selection handled
  }

  private async handleSelection_Page(selectedId: string): Promise<string> {
    const dx = this.dx.sub('handleSelection_Page');
    dx.out(`selectedId = ${selectedId}`);

    if (selectedId === UIMenu.defaultId()) {
      // Return the current page size for default selection
      const currentPageSize = this.pageSize;
      dx.out(`returning current page size: ${currentPageSize}`);
      dx.done();
      return currentPageSize;
    }

    // Handle page size selection
    if (PAGE_SIZES.includes(selectedId as PageSize)) {
      dx.out(`updating page size to ${selectedId}`);
      this.pageSize = selectedId as PageSize;

      // Update webview with new page size
      dx.out(`updating webview with new page size`);
      if (this.currentWebView) {
        try {
          await this.currentWebView.updateOptions({ pageSize: selectedId as PageSize });
        } catch (error) {
          this.app.ui.showErrorMessage(`Failed to update page size: ${String(error)}`);
        }
      }

      dx.done();
      return selectedId; // Return the selected size for checkmark
    }

    dx.done();
    return ''; // selection handled
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

    // Handle orient selection
    if (selectedId === 'portrait' || selectedId === 'landscape') {
      dx.out(`updating orient to ${selectedId}`);
      this.orient = selectedId;

      // Update webview with new orientation
      dx.out(`updating webview with new orientation`);
      if (this.currentWebView) {
        try {
          await this.currentWebView.updateOptions({ orient: selectedId as 'portrait' | 'landscape' });
        } catch (error) {
          this.app.ui.showErrorMessage(`Failed to update orientation: ${String(error)}`);
        }
      }

      dx.done();
      return selectedId; // Return the selected orient for checkmark
    }

    dx.done();
    return ''; // selection handled
  }

  // Removed CSS hacks; rely on theme overrides
}
