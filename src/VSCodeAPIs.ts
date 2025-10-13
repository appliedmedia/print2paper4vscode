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
import type { PostMessage } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

// Opaque ID type for webview panels
export type WebviewPanelId = string & { readonly __brand: 'WebviewPanelId' };

// Global state base types - simple scalars
export type GlobalStateKey_t = string;
export type GlobalStateValue_t = string | number | boolean;

/**
 * VSCodeAPIs - VS Code API isolation layer
 *
 * Single source of truth for all VS Code API access. Isolates vscode module imports
 * to prevent circular dependencies. Manages commands, webview panels, global state,
 * text editors, and workspace operations. Provides typed wrappers around VS Code APIs.
 *
 * @input app - Application instance
 * @input vscode - VS Code API module
 * @input context - Extension context from VS Code
 * @output VS Code operations, webview management, global state, editor access
 *
 * @example
 * const apis = new VSCodeAPIs(app, vscode, context);
 * const editor = apis.getActiveTextEditor();
 * apis.updateGlobalState('theme', 'github-light');
 * const panel = apis.createWebviewPanel('preview', 'Preview', ...);
 */
export class VSCodeAPIs {
  private app: App;
  private vscode: typeof import('vscode'); // Use official VS Code types
  private context: ExtensionContext; // Properly typed context
  private panels = new Map<WebviewPanelId, WebviewPanel>(); // Panel mapping
  private dx: Diagnostics;

  constructor(app: App, vscode: typeof import('vscode'), context: ExtensionContext) {
    this.app = app;
    this.vscode = vscode;
    this.context = context;
    this.dx = app.dx.create('VSCodeAPIs');
  }

  init(): void {
    const dx = this.dx.sub('init');
    dx.require({ vscode: this.vscode, context: this.context }, ['vscode', 'context']);

    // Register VS Code commands
    const printCommand = this.vscode.commands.registerCommand('p2p4vsc.print2paper', () => {
      this.app.paperprinter.handleFirstPrintCommand();
    });

    this.context.subscriptions.push(printCommand);
    dx.done();
  }

  done(): void {
    // nothing needed here yet
    this.dx.done();
  }

  getGlobalStoragePath(): string {
    return this.context.globalStorageUri.fsPath;
  }

  /**
   * Update global state value
   */
  updateGlobalState(key: GlobalStateKey_t, value: GlobalStateValue_t): void {
    this.context.globalState.update(key, value);
  }

  /**
   * Get global state value
   */
  getGlobalState(key: GlobalStateKey_t): GlobalStateValue_t | undefined {
    return this.context.globalState.get(key);
  }

