import type { App } from './App';
import type { fileRead_t } from './OS';
import type { PDFDoc } from './types/PDF_t';
import {
  getHighlighter,
  BUNDLED_THEMES,
  type IThemedToken as ThemedToken,
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
  fonts?: {
    editor?: string;
  };
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

      // Extract themes for highlighter (IDs for pure Shiki, ThemeData for VS Code)
      const themesForHighlighter: (string | ThemeData)[] = themes.map(
        theme => theme.themeData || theme.id
      );

      this.highlighter = await getHighlighter({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        themes: themesForHighlighter as any,
        langs: [languageId as any],
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
    // Use BUNDLED_THEMES which are just theme IDs as strings
    let themes = [...BUNDLED_THEMES];

    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      themes = themes.filter(theme => filterRegex.test(theme));
    }

    return themes.map(theme => ({
      id: theme,
      displayName: theme.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '), // Convert kebab-case to Title Case
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
        const themeJson = this.app.vscodeapis.getVSCodeThemeJson(ext.id);
        if (!themeJson) continue;

        // Process each theme in the extension
        const themes = Array.isArray(themeJson) ? themeJson : [themeJson];
        for (const theme of themes) {
          if (!theme.id) continue;

          // Resolve display name from NLS if available
          let displayName = theme.id;
          try {
            const nlsPath = this.app.os.pathJoin(ext.extensionPath, 'package.nls.json');
            const nlsData = this.app.os.fileRead<Record<string, string>>(nlsPath);
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
              const themeData = this.convertVSCodeThemeToShiki({
                name: theme.id,
                colors: theme.colors as Record<string, string>,
                tokenColors: theme.tokenColors as TokenColor[],
              });
              themes.push({
                id: theme.id,
                displayName,
                themeData,
              });
            } catch (error) {
              this.dx.out(`Failed to convert theme ${theme.id}: ${error} - skipping`);
            }
          } else {
            this.dx.out(`Theme ${theme.id} has no colors/tokenColors data - skipping`);
          }
        }
      }

      // Move current editor theme to the top
      const id = this.app.vscodeapis.getActiveThemeId();
      const theme = themes.find(t => t.id === id);

      if (theme) {
        // Move active theme to the top
        const index = themes.indexOf(theme);
        if (index > 0) {
          themes.splice(index, 1);
          themes.unshift(theme);
        }
      } else {
        // If editor theme not in list, add it at the top
        const themeJson = this.app.vscodeapis.getVSCodeThemeJson(id);

        if (themeJson && themeJson.colors && themeJson.tokenColors) {
          try {
            const themeData = this.convertVSCodeThemeToShiki({
              name: id,
              colors: themeJson.colors as Record<string, string>,
              tokenColors: themeJson.tokenColors as TokenColor[],
            });
            themes.unshift({
              id,
              displayName: id,
              themeData,
            });
          } catch (error) {
            this.dx.out(`Failed to convert active theme ${id}: ${error} - skipping`);
          }
        } else {
          this.dx.out(`Active theme ${id} has no colors/tokenColors data - skipping`);
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
      this.dx = app.stylize.dx.sub('Converter_StyleToPdf');
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
        const tokenResult = this.app.stylize.highlighter?.codeToThemedTokens(code, languageId, selectedTheme);
        this.dx.out(`tokenizeCode result: ${tokenResult ? 'success' : 'failed'}`);
        return tokenResult || [];
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
      fontSizePx: number;
      lineHeightPx: number;
    } {
      const themeData = this.app.stylize.getThemes().find(theme => theme.id === selectedTheme);
      const fontFamily = themeData ? this.app.stylize.getFontFamilyFromTheme(themeData) : 'courier';

      const editorTypo = this.app.vscodeapis.getEditorTypography();
      const fontSizePx = typeof opts?.fontSize === 'number' ? opts.fontSize : editorTypo.fontSize;
      const lineHeightPx =
        typeof opts?.lineHeight === 'number' ? opts.lineHeight : editorTypo.lineHeight;

      return { fontFamily, fontSizePx, lineHeightPx };
    }

    private async generatePdfDocument(
      tokens: ThemedToken[][],
      fontInfo: { fontFamily: string; fontSizePx: number; lineHeightPx: number },
      title?: string
    ): Promise<PDFDoc> {
      return await         this.app.pdf.generatePdfFromTokens(
          tokens,
          fontInfo.fontFamily,
          fontInfo.fontSizePx,
          fontInfo.lineHeightPx,
          title,
          this.app.pdf.docInfo.marginPts
        );
    }

    async convert(
      code: string,
      languageId: LanguageId,
      opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string; marginPts?: number }
    ): Promise<PDFDoc> {
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
    opts?: { fontSize?: number; lineHeight?: number; title?: string; theme?: string; marginPts?: number }
  ): Promise<PDFDoc> {
    const converter = new this.Converter_StyleToPdf(this.app);
    return converter.convert(code, languageId, opts);
  }

  // Simple tokenization without PDF generation - render one page at a time
  async tokenize(
    code: string,
    languageId: LanguageId,
    theme?: string,
    pageBegin?: number,
    pageEnd?: number,
    optPerLineHandler?: (pageNumber: number, lineNumber: number, htmlData: string) => void
  ): Promise<ThemedToken[][]> {
    const dx = this.dx.sub('tokenize');

    try {
      await this.validateHighlighter(languageId);
      const highlighter = this.highlighter!;
      const themeToUse = theme || this.resolveActiveTheme();

      const tokens = highlighter.codeToThemedTokens(code, languageId, themeToUse);
      
      // Apply page range filtering if specified
      let filteredTokens = tokens;
      if (pageBegin !== undefined && pageEnd !== undefined) {
        if (pageBegin === 0 && pageEnd === 0) {
          // 0,0 means everything - no filtering
          filteredTokens = tokens;
        } else if (pageEnd === 0) {
          // pageBegin,0 means just that page
          filteredTokens = tokens.slice(pageBegin - 1, pageBegin);
        } else {
          // pageBegin,pageEnd means range
          filteredTokens = tokens.slice(pageBegin - 1, pageEnd);
        }
      }

      // Call per-line handler if provided
      if (optPerLineHandler) {
        for (let pageNum = pageBegin || 1; pageNum <= (pageEnd || 1); pageNum++) {
          for (let lineNum = 0; lineNum < filteredTokens.length; lineNum++) {
            const line = filteredTokens[lineNum];
            // Convert line tokens to HTML (simplified)
            const htmlData = line.map((token: ThemedToken) => 
              `<span style="color: ${token.color || '#000000'}">${token.content}</span>`
            ).join('');
            optPerLineHandler(pageNum, lineNum, htmlData);
          }
        }
      }

      dx.out(`Tokenized ${filteredTokens.length} lines with theme ${themeToUse}`);
      return filteredTokens;
    } catch (error) {
      dx.out(`Error tokenizing: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }


  /**
   * Resolve active theme for token generation
   */
  private resolveActiveTheme(): string {
    const activeThemeId = this.app.vscodeapis.getActiveThemeId();
    const themeData = this.getThemes().find(theme => theme.id === activeThemeId);

    if (themeData) {
      if (themeData.themeData === null) {
        // Pure Shiki theme - use ID directly
        return themeData.id;
      } else {
        // Pre-converted VS Code theme - use the Shiki theme name
        return themeData.themeData.name || themeData.id;
      }
    } else {
      // Fallback to first available theme
      const themes = this.getThemes();
      return themes.length > 0 ? themes[0].id : 'github-light';
    }
  }

  // Helper: Generate HTML directly from tokens
  private generateHtmlFromTokens(
    tokens: ThemedToken[][],
    fontSize: number,
    lineHeight: number
  ): string {
    // Load YAML templates
    const fileRead: fileRead_t = this.app.os.fileRead;
    const yaml = fileRead<{
      stylize_token_pre: string;
      stylize_token_line: string;
      stylize_token_span: string;
    }>('src/Stylize.yaml');

    if (!yaml) {
      throw new Error('Failed to load Stylize template');
    }

    // Generate lines
    const lines = tokens
      .map(line => {
        // Generate tokens for this line
        const tokenSpans = line
          .map(token => {
            const text = token.content;
            if (!text) return '';

            const color = token.color || '#000000';
            const fontStyle = token.fontStyle || 0;

            // Apply font styles (bold, italic) using template
            const styleParts = [`color: ${color}`];
            if (fontStyle & 1) styleParts.push('font-weight: bold');
            if (fontStyle & 2) styleParts.push('font-style: italic');
            const style = styleParts.join('; ') + ';';

            return this.app.templateDictReplace(yaml.stylize_token_span, {
              STYLE: style,
              TEXT: this.escapeHtml(text),
            });
          })
          .join('');

        return this.app.templateDictReplace(yaml.stylize_token_line, {
          LINEHEIGHT: lineHeight.toString(),
          LINEHEIGHT_PX: lineHeight.toString(),
          TOKENS: tokenSpans,
        });
      })
      .join('');

    // Generate final pre element
    return this.app.templateDictReplace(yaml.stylize_token_pre, {
      FONTSIZE: fontSize.toString(),
      FONTSIZE_PX: fontSize.toString(),
      LINEHEIGHT: lineHeight.toString(),
      LINEHEIGHT_PX: lineHeight.toString(),
      LINES: lines,
    });
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
    const et = this.app.vscodeapis.getEditorTypography();
    return themeData?.themeData?.fonts?.editor || et?.fontFamily || 'courier';
  }

  // Convert VS Code theme JSON to Shiki-compatible CSS variables format
  private convertVSCodeThemeToShiki(vscodeTheme: VSCodeTheme): ThemeData {
    // Derive theme type early so both success and error paths agree
    const derivedType: 'light' | 'dark' = ((vscodeTheme as unknown as { type?: string })?.type ===
    'dark'
      ? 'dark'
      : 'light');

    try {
      // Extract basic theme info
      const name = (vscodeTheme.name as string) || 'github-light';

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

      // Create proper Shiki theme format
      return {
        name,
        type: derivedType, // Prefer provided type; default to light
        colors,
        tokenColors,
        fonts: {
          editor: vscodeTheme.fonts?.editor,
        },
      } as ThemeData;
    } catch (error) {
      this.dx.out(`ERROR:convertVSCodeThemeToShiki: Failed to convert theme: ${String(error)}`);
      // Return a default theme instead of null
      return {
        name: (vscodeTheme.name as string) || 'github-light',
        type: derivedType,
        colors: {},
        tokenColors: [],
      } as ThemeData;
    }
  }
}
