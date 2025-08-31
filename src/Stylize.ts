import type { App } from './App';
import { getSingletonHighlighter, createCssVariablesTheme, bundledThemesInfo } from 'shiki';

// Type definitions
type TokenColor = {
  scope: string[];
  settings: { foreground?: string; background?: string };
};

// Module-level constants for theme filtering
const USE_ALL_LIGHT_SHIKI_THEMES = 'light|bright|day';
const USE_ALL_LIGHT_VSCODE_THEMES = 'light|bright|day';

export class Stylize {
  private app: App;
  private highlighter: any = null;

  constructor(app: App) {
    this.app = app;
  }

  async init(): Promise<void> {
    // No initialization needed - highlighter will be initialized lazily when needed
  }

  private async validateHighlighter(languageId: string): Promise<void> {
    if (!this.highlighter) {
      const themes = this.getThemes();
      this.highlighter = await getSingletonHighlighter({
        themes: themes.map(theme => theme.id),
        langs: [languageId],
      });
    }
  }

  async done(): Promise<void> {
    // Clear themes cache
    Stylize.themesCache = null;
    this.app.ui.debugOut('Stylize cleanup completed', 'info', 'Stylize');
  }

  // Convert VS Code theme JSON to Shiki-compatible CSS variables format
  private convertVSCodeThemeToShiki(vscodeTheme: Record<string, unknown>): any {
    try {
      // Extract basic theme info
      const name = (vscodeTheme.name as string) || 'vscode-theme';

      // Extract colors
      const colors: Record<string, string> = {};
      if (vscodeTheme.colors && typeof vscodeTheme.colors === 'object') {
        const vscodeColors = vscodeTheme.colors as Record<string, string>;
        for (const [key, value] of Object.entries(vscodeColors)) {
          if (typeof value === 'string') {
            colors[key] = value;
          }
        }
      }

      // Extract token colors
      const tokenColors: Array<{
        scope: string[];
        settings: { foreground?: string; background?: string };
      }> = [];
      if (vscodeTheme.tokenColors && Array.isArray(vscodeTheme.tokenColors)) {
        const vscodeTokenColors = vscodeTheme.tokenColors as Array<any>;
        for (const tokenColor of vscodeTokenColors) {
          if (tokenColor.scope && tokenColor.settings) {
            const scope = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope];
            const settings: { foreground?: string; background?: string } = {};

            if (
              tokenColor.settings.foreground &&
              typeof tokenColor.settings.foreground === 'string'
            ) {
              settings.foreground = tokenColor.settings.foreground;
            }
            if (
              tokenColor.settings.background &&
              typeof tokenColor.settings.background === 'string'
            ) {
              settings.background = tokenColor.settings.background;
            }

            if (Object.keys(settings).length > 0) {
              tokenColors.push({ scope, settings });
            }
          }
        }
      }

      // Create CSS variables theme for dynamic switching
      return createCssVariablesTheme({
        name,
        colors,
        tokenColors,
      } as any);
    } catch (error) {
      this.app.ui.debugOut(
        'ERROR:convertVSCodeThemeToShiki: Failed to convert theme',
        'warn',
        'Stylize',
        error
      );
      return null;
    }
  }

  async styleToHtml(
    code: string,
    languageId: string,
    opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string }
  ): Promise<string> {
    this.app.ui.debugOut(
      `THEMECHECK: styleToHtml called with theme: '${opts?.theme || 'undefined'}'`,
      'info',
      'Stylize'
    );
    const lang = languageId;

    // Ensure highlighter is initialized
    await this.validateHighlighter(lang);

    // Determine which theme to use
    let selectedTheme: string;

    if (opts?.theme) {
      // Use specified theme - look it up from our unified theme list
      this.app.ui.debugOut(`THEMECHECK: Looking for theme: '${opts.theme}'`, 'info', 'Stylize');

      const allThemes = this.getThemes();
      this.app.ui.debugOut(
        `THEMECHECK: Available themes in styleToHtml: ${allThemes.map(t => t.id).join(', ')}`,
        'info',
        'Stylize'
      );

      const themeData = allThemes.find(theme => theme.id === opts.theme);
      this.app.ui.debugOut(
        `THEMECHECK: Theme lookup result: ${themeData ? 'FOUND' : 'NOT FOUND'}`,
        'info',
        'Stylize'
      );

      if (themeData) {
        this.app.ui.debugOut(
          `THEMECHECK: Found theme: id='${themeData.id}', displayName='${themeData.displayName}', hasColors=${!!themeData.colors}, hasTokenColors=${!!themeData.tokenColors}`,
          'info',
          'Stylize'
        );
      }

      if (!themeData) {
        throw new Error(`Theme '${opts.theme}' not found in available themes`);
      }

      if (themeData.colors && themeData.tokenColors) {
        // VS Code theme - convert and use
        this.app.ui.debugOut(
          `THEMECHECK: Converting VS Code theme: ${themeData.id}`,
          'info',
          'Stylize'
        );
        this.app.ui.debugOut(
          `THEMECHECK: Colors count: ${Object.keys(themeData.colors).length}, TokenColors count: ${themeData.tokenColors.length}`,
          'info',
          'Stylize'
        );

        const shikiTheme = this.convertVSCodeThemeToShiki({
          name: themeData.id,
          colors: themeData.colors,
          tokenColors: themeData.tokenColors,
        });

        this.app.ui.debugOut(
          `THEMECHECK: convertVSCodeThemeToShiki result: ${JSON.stringify(shikiTheme)}`,
          'info',
          'Stylize'
        );

        selectedTheme = shikiTheme?.name || 'github-light';
        this.app.ui.debugOut(
          `THEMECHECK: Final selectedTheme: ${selectedTheme}`,
          'info',
          'Stylize'
        );
      } else {
        // Shiki theme - use directly
        this.app.ui.debugOut(
          `THEMECHECK: No colors/tokenColors, using theme ID directly: ${themeData.id}`,
          'info',
          'Stylize'
        );
        selectedTheme = themeData.id;
        this.app.ui.debugOut(
          `THEMECHECK: Using Shiki theme directly: ${selectedTheme}`,
          'info',
          'Stylize'
        );
      }
    } else {
      // Use current VS Code theme - get it from our unified theme list
      this.app.ui.debugOut(
        `THEMECHECK: No theme specified, using current VS Code theme`,
        'info',
        'Stylize'
      );
      const activeThemeId = this.app.vscodeapis.getActiveThemeId();
      this.app.ui.debugOut(`THEMECHECK: Active theme ID: '${activeThemeId}'`, 'info', 'Stylize');

      const allThemes = this.getThemes();
      this.app.ui.debugOut(
        `THEMECHECK: All themes in else branch: ${allThemes.map(t => t.id).join(', ')}`,
        'info',
        'Stylize'
      );

      const themeData = allThemes.find(theme => theme.id === activeThemeId);
      this.app.ui.debugOut(
        `THEMECHECK: Found active theme data: ${themeData ? 'YES' : 'NO'}`,
        'info',
        'Stylize'
      );

      if (themeData) {
        this.app.ui.debugOut(
          `THEMECHECK: Active theme details: id='${themeData.id}', displayName='${themeData.displayName}', hasColors=${!!themeData.colors}, hasTokenColors=${!!themeData.tokenColors}`,
          'info',
          'Stylize'
        );
      }

      if (themeData && themeData.colors && themeData.tokenColors) {
        // VS Code theme - convert and use
        this.app.ui.debugOut(
          `THEMECHECK: Converting active VS Code theme: ${themeData.id}`,
          'info',
          'Stylize'
        );
        const shikiTheme = this.convertVSCodeThemeToShiki({
          name: themeData.id,
          colors: themeData.colors,
          tokenColors: themeData.tokenColors,
        });
        selectedTheme = shikiTheme?.name || 'github-light';
        this.app.ui.debugOut(
          `THEMECHECK: Active theme converted to: ${selectedTheme}`,
          'info',
          'Stylize'
        );
      } else {
        // Fallback to github-light
        this.app.ui.debugOut(
          `THEMECHECK: No active theme data, falling back to github-light`,
          'info',
          'Stylize'
        );
        selectedTheme = 'github-light';
      }
    }

    this.app.ui.debugOut(
      `THEMECHECK: About to call highlighter with theme: '${selectedTheme}'`,
      'info',
      'Stylize'
    );

    this.app.ui.debugOut(
      `THEMECHECK: Highlighter call parameters - lang: '${lang}', theme: '${selectedTheme}', code length: ${code.length}`,
      'info',
      'Stylize'
    );

    // Generate HTML using the singleton highlighter
    const html = this.highlighter.codeToHtml(code, {
      lang,
      theme: selectedTheme,
    });

    this.app.ui.debugOut(`THEMECHECK: Highlighter call completed successfully`, 'info', 'Stylize');

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

  // Static cache for themes
  private static themesCache: Array<{
    id: string;
    displayName: string;
    colors?: Record<string, string>;
    tokenColors?: TokenColor[];
  }> | null = null;

  // Get combined themes for display (Shiki + VSCode) - Editor theme is now included by getVSCodeThemes
  getThemes(filter?: string): Array<{
    id: string;
    displayName: string;
    colors?: Record<string, string>;
    tokenColors?: TokenColor[];
  }> {
    // Build themes cache if not available
    if (Stylize.themesCache === null) {
      this.app.ui.debugOut('THEMECHECK: Rebuilding themes cache', 'info', 'Stylize');
      const shikiThemes = this.getShikiThemes(USE_ALL_LIGHT_SHIKI_THEMES);
      const vscodeThemes = this.getVSCodeThemes(USE_ALL_LIGHT_VSCODE_THEMES);

      // Combine themes: Shiki first (more reliable for printing), then VSCode
      Stylize.themesCache = [...shikiThemes, ...vscodeThemes];
      this.app.ui.debugOut(
        `THEMECHECK: Cache built with ${Stylize.themesCache.length} themes: ${Stylize.themesCache.map(t => t.id).join(', ')}`,
        'info',
        'Stylize'
      );
    } else {
      this.app.ui.debugOut('THEMECHECK: Using existing themes cache', 'info', 'Stylize');
    }

    // Get themes from cache
    let themes = [...Stylize.themesCache];

    // Apply filter if provided
    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      themes = themes.filter(theme => filterRegex.test(theme.displayName));
    }

    return themes;
  }

  // Get Shiki themes with optional filter
  getShikiThemes(filter?: string): Array<{
    id: string;
    displayName: string;
    colors?: Record<string, string>;
    tokenColors?: TokenColor[];
  }> {
    // Use bundledThemesInfo which has proper display names
    let themes = [...bundledThemesInfo];

    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      themes = themes.filter(theme => filterRegex.test(theme.id));
    }

    return themes.map(theme => ({
      id: theme.id,
      displayName: theme.displayName, // Use the actual display name from Shiki
      colors: undefined, // Shiki themes are built-in
      tokenColors: undefined,
    }));
  }

  // Get VSCode themes with optional filter
  getVSCodeThemes(filter?: string): Array<{
    id: string;
    displayName: string;
    colors?: Record<string, string>;
    tokenColors?: TokenColor[];
  }> {
    try {
      // Get theme extensions and filter them immediately if filter is provided
      let themeExtensions = this.app.vscodeapis.getVSCodeExtensionsThemes();

      if (filter) {
        const filterRegex = new RegExp(filter, 'i');
        themeExtensions = themeExtensions.filter(ext => filterRegex.test(ext.id));
      }

      const themes: Array<{
        id: string;
        displayName: string;
        colors?: Record<string, string>;
        tokenColors?: TokenColor[];
      }> = [];

      for (const ext of themeExtensions) {
        // Get theme data for this extension
        const themeData = this.app.vscodeapis.getVSCodeThemeJson(ext.id);
        if (!themeData) continue;

        // Process each theme in the extension
        const extensionThemes = Array.isArray(themeData) ? themeData : [themeData];
        for (const theme of extensionThemes) {
          if (!theme.id) continue;

          // No need to filter here anymore - extensions are already filtered

          // Resolve display name from NLS if available
          let displayName = theme.id;
          try {
            const nlsPath = this.app.os.pathJoin(ext.extensionPath, 'package.nls.json');
            const nlsData = this.app.os.readJsonFile<Record<string, string>>(nlsPath);
            if (
              nlsData &&
              theme.label &&
              theme.label.startsWith('%') &&
              theme.label.endsWith('%')
            ) {
              const key = theme.label.slice(1, -1);
              displayName = nlsData[key] || theme.id;
            }
          } catch {
            // Use theme ID if NLS resolution fails
            displayName = theme.id;
          }

          themes.push({
            id: theme.id,
            displayName,
            colors: theme.colors as Record<string, string> | undefined,
            tokenColors: theme.tokenColors as TokenColor[] | undefined,
          });
        }
      }

      // Add current editor theme at the top with 📝 indicator
      const activeThemeID = this.app.vscodeapis.getActiveThemeId();
      const activeTheme = themes.find(t => t.id === activeThemeID);

      if (activeTheme) {
        activeTheme.displayName = `${activeTheme.displayName} 📝`;
      } else {
        // If editor theme not in list, add it at the top
        const editorThemeData = this.app.vscodeapis.getVSCodeThemeJson(activeThemeID);

        if (editorThemeData) {
          this.app.ui.debugOut(
            `THEMECHECK: Adding editor theme to themes list: ${activeThemeID}`,
            'info',
            'Stylize'
          );
          themes.unshift({
            id: activeThemeID,
            displayName: `${activeThemeID} 📝`,
            colors: editorThemeData.colors as Record<string, string> | undefined,
            tokenColors: editorThemeData.tokenColors as TokenColor[] | undefined,
          });

          // Clear the themes cache so the new theme is included
          Stylize.themesCache = null;
        }
      }

      return themes;
    } catch (err) {
      this.app.ui.debugOut('ERROR:getVSCodeThemes: Failed to get themes', 'warn', 'Stylize', err);
      return [];
    }
  }
}
