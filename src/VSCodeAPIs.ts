import type { App } from './App';
import type {
  Disposable,
  ExtensionContext,
  TextEditor,
  TextDocument,
  Uri,
  WebviewPanel,
  // Position,
  // WorkspaceEdit,
} from 'vscode';
import type { WebviewMessage } from './types/UI_t';

export class VSCodeAPIs {
  private app: App;
  private vscode: typeof import('vscode'); // Use official VS Code types
  private context: ExtensionContext; // Properly typed context

  constructor(app: App, vscode: typeof import('vscode'), context: ExtensionContext) {
    this.app = app;
    this.vscode = vscode;
    this.context = context;
  }

  init(): void {
    // Register VS Code commands
    const printCommand = this.vscode.commands.registerCommand('p2p4vsc.print2paper', () => {
      this.app.paperprinter.handleFirstPrintCommand();
    });

    this.context.subscriptions.push(printCommand);

    this.app.ui.debugOut('VSCodeAPIs initialized', 'info', 'VSCodeAPIs');
  }

  done(): void {
    // nothing needed here yet
    this.app.ui.debugOut('VSCodeAPIs cleanup completed', 'info', 'VSCodeAPIs');
  }

  getGlobalStoragePath(): string {
    return this.context.globalStorageUri.fsPath;
  }

  /**
   * Update global state value
   */
  updateGlobalState(key: string, value: any): void {
    this.context.globalState.update(key, value);
  }

  /**
   * Get global state value
   */
  getGlobalState<T>(key: string, defaultValue?: T): T | undefined {
    return this.context.globalState.get(key, defaultValue);
  }

  getEditorTypography(): { fontSize: number; lineHeight: number } {
    const editorCfg = this.vscode.workspace.getConfiguration('editor');
    const fontSize = Math.max(10, Number(editorCfg.get('fontSize') || 12));
    const cfgLineHeight = Number(editorCfg.get('lineHeight') || 0);
    // VS Code uses 0 to mean "compute from font metrics". Approximate with 1.35x font size.
    const lineHeight = cfgLineHeight > 0 ? cfgLineHeight : Math.round(fontSize * 1.35);
    return { fontSize, lineHeight };
  }

  /**
   * Creates a new document with content
   */
  async createDocument(content: string, uri?: Uri): Promise<TextDocument> {
    const documentUri = uri || this.vscode.Uri.parse('untitled:untitled');
    const document = await this.vscode.workspace.openTextDocument(documentUri);

    // Set the content
    const edit = new this.vscode.WorkspaceEdit();
    edit.insert(documentUri, new this.vscode.Position(0, 0), content);
    await this.vscode.workspace.applyEdit(edit);

    return document;
  }

  /**
   * Shows a document in a new tab
   */
  async showDocument(document: TextDocument, preview: boolean = false): Promise<void> {
    await this.vscode.window.showTextDocument(document, { preview });
  }

  /**
   * Opens a file by path in VSCode
   */
  async openInVSCode(filePath: string): Promise<void> {
    try {
      const documentUri = this.vscode.Uri.file(filePath);
      const document = await this.vscode.workspace.openTextDocument(documentUri);
      await this.vscode.window.showTextDocument(document);
    } catch (error) {
      this.app.ui.debugOut(
        `Failed to open file in VSCode: ${filePath}`,
        'error',
        'VSCodeAPIs',
        error
      );
    }
  }

  /**
   * Create and show a Webview panel with provided HTML
   */
  createWebviewPanel(title: string, htmlContent: string): WebviewPanel {
    const panel = this.vscode.window.createWebviewPanel(
      'p2p4vsc.printprep',
      title,
      this.vscode.ViewColumn.Active, // Use the correct ViewColumn from vscode namespace
      { enableScripts: true, retainContextWhenHidden: true }
    );
    panel.webview.html = htmlContent;

    // Restore toolbar position if saved
    const savedPosition = this.getGlobalState('toolbarLeft');
    if (savedPosition !== undefined) {
      panel.webview.postMessage({
        type: 'restorePosition',
        left: savedPosition,
      });
    }

    return panel;
  }

