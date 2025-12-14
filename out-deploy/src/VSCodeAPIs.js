"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeAPIs = void 0;
const vscode_1 = require("vscode");
const _entrypoint_extId_t_1 = require("./_entrypoint_extId_t");
const Persist_1 = require("./Persist");
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
class VSCodeAPIs {
    static id = 'vscodeapis';
    static WEBVIEW_ID = _entrypoint_extId_t_1.kExtId + '.printprep';
    reg;
    fn;
    vscode;
    context;
    panels = new Map();
    dx;
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('paperprinter.handlePrintCommandFromVSCode', 'ui.handleWebviewMessage', 'os.pathJoin', 'os.fileRead', 'os.getExtensionRoot', 'os.htmlSrcPathToURI', 'os.pathBasename', 'os.dateAsYYYYMMDDHHMMSS');
        this.dx = this.fn.dx.sub({ name: 'VSCodeAPIs' });
        this.vscode = args.vscode;
        this.context = args.context;
        // Register VS Code commands - must happen at activation
        // Command handlers use methods requested during construction
        const command_Print2Paper = this.vscode.commands.registerCommand('p2p4vsc.print2paper', () => {
            this.fn.paperprinter.handlePrintCommandFromVSCode();
        });
        const command_PersistClear = this.vscode.commands.registerCommand('p2p4vsc.persistClear', async () => {
            await Persist_1.Persist.clear({ reg: this.reg });
        });
        this.context.subscriptions.push(command_Print2Paper, command_PersistClear);
    }
    done() {
        // nothing needed here yet
        this.dx.done();
    }
    getGlobalStoragePath() {
        return this.context.globalStorageUri.fsPath;
    }
    /**
     * Update global state value
     */
    updateGlobalState(args) {
        const dx = this.dx.sub({ name: 'updateGlobalState' });
        dx.require(args, ['key', 'value']);
        const { key, value } = args;
        this.context.globalState.update(key, value);
        dx.done();
    }
    /**
     * Delete global state value
     */
    deleteGlobalState(args) {
        const dx = this.dx.sub({ name: 'deleteGlobalState' });
        dx.require(args, ['key']);
        const { key } = args;
        this.context.globalState.update(key, undefined);
        dx.done();
    }
    /**
     * Get global state value
     */
    getGlobalState(key) {
        return this.context.globalState.get(key);
    }
    /**
     * Get workspace configuration for a given section
     */
    getConfiguration(section) {
        return this.vscode.workspace.getConfiguration(section);
    }
    /**
     * Get VS Code markdown language features extension
     */
    getExtension_Markdown() {
        return this.vscode.extensions.getExtension('vscode.markdown-language-features');
    }
    /**
     * Render markdown to HTML using VS Code's official markdown.api.render command
     * @param markdown - Markdown source text
     * @param document - VS Code TextDocument for context (currently unused, for future enhancement)
     * @returns HTML string
     * @see https://code.visualstudio.com/api/extension-guides/markdown-extension
     */
    async renderMarkdownToHtml(args) {
        const dx = this.dx.sub({ name: 'renderMarkdownToHtml' });
        dx.require(args, ['markdown', 'document']);
        const { markdown } = args;
        try {
            // Use the official markdown.api.render command (available since VS Code 1.38)
            // This is the documented approach instead of accessing extension.exports directly
            const html = await this.vscode.commands.executeCommand('markdown.api.render', markdown);
            if (!html) {
                const errorMsg = 'Markdown render command returned empty result';
                dx.error(errorMsg);
                throw new Error(errorMsg);
            }
            dx.out(`Rendered markdown to HTML (${html.length} chars)`);
            return html;
        }
        catch (error) {
            const errorMsg = `Failed to render markdown: ${error instanceof Error ? error.message : String(error)}`;
            dx.error(errorMsg);
            throw new Error(errorMsg);
        }
        finally {
            dx.done();
        }
    }
    getEditorTypography() {
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
    async createDocument(content, uri) {
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
    async showDocument(document, preview = false) {
        await this.vscode.window.showTextDocument(document, { preview });
    }
    /**
     * Opens a file by path in VSCode
     */
    async openInVSCode(filePath) {
        try {
            const documentUri = this.vscode.Uri.file(filePath);
            const document = await this.vscode.workspace.openTextDocument(documentUri);
            await this.vscode.window.showTextDocument(document);
        }
        catch (error) {
            this.dx.out(`Failed to open file in VSCode: ${filePath} - ${error}`);
        }
    }
    /**
     * Generate a unique panel ID from title
     */
    generatePanelId(title) {
        let baseId = title.toLowerCase().replace(/\s+/g, '_');
        if (this.panels.has(baseId)) {
            const dt = this.fn.os.dateAsYYYYMMDDHHMMSS();
            baseId = `${baseId}_${dt}`;
        }
        return baseId;
    }
    /**
     * Update panel HTML content
     */
    updatePanelHtml(args) {
        const dx = this.dx.sub({ name: 'updatePanelHtml' });
        dx.require(args, ['id', 'html']);
        const { id, html } = args;
        const panel = this.panels.get(id);
        if (panel)
            panel.webview.html = html;
        dx.done();
    }
    /**
     * Remove panel from map (for cleanup)
     */
    removePanel(id) {
        this.panels.delete(id);
        this.dx.out(`Removed panel from map: ${id}`);
    }
    /**
     * Get panel for URI conversion (internal use)
     */
    getPanelForUriConversion(id) {
        return this.panels.get(id);
    }
    /**
     * Get or create webview panel with URI conversion
     */
    async getOrCreateWebviewPanel(args) {
        const dx = this.dx.sub({ name: 'getOrCreateWebviewPanel' });
        dx.require(args, ['title', 'html']);
        const { title, html, existingPanelId } = args;
        dx.out(`getOrCreateWebviewPanel: existingPanelId=${existingPanelId}, panels.size=${this.panels.size}`);
        // Check if we have an existing panel to reuse
        if (existingPanelId) {
            const panel = this.panels.get(existingPanelId);
            if (panel) {
                try {
                    // Panel is still valid, reuse it
                    dx.out(`Reusing existing panel: ${existingPanelId}`);
                    panel.title = title;
                    const htmlWithURIs = this.fn.os.htmlSrcPathToURI({ html, webviewPanelId: existingPanelId });
                    panel.webview.html = htmlWithURIs;
                    dx.done();
                    return existingPanelId;
                }
                catch {
                    // Panel is disposed, remove from map
                    dx.out(`Panel disposed, removing from map: ${existingPanelId}`);
                    this.panels.delete(existingPanelId);
                }
            }
            else {
                dx.out(`Panel not found in map: ${existingPanelId}`);
            }
        }
        else {
            dx.out(`No existingPanelId provided`);
        }
        // Create new panel
        dx.out(`Creating new panel for title: ${title}`);
        // Get extension root URI for local resource access
        const extensionRoot = this.fn.os.getExtensionRoot();
        const extensionUri = extensionRoot ? this.vscode.Uri.file(extensionRoot) : undefined;
        const panel = this.vscode.window.createWebviewPanel(VSCodeAPIs.WEBVIEW_ID, title, this.vscode.ViewColumn.Active, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: extensionUri ? [extensionUri] : [],
        });
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
        const htmlWithURIs = this.fn.os.htmlSrcPathToURI({ html, webviewPanelId: id });
        this.updatePanelHtml({ id, html: htmlWithURIs });
        dx.done();
        return id;
    }
    /**
     * Set up message handling for an existing webview panel
     */
    setupMessageHandling(panel) {
        panel.webview.onDidReceiveMessage(async (msg) => {
            await this.fn.ui.handleWebviewMessage(msg);
        });
    }
    /**
     * Get all VS Code extensions that contribute themes
     * @returns Array of theme extension data with id, displayName, and extensionPath
     */
    getVSCodeExtensionsThemes() {
        const themeExtensions = this.vscode.extensions.all.filter(ext => ext.packageJSON?.contributes?.themes && Array.isArray(ext.packageJSON.contributes.themes));
        return themeExtensions.map(ext => ({
            id: ext.id,
            displayName: ext.packageJSON.displayName || ext.id,
            extensionPath: ext.extensionPath,
        }));
    }
    /**
     * Get VS Code theme JSON data for a specific theme
     * @param themeId - The theme ID to retrieve
     * @param keys - Optional array of specific keys to extract from the theme
     * @returns Theme data or undefined if not found
     */
    getVSCodeThemeJson(args) {
        const dx = this.dx.sub({ name: 'getVSCodeThemeJson' });
        dx.require(args, ['themeId']);
        const { themeId, keys } = args;
        // Find the extension that contributes this theme
        // themeId might be a display name, so check multiple properties
        const themeExtension = this.vscode.extensions.all.find(ext => {
            if (ext.packageJSON?.contributes?.themes) {
                const found = ext.packageJSON.contributes.themes.some((theme) => {
                    const matches = theme.id === themeId || theme.label === themeId;
                    return matches;
                });
                return found;
            }
            return false;
        });
        if (!themeExtension) {
            dx.done();
            return undefined;
        }
        const theme = themeExtension.packageJSON.contributes.themes.find((t) => t.id === themeId || t.label === themeId);
        if (!theme) {
            dx.done();
            return undefined;
        }
        // Load the actual theme file content if path is available
        if (theme.path && typeof theme.path === 'string') {
            try {
                const themePath = this.fn.os.pathJoin(themeExtension.extensionPath, theme.path);
                const fileRead = this.fn.os.fileRead;
                const themeContent = fileRead({ path: themePath });
                if (themeContent) {
                    // Merge the theme metadata with the loaded content
                    const fullTheme = { ...theme, ...themeContent };
                    // If specific keys requested, filter the theme data
                    if (keys && keys.length > 0) {
                        const filteredTheme = {};
                        keys.forEach(key => {
                            if (fullTheme[key] !== undefined) {
                                filteredTheme[key] = fullTheme[key];
                            }
                        });
                        dx.done();
                        return filteredTheme;
                    }
                    dx.done();
                    return fullTheme;
                }
            }
            catch (err) {
                dx.out(`ERROR: Failed to load theme file: ${err}`);
            }
        }
        // If specific keys requested, filter the theme data
        if (keys && keys.length > 0) {
            const filteredTheme = {};
            keys.forEach(key => {
                if (theme[key] !== undefined) {
                    filteredTheme[key] = theme[key];
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
    getActiveThemeId() {
        return String(this.vscode.workspace.getConfiguration('workbench').get('colorTheme') || 'Default Dark+');
    }
    /**
     * Gets the active text editor
     */
    getActiveTextEditor() {
        return this.vscode.window.activeTextEditor;
    }
    /**
     * Returns the selected text or entire document text for the active editor
     */
    getSelectionOrDocumentText(editor) {
        const selection = editor.selection;
        if (!selection.isEmpty) {
            // If there's a selection, get the entire line(s) that contain the selection
            const startLine = selection.start.line;
            const endLine = selection.end.line;
            const lineRange = new vscode_1.Range(startLine, 0, endLine + 1, 0);
            return editor.document.getText(lineRange);
        }
        return editor.document.getText();
    }
    /**
     * Returns the languageId of the active editor, or 'plaintext' if none
     */
    getActiveLanguageId() {
        const editor = this.vscode.window.activeTextEditor;
        return editor ? editor.document.languageId : 'plaintext';
    }
    /**
     * Checks if the active editor has a non-empty selection
     */
    hasActiveSelection() {
        const editor = this.vscode.window.activeTextEditor;
        return editor ? !editor.selection.isEmpty : false;
    }
    /**
     * Gets the active tab name
     */
    getActiveTabName() {
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
    getDescriptiveName(document) {
        const uri = document.uri.toString();
        if (uri.startsWith('untitled:')) {
            const tabName = uri.replace('untitled:', '');
            return tabName;
        }
        else {
            const fileName = this.fn.os.pathBasename(document.fileName);
            return fileName;
        }
    }
    /**
     * Shows information message
     */
    showInformationMessage(message) {
        this.vscode.window.showInformationMessage(message);
    }
    /**
     * Shows warning message
     */
    showWarningMessage(message) {
        this.vscode.window.showWarningMessage(message);
    }
    /**
     * Shows error message
     */
    showErrorMessage(message) {
        this.vscode.window.showErrorMessage(message);
    }
    /**
     * Sets status bar message
     */
    setStatusBarMessage(text, timeoutMs) {
        if (timeoutMs && timeoutMs > 0) {
            return this.vscode.window.setStatusBarMessage(text, timeoutMs);
        }
        return this.vscode.window.setStatusBarMessage(text);
    }
    /**
     * Gets extension path
     */
    getExtensionPath() {
        return this.context.extensionPath;
    }
    /**
     * Gets temp directory for the extension
     */
    getDir_Temp() {
        return this.fn.os.pathJoin(this.context.globalStorageUri.fsPath, 'temp');
    }
    /**
     * Show save dialog to user
     */
    async showSaveDialog(options) {
        return await this.vscode.window.showSaveDialog(options);
    }
    /**
     * Convert file path to URI
     */
    uriFromPath(filePath) {
        return this.vscode.Uri.file(filePath);
    }
    /**
     * Convert URI to file path
     */
    uriToPath(uri) {
        return uri.fsPath;
    }
}
exports.VSCodeAPIs = VSCodeAPIs;
// end, VSCodeAPIs.ts
//# sourceMappingURL=VSCodeAPIs.js.map