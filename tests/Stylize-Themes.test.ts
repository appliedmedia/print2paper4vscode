import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('Stylize Simple Unit Tests', () => {
  let app: App;

  beforeEach(async () => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    // Note: Stylize no longer has init() - highlighter initialized lazily when needed
  });

  afterEach(() => {
    app.done();
  });

  it('should initialize and load Shiki themes', async () => {
    const themes = app.stylize.getShikiThemes();
    
    assert.ok(themes.length > 0, 'Should have Shiki themes');
    assert.ok(themes.some(t => t.id.includes('light')), 'Should have light themes');
  });

  it('should filter themes by regex pattern', async () => {
    const lightThemes = app.stylize.getShikiThemes('light|bright|day');
    assert.ok(lightThemes.length > 0, 'Should have light themes');
    
    lightThemes.forEach(theme => {
      const name = theme.displayName.toLowerCase();
      assert.ok(
        name.includes('light') || name.includes('bright') || name.includes('day'),
        `Theme ${theme.displayName} should match filter`
      );
    });
  });

  it('should get all themes including Shiki themes', async () => {
    const allThemes = app.stylize.getThemes();
    assert.ok(allThemes.length > 0, 'Should have themes');
    
    // Themes should have required structure
    const theme = allThemes[0];
    assert.ok(theme.id, 'Theme should have ID');
    assert.ok(theme.displayName, 'Theme should have displayName');
  });

  it('should tokenize code with a theme', async () => {
    const code = 'const x = 42;';
    const tokens = await app.stylize.tokenize({ code, languageId: 'javascript', theme: 'github-light' });
    
    assert.ok(Array.isArray(tokens), 'Should return array');
    assert.ok(tokens.length > 0, 'Should have tokens');
    assert.ok(Array.isArray(tokens[0]), 'Each line should be array of tokens');
  });

  it('should resolve active theme', async () => {
    const theme = app.stylize.resolveActiveTheme();
    assert.ok(typeof theme === 'string', 'Should return theme ID');
    assert.ok(theme.length > 0, 'Theme ID should not be empty');
  });

  it('should get font family from theme', async () => {
    const themes = app.stylize.getThemes();
    if (themes.length > 0) {
      const fontFamily = app.stylize.getFontFamilyFromTheme(themes[0]);
      assert.ok(typeof fontFamily === 'string', 'Should return font family string');
    }
  });

  it('should convert VSCode theme to Shiki format', async () => {
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

    const converted = app.stylize.convertVSCodeThemeToShiki(vscodeTheme);
    
    assert.ok(converted, 'Should convert theme');
    assert.strictEqual(converted.name, 'test-theme', 'Should preserve name');
    assert.ok(converted.colors, 'Should have colors');
    assert.ok(Array.isArray(converted.tokenColors), 'Should have token colors');
  });

  it('should handle empty filter to return all themes', async () => {
    const allThemes = app.stylize.getShikiThemes();
    const filteredThemes = app.stylize.getShikiThemes('');
    
    assert.strictEqual(allThemes.length, filteredThemes.length, 'Empty filter should return all');
  });
});
