import type { App } from './App.js';
import { getSingletonHighlighter } from 'shiki';

export class Stylize {
    private app: App;
    private shikiStyler: any;
    private vscodeThemeStyler: any;
    private availableShikiThemes: string[] = [];
    private loadedLanguages: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    async init(): Promise<void> {
        // Dynamically get all available themes from Shiki
        this.availableShikiThemes = Object.keys(require('shiki').bundledThemes);
    }

    async done(): Promise<void> { 
        this.shikiStyler = undefined;
        this.vscodeThemeStyler = undefined;
        this.loadedLanguages.clear();
    }

    private async ensureLanguage(lang: string): Promise<void> {
        if (!this.shikiStyler) throw new Error('Shiki styler not initialized');
        
        // Check if language is already loaded
        if (!this.loadedLanguages.has(lang)) {
            try {
                // Load the specific language
                await this.shikiStyler.loadLanguage(lang);
                this.loadedLanguages.add(lang);
            } catch (error) {
                throw new Error(`Failed to load language '${lang}': ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    private async ensureVSCodeTheme(theme: unknown): Promise<void> {
        if (!this.vscodeThemeStyler || this.vscodeThemeStyler.getTheme() !== theme) {
            // For VSCode themes, we need to know what languages are already loaded
            const currentLanguages = Array.from(this.loadedLanguages);
            
            this.vscodeThemeStyler = await getSingletonHighlighter({
                themes: [theme],
                langs: currentLanguages
            });
        }
    }

    async styleToHtml(
        code: string,
        languageId: string,
        themeInput: string | unknown,
        opts?: { fontSize?: number; lineHeight?: number; title?: string }
    ): Promise<string> {
        const lang = languageId;
        
        // Initialize Shiki styler if not already done
        if (!this.shikiStyler) {
            const lightThemes = this.getShikiThemes('light|bright|day');
            const initialTheme = lightThemes.length > 0 ? lightThemes[0].id : 'github-light';
            
            this.shikiStyler = await getSingletonHighlighter({
                themes: [initialTheme],
                langs: []
            });
        }
        
        // Validate and load the specific language we need
        await this.ensureLanguage(lang);
        
        let html: string;

        if (typeof themeInput === 'string') {
            // String theme - use Shiki built-in theme
            if (!this.shikiStyler) throw new Error('Shiki styler not initialized');
            html = this.shikiStyler.codeToHtml(code, { lang });
        } else {
            // VSCode theme object - create styler with custom theme
            await this.ensureVSCodeTheme(themeInput);
            if (!this.vscodeThemeStyler) throw new Error('VSCode theme styler not initialized');
            html = this.vscodeThemeStyler.codeToHtml(code, { lang });
        }

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

    // Get Shiki themes with optional filter
    getShikiThemes(filter?: string): Array<{ id: string; label: string; source: 'shiki' }> {
        if (!filter) {
            // Return all themes
            return this.availableShikiThemes.map(theme => ({
                id: theme,
                label: theme,
                source: 'shiki' as const
            }));
        }
        
        // Apply filter using regex
        const filterRegex = new RegExp(filter, 'i');
        return this.availableShikiThemes
            .filter(theme => filterRegex.test(theme))
            .map(theme => ({
                id: theme,
                label: theme,
                source: 'shiki' as const
            }));
    }

    // Get currently loaded languages
    getLoadedLanguages(): string[] {
        return Array.from(this.loadedLanguages);
    }

    // Check if a specific language is currently loaded
    isLanguageLoaded(languageId: string): boolean {
        return this.loadedLanguages.has(languageId);
    }

    // Validate if a language is supported by Shiki (without loading it)
    async validateLanguageSupport(languageId: string): Promise<boolean> {
        try {
            // Try to create a minimal highlighter with just this language
            const testHighlighter = await getSingletonHighlighter({
                themes: ['github-light'],
                langs: [languageId]
            });
            
            // If we get here, the language is supported
            return true;
        } catch (error) {
            return false;
        }
    }
}


