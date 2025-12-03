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
import { Range } from 'vscode';
import type { SendToExt_t } from './types/UI_t';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { kExtId } from './_entrypoint_extId_t';

// Opaque ID type for webview panels
export type WebviewPanelId_t = string & { readonly __brand: 'WebviewPanelId' };

// Global state base types - simple scalars
// NOTE: Matches PersistValue_t - no booleans in global state.
// All persisted values are strings (IDs, themes) or numbers (zoom, margins).
export type GlobalStateKey_t = string;
export type GlobalStateValue_t = string | number;

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
  static readonly id = 'vscodeapis';
  private static readonly WEBVIEW_ID = kExtId + '.printprep';

  private app: App;
  public vscode: typeof import('vscode');
  public context: ExtensionContext;
  private panels = new Map<WebviewPanelId_t, WebviewPanel>();
  
  // Lazy diagnostics
  private _dx?: Diagnostics;
  private get dx(): Diagnostics {
    if (!this._dx) {
      const fn = this.app.reg.use(); // gets dx.sub from always
      this._dx = fn.dx.sub({ name: 'VSCodeAPIs' });
    }
    return this._dx;
  }

  constructor(app: App, params?: { vscode: typeof import('vscode'); context: ExtensionContext }) {
    this.app = app;
    if (!params) {
      throw new Error('VSCodeAPIs requires vscode and context params');
    }
    this.vscode = params.vscode;
    this.context = params.context;

    // Register VS Code commands - must happen at activation
    // Command handlers resolve dependencies lazily when invoked
    const command_Print2Paper = this.vscode.commands.registerCommand('p2p4vsc.print2paper', () => {
      const fn = this.app.reg.use('paperprinter.handlePrintCommandFromVSCode');
      fn.paperprinter.handlePrintCommandFromVSCode();
    });

    const command_PersistClear = this.vscode.commands.registerCommand(
      'p2p4vsc.persistClear',
      async () => {
        const fn = this.app.reg.use('persist.clear');
        await fn.persist.clear();
      }
    );

    this.context.subscriptions.push(command_Print2Paper, command_PersistClear);
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
  updateGlobalState(args: { key: GlobalStateKey_t; value: GlobalStateValue_t }): void {
    const dx = this.dx.sub({ name: 'updateGlobalState' });
    dx.require(args, ['key', 'value']);
    const { key, value } = args;
    this.context.globalState.update(key, value);
    dx.done();
  }

  /**
   * Delete global state value
   */
  deleteGlobalState(args: { key: GlobalStateKey_t }): void {
    const dx = this.dx.sub({ name: 'deleteGlobalState' });
    dx.require(args, ['key']);
    const { key } = args;
    this.context.globalState.update(key, undefined);
    dx.done();
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
  private generatePanelId(title: string): WebviewPanelId_t {
    let baseId = title.toLowerCase().replace(/\s+/g, '_') as WebviewPanelId_t;

    if (this.panels.has(baseId)) {
      const dt = this.app.os.dateAsYYYYMMDDHHMMSS();
      baseId = `${baseId}_${dt}` as WebviewPanelId_t;
    }

    return baseId;
  }


  /**
   * Update panel HTML content
   */
  updatePanelHtml(args: { id: WebviewPanelId_t; html: string }): void {
    const dx = this.dx.sub({ name: 'updatePanelHtml' });
    dx.require(args, ['id', 'html']);
    const { id, html } = args;
    const panel = this.panels.get(id);
    if (panel) panel.webview.html = html;
    dx.done();
  }

  /**
   * Remove panel from map (for cleanup)
   */
  removePanel(id: WebviewPanelId_t): void {
    this.panels.delete(id);
    this.dx.out(`Removed panel from map: ${id}`);
  }

  /**
   * Get panel for URI conversion (internal use)
   */
  getPanelForUriConversion(id: WebviewPanelId_t): WebviewPanel | undefined {
    return this.panels.get(id);
  }

  /**
   * Get or create webview panel with URI conversion
   */
  async getOrCreateWebviewPanel(args: {
    title: string;
    html: string;
    existingPanelId?: WebviewPanelId_t;
  }): Promise<WebviewPanelId_t> {
    const dx = this.dx.sub({ name: 'getOrCreateWebviewPanel' });
    dx.require(args, ['title', 'html']);
    const { title, html, existingPanelId } = args;
    dx.out(
      `getOrCreateWebviewPanel: existingPanelId=${existingPanelId}, panels.size=${this.panels.size}`
    );

    // Check if we have an existing panel to reuse
    if (existingPanelId) {
      const panel = this.panels.get(existingPanelId);
      if (panel) {
        try {
          // Panel is still valid, reuse it
          dx.out(`Reusing existing panel: ${existingPanelId}`);
          panel.title = title;
          const htmlWithURIs = this.app.os.htmlSrcPathToURI({ html, webviewPanelId: existingPanelId });
          panel.webview.html = htmlWithURIs;
          dx.done();
          return existingPanelId;
        } catch {
          // Panel is disposed, remove from map
          dx.out(`Panel disposed, removing from map: ${existingPanelId}`);
          this.panels.delete(existingPanelId);
        }
      } else {
        dx.out(`Panel not found in map: ${existingPanelId}`);
      }
    } else {
      dx.out(`No existingPanelId provided`);
    }

    // Create new panel
    dx.out(`Creating new panel for title: ${title}`);

    // Get extension root URI for local resource access
    const extensionRoot = this.app.os.getExtensionRoot();
    const extensionUri = extensionRoot ? this.vscode.Uri.file(extensionRoot) : undefined;

    const panel = this.vscode.window.createWebviewPanel(
      VSCodeAPIs.WEBVIEW_ID,
      title,
      this.vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: extensionUri ? [extensionUri] : [],
      }
    );

    // Generate unique ID and store panel
    const id = this.generatePanelId(title);
    this.panels.set(id, panel);

    // Clean up when panel is closed
    panel.onDidDispose(() => {
      this.panels.delete(id);
      dx.out(`Panel ${id} disposed and removed from map`);
    });

    // Set up message handling
    this.setupMessageHandling(panel);

    const htmlWithURIs = this.app.os.htmlSrcPathToURI({ html, webviewPanelId: id });
    this.updatePanelHtml({ id, html: htmlWithURIs });

    dx.done();
    return id;
  }

  /**
   * Set up message handling for an existing webview panel
   */
  setupMessageHandling(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage(async (msg: SendToExt_t) => {
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
  getVSCodeThemeJson(args: {
    themeId: string;
    keys?: string[];
  }): Record<string, unknown> | undefined {
    const dx = this.dx.sub({ name: 'getVSCodeThemeJson' });
    dx.require(args, ['themeId']);
    const { themeId, keys } = args;
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
      dx.done();
      return undefined;
    }

    const theme = themeExtension.packageJSON.contributes.themes.find(
      (t: { id: string; label?: string; uiTheme?: string }) =>
        t.id === themeId || t.label === themeId
    );
    if (!theme) {
      dx.done();
      return undefined;
    }

    // Load the actual theme file content if path is available
    if (theme.path && typeof theme.path === 'string') {
      try {
        const themePath = this.app.os.pathJoin(themeExtension.extensionPath, theme.path);
        const themeContent = (this.app.os.fileRead as (args: { path: string }) => Record<string, unknown> | undefined)({ path: themePath });

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
            dx.done();
            return filteredTheme;
          }

          dx.done();
          return fullTheme;
        }
      } catch (err) {
        dx.out(`ERROR: Failed to load theme file: ${err}`);
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
      dx.done();
      return filteredTheme;
    }

    dx.done();
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
      // If there's a selection, get the entire line(s) that contain the selection
      const startLine = selection.start.line;
      const endLine = selection.end.line;
      const lineRange = new Range(startLine, 0, endLine + 1, 0);
      return editor.document.getText(lineRange);
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
   *
   * NOTE: Left here intentionally to guide future developers.
   *
   * CAVEAT: Both vscode.env.language, vscode.l10n.uri?.fsPath, and navigator.language
   * often return just "en" without region codes (not "en-US" as documented).
   * They are unreliable for region detection. Use OS.getLocale() instead which uses Intl API.
   *
   * Examples of what these APIs actually return:
   * - vscode.env.language → "en" (just language, no region)
   * - vscode.l10n.uri?.fsPath → path like "/path/to/vscode/l10n/bundle.l10n.json" (not a locale string)
   * - navigator.language → "en" (browser API, also unreliable)
   *
   * @deprecated Use OS.getLocale() for actual locale with region
   */
}

// end, VSCodeAPIs.ts
