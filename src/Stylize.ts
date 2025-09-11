import type { App } from './App';
import {
  getSingletonHighlighter,
  createCssVariablesTheme,
  bundledThemesInfo,
  type ThemedToken,
  type Highlighter,
} from 'shiki';
import { Diagnostics } from './Diagnostics';
import jsPDF from 'jspdf';
import type { Theme, ThemeData, TokenColor } from './types/theme_t';

// Module-level constants for theme filtering
const USE_ALL_LIGHT_SHIKI_THEMES = 'light|bright|day';
const USE_ALL_LIGHT_VSCODE_THEMES = 'light|bright|day';

// Type definitions for Shiki highlighter and theme data
type LanguageId = string; // We accept any string as language ID, even if Shiki expects specific types

interface VSCodeTheme {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: TokenColor[];
}

export class Stylize {
  private app: App;
  private highlighter: Highlighter | null = null;
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

    if (!this.highlighter) {
      const themes = this.getThemes();
      dx.out(`Creating highlighter with ${themes.length} themes`);

      // Extract themes for highlighter (IDs for pure Shiki, objects for converted VS Code)
      const themesForHighlighter: (string | ThemeData)[] = themes.map(
        theme => theme.themeData || theme.id
      );

      this.highlighter = await getSingletonHighlighter({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        themes: themesForHighlighter as any,
        langs: [languageId],
      });

      dx.out(`Highlighter created successfully`);
    }
    dx.done();
  }

  async done(): Promise<void> {
    // Clear themes cache
    Stylize.themesCache = null;
    this.dx.done();
  }

  // Static cache for themes
  private static themesCache: Theme[] | null = null;

  // Get combined themes for display (Shiki + VSCode) - Editor theme is now included by getVSCodeThemes
  getThemes(filter?: string): Theme[] {
    // Build themes cache if not available
    if (Stylize.themesCache === null) {
      const shikiThemes = this.getShikiThemes(USE_ALL_LIGHT_SHIKI_THEMES);
      const vscodeThemes = this.getVSCodeThemes(USE_ALL_LIGHT_VSCODE_THEMES);

      // Combine themes: Shiki first (more reliable for printing), then VSCode
      Stylize.themesCache = [...shikiThemes, ...vscodeThemes];
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

  // Get Shiki themes with optional filter (returns Theme objects)
  getShikiThemes(filter?: string): Theme[] {
    // Use bundledThemesInfo which has proper display names
    let themes = [...bundledThemesInfo];

    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      themes = themes.filter(theme => filterRegex.test(theme.id));
    }

    return themes.map(theme => ({
      id: theme.id,
      displayName: theme.displayName, // Use the actual display name from Shiki
      themeData: null, // Pure Shiki themes use id directly
    }));
  }

  // Get VSCode themes with optional filter (returns converted Theme objects)
  getVSCodeThemes(filter?: string): Theme[] {
    try {
      // Get theme extensions and filter them immediately if filter is provided
      let themeExtensions = this.app.vscodeapis.getVSCodeExtensionsThemes();

      if (filter) {
        const filterRegex = new RegExp(filter, 'i');
        themeExtensions = themeExtensions.filter(ext => filterRegex.test(ext.id));
      }

      const themes: Theme[] = [];

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

          // Convert VS Code theme to Shiki theme
          if (theme.colors && theme.tokenColors) {
            try {
              const shikiTheme = this.convertVSCodeThemeToShiki({
                name: theme.id,
                colors: theme.colors as Record<string, string>,
                tokenColors: theme.tokenColors as TokenColor[],
              });
              themes.push({
                id: theme.id,
                displayName,
                themeData: shikiTheme,
              });
            } catch (error) {
              this.dx.out(`Failed to convert theme ${theme.id}: ${error} - skipping`);
            }
          } else {
            this.dx.out(`Theme ${theme.id} has no colors/tokenColors data - skipping`);
          }
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

        if (editorThemeData && editorThemeData.colors && editorThemeData.tokenColors) {
          try {
            const shikiTheme = this.convertVSCodeThemeToShiki({
              name: activeThemeID,
              colors: editorThemeData.colors as Record<string, string>,
              tokenColors: editorThemeData.tokenColors as TokenColor[],
            });
            themes.unshift({
              id: activeThemeID,
              displayName: `${activeThemeID} 📝`,
              themeData: shikiTheme,
            });
          } catch (error) {
            this.dx.out(`Failed to convert active theme ${activeThemeID}: ${error} - skipping`);
          }
        } else {
          this.dx.out(`Active theme ${activeThemeID} has no colors/tokenColors data - skipping`);
        }
      }

      return themes;
    } catch (err) {
      this.dx.out(`ERROR:getVSCodeThemes: Failed to get themes: ${String(err)}`);
      return [];
    }
  }

  // Internal converter class for styleToPdf logic
  private Converter_StyleToPdf = class {
    private app: App;
    private dx: Diagnostics;

    constructor(app: App) {
      this.app = app;
      this.dx = app.stylize.dx.sub('Converter_StyleToPdf', true /* debugOn */);
    }

    private determineTheme(opts?: { theme?: string }): string {
      this.dx.out(`determineTheme called with opts: ${JSON.stringify(opts)}`);
      if (opts?.theme) {
        this.dx.out(`Using specified theme: ${opts.theme}`);
        return this.resolveSpecifiedTheme(opts.theme);
      } else {
        this.dx.out(`No theme specified, using active theme`);
        return this.resolveActiveTheme();
      }
    }

    private resolveSpecifiedTheme(themeId: string): string {
      const allThemes = this.app.stylize.getThemes();
      this.dx.out(
        `Resolving specified theme '${themeId}' from ${allThemes.length} available themes`
      );
      this.dx.out(`Available theme IDs: ${allThemes.map(t => t.id).join(', ')}`);

      const themeData = allThemes.find(theme => theme.id === themeId);

      if (!themeData) {
        // Theme not found - fallback to active editor theme
        this.app.ui.showErrorMessage(
          `Theme '${themeId}' not found. Using active editor theme instead.`
        );
        return this.resolveActiveTheme();
      }

      this.dx.out(
        `Found theme data for '${themeId}': themeData is ${themeData.themeData ? 'converted' : 'null (pure Shiki)'}`
      );

      if (themeData.themeData === null) {
        // Pure Shiki theme - use ID directly
        return themeData.id;
      } else {
        // Pre-converted VS Code theme - use the Shiki theme name
        return themeData.themeData.name || themeData.id;
      }
    }

    private resolveActiveTheme(): string {
      const activeThemeId = this.app.vscodeapis.getActiveThemeId();
      this.dx.out(`Resolving active theme '${activeThemeId}'`);

      const themeData = this.app.stylize.getThemes().find(theme => theme.id === activeThemeId);

      this.dx.out(
        `Active theme found: ${!!themeData}, themeData is ${themeData?.themeData ? 'converted' : 'null (pure Shiki)'}`
      );

      if (themeData) {
        if (themeData.themeData === null) {
          // Pure Shiki theme - use ID directly
          return themeData.id;
        } else {
          // Pre-converted VS Code theme - use the Shiki theme name
          return themeData.themeData.name || themeData.id;
        }
      } else {
        // Active theme not found - fallback to first available theme
        this.app.ui.showErrorMessage(
          `Active theme '${activeThemeId}' not found. Using first available theme instead.`
        );
        return this.getFallbackTheme();
      }
    }

    private getFallbackTheme(): string {
      const themes = this.app.stylize.getThemes();
      this.dx.out(`Getting fallback theme from ${themes.length} available themes`);
      if (themes.length === 0) {
        this.app.ui.showErrorMessage(
          'No themes available - cannot generate PDF. Please check your theme configuration.'
        );
        throw new Error('No themes available - cannot generate PDF');
      }
      this.dx.out(`Using fallback theme: ${themes[0].id}`);
      return themes[0].id;
    }

    private async ensureHighlighterReady(languageId: LanguageId): Promise<void> {
      await this.app.stylize.validateHighlighter(languageId);
    }

    private tokenizeCode(
      code: string,
      languageId: LanguageId,
      selectedTheme: string
    ): ThemedToken[][] {
      this.dx.out(`tokenizeCode called with theme: '${selectedTheme}'`);
      this.dx.out(`Highlighter exists: ${!!this.app.stylize.highlighter}`);

      try {
        const tokenResult = this.app.stylize.highlighter?.codeToTokens(code, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lang: languageId as any,
          theme: selectedTheme,
        });
        this.dx.out(`tokenizeCode result: ${tokenResult ? 'success' : 'failed'}`);
        return tokenResult?.tokens || [];
      } catch (error) {
        this.dx.out(`tokenizeCode error: ${error}`);
        throw error;
      }
    }

    private extractFontInfo(
      selectedTheme: string,
      opts?: { fontSize?: number; lineHeight?: number }
    ): {
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
    } {
      const themeData = this.app.stylize.getThemes().find(theme => theme.id === selectedTheme);
      const fontFamily = themeData ? this.app.stylize.getFontFamilyFromTheme(themeData) : 'courier';

      const editorTypo = this.app.vscodeapis.getEditorTypography();
      const fontSize = typeof opts?.fontSize === 'number' ? opts.fontSize : editorTypo.fontSize;
      const lineHeight =
        typeof opts?.lineHeight === 'number' ? opts.lineHeight : editorTypo.lineHeight;

      return { fontFamily, fontSize, lineHeight };
    }

    private async generatePdfDocument(
      tokens: ThemedToken[][],
      fontInfo: { fontFamily: string; fontSize: number; lineHeight: number },
      title?: string
    ): Promise<jsPDF> {
      return await this.app.pdf.generatePdfFromTokens(
        tokens,
        fontInfo.fontFamily,
        fontInfo.fontSize,
        fontInfo.lineHeight,
        title
      );
    }

    async convert(
      code: string,
      languageId: LanguageId,
      opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string }
    ): Promise<jsPDF> {
      const dx = this.dx.sub('Converter_StyleToPdf');
      dx.require({ code, languageId }, ['code', 'languageId']);

      try {
        const selectedTheme = this.determineTheme(opts);
        await this.ensureHighlighterReady(languageId);
        const tokens = this.tokenizeCode(code, languageId, selectedTheme);
        const fontInfo = this.extractFontInfo(selectedTheme, opts);
        const pdfDoc = await this.generatePdfDocument(tokens, fontInfo, opts?.title);

        dx.out(`PDF document generated successfully`);
        return pdfDoc;
      } catch (error) {
        dx.out(`Error generating PDF: ${error}`);
        throw error;
      } finally {
        dx.done();
      }
    }
  };

  // NEW: Generate PDF directly from code using theme font and user size
  async styleToPdf(
    code: string,
    languageId: LanguageId,
    opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string }
  ): Promise<jsPDF> {
    const converter = new this.Converter_StyleToPdf(this.app);
    return converter.convert(code, languageId, opts);
  }

  // Helper: Generate HTML directly from tokens
  private generateHtmlFromTokens(
    tokens: ThemedToken[][],
    fontSize: number,
    lineHeight: number
  ): string {
    let html =
      '<pre style="font-size: ' +
      fontSize +
      'px; line-height: ' +
      lineHeight +
      'px; margin: 0; white-space: pre;">';

    for (const line of tokens) {
      html +=
        '<div class="line" style="line-height: ' +
        lineHeight +
        'px; min-height: ' +
        lineHeight +
        'px; margin: 0; padding: 0; white-space: pre;">';

      for (const token of line) {
        const text = token.content;
        if (!text) continue;

        const color = token.color || '#000000';
        const fontStyle = token.fontStyle || 0;

        // Apply font styles (bold, italic)
        let style = `color: ${color};`;
        if (fontStyle & 1) style += ' font-weight: bold;';
        if (fontStyle & 2) style += ' font-style: italic;';

        html += `<span style="${style}">${this.escapeHtml(text)}</span>`;
      }

      html += '</div>';
    }

    html += '</pre>';
    return html;
  }

  // Helper: Create the final HTML page
  private createHtmlPage(
    codeHtml: string,
    fontSize: number,
    lineHeight: number,
    title: string
  ): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <style>
      body { 
        margin: 24px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; 
      }
      pre { 
        white-space: pre; 
        word-wrap: normal; 
        margin: 0; 
      }
      code { 
        font-size: ${fontSize}px; 
        display: block; 
        margin: 0; 
        white-space: normal; 
      }
      .line { 
        display: block; 
        line-height: ${lineHeight}px; 
        min-height: ${lineHeight}px; 
        margin: 0; 
        padding: 0; 
        white-space: pre; 
      }
    </style>
    <title>${title}</title>
  </head>
  <body>
    ${codeHtml}
  </body>
