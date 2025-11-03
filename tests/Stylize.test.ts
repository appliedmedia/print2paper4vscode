import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { Stylize } from '../src/Stylize.js';

describe('Stylize', () => {
  let stylize: Stylize;
  let mockApp: any;

  beforeEach(() => {
    // Mock app for testing
    mockApp = {
      vscodeapis: {
      getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 }),
      getActiveThemeId: () => 'vs-light',
      getVSCodeExtensionsThemes: () => [
        { id: 'vs-extension', displayName: 'VS Extension', extensionPath: '/path/to/vs' },
        {
          id: 'another-extension',
          displayName: 'Another Extension',
          extensionPath: '/path/to/another',
        },
      ],
      getVSCodeThemeJson: (themeId: string) => {
        // Mock theme data
        const themes = {
          'vs-light': {
            id: 'vs-light',
            label: 'VS Light',
            colors: { 'editor.background': '#ffffff' },
          },
          'vs-dark': {
            id: 'vs-dark',
            label: 'VS Dark',
            colors: { 'editor.background': '#000000' },
          },
          'another-light': {
            id: 'another-light',
            label: 'Another Light Theme',
            colors: { 'editor.background': '#f0f0f0' },
          },
        };
        return themes[themeId as keyof typeof themes];
      },
    },
    os: {
      readExtensionYaml: () => ({ stylize_html: '<pre>{{CODE}}</pre>' }),
      templateDictReplace: (source: string, dictionary: Record<string, string>) =>
        source.replace(/\{\{(\w+)\}\}/g, (match, key) => dictionary[key] || match),
      pathJoin: (...paths: string[]) => paths.join('/'),
      readJsonFile: () => undefined,
    },
    ui: {
      debugOut: (message: string, level: string, source: string, error?: any) => {
        // Mock debug output - do nothing in tests
      },
    },
    dx: {
      create: (name: string) => ({
        out: () => {},
        print: () => {},
        done: () => {},
        sub: (name: string) => ({
          out: () => {},
          print: () => {},
          done: () => {},
          require: () => true,
        }),
      }),
    },
  };
  stylize = new Stylize(mockApp);
  });

  it('should initialize with available Shiki themes', async () => {
    await stylize.init();
    const allThemes = stylize.getShikiThemes();

    // Should have many themes (Shiki v3 has 100+)
    assert.ok(allThemes.length > 10, 'Should have many themes available');

    // Should include common themes
    const themeNames = allThemes.map(t => t.id);
    assert.ok(themeNames.includes('github-light'), 'Should have GitHub light theme');
    // Verify we have multiple themes, not specific names
    assert.ok(themeNames.length > 20, 'Should have many theme IDs');
  });

  it('should filter themes by regex pattern', async () => {
    await stylize.init();

    // Test light theme filtering
    const lightThemes = stylize.getShikiThemes('light|bright|day');
    assert.ok(lightThemes.length > 0, 'Should have light themes');

    lightThemes.forEach(theme => {
      const name = theme.displayName.toLowerCase();
      assert.ok(
        name.includes('light') || name.includes('bright') || name.includes('day'),
        `Theme ${theme.displayName} should match light|bright|day pattern`
      );
    });

    // Test GitHub theme filtering
    const githubThemes = stylize.getShikiThemes('github');
    assert.ok(githubThemes.length > 0, 'Should have GitHub themes');

    githubThemes.forEach(theme => {
      assert.ok(
        theme.displayName.toLowerCase().includes('github'),
        `Theme ${theme.displayName} should contain 'github'`
      );
    });
  });

  it('should handle empty filter (return all themes)', async () => {
    await stylize.init();
    const allThemes = stylize.getShikiThemes();
    const filteredThemes = stylize.getShikiThemes('');

    // Empty filter should return all themes
    assert.strictEqual(
      allThemes.length,
      filteredThemes.length,
      'Empty filter should return all themes'
    );
  });

  it('should handle undefined filter (return all themes)', async () => {
    await stylize.init();
    const allThemes = stylize.getShikiThemes();
    const noFilterThemes = stylize.getShikiThemes();

    // Undefined filter should return all themes
    assert.strictEqual(
      allThemes.length,
      noFilterThemes.length,
      'Undefined filter should return all themes'
    );
  });

  it('should return themes with correct structure', async () => {
    await stylize.init();
    const themes = stylize.getShikiThemes('github');

    themes.forEach(theme => {
      assert.ok(theme.id, 'Theme should have ID');
      assert.ok(theme.displayName, 'Theme should have displayName');
      assert.ok(theme.id.length > 0, 'Theme ID should not be empty');
      assert.ok(theme.displayName.length > 0, 'Theme displayName should not be empty');
    });
  });

  it('should handle tokenize with theme', async () => {
    await stylize.init();
    const code = 'const x = 42;';
    const tokens = await stylize.tokenize(code, 'javascript', 'github-light');
    
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length > 0);
    assert.ok(Array.isArray(tokens[0]));
  });

  it('should handle tokenize without theme (uses active theme)', async () => {
    await stylize.init();
    const code = 'function test() { return 1; }';
    const tokens = await stylize.tokenize(code, 'javascript');
    
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length > 0);
  });

  it('should get all themes including VS Code themes', async () => {
    await stylize.init();
    const allThemes = stylize.getThemes();
    
    assert.ok(allThemes.length > 0, 'Should have themes');
    // Should include Shiki themes
    const shikiThemes = allThemes.filter(t => !t.themeData);
    assert.ok(shikiThemes.length > 0, 'Should have Shiki themes');
  });

  it('should convert VS Code theme to Shiki format', async () => {
    await stylize.init();
    const vscodeTheme = {
      name: 'test-theme',
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
      },
      tokenColors: [
        {
          scope: 'keyword',
          settings: {
            foreground: '#0000ff',
          },
        },
      ],
    };

    // Test public method directly
    const converted = stylize.convertVSCodeThemeToShiki(vscodeTheme);
    
    assert.ok(converted);
    assert.strictEqual(converted.name, 'test-theme');
    assert.ok(converted.colors);
    assert.ok(Array.isArray(converted.tokenColors));
  });

  it('should handle VS Code theme conversion error gracefully', async () => {
    await stylize.init();
    const invalidTheme = null as any;

    const converted = stylize.convertVSCodeThemeToShiki(invalidTheme);
    
    // Should return default theme instead of null
    assert.ok(converted);
    assert.ok(converted.name);
  });

  it('should escape HTML characters', async () => {
    await stylize.init();
    const stylizeInstance = stylize as any;
    
    assert.strictEqual(stylizeInstance.escapeHtml('&'), '&amp;');
    assert.strictEqual(stylizeInstance.escapeHtml('<'), '&lt;');
    assert.strictEqual(stylizeInstance.escapeHtml('>'), '&gt;');
    assert.strictEqual(stylizeInstance.escapeHtml('"'), '&quot;');
    assert.strictEqual(stylizeInstance.escapeHtml("'"), '&#39;');
    assert.strictEqual(stylizeInstance.escapeHtml('test & < > " \''), 'test &amp; &lt; &gt; &quot; &#39;');
  });

  it('should get font family from theme', async () => {
    await stylize.init();
    const themes = stylize.getThemes();
    
    if (themes.length > 0) {
      const fontFamily = stylize.getFontFamilyFromTheme(themes[0]);
      assert.ok(typeof fontFamily === 'string');
    }
  });

  it('should resolve active theme', async () => {
    await stylize.init();
    const theme = stylize.resolveActiveTheme();
    assert.ok(typeof theme === 'string');
    assert.ok(theme.length > 0);
  });
});
