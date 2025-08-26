import { ClipboardCapture } from './ClipboardCapture';
import type { App } from './App';
import type { WebviewMessage } from './UI';

export class PaperPrinter {
  private app: App;
  private clipboardCapture: ClipboardCapture;
  private lastPrintPrepHtml: string | null = null;
  private lastRawCode: string | null = null;
  private lastLanguageId: string | null = null;
  private currentPrintableLabel: string = 'Printable';
  private currentColorMode: 'theme' | 'print' = 'theme';
  private currentThemeChoice: string = 'editor';

  private currentFontSizeMode: 'editor' | 9 | 10 | 12 | 14 | 18 | 24 = 'editor';

  constructor(app: App) {
    this.app = app;
    this.clipboardCapture = new ClipboardCapture(app);
  }

  init(): void {
    this.clipboardCapture.init();

    // Register message handlers with UI system
    this.app.ui.registerMessageHandler('dragEnd', this.handleDragEnd.bind(this));
    this.app.ui.registerMessageHandler('menu', this.handleMenu.bind(this));
    this.app.ui.registerMessageHandler('menuItemSelected', this.handleMenuItemSelected.bind(this));
    this.app.ui.registerMessageHandler('print', this.handlePrintMessage.bind(this));

    // Note: theme list recomputed on toolbar render to ensure VS Code extensions are loaded
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

  private async handleMenu(msg: WebviewMessage): Promise<void> {
    if (typeof msg.value === 'string' && msg.value.startsWith('theme-')) {
      const id = String(msg.value).substring('theme-'.length);
      this.currentColorMode = 'theme';
      this.currentThemeChoice = id;
    } else if (msg.value === 'colors-theme') this.currentColorMode = 'theme';
    else if (msg.value === 'colors-print') this.currentColorMode = 'print';
    else if (typeof msg.value === 'string' && msg.value.startsWith('text-size-')) {
      const sz = String(msg.value).substring('text-size-'.length);
      this.currentFontSizeMode =
        sz === 'editor' ? 'editor' : (Number(sz) as 9 | 10 | 12 | 14 | 18 | 24);
    }
    if (!this.lastPrintPrepHtml) return;
    // TODO: Update webview HTML - need access to panel
    this.app.ui.debugOut('Menu selection processed', 'info', 'PaperPrinter');
  }

  private async handleMenuItemSelected(msg: WebviewMessage): Promise<void> {
    // Handle menu item selections from the new generic UI system
    const { targetId, parentId, x, y } = msg;
    this.app.ui.debugOut(
      `Menu item selected: ${targetId} in menu ${parentId} at (${x}, ${y})`,
      'info',
      'PaperPrinter'
    );

    // Route to appropriate handler based on parentId
    if (parentId === 'print') {
      if (!this.lastPrintPrepHtml) return;
      const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
      if (targetId === 'preview')
        await this.app.pdf.printWithPreview(updated, this.currentPrintableLabel || 'Print Output');
      else if (targetId === 'direct')
        await this.app.pdf.printDirectly(updated, this.currentPrintableLabel || 'Print Output');
      else if (targetId === 'save')
        await this.app.pdf.saveAsPDF(updated, this.currentPrintableLabel || 'Print Output');
      // TODO: Re-render webview - need access to panel
    } else if (parentId === 'theme') {
      // Handle theme menu selections
      this.app.ui.debugOut(`Theme menu selection: ${targetId}`, 'info', 'PaperPrinter');
      // TODO: Implement theme handling
    } else if (parentId === 'text') {
      // Handle text menu selections
      this.app.ui.debugOut(`Text menu selection: ${targetId}`, 'info', 'PaperPrinter');
      // TODO: Implement text handling
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
      const theme = this.app.vscodeapis.getActiveTheme();
      const selection = this.app.vscodeapis.getActiveTextEditor()?.selection;
      let printableLabel = info.name;
      if (selection && !selection.isEmpty) {
        const start = selection.start.line + 1;
        const end = selection.end.line + 1;
        printableLabel =
          start === end ? `Line ${start} of ${info.name}` : `Lines ${start}-${end} of ${info.name}`;
      }
      this.currentPrintableLabel = printableLabel;
      const htmlContent = await this.app.stylize.styleToHtml(
        info.text,
        info.languageId,
        theme as string | Record<string, unknown>,
        {
          title: this.currentPrintableLabel,
        }
      );
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
    const initial = await this.applyRenderModes(htmlContent);
    this.app.ui.createWebviewPanel(
      `Printable: ${tabName}`,
      this.app.ui.addToolbar(initial, this.app)
    );
  }

  private async applyRenderModes(htmlBase: string): Promise<string> {
    // Prefer regenerating with theme overrides if we have raw code; otherwise fallback to CSS overlays
    if (this.lastRawCode && this.lastLanguageId) {
      let themeToUse: unknown | string;
      if (this.currentColorMode === 'print') {
        themeToUse =
          this.currentThemeChoice === 'editor' ? 'github-light' : this.currentThemeChoice;
      } else {
        themeToUse =
          this.currentThemeChoice === 'editor'
            ? this.app.vscodeapis.getActiveTheme()
            : this.currentThemeChoice;
      }
      const sizePx = this.computeFontSizePx();
      const lhPx = this.computeLineHeightPx(sizePx);
      const html = await this.app.stylize.styleToHtml(
        this.lastRawCode,
        this.lastLanguageId,
        themeToUse as string | Record<string, unknown>,
        { fontSize: sizePx, lineHeight: lhPx, title: this.currentPrintableLabel }
      );
      return html;
    }
    // Fallback for captured HTML from preview tabs
    let html = htmlBase;
    if (this.currentColorMode === 'print') {
      const css = [
        'body{background:#ffffff !important}',
        '.shiki{background:#ffffff !important}',
        `pre{white-space:pre; word-wrap:normal; margin:0}`,
        `pre.shiki code{white-space:normal; font-size:${this.computeFontSizePx()}px}`,
        `.shiki .line{background:transparent !important; display:block; margin:0; padding:0; white-space:pre}`,
        '.shiki span{background:transparent !important}',
      ].join('\n');
      const injectCss = (source: string, cssStr: string): string => {
        if (/<style>[\s\S]*?<\/style>/.test(source)) {
          return source.replace(
            /<style>([\s\S]*?)<\/style>/,
            (m, inner) => `<style>${inner}\n${cssStr}</style>`
          );
        }
        return source.replace(/<\/head>/, `<style>${cssStr}</style></head>`);
      };
      html = injectCss(html, css);
    }
    return html;
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

  // Removed CSS hacks; rely on theme overrides
}
