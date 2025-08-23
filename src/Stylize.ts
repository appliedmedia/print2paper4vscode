import type { App } from './App.js';
import { createHighlighter, type Highlighter } from 'shiki';

export class Stylize {
    private app: App;
    private shikiStyler: Highlighter | undefined;
    private vscodeThemeStyler: Highlighter | undefined;
    private availableShikiThemes: string[] = [];
    private loadedLanguages: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    async init(): Promise<void> {
        // Dynamically get all available themes from Shiki
        this.availableShikiThemes = Object.keys(require('shiki').bundledThemes);
        
        // Initialize with first available light theme and no languages (will load as needed)
        const lightThemes = this.filterThemes('light|bright|day');
        const initialTheme = lightThemes.length > 0 ? lightThemes[0].id : 'github-light';
        
        this.shikiStyler = await createHighlighter({
            theme: initialTheme,
            langs: [] // Start with no languages
        });
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

    private async ensureVSCodeTheme(theme: Theme): Promise<void> {
        if (!this.vscodeThemeStyler || this.vscodeThemeStyler.getTheme() !== theme) {
            // For VSCode themes, we need to know what languages are already loaded
            const currentLanguages = Array.from(this.loadedLanguages);
            
            this.vscodeThemeStyler = await getHighlighter({
                theme,
                langs: currentLanguages
            });
        }
    }

    async styleToHtml(
        code: string,
        languageId: string,
        themeInput: string | Theme,
        opts?: { fontSize?: number; lineHeight?: number; title?: string }
    ): Promise<string> {
        const lang = languageId as Lang;
        
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

    // Return ALL available Shiki themes
    getAvailableShikiThemes(): Theme[] {
        return this.availableShikiThemes;
    }

    // Generic theme filtering using regex on filter string
    filterThemes(filterString: string): Array<{ id: string; label: string; source: 'shiki' }> {
        const filterRegex = new RegExp(filterString, 'i');
        
        return this.availableShikiThemes
            .filter(theme => {
                if (!theme.name) return false;
                return filterRegex.test(theme.name);
            })
            .map(theme => ({
                id: theme.name!,
                label: theme.name!,
                source: 'shiki' as const
            }));
    }

    // Get currently loaded languages
    getLoadedLanguages(): Lang[] {
        return Array.from(this.loadedLanguages);
    }

    // Check if a specific language is currently loaded
    isLanguageLoaded(languageId: string): boolean {
        return this.loadedLanguages.has(languageId as Lang);
    }

    // Validate if a language is supported by Shiki (without loading it)
    async validateLanguageSupport(languageId: string): Promise<boolean> {
        try {
            // Try to create a minimal highlighter with just this language
            const testHighlighter = await getHighlighter({
                theme: 'github-light',
                langs: [languageId as Lang]
            });
            
            // If we get here, the language is supported
            return true;
        } catch (error) {
            return false;
        }
    }
}


