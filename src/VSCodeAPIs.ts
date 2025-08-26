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
      this.app.paperprinter.handlePrint();
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

  /**
   * Generate VS Code API TypeScript stubs to temp file
   */
  private async generateAPIStubs(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tempFileName = `${timestamp}_vscodeapi_stubs.ts`;
      const tempDir = this.getTempDirectory();
      const tempFilePath = this.app.os.pathJoin(tempDir, tempFileName);

      this.app.ui.debugOut(`Generating API stubs to: ${tempFilePath}`, 'info', 'VSCodeAPIs');

      // Generate the stubs content
      const stubsContent = this.generateStubsContent();

      // Write to temp file
      const fs = await import('fs');
      fs.writeFileSync(tempFilePath, stubsContent, 'utf8');

      // Show success message with file path
      this.vscode.window.showInformationMessage(`VS Code API stubs generated: ${tempFilePath}`);
    } catch (error) {
      this.app.ui.debugOut(`Failed to generate API stubs: ${error}`, 'error', 'VSCodeAPIs');
      this.vscode.window.showErrorMessage(`Failed to generate API stubs: ${error}`);
    }
  }

  /**
   * Generate the actual stubs content
   */
  private generateStubsContent(): string {
    let output = '';

    // Header
    output += `// Auto-generated VS Code API TypeScript stubs\n`;
    output += `// Generated on: ${new Date().toISOString()}\n`;
    output += `// Source: vscode module introspection\n\n`;

    // Main VSCodeAPI interface - dynamically generated from actual vscode object
    output += `export interface VSCodeAPI {\n`;

    // Walk the actual vscode object and generate properties
    const vscodeKeys = Object.getOwnPropertyNames(this.vscode);
    for (const key of vscodeKeys) {
      try {
        const value = (this.vscode as any)[key];
        const type = this.getTypeOf(value);
        output += `  ${key}: ${type};\n`;
      } catch (error) {
        output += `  ${key}: unknown; // Error getting type: ${error}\n`;
      }
    }
    output += `}\n\n`;

    // Generate interfaces for all top-level objects in vscode
    for (const key of vscodeKeys) {
      try {
        const value = (this.vscode as any)[key];
        if (typeof value === 'object' && value !== null) {
          const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
          output += this.generateInterface(value, interfaceName, 0) + '\n\n';
        }
      } catch (error) {
        this.app.ui.debugOut(`Failed to get type for ${key}: ${error}`, 'error', 'VSCodeAPIs'); // Skip if we can't process this key
      }
    }

    return output;
  }

  /**
   * Generate TypeScript interface for an object
   */
  private generateInterface(
    obj: any,
    name: string,
    depth: number = 0,
    visited: Set<any> = new Set()
  ): string {
    const MAX_DEPTH = 5;
    const MAX_PROPERTIES = 100;

    if (depth > MAX_DEPTH || visited.has(obj)) {
      return `export interface ${name} {\n  // Circular reference or max depth reached\n}`;
    }

    visited.add(obj);

    try {
      const properties = Object.getOwnPropertyNames(obj);
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj) || {});
      const allProps = [...new Set([...properties, ...methods])];

      if (allProps.length === 0) {
        return `export interface ${name} {\n  // Empty interface\n}`;
      }

      // Limit properties to prevent massive interfaces
      const limitedProps = allProps.slice(0, MAX_PROPERTIES);

      const interfaceBody = limitedProps
        .filter(prop => {
          // Skip internal properties
          return !prop.startsWith('_') && !prop.startsWith('__') && prop !== 'constructor';
        })
        .map(prop => {
          try {
            const value = obj[prop];
            const type = this.getTypeOf(value);
            return `  ${prop}: ${type};`;
          } catch {
            return `  ${prop}: any;`;
          }
        })
        .join('\n');

      return `export interface ${name} {\n${interfaceBody}\n}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `export interface ${name} {\n  // Error generating interface: ${errorMessage}\n}`;
    } finally {
      visited.delete(obj);
    }
  }

  /**
   * Get the type of a value as a string
   */
  private getTypeOf(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    if (type === 'function') {
      // Try to determine if it's a constructor
      try {
        const func = value as { prototype?: { constructor?: unknown } };
        if (func.prototype && func.prototype.constructor === func) {
          return 'new (...args: unknown[]) => unknown';
        }
      } catch {
        // Ignore prototype access errors
      }
      return '(...args: unknown[]) => unknown';
    }

    if (type === 'object') {
      if (Array.isArray(value)) {
        // Try to determine array element type
        if (value.length > 0) {
          const firstElementType = this.getTypeOf(value[0]);
          return `${firstElementType}[]`;
        }
        return 'unknown[]';
      }
      if (value instanceof Date) return 'Date';
      if (value instanceof RegExp) return 'RegExp';

      // For objects, try to determine if it's a specific type
      if (value && typeof value === 'object') {
        const constructorName = value.constructor?.name;
        if (constructorName && constructorName !== 'Object') {
          return constructorName;
        }
      }

      return 'Record<string, unknown>';
    }

    return type;
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

  // Removed legacy string mapping; we now pass VS Code theme JSONs directly

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

  getGlobalStoragePath(): string {
    return this.context.globalStorageUri.fsPath;
  }

  getActiveThemeLabel(): string {
    const configured = (this.vscode.workspace.getConfiguration('workbench').get('colorTheme') || '')
      .toString()
      .trim();
    return configured || 'Editor Theme';
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
   * Resolve the active VS Code theme JSON
   */
  getActiveThemeShikiTheme(): unknown {
    const configured = (this.vscode.workspace.getConfiguration('workbench').get('colorTheme') || '')
      .toString()
      .toLowerCase();

    try {
      // Search all extensions that contribute themes; pick the configured one
      for (const ext of this.vscode.extensions.all) {
        const contrib = (ext.packageJSON?.contributes?.themes || []) as Array<{
          label?: string;
          path?: string;
          id?: string;
        }>;
        for (const themeEntry of contrib) {
          const label = (themeEntry.label || themeEntry.id || '').toLowerCase();
          if (label && configured && label === configured) {
            const absPath = this.app.os.pathJoin(ext.extensionPath, themeEntry.path || '');
            const loaded = this.app.os.readJsonFile<Record<string, unknown>>(absPath);
            if (loaded) return loaded;
          }
        }
      }

      // Fallback for default themes shipped in theme-defaults
      const themeDefaults =
        this.vscode.extensions.getExtension('vscode.theme-defaults') ||
        this.vscode.extensions.getExtension('ms-vscode.theme-defaults');
      if (themeDefaults) {
        const base = this.app.os.pathJoin(themeDefaults.extensionPath, 'themes');
        const name = configured;
        const map: Record<string, string> = {
          'default dark modern': 'dark_modern.json',
          'default light modern': 'light_modern.json',
          'default dark+': 'dark_plus.json',
          'default light+': 'light_plus.json',
        };
        const file = map[name];
        if (file) {
          const abs = this.app.os.pathJoin(base, file);
          const loaded = this.app.os.readJsonFile<Record<string, unknown>>(abs);
          if (loaded) return loaded;
        }
      }
    } catch (err) {
      this.app.ui.debugOut(
        'ERROR:getActiveThemeShikiTheme: No active theme found',
        'warn',
        'VSCodeAPIs',
        err
      );
    }

    // No fallback - if we can't find the active theme, fail properly
    throw new Error(
      `Could not resolve active theme '${configured}' - no matching theme found in extensions`
    );
  }

  // Return the active theme as either a Shiki theme name string or a VS Code theme JSON object
  getActiveTheme(): unknown {
    return this.getActiveThemeShikiTheme();
  }

  // Simple function to get VSCode themes with optional filter
  getVSCodeThemes(filter?: string): Array<{ id: string; label: string; source: 'vscode' }> {
    try {
      // Get all extensions that contribute themes
      const themeExtensions = this.vscode.extensions.all.filter(
        ext =>
          ext.packageJSON?.contributes?.themes && Array.isArray(ext.packageJSON.contributes.themes)
      );

      // Extract all themes from all extensions
      const allThemes = themeExtensions
        .flatMap(ext => {
          const extThemes = ext.packageJSON.contributes.themes;
          return extThemes.map((theme: any) => ({
            id: theme.id || theme.name || `theme-${ext.id}`,
            label: theme.label || theme.name || theme.id || `Theme from ${ext.id}`,
            source: 'vscode' as const,
            extension: ext.id,
            theme: theme, // Keep the full theme object for Shiki
          }));
        })
        .filter(theme => theme.id && theme.label);

      // Remove duplicates
      const uniqueThemes = allThemes.filter(
        (theme, index, self) => index === self.findIndex(t => t.id === theme.id)
      );

      // Apply filter if provided
      if (filter) {
        const filterRegex = new RegExp(filter, 'i');
        return uniqueThemes.filter(theme => filterRegex.test(theme.label));
      }

      return uniqueThemes;
    } catch (err) {
      this.app.ui.debugOut('ERROR:getVSThemes: Failed to get themes', 'warn', 'VSCodeAPIs', err);
      return [];
    }
  }

  // loadThemeJson removed; use OS.readJsonFile and handle include/merge at a higher layer
}
