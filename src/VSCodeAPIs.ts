import * as vscode from 'vscode';
import type { App } from './App.js';

export class VSCodeAPIs {
    private app: App;
    private context: vscode.ExtensionContext;

    constructor(app: App, context: vscode.ExtensionContext) {
        this.app = app;
        this.context = context;
    }

    init(): void {
        // Register VS Code commands
        const printCommand = vscode.commands.registerCommand('p2p4vs.print2paper', () => {
            this.app.paperprinter.handlePrint();
        });

        const capturePreviewCommand = vscode.commands.registerCommand('p2p4vs.capturePreview', () => {
            this.app.paperprinter.handleCapturePreview();
        });

        this.context.subscriptions.push(printCommand, capturePreviewCommand);
        
        this.app.ui.debugOut('VSCodeAPIs initialized', 'info', 'VSCodeAPIs');
    }

    done(): void {
        // nothing needed here yet
        this.app.ui.debugOut('VSCodeAPIs cleanup completed', 'info', 'VSCodeAPIs');
    }

    /**
     * Gets the active text editor
     */
    getActiveTextEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
    }

    /**
     * Returns the selected text or entire document text for the active editor
     */
    getSelectionOrDocumentText(editor: vscode.TextEditor): string {
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
        const editor = vscode.window.activeTextEditor;
        return editor ? editor.document.languageId : 'plaintext';
    }

    // Removed legacy string mapping; we now pass VS Code theme JSONs directly

    /**
     * Gets the active tab name
     */
    getActiveTabName(): string {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return this.getDescriptiveName(activeEditor.document);
        }
        
        // Try to get name from tab groups
        const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
        if (activeTabGroup?.activeTab) {
            return activeTabGroup.activeTab.label;
        }
        
        return 'Unknown Tab';
    }

    /**
     * Gets descriptive name from document
     */
    getDescriptiveName(document: vscode.TextDocument): string {
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
        vscode.window.showInformationMessage(message);
    }

    /**
     * Shows warning message
     */
    showWarningMessage(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    /**
     * Shows error message
     */
    showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    /**
     * Sets status bar message
     */
    setStatusBarMessage(text: string, timeoutMs?: number): vscode.Disposable {
        if (timeoutMs && timeoutMs > 0) {
            return vscode.window.setStatusBarMessage(text, timeoutMs);
        }
        return vscode.window.setStatusBarMessage(text);
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
        const configured = (vscode.workspace.getConfiguration('workbench').get<string>('colorTheme') || '').trim();
        return configured || 'Editor Theme';
    }

    getEditorTypography(): { fontSize: number; lineHeight: number } {
        const editorCfg = vscode.workspace.getConfiguration('editor');
        const fontSize = Math.max(10, Number(editorCfg.get<number>('fontSize') || 12));
        const cfgLineHeight = Number(editorCfg.get<number>('lineHeight') || 0);
        // VS Code uses 0 to mean "compute from font metrics". Approximate with 1.35x font size.
        const lineHeight = cfgLineHeight > 0 ? cfgLineHeight : Math.round(fontSize * 1.35);
        return { fontSize, lineHeight };
    }

    /**
     * Creates a new document with content
     */
    async createDocument(content: string, uri?: vscode.Uri): Promise<vscode.TextDocument> {
        const documentUri = uri || vscode.Uri.parse('untitled:untitled');
        const document = await vscode.workspace.openTextDocument(documentUri);
        
        // Set the content
        const edit = new vscode.WorkspaceEdit();
        edit.insert(documentUri, new vscode.Position(0, 0), content);
        await vscode.workspace.applyEdit(edit);
        
        return document;
    }

    /**
     * Shows a document in a new tab
     */
    async showDocument(document: vscode.TextDocument, preview: boolean = false): Promise<void> {
        await vscode.window.showTextDocument(document, { preview });
    }

    /**
     * Create and show a Webview panel with provided HTML
     */
    createWebviewPanel(title: string, htmlContent: string): vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel(
            'p2p4vs.printprep',
            title,
            vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        panel.webview.html = htmlContent;
        return panel;
    }

    /**
     * Resolve the active VS Code theme JSON
     */
    getActiveThemeShikiTheme(): unknown {
        try {
            const configured = (vscode.workspace.getConfiguration('workbench').get<string>('colorTheme') || '').toLowerCase();

            // Search all extensions that contribute themes; pick the configured one
            for (const ext of vscode.extensions.all) {
                const contrib = (ext.packageJSON?.contributes?.themes || []) as Array<{ label?: string; path?: string; id?: string }>;
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
            const themeDefaults = vscode.extensions.getExtension('vscode.theme-defaults') || vscode.extensions.getExtension('ms-vscode.theme-defaults');
            if (themeDefaults) {
                const base = this.app.os.pathJoin(themeDefaults.extensionPath, 'themes');
                const name = configured;
                const map: Record<string, string> = {
                    'default dark modern': 'dark_modern.json',
                    'default light modern': 'light_modern.json',
                    'default dark+': 'dark_plus.json',
                    'default light+': 'light_plus.json'
                };
                const file = map[name];
                if (file) {
                    const abs = this.app.os.pathJoin(base, file);
                    const loaded = this.app.os.readJsonFile<Record<string, unknown>>(abs);
                    if (loaded) return loaded;
                }
            }
        } catch (err) {
           this.app.ui.debugOut('ERROR:getActiveThemeShikiTheme: No active theme found', 'warn', 'VSCodeAPIs', err);
        }

        // Final fallback: use the first available light theme from Stylize
        const lightThemes = this.app.stylize.getShikiThemes('light|bright|day');
        return lightThemes.length > 0 ? lightThemes[0].id : 'github-light';
    }

    // Return the active theme as either a Shiki theme name string or a VS Code theme JSON object
    getActiveTheme(): unknown {
        return this.getActiveThemeShikiTheme();
    }

    // Simple function to get VSCode themes with optional filter
    getVSCodeThemes(filter?: string): Array<{ id: string; label: string; source: 'vscode' }> {
        try {
            // Get all extensions that contribute themes
            const themeExtensions = vscode.extensions.all.filter(ext => 
                ext.packageJSON?.contributes?.themes && 
                Array.isArray(ext.packageJSON.contributes.themes)
            );

            // Extract all themes from all extensions
            const allThemes = themeExtensions.flatMap(ext => {
                const extThemes = ext.packageJSON.contributes.themes;
                return extThemes.map((theme: any) => ({
                    id: theme.id || theme.name || `theme-${ext.id}`,
                    label: theme.label || theme.name || theme.id || `Theme from ${ext.id}`,
                    source: 'vscode' as const,
                    extension: ext.id,
                    theme: theme // Keep the full theme object for Shiki
                }));
            }).filter(theme => theme.id && theme.label);

            // Remove duplicates
            const uniqueThemes = allThemes.filter((theme, index, self) => 
                index === self.findIndex(t => t.id === theme.id)
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