  /**
   * Set up message handling for an existing webview panel
   */
  setupMessageHandling(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      await this.app.ui.handleWebviewMessage(msg);
    });
  }

  /**
   * Get all VS Code extensions that contribute themes
   * @returns Array of theme extension data with id, displayName, and extensionPath
   */
  getVSCodeExtensionsThemes(): Array<{ id: string; displayName: string; extensionPath: string }> {
    const themeExtensions = this.vscode.extensions.all.filter(
      ext =>
        ext.packageJSON?.contributes?.themes && Array.isArray(ext.packageJSON.contributes.themes)
    );

    return themeExtensions.map(ext => ({
      id: ext.id,
      displayName: (ext.packageJSON as { displayName?: string }).displayName || ext.id,
      extensionPath: ext.extensionPath,
    }));
  }

  /**
   * Get VS Code theme JSON data for a specific theme
   * @param themeId - The theme ID to retrieve
   * @param keys - Optional array of specific keys to extract from the theme
   * @returns Theme data or undefined if not found
   */
  getVSCodeThemeJson(themeId: string, keys?: string[]): Record<string, unknown> | undefined {
    // Find the extension that contributes this theme
    // themeId might be a display name, so check multiple properties
    const themeExtension = this.vscode.extensions.all.find(ext => {
      if (ext.packageJSON?.contributes?.themes) {
        const found = ext.packageJSON.contributes.themes.some(
          (theme: { id: string; label?: string; uiTheme?: string }) => {
            const matches = theme.id === themeId || theme.label === themeId;
            return matches;
          }
        );
        return found;
      }
      return false;
    });

    if (!themeExtension) {
      return undefined;
    }

    const theme = themeExtension.packageJSON.contributes.themes.find(
      (t: { id: string; label?: string; uiTheme?: string }) =>
        t.id === themeId || t.label === themeId
    );
    if (!theme) {
      return undefined;
    }

    // Load the actual theme file content if path is available
    if (theme.path && typeof theme.path === 'string') {
      try {
        const themePath = this.app.os.pathJoin(themeExtension.extensionPath, theme.path);
        const themeContent = this.app.os.readJsonFile<Record<string, unknown>>(themePath);

        if (themeContent) {
          // Merge the theme metadata with the loaded content
          const fullTheme = { ...theme, ...themeContent };

          // If specific keys requested, filter the theme data
          if (keys && keys.length > 0) {
            const filteredTheme: Record<string, unknown> = {};
            keys.forEach(key => {
              if ((fullTheme as Record<string, unknown>)[key] !== undefined) {
                filteredTheme[key] = (fullTheme as Record<string, unknown>)[key];
              }
            });
            return filteredTheme;
          }

          return fullTheme;
        }
      } catch (err) {
        this.app.ui.debugOut(`ERROR: Failed to load theme file: ${err}`, 'warn', 'VSCodeAPIs');
      }
    }

    // If specific keys requested, filter the theme data
    if (keys && keys.length > 0) {
      const filteredTheme: Record<string, unknown> = {};
      keys.forEach(key => {
        if ((theme as Record<string, unknown>)[key] !== undefined) {
          filteredTheme[key] = (theme as Record<string, unknown>)[key];
        }
      });
      return filteredTheme;
    }

    return theme;
  }

  /**
   * Get the ID of the currently active VS Code theme
   * @returns The active theme ID
   */
  getActiveThemeId(): string {
    return String(
      this.vscode.workspace.getConfiguration('workbench').get('colorTheme') || 'Default Dark+'
    );
  }

  /**
   * Gets the active text editor
   */
  getActiveTextEditor(): TextEditor | undefined {
    return this.vscode.window.activeTextEditor;
  }

  /**
   * Returns the selected text or entire document text for the active editor
   */
  getSelectionOrDocumentText(editor: TextEditor): string {
    const selection = editor.selection;
    if (!selection.isEmpty) {
      return editor.document.getText(selection);
    }
    return editor.document.getText();
  }

  /**
   * Returns the languageId of the active editor, or 'plaintext' if none
   */
  getActiveLanguageId(): string {
    const editor = this.vscode.window.activeTextEditor;
    return editor ? editor.document.languageId : 'plaintext';
  }

  /**
   * Gets the active tab name
   */
  getActiveTabName(): string {
    const activeEditor = this.vscode.window.activeTextEditor;
    if (activeEditor) {
      return this.getDescriptiveName(activeEditor.document);
    }

    // Try to get name from tab groups
    const activeTabGroup = this.vscode.window.tabGroups.activeTabGroup;
    if (activeTabGroup?.activeTab) {
      return activeTabGroup.activeTab.label;
    }

    return 'Unknown Tab';
  }

  /**
   * Gets descriptive name from document
   */
  getDescriptiveName(document: TextDocument): string {
    const uri = document.uri.toString();
    if (uri.startsWith('untitled:')) {
      const tabName = uri.replace('untitled:', '');
      return tabName;
    } else {
      const fileName = this.app.os.pathBasename(document.fileName);
      return fileName;
    }
  }

  /**
   * Shows information message
   */
  showInformationMessage(message: string): void {
    this.vscode.window.showInformationMessage(message);
  }

  /**
   * Shows warning message
   */
  showWarningMessage(message: string): void {
    this.vscode.window.showWarningMessage(message);
  }

  /**
   * Shows error message
   */
  showErrorMessage(message: string): void {
    this.vscode.window.showErrorMessage(message);
  }

  /**
   * Sets status bar message
   */
  setStatusBarMessage(text: string, timeoutMs?: number): Disposable {
    if (timeoutMs && timeoutMs > 0) {
      return this.vscode.window.setStatusBarMessage(text, timeoutMs);
    }
    return this.vscode.window.setStatusBarMessage(text);
  }

  /**
   * Gets extension path
   */
  getExtensionPath(): string {
    return this.context.extensionPath;
  }

  /**
   * Gets temp directory for the extension
   */
  getTempDirectory(): string {
    return this.app.os.pathJoin(this.context.globalStorageUri.fsPath, 'temp');
  }
}