  getEditorTypography(): {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
    sizeToHeightRatio: number;
  } {
    const editorCfg = this.vscode.workspace.getConfiguration('editor');
    const fontSize = Math.max(10, Number(editorCfg.get('fontSize') || 12));
    const cfgLineHeight = Number(editorCfg.get('lineHeight') || 0);
    const fontFamily = String(editorCfg.get('fontFamily') || 'Consolas, "Courier New", monospace');
    // VS Code uses 0 to mean "compute from font metrics". Use balanced spacing for code printing.
    const lineHeight = cfgLineHeight > 0 ? cfgLineHeight : Math.round(fontSize * 1.2);
    const sizeToHeightRatio = lineHeight / fontSize;
    return { fontSize, lineHeight, fontFamily, sizeToHeightRatio };
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
      this.dx.out(`Failed to open file in VSCode: ${filePath} - ${error}`);
    }
  }

  /**
   * Generate a unique panel ID from title
   */
  private generatePanelId(title: string): WebviewPanelId {
    let baseId = title.toLowerCase().replace(/\s+/g, '_') as WebviewPanelId;

    if (this.panels.has(baseId)) {
      const dt = this.app.os.dateAsYYYYMMDDHHMMSS();
      baseId = `${baseId}_${dt}` as WebviewPanelId;
    }

    return baseId;
  }

  /**
   * Create and show a Webview panel with provided HTML
   * @deprecated Use getOrCreateWebviewPanel instead for URI conversion and panel reuse
   */
  createWebviewPanel_OBSOLETE_DELETEME(title: string, htmlContent: string): WebviewPanelId {
    // Get extension root URI for local resource access
    const extensionRoot = this.app.os.getExtensionRoot();
    const extensionUri = extensionRoot ? this.vscode.Uri.file(extensionRoot) : undefined;

    const panel = this.vscode.window.createWebviewPanel(
      'p2p4vsc.printprep',
      title,
      this.vscode.ViewColumn.Active, // Use the correct ViewColumn from vscode namespace
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: extensionUri ? [extensionUri] : [], // Allow access to extension files
        // Most restrictive sandbox settings for security
        // allow-same-origin: false - prevents access to parent window
        // allow-forms: false - no form submission needed
        // allow-popups: false - no popups needed
        // allow-top-navigation: false - no navigation needed
        // allow-modals: false - no modals needed
        // allow-downloads: false - no downloads needed
        // allow-pointer-lock: false - no pointer lock needed
        // allow-presentation: false - no presentation needed
        // allow-storage-access-by-user-activation: false - no storage access needed
        // allow-top-navigation-by-user-activation: false - no user navigation needed
      }
    );
    panel.webview.html = htmlContent;

    // Generate unique ID and store panel
    const id = this.generatePanelId(title);
    this.panels.set(id, panel);

    // Clean up when panel is closed
    panel.onDidDispose(() => {
      this.panels.delete(id);
      this.dx.out(`Panel ${id} disposed and removed from map`);
    });

    // Set up message handling
    this.setupMessageHandling(panel);

    // Restore toolbar position if saved
    const savedPosition = this.getGlobalState('toolbarPosPx');
    if (savedPosition) {
      panel.webview.postMessage({
        type: 'restorePosition',
        left: savedPosition,
      });
    }

    return id;
  }

  /**
   * Update panel title
   */
  setPanelTitle(id: WebviewPanelId, title: string): void {
    const panel = this.panels.get(id);
    if (panel) panel.title = title;
  }

  /**
   * Update panel HTML content
   */
  updatePanelHtml(id: WebviewPanelId, html: string): void {
    const panel = this.panels.get(id);
    if (panel) panel.webview.html = html;
  }

  /**
   * Post message to panel
   */
  postMessage(id: WebviewPanelId, message: PostMessage): void {
    const panel = this.panels.get(id);
    if (!panel) return;

    try {
      panel.webview.postMessage(message);
    } catch (error) {
      // Panel disposed, remove from map
      this.panels.delete(id);
      this.dx.out(`Panel disposed, removing from map: ${id}`);
      this.dx.out(`Error posting message to panel: ${String(error)}`);
    }
  }

  /**
   * Remove panel from map (for cleanup)
   */
  removePanel(id: WebviewPanelId): void {
    this.panels.delete(id);
    this.dx.out(`Removed panel from map: ${id}`);
  }

  /**
   * Get panel for URI conversion (internal use)
   */
  getPanelForUriConversion(id: WebviewPanelId): WebviewPanel | undefined {
    return this.panels.get(id);
  }

  /**
   * Get or create webview panel with URI conversion
   */
  async getOrCreateWebviewPanel(
    title: string,
    html: string,
    existingPanelId?: WebviewPanelId
  ): Promise<WebviewPanelId> {
    this.dx.out(
      `getOrCreateWebviewPanel: existingPanelId=${existingPanelId}, panels.size=${this.panels.size}`
    );

    // Check if we have an existing panel to reuse
    if (existingPanelId) {
      const panel = this.panels.get(existingPanelId);
      if (panel) {
        try {
          // Panel is still valid, reuse it
          this.dx.out(`Reusing existing panel: ${existingPanelId}`);
          panel.title = title;
          const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, existingPanelId);
          panel.webview.html = htmlWithURIs;
          return existingPanelId;
        } catch {
          // Panel is disposed, remove from map
          this.dx.out(`Panel disposed, removing from map: ${existingPanelId}`);
          this.panels.delete(existingPanelId);
        }
      } else {
        this.dx.out(`Panel not found in map: ${existingPanelId}`);
      }
    } else {
      this.dx.out(`No existingPanelId provided`);
    }

    // Create new panel
    this.dx.out(`Creating new panel for title: ${title}`);
    const id = this.createWebviewPanel_OBSOLETE_DELETEME(title, '');
    const htmlWithURIs = this.app.os.htmlSrcPathToURI(html, id);
    this.updatePanelHtml(id, htmlWithURIs);
    return id;
  }

  /**
   * Set up message handling for an existing webview panel
   */
  setupMessageHandling(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage(async (msg: PostMessage) => {
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
        const themeContent = this.app.os.fileRead<Record<string, unknown>>(themePath);

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
        this.dx.out(`ERROR: Failed to load theme file: ${err}`);
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
   * Checks if the active editor has a non-empty selection
   */
  hasActiveSelection(): boolean {
    const editor = this.vscode.window.activeTextEditor;
    return editor ? !editor.selection.isEmpty : false;
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
  getDir_Temp(): string {
    return this.app.os.pathJoin(this.context.globalStorageUri.fsPath, 'temp');
  }

  /**
   * Show save dialog to user
   */
  async showSaveDialog(options: {
    defaultUri?: Uri;
    filters?: { [name: string]: string[] };
    title?: string;
  }): Promise<Uri | undefined> {
    return await this.vscode.window.showSaveDialog(options);
  }

  /**
   * Convert file path to URI
   */
  uriFromPath(filePath: string): Uri {
    return this.vscode.Uri.file(filePath);
  }

  /**
   * Convert URI to file path
   */
  uriToPath(uri: Uri): string {
    return uri.fsPath;
  }

  /**
   * Gets the current VS Code locale
   */
  getLocale(): string {
    return this.vscode.env.language;
  }
}

// end, VSCodeAPIs.ts
