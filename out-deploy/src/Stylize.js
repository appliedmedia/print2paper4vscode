"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stylize = void 0;
exports.isThemeId = isThemeId;
const shiki_1 = require("shiki");
// Type guard for theme validation - accepts any non-empty string since themes come from Shiki
function isThemeId(id) {
    return typeof id === 'string' && id.length > 0;
}
// Module-level constants for theme filtering
const USE_ALL_LIGHT_SHIKI_THEMES = 'light|bright|day';
const USE_ALL_LIGHT_VSCODE_THEMES = 'light|bright|day';
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
class Stylize {
    static id = 'stylize';
    reg;
    fn;
    highlighter = null;
    dx;
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('vscodeapis.getVSCodeExtensionsThemes', 'vscodeapis.getVSCodeThemeJson', 'vscodeapis.getActiveThemeId', 'vscodeapis.getEditorTypography', 'vscodeapis.renderMarkdownToHtml', 'os.pathJoin', 'os.fileRead', 'utils.templateDictReplace');
        this.dx = this.fn.dx.sub({ name: 'Stylize' });
    }
    async validateHighlighter(languageId) {
        const dx = this.dx.sub({ name: 'validateHighlighter' });
        dx.require({ languageId }, ['languageId']);
        if (!this.highlighter) {
            const themes = this.getThemes();
            dx.out(`Creating highlighter with ${themes.length} themes`);
            // Extract themes for highlighter (IDs for pure Shiki, ThemeData for VS Code)
            const themesForHighlighter = themes.map(theme => theme.themeData || theme.id);
            this.highlighter = await (0, shiki_1.getSingletonHighlighter)({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                themes: themesForHighlighter,
                langs: [languageId],
            });
            dx.out(`Highlighter created successfully`);
        }
        dx.done();
    }
    async done() {
        // Clear themes cache
        Stylize.themesCache = null;
        this.dx.done();
    }
    // Static cache for themes
    static themesCache = null;
    // Get combined themes for display (Shiki + VSCode) - Editor theme is now included by getVSCodeThemes
    getThemes(filter) {
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
    getShikiThemes(filter) {
        // Use bundledThemesInfo which has proper display names
        let themes = [...shiki_1.bundledThemesInfo];
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
    getVSCodeThemes(filter) {
        try {
            // Get theme extensions and filter them immediately if filter is provided
            let themeExtensions = this.fn.vscodeapis.getVSCodeExtensionsThemes();
            if (filter) {
                const filterRegex = new RegExp(filter, 'i');
                themeExtensions = themeExtensions.filter((ext) => filterRegex.test(ext.id));
            }
            const themesOut = [];
            for (const ext of themeExtensions) {
                // Get theme data for this extension
                const themeJson = this.fn.vscodeapis.getVSCodeThemeJson({ themeId: ext.id });
                if (!themeJson)
                    continue;
                // Process each theme in the extension
                const themeJsons = Array.isArray(themeJson) ? themeJson : [themeJson];
                for (const theme of themeJsons) {
                    if (!theme.id)
                        continue;
                    // Resolve display name from NLS if available
                    let displayName = theme.id;
                    try {
                        const nlsPath = this.fn.os.pathJoin(ext.extensionPath, 'package.nls.json');
                        const nlsData = this.fn.os.fileRead({ path: nlsPath });
                        if (nlsData &&
                            theme.label &&
                            theme.label.startsWith('%') &&
                            theme.label.endsWith('%')) {
                            const key = theme.label.slice(1, -1);
                            displayName = nlsData[key] || theme.id;
                        }
                    }
                    catch {
                        // Use theme ID if NLS resolution fails
                        displayName = theme.id;
                    }
                    // Convert VS Code theme to Shiki theme
                    if (theme.colors && theme.tokenColors) {
                        try {
                            const themeData = this.convertVSCodeThemeToShiki({
                                name: theme.id,
                                colors: theme.colors,
                                tokenColors: theme.tokenColors,
                            });
                            themesOut.push({
                                id: theme.id,
                                displayName,
                                themeData,
                            });
                        }
                        catch (error) {
                            this.dx.out(`Failed to convert theme ${theme.id}: ${error} - skipping`);
                        }
                    }
                    else {
                        this.dx.out(`Theme ${theme.id} has no colors/tokenColors data - skipping`);
                    }
                }
            }
            // Move current editor theme to the top
            const id = this.fn.vscodeapis.getActiveThemeId();
            const theme = themesOut.find(t => t.id === id);
            if (theme) {
                // Move active theme to the top
                const index = themesOut.indexOf(theme);
                if (index > 0) {
                    themesOut.splice(index, 1);
                    themesOut.unshift(theme);
                }
            }
            else {
                // If editor theme not in list, add it at the top
                const themeJson = this.fn.vscodeapis.getVSCodeThemeJson({ themeId: id });
                if (themeJson && themeJson.colors && themeJson.tokenColors) {
                    try {
                        const themeData = this.convertVSCodeThemeToShiki({
                            name: id,
                            colors: themeJson.colors,
                            tokenColors: themeJson.tokenColors,
                        });
                        themesOut.unshift({
                            id,
                            displayName: id,
                            themeData,
                        });
                    }
                    catch (error) {
                        this.dx.out(`Failed to convert active theme ${id}: ${error} - skipping`);
                    }
                }
                else {
                    this.dx.out(`Active theme ${id} has no colors/tokenColors data - skipping`);
                }
            }
            return themesOut;
        }
        catch (err) {
            this.dx.out(`ERROR:getVSCodeThemes: Failed to get themes: ${String(err)}`);
            return [];
        }
    }
    // Tokenize code and optionally render directly to PDF
    /**
     * Tokenize code or render markdown to HTML
     * Returns either tokens (for syntax highlighting) or HTML (for rendered markdown)
     * Does NOT render to PDF - that's handled by PDF.render()
     */
    async tokenize(args) {
        const dx = this.dx.sub({ name: 'tokenize' });
        dx.require(args, ['code', 'languageId']);
        const { code, languageId, theme, useRenderedMd, document } = args;
        try {
            // Branch: Rendered markdown vs tokenized code
            if (languageId === 'markdown' && useRenderedMd && document) {
                // Rendered markdown path: Get HTML from VS Code markdown API
                dx.out('Rendering markdown to HTML via VS Code API');
                const html = await this.fn.vscodeapis.renderMarkdownToHtml({
                    markdown: code,
                    document
                });
                dx.out(`Rendered markdown to HTML (${html.length} chars)`);
                return { html };
            }
            else {
                // Tokenized path: Use Shiki for syntax highlighting
                await this.validateHighlighter(languageId);
                const highlighter = this.highlighter;
                const themeToUse = theme || this.resolveActiveTheme();
                const tokenResult = highlighter.codeToTokens(code, {
                    lang: languageId,
                    theme: themeToUse,
                });
                const tokens = tokenResult?.tokens || [];
                dx.out(`Tokenized ${tokens.length} lines with theme ${themeToUse}`);
                return { tokens };
            }
        }
        catch (error) {
            dx.out(`Error in tokenize: ${error}`);
            throw error;
        }
        finally {
            dx.done();
        }
    }
    /**
     * Resolve active theme for token generation
     */
    resolveActiveTheme() {
        const activeThemeId = this.fn.vscodeapis.getActiveThemeId();
        const themeData = this.getThemes().find(theme => theme.id === activeThemeId);
        if (themeData) {
            if (themeData.themeData === null) {
                // Pure Shiki theme - use ID directly
                return themeData.id;
            }
            else {
                // Pre-converted VS Code theme - use the Shiki theme name
                return themeData.themeData.name || themeData.id;
            }
        }
        else {
            // Fallback to first available theme
            const themes = this.getThemes();
            return themes.length > 0 ? themes[0].id : 'github-light';
        }
    }
    // Helper: Generate HTML directly from tokens
    generateHtmlFromTokens(tokenLines, fontSize, lineHeight) {
        // Load YAML templates
        const fileRead = this.fn.os.fileRead;
        const yaml = fileRead({ path: 'src/Stylize.yaml' });
        if (!yaml) {
            this.dx.error('Failed to load Stylize template');
            throw new Error('Failed to load Stylize template');
        }
        // Generate lines
        const lines = tokenLines
            .map(line => {
            // Generate tokens for this line
            const tokens = line
                .map(token => {
                if (!token.content)
                    return '';
                const text = this.escapeHtml(token.content);
                const color = token.color || '#000000';
                const fontStyle = token.fontStyle || 0;
                // Apply font styles (bold, italic) using template
                const styleParts = [`color: ${color}`];
                if (fontStyle & 1)
                    styleParts.push('font-weight: bold');
                if (fontStyle & 2)
                    styleParts.push('font-style: italic');
                const style = styleParts.join('; ') + ';';
                return this.fn.utils.templateDictReplace(yaml.stylize_token_span, {
                    style,
                    text,
                });
            })
                .join('');
            return this.fn.utils.templateDictReplace(yaml.stylize_token_line, {
                lineHeight: lineHeight.toString(),
                tokens,
            });
        })
            .join('');
        // Generate final pre element
        return this.fn.utils.templateDictReplace(yaml.stylize_token_pre, {
            fontSize: fontSize.toString(),
            lineHeight: lineHeight.toString(),
            lines,
        });
    }
    // Helper: Create the final HTML page
    createHtmlPage(codeHtml, fontSize, lineHeight, title) {
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
    escapeHtml(text = '') {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    // Helper: Get font family from theme
    getFontFamilyFromTheme(themeData) {
        const et = this.fn.vscodeapis.getEditorTypography();
        return themeData?.themeData?.fonts?.editor || et?.fontFamily || 'courier';
    }
    // Convert VS Code theme JSON to Shiki-compatible CSS variables format
    convertVSCodeThemeToShiki(vscodeTheme) {
        // Derive theme type early so both success and error paths agree
        const derivedType = vscodeTheme?.type === 'dark' ? 'dark' : 'light';
        try {
            // Extract basic theme info
            const name = vscodeTheme.name || 'github-light';
            // Extract colors
            const colors = {};
            if (vscodeTheme.colors && typeof vscodeTheme.colors === 'object') {
                const vscodeColors = vscodeTheme.colors;
                for (const [key, value] of Object.entries(vscodeColors)) {
                    if (typeof value === 'string') {
                        colors[key] = value;
                    }
                }
            }
            // Extract token colors
            const tokenColors = [];
            if (vscodeTheme.tokenColors && Array.isArray(vscodeTheme.tokenColors)) {
                const vscodeTokenColors = vscodeTheme.tokenColors;
                for (const tokenColor of vscodeTokenColors) {
                    if (tokenColor.scope && tokenColor.settings) {
                        const scope = tokenColor.scope;
                        const settings = {};
                        if (tokenColor.settings.foreground &&
                            typeof tokenColor.settings.foreground === 'string') {
                            settings.foreground = tokenColor.settings.foreground;
                        }
                        if (tokenColor.settings.background &&
                            typeof tokenColor.settings.background === 'string') {
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
            };
        }
        catch (error) {
            this.dx.out(`ERROR:convertVSCodeThemeToShiki: Failed to convert theme: ${String(error)}`);
            // Return a default theme instead of null
            return {
                name: vscodeTheme.name || 'github-light',
                type: derivedType,
                colors: {},
                tokenColors: [],
            };
        }
    }
}
exports.Stylize = Stylize;
// end, Stylize.ts
//# sourceMappingURL=Stylize.js.map