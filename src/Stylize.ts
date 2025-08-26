import type { App } from './App';
import { createHighlighter, bundledThemes } from 'shiki';

export class Stylize {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async init(): Promise<void> {
    // No initialization needed - we create fresh highlighters as needed
  }

  async done(): Promise<void> {
    // No cleanup needed - we don't store persistent state
  }

  async styleToHtml(
    code: string,
    languageId: string,
    opts?: { fontSize?: number; lineHeight?: number; title?: string }
  ): Promise<string> {
    const lang = languageId;

    // Get the active VS Code theme JSON - this will error out if no theme found
    const vscodeTheme = this.app.vscodeapis.getVSCodeThemeJSON();
    if (!vscodeTheme) {
      throw new Error('Could not get active VSCode theme');
    }

    // TODO: Convert VS Code theme JSON to Shiki-compatible format
    // For now, use github-light since conversion is not yet implemented
    const activeTheme = 'github-light';

    const styler = await createHighlighter({
      themes: [activeTheme],
      langs: [lang],
    });

    const html = styler.codeToHtml(code, {
      lang,
      theme: activeTheme,
    });

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
}
