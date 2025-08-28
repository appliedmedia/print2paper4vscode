import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Stylize } from '../src/Stylize.js';

describe('Stylize CSS Variables Theming', () => {
  test('should generate CSS variables for VSCode themes', () => {
    const mockApp = {
      ui: {
        debugOut: () => {},
      },
      vscodeapis: {
        getActiveThemeId: () => 'vs-light',
        getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 }),
      },
      os: {
        readExtensionYaml: () => ({ stylize_html: '<style>{{CSS_VARIABLES}}</style>{{CODE}}' }),
      },
      templateDictReplace: (template: string, vars: any) => {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
      },
    } as any;

    const stylize = new Stylize(mockApp);
    
    // Mock theme data
    const mockTheme = {
      id: 'test-theme',
      displayName: 'Test Theme',
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
      },
      tokenColors: [
        {
          scope: ['comment'],
          settings: { foreground: '#888888' },
        },
        {
          scope: ['keyword'],
          settings: { foreground: '#ff0000' },
        },
      ],
    };

    // Test CSS variables generation
    const cssVariables = (stylize as any).generateCSSVariables(mockTheme);
    
    assert.ok(cssVariables.includes('--shiki-background: #ffffff'), 'Should include background CSS variable');
    assert.ok(cssVariables.includes('--shiki-foreground: #000000'), 'Should include foreground CSS variable');
    assert.ok(cssVariables.includes('--shiki-token-comment: #888888'), 'Should include comment token CSS variable');
    assert.ok(cssVariables.includes('--shiki-token-keyword: #ff0000'), 'Should include keyword token CSS variable');
    assert.ok(cssVariables.startsWith(':root {'), 'Should start with :root selector');
    assert.ok(cssVariables.endsWith('}'), 'Should end with closing brace');
  });

  test('should handle theme switching without regeneration', () => {
    const mockApp = {
      ui: {
        debugOut: () => {},
      },
      vscodeapis: {
        getActiveThemeId: () => 'vs-light',
        getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 }),
      },
      os: {
        readExtensionYaml: () => ({ stylize_html: '<style>{{CSS_VARIABLES}}</style>{{CODE}}' }),
      },
      templateDictReplace: (template: string, vars: any) => {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
      },
    } as any;

    const stylize = new Stylize(mockApp);
    
    // Mock themes cache
    (Stylize as any).themesCache = [
      {
        id: 'light-theme',
        displayName: 'Light Theme',
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
        },
        tokenColors: [
          {
            scope: ['comment'],
            settings: { foreground: '#888888' },
          },
        ],
      },
      {
        id: 'dark-theme',
        displayName: 'Dark Theme',
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
        },
        tokenColors: [
          {
            scope: ['comment'],
            settings: { foreground: '#6a9955' },
          },
        ],
      },
    ];

    // Test theme switching
    const lightCSS = stylize.switchTheme('light-theme');
    const darkCSS = stylize.switchTheme('dark-theme');
    
    assert.ok(lightCSS.includes('#ffffff'), 'Light theme should have white background');
    assert.ok(darkCSS.includes('#1e1e1e'), 'Dark theme should have dark background');
    assert.ok(lightCSS.includes('#888888'), 'Light theme should have gray comment color');
    assert.ok(darkCSS.includes('#6a9955'), 'Dark theme should have green comment color');
    
    // CSS should be different for different themes
    assert.notStrictEqual(lightCSS, darkCSS, 'Different themes should generate different CSS');
  });

  test('should handle invalid theme switching gracefully', () => {
    const mockApp = {
      ui: {
        debugOut: () => {},
      },
      vscodeapis: {
        getActiveThemeId: () => 'vs-light',
        getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 }),
      },
      os: {
        readExtensionYaml: () => ({ stylize_html: '<style>{{CSS_VARIABLES}}</style>{{CODE}}' }),
      },
      templateDictReplace: (template: string, vars: any) => {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
      },
    } as any;

    const stylize = new Stylize(mockApp);
    
    // Mock empty themes cache
    (Stylize as any).themesCache = [];

    // Test switching to non-existent theme
    assert.throws(
      () => stylize.switchTheme('non-existent-theme'),
      /Theme 'non-existent-theme' not found or invalid/,
      'Should throw error for non-existent theme'
    );
  });

  test('should generate empty CSS variables for invalid theme data', () => {
    const mockApp = {
      ui: {
        debugOut: () => {},
      },
      vscodeapis: {
        getActiveThemeId: () => 'vs-light',
        getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 }),
      },
      os: {
        readExtensionYaml: () => ({ stylize_html: '<style>{{CSS_VARIABLES}}</style>{{CODE}}' }),
      },
      templateDictReplace: (template: string, vars: any) => {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
      },
    } as any;

    const stylize = new Stylize(mockApp);
    
    // Test with invalid theme data
    const emptyCSS = (stylize as any).generateCSSVariables(null);
    const invalidCSS = (stylize as any).generateCSSVariables({});
    const noColorsCSS = (stylize as any).generateCSSVariables({ colors: {}, tokenColors: [] });
    
    assert.strictEqual(emptyCSS, '', 'Should return empty string for null theme');
    assert.strictEqual(invalidCSS, '', 'Should return empty string for invalid theme');
    assert.strictEqual(noColorsCSS, ':root {\n}', 'Should return minimal CSS for theme with no colors');
  });
});