</html>`;
  }

  // Helper: Escape HTML characters
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Helper: Get font family from theme
  private getFontFamilyFromTheme(themeData: Theme): string {
    // Priority 1: If theme has a converted Shiki theme with font family, return that
    if (themeData.themeData && themeData.themeData.fonts?.editor) {
      return themeData.themeData.fonts.editor;
    }

    // Priority 2: Return the current editor's font family
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    if (editorTypo.fontFamily) {
      return editorTypo.fontFamily;
    }

    // Priority 3: Fallback to courier
    return 'courier';
  }

  // Convert VS Code theme JSON to Shiki-compatible CSS variables format
  private convertVSCodeThemeToShiki(vscodeTheme: VSCodeTheme): ThemeData {
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
        scope: string | string[];
        settings: { foreground?: string; background?: string };
      }> = [];
      if (vscodeTheme.tokenColors && Array.isArray(vscodeTheme.tokenColors)) {
        const vscodeTokenColors = vscodeTheme.tokenColors as TokenColor[];
        for (const tokenColor of vscodeTokenColors) {
          if (tokenColor.scope && tokenColor.settings) {
            const scope = tokenColor.scope;
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
      } as ThemeData);
    } catch (error) {
      this.dx.out(`ERROR:convertVSCodeThemeToShiki: Failed to convert theme: ${String(error)}`);
      // Return a default theme instead of null
      return createCssVariablesTheme({
        name: 'fallback-theme',
      });
    }
  }
}
