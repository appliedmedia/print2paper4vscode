import type { App } from './App';
import type { FileRead_t } from './OS';
import type { FnImport_t } from './types/Registry_t';
import {
  getSingletonHighlighter,
  bundledThemesInfo,
  type ThemedToken,
  type Highlighter,
  type BundledLanguage,
} from 'shiki';
import { Diagnostics } from './Diagnostics';
import type { Theme, ThemeData, TokenColor } from './types/theme_t';

// Language ID type - abstraction over Shiki's BundledLanguage
export type LanguageId_t = BundledLanguage;

// Theme ID types - Dynamic from Shiki
export type ThemeId_t = string; // Dynamic from Shiki themes, cannot be hardcoded

// Type guard for theme validation - accepts any non-empty string since themes come from Shiki
export function isThemeId(id: string): id is ThemeId_t {
  return typeof id === 'string' && id.length > 0;
}

// Module-level constants for theme filtering
const USE_ALL_LIGHT_SHIKI_THEMES = 'light|bright|day';
const USE_ALL_LIGHT_VSCODE_THEMES = 'light|bright|day';

// Type definitions for Shiki highlighter and theme data
interface VSCodeTheme {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: TokenColor[];
  fonts?: {
    editor?: string;
  };
}

/**
 * Stylize - Syntax highlighting and theme management with Shiki
 *
 * Provides syntax highlighting using Shiki with lazy highlighter initialization.
 * Manages theme loading, validation, and token generation. Supports both bundled
 * Shiki themes and VS Code themes. Handles fallback to 'github-light' on errors.
 *
 * @input app - Application instance
 * @output Highlighted tokens, theme data, theme lists, CSS token styling
 *
 * @example
 * const stylize = new Stylize(app);
 * const tokens = await stylize.getTokens('console.log("hi")', 'javascript', 'github-light');
 * const themes = stylize.getThemes();
 */
export class Stylize {
  static readonly id = 'stylize';
  private app: App;
  private fn: FnImport_t;
  private highlighter: Highlighter | null = null;
  private dx: Diagnostics;

  constructor(args: { app: App }) {
    this.app = args.app;
    // Request only dx.sub via Registry (always available)
    // Other dependencies accessed via this.app.xxx
    this.fn = this.app.reg.use();
    this.dx = this.fn.dx.sub({ name: 'Stylize' });
    // No init() logic to move - highlighter initialized lazily when needed
  }

