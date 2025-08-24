import * as vscode from 'vscode';
import { ClipboardCapture } from './ClipboardCapture.js';
import type { App } from './App.js';

export class PaperPrinter {
    private app: App;
    private clipboardCapture: ClipboardCapture;
    private lastPrintPrepHtml: string | null = null;
    private lastRawCode: string | null = null;
    private lastLanguageId: string | null = null;
    private currentPrintableLabel: string = 'Printable';
    private currentColorMode: 'theme' | 'print' = 'theme';
    private currentThemeChoice: string = 'editor';
    private themePickerList: Array<{ id: string; label: string; source: 'shiki' | 'vscode' }> = [];
    private currentFontSizeMode: 'editor' | 9 | 10 | 12 | 14 | 18 | 24 = 'editor';

    constructor(app: App) {
        this.app = app;
        this.clipboardCapture = new ClipboardCapture(app);
    }

    init(): void {
        this.clipboardCapture.init();
        // Note: theme list recomputed on toolbar render to ensure VS Code extensions are loaded
        this.app.ui.debugOut('PaperPrinter initialized', 'info', 'PaperPrinter');
    }

    done(): void {
        this.clipboardCapture.done();
        this.app.ui.debugOut('PaperPrinter cleanup completed', 'info', 'PaperPrinter');
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
                printableLabel = start === end ? `Line ${start} of ${info.name}` : `Lines ${start}-${end} of ${info.name}`;
            }
            this.currentPrintableLabel = printableLabel;
            const htmlContent = await this.app.stylize.styleToHtml(info.text, info.languageId, theme, { title: this.currentPrintableLabel });
            await this.openPrintPrepAndPrompt(htmlContent, printableLabel);
            
        } catch (error) {
            this.app.ui.debugOut('Error handling print', 'error', 'PaperPrinter', error);
            this.app.ui.showErrorMessage(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async openPrintPrepAndPrompt(htmlContent: string, tabName: string): Promise<void> {
        this.lastPrintPrepHtml = htmlContent;
        this.currentPrintableLabel = tabName;
        const initial = await this.applyRenderModes(htmlContent);
        const panel = this.app.vscodeapis.createWebviewPanel(`Printable: ${tabName}`, this.wrapWithToolbar(initial));
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (!msg) return;
            if (msg.type === 'menu') {
                if (typeof msg.value === 'string' && msg.value.startsWith('theme-')) {
                    const id = String(msg.value).substring('theme-'.length);
                    this.currentColorMode = 'theme';
                    this.currentThemeChoice = id;
                } else if (msg.value === 'colors-theme') this.currentColorMode = 'theme';
                else if (msg.value === 'colors-print') this.currentColorMode = 'print';
                else if (typeof msg.value === 'string' && msg.value.startsWith('text-size-')) {
                    const sz = String(msg.value).substring('text-size-'.length);
                    this.currentFontSizeMode = (sz === 'editor') ? 'editor' : (Number(sz) as 9 | 10 | 12 | 14 | 18 | 24);
                }
                if (!this.lastPrintPrepHtml) return;
                const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
                panel.webview.html = this.wrapWithToolbar(updated);
                return;
            }
            if (msg.type === 'history_open') {
                const p = String(msg.value || '');
                if (p) { await this.app.history.open(p); }
                return;
            }
            if (msg.type === 'print') {
                if (!this.lastPrintPrepHtml) return;
                const updated = await this.applyRenderModes(this.lastPrintPrepHtml);
                if (msg.value === 'preview') await this.app.pdf.printWithPreview(updated, tabName);
                else if (msg.value === 'direct') await this.app.pdf.printDirectly(updated, tabName);
                else if (msg.value === 'save') await this.app.pdf.saveAsPDF(updated, tabName);
                // Re-render to include any new History entries
                panel.webview.html = this.wrapWithToolbar(updated);
            }
        });
    }

    private applyBackgroundMode(html: string, mode: 'keep' | 'white' | 'invert'): string {
        if (mode === 'keep') return html;
        const injectCss = (source: string, css: string): string => {
            if (/<style>[\s\S]*?<\/style>/.test(source)) {
                return source.replace(/<style>([\s\S]*?)<\/style>/, (m, inner) => `<style>${inner}\n${css}</style>`);
            }
            return source.replace(/<\/head>/, `<style>${css}</style></head>`);
        };
        if (mode === 'white') {
            const css = [
                'body{background:#ffffff !important;color:#000 !important}',
                '.shiki{background:#ffffff !important}',
                '.shiki .line{display:block;background:#ffffff !important}',
                '.shiki span{background:transparent !important}'
            ].join('\n');
            return injectCss(html, css);
        }
        // invert: invert only text (code glyphs), keep background as-is
        let out = injectCss(
            html,
            [
                '.invert-text pre.shiki code{filter: invert(100%) hue-rotate(180deg)}',
                '.invert-text pre.shiki span{background:transparent !important}',
                '.invert-text pre.shiki .line{background:transparent !important; display:block}'
            ].join('\n')
        );
        out = out.replace('<body>', '<body><div class="invert-text">');
        out = out.replace('</body>', '</div></body>');
        return out;
    }

    private wrapWithToolbar(html: string): string {
        // Recompute available themes at render time
        const editorThemeLabel = this.app.vscodeapis.getActiveThemeLabel();
        const editorTypo = this.app.vscodeapis.getEditorTypography();
        // Get all light themes suitable for printing with editor theme at top
        this.themePickerList = this.app.stylize.getThemes('light|bright|day', 'top');

        // Generic picker list generator
        const generatePickerList = (items: Array<{id: string, label: string, attributes?: Record<string, string>}>) => {
            return items.map(item => {
                const attrs = item.attributes ? Object.entries(item.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
                return `<div class="item" ${attrs}>${item.label}</div>`;
            }).join('\n          ');
        };

        // Generate all picker lists using the generic function
        const printPickerList = generatePickerList([
            { id: 'preview', label: 'Print with Preview', attributes: { 'data-print': 'preview' } },
            { id: 'direct', label: 'Print', attributes: { 'data-print': 'direct' } },
            { id: 'save', label: 'Save as PDF', attributes: { 'data-print': 'save' } }
        ]);

        const textPickerList = generatePickerList([
            { id: 'editor', label: `Editor (${editorTypo.fontSize}px)`, attributes: { 'data-action': 'text-size-editor', 'data-label': `Editor (${editorTypo.fontSize}px)` } },
            { id: '9', label: '9 px', attributes: { 'data-action': 'text-size-9', 'data-label': '9 px' } },
            { id: '10', label: '10 px', attributes: { 'data-action': 'text-size-10', 'data-label': '10 px' } },
            { id: '12', label: '12 px', attributes: { 'data-action': 'text-size-12', 'data-label': '12 px' } },
            { id: '14', label: '14 px', attributes: { 'data-action': 'text-size-14', 'data-label': '14 px' } },
            { id: '18', label: '18 px', attributes: { 'data-action': 'text-size-18', 'data-label': '18 px' } },
            { id: '24', label: '24 px', attributes: { 'data-action': 'text-size-24', 'data-label': '24 px' } }
        ]);

        const themesPickerList = generatePickerList(
            this.themePickerList.map(t => ({
                id: t.id,
                label: t.label,
                attributes: { 'data-action': `theme-${t.id}`, 'data-label': t.label }
            }))
        );

        const historyPickerList = generatePickerList(
            this.app.history.getEntries().map(p => {
                const base = this.app.os.pathBasename(p);
                return {
                    id: base,
                    label: base,
                    attributes: { 'data-history': p, 'title': p }
                };
            })
        );

        const doc = this.app.os.readExtensionYaml<{ toolbar_html: string }>('src/PaperPrinter.yaml');

        const toolbar = this.app.templateDictReplace(doc.toolbar_html, {
            COLOR_INIT: this.currentColorMode,
            THEME_INIT: this.currentThemeChoice,
            SIZE_INIT: String(this.currentFontSizeMode),
            PRINT_PICKER_LIST: printPickerList,
            THEMES_PICKER_LIST: themesPickerList,
            TEXT_PICKER_LIST: textPickerList,
            EDITOR_PX: String(editorTypo.fontSize),
            HISTORY_PICKER_LIST: historyPickerList
        });
        return html.replace('</body>', `${toolbar}</body>`);
    }

    private async applyRenderModes(htmlBase: string): Promise<string> {
        // Prefer regenerating with theme overrides if we have raw code; otherwise fallback to CSS overlays
        if (this.lastRawCode && this.lastLanguageId) {
            let themeToUse: unknown | string;
            if (this.currentColorMode === 'print') {
                themeToUse = this.currentThemeChoice === 'editor' ? 'github-light' : this.resolveThemeChoice(this.currentThemeChoice);
            } else {
                themeToUse = this.currentThemeChoice === 'editor' ? this.app.vscodeapis.getActiveTheme() : this.resolveThemeChoice(this.currentThemeChoice);
            }
            const sizePx = this.computeFontSizePx();
            const lhPx = this.computeLineHeightPx(sizePx);
                            const html = await this.app.stylize.styleToHtml(this.lastRawCode, this.lastLanguageId, themeToUse, { fontSize: sizePx, lineHeight: lhPx, title: this.currentPrintableLabel });
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
                '.shiki span{background:transparent !important}'
            ].join('\n');
            const injectCss = (source: string, cssStr: string): string => {
                if (/<style>[\s\S]*?<\/style>/.test(source)) {
                    return source.replace(/<style>([\s\S]*?)<\/style>/, (m, inner) => `<style>${inner}\n${cssStr}</style>`);
                }
                return source.replace(/<\/head>/, `<style>${cssStr}</style></head>`);
            };
            html = injectCss(html, css);
        }
        return html;
    }

    private computeFontSizePx(): number {
        if (this.currentFontSizeMode === 'editor') return this.app.vscodeapis.getEditorTypography().fontSize;
        return this.currentFontSizeMode;
    }

    private computeLineHeightPx(fontSize: number): number {
        const editorTypo = this.app.vscodeapis.getEditorTypography();
        if (this.currentFontSizeMode === 'editor') return editorTypo.lineHeight;
        return Math.round(fontSize * 1.35);
    }

    private resolveThemeChoice(id: string): unknown {
        const found = this.themePickerList.find(t => t.id === id);
        if (!found) return 'github-light';
        if (found.source === 'shiki') return found.id;
        // vscode theme: load JSON by scanning contributions
        // For now, return the theme ID as a fallback since we don't have path information
        // TODO: Implement proper VSCode theme JSON loading when needed
        return found.id;
        return 'github-light';
    }

    // Removed CSS hacks; rely on theme overrides

    /**
     * Handles the capture preview command - captures content from active Preview tab
     */
    async handleCapturePreview(): Promise<void> {
        try {
            this.app.ui.showInformationMessage('Capturing content from active tab...');
            
            // Get the current active tab name
            const tabName = this.app.vscodeapis.getActiveTabName();
            this.app.ui.debugOut(`Active tab: ${tabName}`, 'info', 'PaperPrinter');
            
            // Capture and convert content
            const htmlContent = await this.clipboardCapture.captureAndConvert();
            
            if (htmlContent) {
                // Create PrintPrep tab with business logic
                const printPrepUri = vscode.Uri.parse(`untitled:PrintPrep: ${tabName}`);
                const document = await this.app.vscodeapis.createDocument(htmlContent, printPrepUri);
                await this.app.vscodeapis.showDocument(document, false);
                
                this.app.ui.showInformationMessage('Content captured and opened in PrintPrep tab!');
                
                // Log the first 200 characters to see what we got
                const preview = htmlContent.substring(0, 200);
                this.app.ui.debugOut(`Captured content preview: ${preview}...`, 'info', 'PaperPrinter');
                
            } else {
                this.app.ui.showErrorMessage('Failed to capture content from active tab');
            }
            
        } catch (error) {
            this.app.ui.debugOut('Error handling capture preview', 'error', 'PaperPrinter', error);
            this.app.ui.showErrorMessage(`Capture preview failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}