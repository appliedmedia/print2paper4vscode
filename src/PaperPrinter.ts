import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { WebviewMessage } from './UI';
import type { UIMenuItem } from './types/UIMenuItem';

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private lastPrintPrepHtml: string | null = null;
  private lastRawCode: string | null = null;
  private lastLanguageId: string | null = null;
  private currentPrintableLabel: string = 'Printable';

  private currentThemeChoice: string = 'editor';

  private currentFontSizeMode: 'editor' | 9 | 10 | 12 | 14 | 18 | 24 = 'editor';

  constructor(app: App) {
    this.app = app;
    this.clipboardCapture = new ClipboardCapture(app);
  }

  init(): void {
    this.clipboardCapture.init();
    this.app.ui.debugOut('PaperPrinter initialized', 'info', 'PaperPrinter');
  }

  done(): void {
    this.clipboardCapture.done();
    this.app.ui.debugOut('PaperPrinter cleanup completed', 'info', 'PaperPrinter');
  }

  // Message handler methods
  private async handleDragEnd(msg: WebviewMessage): Promise<void> {
    // Save final position when drag ends
    if (msg.clientX !== undefined) {
      // TODO: Save position to VS Code storage
      this.app.ui.debugOut(`Drag ended at position: ${msg.clientX}`, 'info', 'PaperPrinter');
    }
  }

  private async handleMenuItemSelected(msg: WebviewMessage): Promise<void> {
    // Handle menu item selections from the new generic UI system
    const { targetId, parentId, x, y } = msg;
    this.app.ui.debugOut(
      `Menu item selected: ${targetId} in menu ${parentId} at (${x}, ${y})`,
      'info',
      'PaperPrinter'
    );

    // Get the menu and call its selection handler directly
    if (parentId && targetId) {
      const menu = this.app.uimenumgr.getMenu(parentId);
      if (menu) {
        // Call the menu's selection handler - it knows how to dispatch to the right method
        await (menu as any)._selectionHandler(targetId);
      }
    }
  }

  private async handlePrintMessage(msg: WebviewMessage): Promise<void> {
    if (!this.lastPrintPrepHtml) return;
    const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
    if (msg.value === 'preview')
      await this.app.pdf.printWithPreview(updated, this.currentPrintableLabel || 'Print Output');
    else if (msg.value === 'direct')
      await this.app.pdf.printDirectly(updated, this.currentPrintableLabel || 'Print Output');
    else if (msg.value === 'save')
      await this.app.pdf.saveAsPDF(updated, this.currentPrintableLabel || 'Print Output');
    // TODO: Re-render webview - need access to panel
  }

  /**
   * Handles print command - automatically detects selection vs document
   */
  async handlePrint(): Promise<void> {
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
      this.currentPrintableLabel = printableLabel;
      const htmlContent = await this.app.stylize.styleToHtml(info.text, info.languageId, {
        title: this.currentPrintableLabel,
      });
      await this.openPrintPrepAndPrompt(htmlContent, printableLabel);
    } catch (error) {
      this.app.ui.debugOut('Error handling print', 'error', 'PaperPrinter', error);
      this.app.ui.showErrorMessage(
        `Print failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async openPrintPrepAndPrompt(htmlContent: string, tabName: string): Promise<void> {
    this.lastPrintPrepHtml = htmlContent;
    this.currentPrintableLabel = tabName;

    // Create menus and register message handlers when we actually need them
    this.createMenus();
    this.registerMessageHandlers();

    const initial = await this.applyRenderModes(htmlContent);

    this.app.ui.createWebviewPanel(`Printable: ${tabName}`, this.app.ui.addToolbar(initial));
  }

  private async applyRenderModes(htmlBase: string): Promise<string> {
    // If we have raw code, regenerate with theme overrides
    if (this.lastRawCode && this.lastLanguageId) {
      const sizePx = this.computeFontSizePx();
      const lhPx = this.computeLineHeightPx(sizePx);
      const html = await this.app.stylize.styleToHtml(this.lastRawCode, this.lastLanguageId, {
        fontSize: sizePx,
        lineHeight: lhPx,
        title: this.currentPrintableLabel,
      });
      return html;
    }
    // For captured HTML from preview tabs, just return as-is
    return htmlBase;
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
    const menuConfigs = [
      {
        id: 'print',
        icon: '🖨',
        title: 'Print',
        buildList: this.printBuildList.bind(this),
        selectionHandler: this.handleSelection_Print.bind(this),
      },
      {
        id: 'theme',
        icon: '🎨',
        title: 'Theme',
        buildList: this.themesBuildList.bind(this),
        selectionHandler: this.handleSelection_Theme.bind(this),
      },
      {
        id: 'text',
        icon: 'Tt',
        title: 'Text',
        buildList: this.textBuildList.bind(this),
        selectionHandler: this.handleSelection_Text.bind(this),
      },
    ];

    menuConfigs.forEach(config => {
      const menu = this.app.uimenumgr.createMenu(
        config.id,
        config.icon,
        config.title,
        config.buildList,
        config.selectionHandler
      );
      this.app.uimenumgr.addMenu(menu);
    });
  }

  // Register message handlers when needed for the webview
  private registerMessageHandlers(): void {
    const messageHandlers = [
      { type: 'dragEnd', handler: this.handleDragEnd.bind(this) },
      { type: 'menuItemSelected', handler: this.handleMenuItemSelected.bind(this) },
      { type: 'print', handler: this.handlePrintMessage.bind(this) },
    ];

    messageHandlers.forEach(({ type, handler }) => {
      this.app.ui.registerMessageHandler(type, handler);
    });
  }

  // Build list methods for each menu type
  private printBuildList(): UIMenuItem[] {
    return [
      { id: 'preview', label: 'Print with Preview' },
      { id: 'direct', label: 'Print' },
      { id: 'save', label: 'Save as PDF' },
    ];
  }

  private themesBuildList(): UIMenuItem[] {
    return [
      { id: 'editor', label: 'Editor Theme' },
      ...this.app.stylize.getThemes().map(theme => ({
        id: theme.id,
        label: theme.label,
      })),
    ];
  }

  private textBuildList(): UIMenuItem[] {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return [
      { id: 'editor', label: `Editor (${editorTypo.fontSize}px)` },
      { id: '9', label: '9 px' },
      { id: '10', label: '10 px' },
      { id: '12', label: '12 px' },
      { id: '14', label: '14 px' },
      { id: '18', label: '18 px' },
      { id: '24', label: '24 px' },
    ];
  }

  // Selection handler methods for each menu type
  private async handleSelection_Print(selectedId: string): Promise<void> {
    if (!this.lastPrintPrepHtml) return;
    const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
    if (selectedId === 'preview')
      await this.app.pdf.printWithPreview(updated, this.currentPrintableLabel || 'Print Output');
    else if (selectedId === 'direct')
      await this.app.pdf.printDirectly(updated, this.currentPrintableLabel || 'Print Output');
    else if (selectedId === 'save')
      await this.app.pdf.saveAsPDF(updated, this.currentPrintableLabel || 'Print Output');
    // TODO: Re-render webview - need access to panel
  }

  private async handleSelection_Theme(selectedId: string): Promise<void> {
    this.app.ui.debugOut(`Theme menu selection: ${selectedId}`, 'info', 'PaperPrinter');
    this.currentThemeChoice = selectedId;
    // TODO: Re-render webview with new theme - need access to panel
  }

  private async handleSelection_Text(selectedId: string): Promise<void> {
    this.app.ui.debugOut(`Text menu selection: ${selectedId}`, 'info', 'PaperPrinter');
    // TODO: Implement text handling
  }

  // Removed CSS hacks; rely on theme overrides
}
