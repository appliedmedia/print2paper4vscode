import type { App } from './App';
import type {
  ExtensionContext,
  TextEditor,
  TextDocument,
  WebviewPanel,
  Uri,
  Position,
  WorkspaceEdit,
  Disposable,
} from 'vscode';

// Create a minimal type that includes only the VS Code API methods we actually use
type vscode_t = {
  commands: {
    registerCommand: (command: string, callback: (...args: any[]) => any) => Disposable;
  };
  window: {
    activeTextEditor: TextEditor | undefined;
    tabGroups: {
      activeTabGroup:
        | {
            activeTab: { label: string } | undefined;
          }
        | undefined;
    };
    showInformationMessage: (message: string) => void;
    showWarningMessage: (message: string) => void;
    showErrorMessage: (message: string) => void;
    setStatusBarMessage: (text: string, timeoutMs?: number) => Disposable;
    createWebviewPanel: (
      viewType: string,
      title: string,
      column: number,
      options: { enableScripts: boolean; retainContextWhenHidden: boolean }
    ) => WebviewPanel;
    showTextDocument: (document: TextDocument, options?: { preview: boolean }) => Promise<void>;
    ViewColumn: { Active: number };
  };
  workspace: {
    getConfiguration: (section: string) => {
      get: (key: string) => string | number | undefined;
    };
    openTextDocument: (uri: Uri) => Promise<TextDocument>;
    applyEdit: (edit: WorkspaceEdit) => Promise<boolean>;
  };
  Uri: {
    parse: (value: string) => Uri;
    file: (path: string) => Uri;
  };
  Position: new (line: number, character: number) => Position;
  WorkspaceEdit: new () => WorkspaceEdit;
  extensions: {
    all: Array<{
      id: string;
      packageJSON: {
        contributes: {
          themes: Array<{
            label: string;
            id: string;
          }>;
        };
      };
      extensionPath: string;
    }>;
    getExtension: (id: string) => any;
  };
};

export class VSCodeAPIs {
  private app: App;
  private vscode: vscode_t; // Use our custom type
  private context: ExtensionContext; // Properly typed context

  constructor(app: App, vscode: vscode_t, context: ExtensionContext) {
    this.app = app;
    this.vscode = vscode;
    this.context = context;
  }

  init(): void {
    // Register VS Code commands
    const printCommand = this.vscode.commands.registerCommand('p2p4vsc.print2paper', () => {
      this.app.paperprinter.handleFirstPrintCommand();
    });

    const api2tsCommand = this.vscode.commands.registerCommand('p2p4vsc.api2ts', () => {
      this.generateAPIStubs();
    });

    this.context.subscriptions.push(printCommand);
    this.context.subscriptions.push(api2tsCommand);

    this.app.ui.debugOut('VSCodeAPIs initialized', 'info', 'VSCodeAPIs');
  }

  done(): void {
    // nothing needed here yet
    this.app.ui.debugOut('VSCodeAPIs cleanup completed', 'info', 'VSCodeAPIs');
  }

  generateAPIStubs(): void {
    // Generate TypeScript stubs for VS Code API
    const stubContent = `// Auto-generated VS Code API stubs
export namespace vscode {
  export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any): any;
  }
  export namespace window {
    export const activeTextEditor: any;
    export namespace tabGroups {
      export const activeTabGroup: any;
    }
    export function showInformationMessage(message: string): void;
    export function showWarningMessage(message: string): void;
    export function showErrorMessage(message: string): void;
    export function setStatusBarMessage(text: string, timeoutMs?: number): any;
    export function createWebviewPanel(viewType: string, title: string, column: number, options: any): any;
    export function showTextDocument(document: any, options?: any): Promise<void>;
    export const ViewColumn: any;
  }
  export namespace workspace {
    export function getConfiguration(section: string): any;
    export function openTextDocument(uri: any): Promise<any>;
    export function applyEdit(edit: any): Promise<boolean>;
  }
  export namespace Uri {
    export function parse(value: string): any;
    export function file(path: string): any;
  }
  export const Position: any;
  export const WorkspaceEdit: any;
  export namespace extensions {
    export const all: any[];
    export function getExtension(id: string): any;
  }
}`;

    this.app.os.fileWrite('vscodeapis_stubs.ts', stubContent);
    this.app.ui.debugOut('VS Code API stubs generated', 'info', 'VSCodeAPIs');
  }

  getGlobalStoragePath(): string {
    return this.context.globalStorageUri.fsPath;
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
  async createDocument(content: string, uri?: any): Promise<any> {
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
  async showDocument(document: any, preview: boolean = false): Promise<void> {
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
  createWebviewPanel(title: string, htmlContent: string): any {
    const panel = this.vscode.window.createWebviewPanel(
      'p2p4vsc.printprep',
      title,
      this.vscode.window.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    panel.webview.html = htmlContent;
    return panel;
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
      displayName: (ext.packageJSON as any).displayName || ext.id,
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
    const themeExtension = this.vscode.extensions.all.find(ext =>
      ext.packageJSON?.contributes?.themes?.some((theme: any) => theme.id === themeId)
    );

    if (!themeExtension) {
      return undefined;
    }

    const theme = themeExtension.packageJSON.contributes.themes.find((t: any) => t.id === themeId);
    if (!theme) {
      return undefined;
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
  getActiveTextEditor(): any | undefined {
    return this.vscode.window.activeTextEditor;
  }

  /**
   * Returns the selected text or entire document text for the active editor
   */
  getSelectionOrDocumentText(editor: any): string {
    const selection = editor.selection;
    if (selection && !selection.isEmpty) {
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
  getDescriptiveName(document: any): string {
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
  setStatusBarMessage(text: string, timeoutMs?: number): any {
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