  private async validateHighlighter(languageId: LanguageId_t): Promise<void> {
    const dx = this.dx.sub({ name: 'validateHighlighter' });
    dx.require({ languageId }, ['languageId']);

    if (!this.highlighter) {
      const themes = this.getThemes();
      dx.out(`Creating highlighter with ${themes.length} themes`);

      // Extract themes for highlighter (IDs for pure Shiki, ThemeData for VS Code)
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

      const themesOut: Theme[] = [];

      for (const ext of themeExtensions) {
        // Get theme data for this extension
        const themeJson = this.app.vscodeapis.getVSCodeThemeJson({ themeId: ext.id });
        if (!themeJson) continue;

        // Process each theme in the extension
        const themeJsons = Array.isArray(themeJson) ? themeJson : [themeJson];
        for (const theme of themeJsons) {
          if (!theme.id) continue;

          // Resolve display name from NLS if available
          let displayName = theme.id;
          try {
            const nlsPath = this.app.os.pathJoin(ext.extensionPath, 'package.nls.json');
            const nlsData = this.app.os.fileRead<Record<string, string>>({ path: nlsPath });
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
              themesOut.push({
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
      const theme = themesOut.find(t => t.id === id);

      if (theme) {
        // Move active theme to the top
        const index = themesOut.indexOf(theme);
        if (index > 0) {
          themesOut.splice(index, 1);
          themesOut.unshift(theme);
        }
      } else {
        // If editor theme not in list, add it at the top
        const themeJson = this.app.vscodeapis.getVSCodeThemeJson({ themeId: id });

        if (themeJson && themeJson.colors && themeJson.tokenColors) {
          try {
            const themeData = this.convertVSCodeThemeToShiki({
              name: id,
              colors: themeJson.colors as Record<string, string>,
              tokenColors: themeJson.tokenColors as TokenColor[],
            });
            themesOut.unshift({
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

      return themesOut;
    } catch (err) {
      this.dx.out(`ERROR:getVSCodeThemes: Failed to get themes: ${String(err)}`);
      return [];
    }
  }

  // Tokenize code and optionally render directly to PDF
  async tokenize(args: {
    code: string;
    languageId: LanguageId_t;
    theme?: string;
  }): Promise<ThemedToken[][]> {
    const dx = this.dx.sub({ name: 'tokenize' });
    dx.require(args, ['code', 'languageId']);
    const { code, languageId, theme } = args;

    try {
      await this.validateHighlighter(languageId);
      const highlighter = this.highlighter!;
      const themeToUse = theme || this.resolveActiveTheme();

      const tokenResult = highlighter.codeToTokens(code, {
        lang: languageId,
        theme: themeToUse,
      });
      const tokens = tokenResult?.tokens || [];

      // Page-based filtering removed here; paging is handled by the renderer.
      const filteredTokens = tokens;

      // Render directly to PDF if PDF is initialized and ready
      if (this.app.pdf.docInfo.pdfDoc) {
        for (let lineNum = 0; lineNum < filteredTokens.length; lineNum++) {
          const line = filteredTokens[lineNum];
          this.app.pdf.renderTokenizedLine({ lineNumber: lineNum, tokens: line });
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
  public resolveActiveTheme(): string {
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
    tokenLines: ThemedToken[][],
    fontSize: number,
    lineHeight: number
  ): string {
    // Load YAML templates
    const fileRead: FileRead_t = this.app.os.fileRead;
    const yaml = fileRead<{
      stylize_token_pre: string;
      stylize_token_line: string;
      stylize_token_span: string;
    }>({ path: 'src/Stylize.yaml' });

    if (!yaml) {
      throw new Error('Failed to load Stylize template');
    }

    // Generate lines
    const lines = tokenLines
      .map(line => {
        // Generate tokens for this line
        const tokens = line
          .map(token => {
            if (!token.content) return '';

            const text = this.escapeHtml(token.content);
            const color = token.color || '#000000';
            const fontStyle = token.fontStyle || 0;

            // Apply font styles (bold, italic) using template
            const styleParts = [`color: ${color}`];
            if (fontStyle & 1) styleParts.push('font-weight: bold');
            if (fontStyle & 2) styleParts.push('font-style: italic');
            const style = styleParts.join('; ') + ';';

            return this.app.templateDictReplace(yaml.stylize_token_span, {
              style,
              text,
            });
          })
          .join('');

        return this.app.templateDictReplace(yaml.stylize_token_line, {
          lineHeight: lineHeight.toString(),
          tokens,
        });
      })
      .join('');

    // Generate final pre element
    return this.app.templateDictReplace(yaml.stylize_token_pre, {
      fontSize: fontSize.toString(),
      lineHeight: lineHeight.toString(),
      lines,
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
  private escapeHtml(text: string = ''): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Helper: Get font family from theme
  public getFontFamilyFromTheme(themeData: Theme): string {
    const et = this.app.vscodeapis.getEditorTypography();
    return themeData?.themeData?.fonts?.editor || et?.fontFamily || 'courier';
  }

  // Convert VS Code theme JSON to Shiki-compatible CSS variables format
  public convertVSCodeThemeToShiki(vscodeTheme: VSCodeTheme): ThemeData {
    // Derive theme type early so both success and error paths agree
    const derivedType: 'light' | 'dark' =
      (vscodeTheme as unknown as { type?: string })?.type === 'dark' ? 'dark' : 'light';

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

// end, Stylize.ts
