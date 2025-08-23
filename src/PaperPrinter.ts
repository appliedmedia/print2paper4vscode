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
    private availableThemes: Array<{ id: string; label: string; source: 'shiki' | 'vscode' }> = [];
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
        // Load Shiki themes - only light ones for printing
        const shikiLightThemes = this.app.stylize.filterThemes('light|bright|day');
        
        // Load VSCode light themes
        const vscodeLightThemes = this.app.vscodeapis.getVSThemes('light|bright|day');
        
        this.availableThemes = [
            { id: 'editor', label: `Editor (${editorThemeLabel})`, source: 'vscode' as const },
            ...shikiLightThemes,
            ...vscodeLightThemes
        ];

        const sizeItems = [
            { id: 'editor', label: `Editor (${editorTypo.fontSize}px)` },
            { id: '9', label: '9 px' },
            { id: '10', label: '10 px' },
            { id: '12', label: '12 px' },
            { id: '14', label: '14 px' },
            { id: '18', label: '18 px' },
            { id: '24', label: '24 px' },
        ];
        const textSizesMarkup = sizeItems.map(s => `<div class="item" data-action="text-size-${s.id}" data-label="${s.label}">${s.label}</div>`).join('\n          ');

        const doc = this.app.os.readExtensionYaml<{ toolbar_html: string }>('src/PaperPrinter.yaml');
        const themesMarkup = this.availableThemes.map((t) => {
            const id = t.id;
            const label = t.label;
            return `<div class="item" data-action="theme-${id}" data-label="${label}">${label}</div>`;
        }).join('\n          ');
        const historyItems = this.app.history.getEntries()
            .map((p) => {
                const base = this.app.os.pathBasename(p);
                return `<div class="item" data-history="${p}" title="${p}">${base}</div>`;
            })
            .join('\n          ');

        const toolbar = this.app.os.renderTemplate(doc.toolbar_html, {
            COLOR_INIT: this.currentColorMode,
            THEME_INIT: this.currentThemeChoice,
            SIZE_INIT: String(this.currentFontSizeMode),
            THEMES: themesMarkup,
            TEXT_SIZES: textSizesMarkup,
            EDITOR_PX: String(editorTypo.fontSize),
            HISTORY_ITEMS: historyItems
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
        const found = this.availableThemes.find(t => t.id === id);
        if (!found) return 'github-light';
        if (found.source === 'shiki') return found.id;
        // vscode theme: load JSON by scanning contributions
        const contribution = this.app.vscodeapis.getThemes().find((c: { label: string; path: string }) => (c.label || '').toLowerCase() === found.label.toLowerCase());
        if (contribution) {
            const json = this.app.os.readJsonFile<Record<string, unknown>>(contribution.path);
            if (json) {
                const colors = (json as { colors?: Record<string, unknown> }).colors || {};
                if (!Object.prototype.hasOwnProperty.call(colors, 'editor.background')) {
                    (json as { colors: Record<string, unknown> }).colors = { ...colors, 'editor.background': '#ffffff' };
                }
                return json;
            }
        }
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