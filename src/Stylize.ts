import type { App } from './App';
import { createHighlighter, bundledThemes } from 'shiki';

export class Stylize {
  private app: App;
  private styler: Awaited<ReturnType<typeof createHighlighter>> | undefined;
  private loadedLanguages: Set<string> = new Set();

  constructor(app: App) {
    this.app = app;
  }

  async init(): Promise<void> {
    // Basic setup - themes will be loaded on-demand in getThemes()
  }

  async done(): Promise<void> {
    this.styler = undefined;
    this.loadedLanguages.clear();
  }

  private async ensureLanguage(lang: string): Promise<void> {
    // Check if language is already loaded
    if (!this.loadedLanguages.has(lang)) {
      try {
        // In Shiki v3, we need to create a new highlighter with the additional language
        // Get current languages and add the new one
        const currentLanguages = Array.from(this.loadedLanguages);
        const newLanguages = [...currentLanguages, lang];

        // Recreate the highlighter with the new language
        if (!this.styler) {
          throw new Error('Styler not initialized - cannot recreate highlighter');
        }
        this.styler = await createHighlighter({
          themes: [this.styler.getTheme('default')],
          langs: newLanguages,
        });

        this.loadedLanguages.add(lang);
      } catch (error) {
        throw new Error(
          `Failed to load language '${lang}': ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private async ensureVSCodeTheme(theme: unknown): Promise<void> {
    if (!this.styler || this.styler.getTheme('default') !== theme) {
      // For VSCode themes, we need to know what languages are already loaded
      // const currentLanguages = Array.from(this.loadedLanguages);

      // VSCode theme object conversion to Shiki format is not yet implemented
      // This is a critical feature that needs proper implementation
      throw new Error(
        'VSCode theme object conversion to Shiki format is not implemented. This feature requires parsing VSCode theme JSON and converting color tokens to Shiki format.'
      );
    }
  }

  async styleToHtml(
    code: string,
    languageId: string,
    themeInput: string | Record<string, unknown>,
    opts?: { fontSize?: number; lineHeight?: number; title?: string }
  ): Promise<string> {
    const lang = languageId;

    // Initialize styler if not already done
    if (!this.styler) {
      const lightThemes = this.getShikiThemes('light|bright|day');
      if (lightThemes.length === 0) {
        throw new Error('No light themes available for initialization');
      }

      this.styler = await createHighlighter({
        themes: [lightThemes[0].id],
        langs: [lang], // Start with the language we need
      });
      this.loadedLanguages.add(lang);
    } else {
      // Ensure the specific language is loaded
      await this.ensureLanguage(lang);
    }

    let html: string;

    if (typeof themeInput === 'string') {
      // String theme - use Shiki built-in theme
      if (!this.styler) throw new Error('Styler not initialized');
      html = this.styler.codeToHtml(code, {
        lang,
        themes: { [themeInput]: themeInput },
      });
    } else {
      // VSCode theme object - create styler with custom theme
      await this.ensureVSCodeTheme(themeInput);
      if (!this.styler) throw new Error('Styler not initialized');
      html = this.styler.codeToHtml(code, {
        lang,
        themes: { 'vscode-custom': 'vscode-custom' },
      });
    }

    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const fontSize = typeof opts?.fontSize === 'number' ? opts.fontSize : editorTypo.fontSize;
    const lineHeight =
      typeof opts?.lineHeight === 'number' ? opts.lineHeight : editorTypo.lineHeight;
    const tpl = this.app.os.readExtensionYaml<{ stylize_html: string }>('src/Stylize.yaml');
    const page = this.app.templateDictReplace(tpl.stylize_html, {
      FONTSIZE_PX: String(fontSize),
      LINEHEIGHT_PX: String(lineHeight),
      CODE: html,
      VAR_TITLE:
        typeof opts?.title === 'string' && opts.title.length > 0 ? opts.title : 'Printable',
    });
    return page;
  }

  // Get combined themes for display (Shiki + VSCode) with optional current editor theme
  getThemes(
    filter?: string,
    addCurrentEditor: 'top' | 'bottom' | 'none' = 'none'
  ): Array<{ id: string; label: string; source: 'shiki' | 'vscode' }> {
    // Get Shiki themes
    const shikiThemes = this.getShikiThemes(filter);

    // Get VSCode themes
    const vscodeThemes = this.app.vscodeapis.getVSCodeThemes(filter);

    // Combine themes: Shiki first (more reliable for printing), then VSCode
    let combinedThemes = [...shikiThemes, ...vscodeThemes];

    // Add current editor theme if requested
    if (addCurrentEditor !== 'none') {
      const editorThemeLabel = this.app.vscodeapis.getActiveThemeLabel();
      const editorTheme = {
        id: 'editor',
        label: `Editor (${editorThemeLabel})`,
        source: 'vscode' as const,
      };

      if (addCurrentEditor === 'top') {
        combinedThemes = [editorTheme, ...combinedThemes];
      } else if (addCurrentEditor === 'bottom') {
        combinedThemes = [...combinedThemes, editorTheme];
      }
    }

    return combinedThemes;
  }

  // Get Shiki themes with optional filter
  getShikiThemes(filter?: string): Array<{ id: string; label: string; source: 'shiki' }> {
    // Load themes on-demand
    const availableThemes = Object.keys(bundledThemes);

    if (availableThemes.length === 0) {
      throw new Error('No Shiki themes available - Shiki installation may be corrupted');
    }

    if (!filter) {
      // Return all themes
      return availableThemes.map(theme => ({
        id: theme,
        label: theme,
        source: 'shiki' as const,
      }));
    }

    // Apply filter using regex
    const filterRegex = new RegExp(filter, 'i');
    return availableThemes
      .filter(theme => filterRegex.test(theme))
      .map(theme => ({
        id: theme,
        label: theme,
        source: 'shiki' as const,
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
}
