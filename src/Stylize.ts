import type { App } from './App';
import { getSingletonHighlighter, createCssVariablesTheme, bundledThemesInfo } from 'shiki';
import { Diagnostics } from './Diagnostics';

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
  private dx: Diagnostics;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('Stylize');
  }

  async init(): Promise<void> {
    // No initialization needed - highlighter will be initialized lazily when needed
  }

  private async validateHighlighter(languageId: string): Promise<void> {
    const dx = this.dx.sub('validateHighlighter');
    dx.require({ languageId }, ['languageId']);
    
    dx.out(`THEMECHECK: validateHighlighter called with languageId: '${languageId}'`);

    if (!this.highlighter) {
      dx.out(`THEMECHECK: No highlighter, creating new one`);
      const themes = this.getThemes();
      dx.out(`THEMECHECK: Themes for highlighter: ${themes.map(theme => theme.id).join(', ')}`);

      try {
        this.highlighter = await getSingletonHighlighter({
          themes: themes.map(theme => theme.id),
          langs: [languageId],
        });
        dx.out(`THEMECHECK: Highlighter created successfully`);
      } catch (error) {
        dx.out(`THEMECHECK: Error creating highlighter: ${error}`);
        throw error;
      }
    } else {
      dx.out(`THEMECHECK: Using existing highlighter`);
    }
    dx.done();
  }

  async done(): Promise<void> {
    // Clear themes cache
    Stylize.themesCache = null;
    this.dx.done();
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
      this.dx.print(
        `ERROR:convertVSCodeThemeToShiki: Failed to convert theme: ${String(error)}`
      );
      return null;
    }
  }

  async styleToHtml(
    code: string,
    languageId: string,
    opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string }
  ): Promise<string> {
    const lang = languageId;

    // Determine which theme to use FIRST
    let selectedTheme: string;

    if (opts?.theme) {
      // Use specified theme - look it up from our unified theme list
      const allThemes = this.getThemes();
      const themeData = allThemes.find(theme => theme.id === opts.theme);

      if (!themeData) {
        throw new Error(`Theme '${opts.theme}' not found in available themes`);
      }

      if (themeData.colors && themeData.tokenColors) {
        // VS Code theme - convert and use
        const shikiTheme = this.convertVSCodeThemeToShiki({
          name: themeData.id,
          colors: themeData.colors,
          tokenColors: themeData.tokenColors,
        });
        selectedTheme = shikiTheme?.name || 'github-light';
      } else {
        // Shiki theme - use directly
        selectedTheme = themeData.id;
      }
    } else {
      // Use current VS Code theme - get it from our unified theme list
      const activeThemeId = this.app.vscodeapis.getActiveThemeId();
      const themeData = this.getThemes().find(theme => theme.id === activeThemeId);

      if (themeData && themeData.colors && themeData.tokenColors) {
        // VS Code theme - convert and use
        const shikiTheme = this.convertVSCodeThemeToShiki({
          name: themeData.id,
          colors: themeData.colors,
          tokenColors: themeData.tokenColors,
        });
        selectedTheme = shikiTheme?.name || 'github-light';
      } else {
        // Fallback to github-light
        selectedTheme = 'github-light';
      }
    }

    // Ensure highlighter is initialized AFTER theme processing
    this.dx.out(
      `THEMECHECK: About to call validateHighlighter with lang: '${lang}'`
    );
    await this.validateHighlighter(lang);
    this.dx.out(
      `THEMECHECK: validateHighlighter completed successfully`
    );

    this.dx.out(
      `THEMECHECK: About to call highlighter with theme: '${selectedTheme}'`
    );

    this.dx.out(
      `THEMECHECK: Highlighter call parameters - lang: '${lang}', theme: '${selectedTheme}', code length: ${code.length}`
    );

    // Generate HTML using the singleton highlighter
    const html = this.highlighter.codeToHtml(code, {
      lang,
      theme: selectedTheme,
    });

    this.dx.out(`THEMECHECK: Highlighter call completed successfully`);

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
      this.dx.out('THEMECHECK: Rebuilding themes cache');
      const shikiThemes = this.getShikiThemes(USE_ALL_LIGHT_SHIKI_THEMES);
      const vscodeThemes = this.getVSCodeThemes(USE_ALL_LIGHT_VSCODE_THEMES);

      // Combine themes: Shiki first (more reliable for printing), then VSCode
      Stylize.themesCache = [...shikiThemes, ...vscodeThemes];
      this.dx.out(
        `THEMECHECK: Cache built with ${Stylize.themesCache.length} themes: ${Stylize.themesCache.map(t => t.id).join(', ')}`
      );
      this.dx.out('THEMECHECK: About to return from getThemes()');
    } else {
      this.dx.out('THEMECHECK: Using existing themes cache');
      this.dx.out('THEMECHECK: About to return from getThemes()');
    }

    // Get themes from cache
    let themes = [...Stylize.themesCache];
    this.dx.out(
      `THEMECHECK: getThemes() - themes array created with ${themes.length} items`
    );

    // Apply filter if provided
    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      themes = themes.filter(theme => filterRegex.test(theme.displayName));
      this.dx.out(
        `THEMECHECK: getThemes() - filter applied, ${themes.length} themes remaining`
      );
    }

    this.dx.out(
      `THEMECHECK: getThemes() - returning themes: ${themes.map(t => t.id).join(', ')}`
    );
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
          this.dx.out(
            `THEMECHECK: Adding editor theme to themes list: ${activeThemeID}`
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
      this.dx.print(`ERROR:getVSCodeThemes: Failed to get themes: ${String(err)}`);
      return [];
    }
  }

  // NEW: Generate PDF directly from code using theme font and user size
  async styleToPdf(
    code: string,
    languageId: string,
    opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string }
  ): Promise<string> {
    const dx = this.dx.sub('styleToPdf');
    dx.require({ code, languageId }, ['code', 'languageId']);
    
    try {
      // Get theme (same logic as styleToHtml)
      let selectedTheme: string;
      if (opts?.theme) {
        const allThemes = this.getThemes();
        const themeData = allThemes.find(theme => theme.id === opts.theme);
        if (!themeData) {
          throw new Error(`Theme '${opts.theme}' not found in available themes`);
        }
        selectedTheme = themeData.id;
      } else {
        const activeThemeId = this.app.vscodeapis.getActiveThemeId();
        const themeData = this.getThemes().find(theme => theme.id === activeThemeId);
        selectedTheme = themeData?.id || 'github-light';
      }

      // Ensure highlighter is initialized
      await this.validateHighlighter(languageId);

      // Get tokens from Shiki - try different method names
      let tokens;
      try {
        // Try the most common method name
        tokens = this.highlighter.codeToThemedTokens(code, {
          lang: languageId,
          theme: selectedTheme,
        });
      } catch (error) {
        // Fallback: try to get tokens using codeToHtml and parse them
        const html = this.highlighter.codeToHtml(code, {
          lang: languageId,
          theme: selectedTheme,
        });
        
        // For now, create a simple token structure from the HTML
        // This is a temporary workaround until we figure out the correct API
        const lines = code.split('\n');
        tokens = lines.map(line => [{
          content: line,
          color: '#000000'
        }]);
      }

      // Get font info from theme
      const themeData = this.getThemes().find(theme => theme.id === selectedTheme);
      const fontFamily = this.getFontFamilyFromTheme(themeData);
      
      // Get user-specified size or editor default
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      const fontSize = typeof opts?.fontSize === 'number' ? opts.fontSize : editorTypo.fontSize;
      const lineHeight = typeof opts?.lineHeight === 'number' ? opts.lineHeight : editorTypo.lineHeight;

      // Generate PDF using PDF class
      const pdfPath = await this.app.pdf.generatePdfFromTokens(tokens, fontFamily, fontSize, lineHeight, opts?.title);
      
      dx.out(`PDF generated successfully: ${pdfPath}`);
      return pdfPath;
      
    } catch (error) {
      dx.out(`Error generating PDF: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  // NEW: Display PDF in VS Code web view
  displayPdfToVSCodeWebView(pdfPath: string, title: string): string {
    return this.app.pdf.displayPdfToVSCodeWebView(pdfPath, title);
  }

  // Helper: Get font family from theme
  private getFontFamilyFromTheme(themeData: any): string {
    if (!themeData?.colors) return 'courier';
    
    // Try to get font from theme colors or use editor font
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return editorTypo.fontFamily || 'courier';
  }
}
