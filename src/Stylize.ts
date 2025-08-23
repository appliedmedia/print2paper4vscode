import type { App } from './App';

type ShikiHighlighterLike = {
    getTheme?: () => string;
    loadTheme?: (theme: unknown) => Promise<void>;
    setTheme?: (theme: unknown) => void;
    codeToHtml: (code: string, options: { lang: string; theme?: unknown }) => string;
};

type ShikiModuleLike = {
    getHighlighter: (options: { theme: unknown }) => Promise<ShikiHighlighterLike>;
};

let shikiMod: ShikiModuleLike | undefined;

export class Stylize {
    private app: App;
    private highlighter: ShikiHighlighterLike | undefined;

    constructor(app: App) {
        this.app = app;
    }

    async init(): Promise<void> {}

    async done(): Promise<void> { this.highlighter = undefined; }

    private async ensure(theme: string | unknown): Promise<void> {
        if (!shikiMod) {
            shikiMod = (await import('shiki')) as unknown as ShikiModuleLike;
        }
        if (!this.highlighter) {
            this.highlighter = await shikiMod.getHighlighter({ theme });
            return;
        }
        if (typeof theme === 'string') {
            if (this.highlighter.getTheme?.() !== theme) {
                await this.highlighter.loadTheme?.(theme);
                this.highlighter.setTheme?.(theme);
            }
        } else {
            // For JSON theme objects, reload highlighter
            this.highlighter = await shikiMod.getHighlighter({ theme });
        }
    }

    async highlightToHtml(
        code: string,
        languageId: string,
        themeInput: string | unknown,
        opts?: { fontSize?: number; lineHeight?: number; title?: string }
    ): Promise<string> {
        const lang = languageId;
        await this.ensure(themeInput);
        if (!this.highlighter) throw new Error('Highlighter not initialized');

        const html = typeof themeInput === 'string'
            ? this.highlighter.codeToHtml(code, { lang, theme: themeInput })
            : this.highlighter.codeToHtml(code, { lang });
        const editorTypo = this.app.vscodeapis.getEditorTypography();
        const fontSize = typeof opts?.fontSize === 'number' ? opts.fontSize : editorTypo.fontSize;
        const lineHeight = typeof opts?.lineHeight === 'number' ? opts.lineHeight : editorTypo.lineHeight;
        const tpl = this.app.os.readExtensionYaml<{ stylize_html: string }>('src/Stylize.yaml');
        const page = this.app.os.renderTemplate(tpl.stylize_html, {
            FONTSIZE_PX: String(fontSize),
            LINEHEIGHT_PX: String(lineHeight),
            CODE: html,
            VAR_TITLE: typeof opts?.title === 'string' && opts.title.length > 0 ? opts.title : 'Printable'
        });
        return page;
    }
}


