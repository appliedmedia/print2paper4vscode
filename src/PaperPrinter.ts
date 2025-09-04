import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { WebviewMessage } from './types/UI_t';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private handlersRegistered = false;
  private lastPrintPrepHtml: any = null; // Now stores PDF document
  private lastPdfDocument: any = null; // Store the actual PDF document for saving
  private lastRawCode: string | null = null;
  private lastLanguageId: string | null = null;
  private printTitle: string = 'Printable';
  private dx: Diagnostics;

  private currentThemeChoice: string | undefined;

  private currentFontSizeMode: 'editor' | 9 | 10 | 12 | 14 | 18 | 24 = 'editor';

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

  // Message handler methods
  private async handleDragEnd(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handleDragEnd');
    dx.require({ msg }, ['msg']);
    
    // Save final position when drag ends
    if (msg.left !== undefined) {
      try {
        // Save position to VS Code global state
        this.app.vscodeapis.updateGlobalState('toolbarLeft', msg.left);
        dx.out(`Drag ended at position: ${msg.left}`);
      } catch (error) {
        dx.out(`Failed to save toolbar position: ${error}`);
      }
    }
    dx.done();
  }

  private async handleMenuItemSelected(msg: WebviewMessage): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');
    dx.require({ msg }, ['msg']);
    
    // Handle menu item selections from the new generic UI system
    const { targetId, parentId, x, y } = msg;
    dx.out(`Menu item selected: ${targetId} in menu ${parentId} at (${x}, ${y})`);

    // Get the menu and call its selection handler directly
    if (parentId && targetId) {
      const menu = this.app.uimenumgr.getMenu(parentId);
      if (menu) {
        // Dispatch selection via public API
        await menu.dispatchSelection(targetId);
      }
    }
    dx.done();
  }

  private async handlePrintMessage(msg: WebviewMessage): Promise<void> {
    if (!this.lastPrintPrepHtml) return;
    const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
    if (msg.value === 'preview')
      await this.app.pdf.printWithPreview(updated, this.printTitle || 'Print Output');
    else if (msg.value === 'direct')
      await this.app.pdf.printDirectly(updated, this.printTitle || 'Print Output');
    else if (msg.value === 'save')
      await this.app.pdf.saveAsPDF(this.lastPdfDocument, this.printTitle || 'Print Output');
    // TODO: Re-render webview - need access to panel
  }

  /**
   * Handles print command - automatically detects selection vs document
   */
  async handleFirstPrintCommand(): Promise<void> {
    try {
      const category = this.app.tabinspector.detectActiveTabCategory();
      if (category === 'preview') {
        const captured = await this.app.tabinspector.capturePreviewHtml();
        if (!captured) {
          this.app.ui.showErrorMessage('Failed to capture content from preview tab');
          return;
        }
        await this.openPrintPrepAndPrompt(captured.html, captured.name);
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
        this.dx.out(
          `THEMECHECK: Initialized currentThemeChoice to: '${this.currentThemeChoice}'`
        );
      }

      this.dx.out(
        `THEMECHECK: Printing with theme: '${this.currentThemeChoice}'`
      );
      const pdfDoc = await this.app.stylize.styleToPdf(info.text, info.languageId, {
        title: this.printTitle,
        theme: this.currentThemeChoice,
      });
      await this.openPrintPrepAndPrompt(pdfDoc, printableLabel);
    } catch (error) {
      this.dx.out(`Error handling print: ${error}`);
      this.app.ui.showErrorMessage(
        `Print failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async openPrintPrepAndPrompt(pdfDoc: any, tabName: string): Promise<void> {
    this.lastPrintPrepHtml = pdfDoc;
    this.lastPdfDocument = pdfDoc; // Store PDF document for saving
    this.printTitle = tabName;

    // Create menus and register message handlers when we actually need them
    this.createMenus();
    this.registerMessageHandlers();

    const initial = await this.applyRenderModes(pdfDoc);

    this.app.ui.htmlToWebViewPanel(`Printable: ${tabName}`, await this.app.ui.addToolbar(initial));
  }

  private async applyRenderModes(pdfDoc: any): Promise<string> {
    // If we have raw code, regenerate with theme overrides
    if (this.lastRawCode && this.lastLanguageId) {
      const sizePx = this.computeFontSizePx();
      const lhPx = this.computeLineHeightPx(sizePx);
      this.dx.out(
        `THEMECHECK: applyRenderModes with theme: '${this.currentThemeChoice}'`
      );
      const newPdfDoc = await this.app.stylize.styleToPdf(this.lastRawCode, this.lastLanguageId, {
        fontSize: sizePx,
        lineHeight: lhPx,
        title: this.printTitle,
        theme: this.currentThemeChoice,
      });
      // Store the new PDF document for saving
      this.lastPdfDocument = newPdfDoc;
      // Convert PDF to HTML
      return this.app.pdf.pdfToHTML(newPdfDoc, this.printTitle);
    }
    // For existing PDF document, convert to HTML
    return this.app.pdf.pdfToHTML(pdfDoc, this.printTitle);
  }

  private computeFontSizePx(): number {
    if (this.currentFontSizeMode === 'editor')
      return this.app.vscodeapis.getEditorTypography().fontSize;
    return this.currentFontSizeMode;
  }

  private computeLineHeightPx(fontSize: number): number {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    if (this.currentFontSizeMode === 'editor') return editorTypo.lineHeight;
    return Math.round(fontSize * 1.35);
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
        icon: '🖨',
        title: 'Print',
        menuItems: this.menuItems_Print.bind(this),
        selectionHandler: this.handleSelection_Print.bind(this),
      },
      {
        id: 'theme',
        icon: '🎨',
        title: 'Theme',
        menuItems: this.menuItems_Theme.bind(this),
        selectionHandler: this.handleSelection_Theme.bind(this),
      },
      {
        id: 'text',
        icon: '📝',
        title: 'Text',
        menuItems: this.menuItems_Text.bind(this),
        selectionHandler: this.handleSelection_Text.bind(this),
      },
    ];

    menuConfigs.forEach(config => {
      this.dx.out(
        `Creating menu: ${config.id} with icon: ${config.icon}`
      );
      const menu = this.app.uimenumgr.createMenu(
        config.id,
        config.icon,
        config.title,
        config.menuItems,
        config.selectionHandler
      );
      this.app.uimenumgr.addMenu(menu);
      this.dx.out(`Added menu: ${config.id}`);
    });

    // Debug: show what menus were created
    const allMenus = this.app.uimenumgr.getAllMenus();
    this.dx.out(`Total menus created: ${allMenus.length}`);
    allMenus.forEach(menu => {
      this.dx.out(`Menu: ${menu.id}, Icon: ${menu.icon}, Title: ${menu.title}`);
    });
  }

  // Register message handlers when needed for the webview
  private registerMessageHandlers(): void {
    if (this.handlersRegistered) return;

    const messageHandlers = [
      { type: 'dragEnd', handler: this.handleDragEnd.bind(this) },
      { type: 'menuItemSelected', handler: this.handleMenuItemSelected.bind(this) },
      { type: 'print', handler: this.handlePrintMessage.bind(this) },
    ];

    messageHandlers.forEach(({ type, handler }) => {
      this.app.ui.registerMessageHandler(type, handler);
    });

    this.handlersRegistered = true;
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
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const editorSize = editorTypo.fontSize;

    // Create base size options
    const sizeOptions = [
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
      // Editor size already exists - no need to add 📝 here, UIMenu.ts will handle it
      // existingEditorOption.displayName stays as is
    } else {
      // Editor size not in list - add it at the top without 📝 suffix
      sizeOptions.unshift({ id: String(editorSize), displayName: `${editorSize}px` });
    }

    return sizeOptions;
  }

  // Selection handler methods for each menu type
  private async handleSelection_Print(selectedId: string): Promise<string> {
    if (selectedId === '0') {
      return ''; // Print menu has no default selection
    }
    if (!this.lastPrintPrepHtml) return '';
    const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
    if (selectedId === 'preview')
      await this.app.pdf.printWithPreview(updated, this.printTitle || 'Print Output');
    else if (selectedId === 'direct')
      await this.app.pdf.printDirectly(updated, this.printTitle || 'Print Output');
    else if (selectedId === 'save')
      await this.app.pdf.saveAsPDF(this.lastPdfDocument, this.printTitle || 'Print Output');
    // TODO: Re-render webview - need access to panel
    return ''; // action handled
  }

  private async handleSelection_Theme(selectedId: string): Promise<string> {
    this.dx.out(
      `THEMECHECK: handleSelection_Theme called with selectedId: '${selectedId}'`
    );

    if (selectedId === '0') {
      // Return the current editor theme ID as the default
      const currentEditorTheme = this.app.vscodeapis.getActiveThemeId();
      const availableThemes = this.app.stylize.getThemes();
      const fallbackTheme = availableThemes[0]?.id || '';
      const result = currentEditorTheme || fallbackTheme;

      this.dx.out(
        `THEMECHECK: Theme default selection - selectedId: '${selectedId}', currentEditorTheme: '${currentEditorTheme}', availableThemes: [${availableThemes.map(t => t.id).join(', ')}], fallbackTheme: '${fallbackTheme}', returning: '${result}'`
      );

      return result;
    }

    this.dx.out(`THEMECHECK: Theme menu selection: ${selectedId}`);
    this.currentThemeChoice = selectedId;
    this.dx.out(`THEMECHECK: currentThemeChoice set to: '${this.currentThemeChoice}'`);

    // TODO: Re-render webview with new theme - need access to panel
    return ''; // selection handled
  }

  private async handleSelection_Text(selectedId: string): Promise<string> {
    if (selectedId === '0') {
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      return String(editorTypo.fontSize);
    }
    this.dx.out(`Text menu selection: ${selectedId}`);
    // TODO: Implement text handling
    return ''; // selection handled
  }

  // Removed CSS hacks; rely on theme overrides
}
