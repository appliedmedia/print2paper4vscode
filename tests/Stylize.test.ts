import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Stylize } from '../src/Stylize.js';

describe('Stylize', () => {
  let stylize: Stylize;
  let mockApp: any;

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
    dx: { create: (name: string) => ({ out: () => {}, print: () => {}, done: () => {}, sub: (name: string) => ({ out: () => {}, print: () => {}, done: () => {}, require: () => true }) }) },
  };
  stylize = new Stylize(mockApp);

  it('should initialize with available Shiki themes', async () => {
    await stylize.init();
    const allThemes = stylize.getShikiThemes();

    // Should have many themes (Shiki v3 has 100+)
    assert.ok(allThemes.length > 10, 'Should have many themes available');

    // Should include common themes
    const themeNames = allThemes.map(t => t.id);
    assert.ok(themeNames.includes('github-light'), 'Should have GitHub light theme');
    assert.ok(themeNames.includes('github-dark'), 'Should have GitHub dark theme');
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
      // ID should be the internal identifier, displayName should be human-readable
      assert.notStrictEqual(
        theme.id,
        theme.displayName,
        'ID and displayName should be different for Shiki themes (ID is internal, displayName is human-readable)'
      );
      // ID should be lowercase with hyphens, displayName should be properly formatted
      assert.ok(theme.id.includes('-'), 'Theme ID should contain hyphens');
      assert.ok(theme.displayName.includes(' '), 'Theme displayName should contain spaces');
    });
  });

});
