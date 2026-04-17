import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// State for tracking (reset per scenario by Before hook below)
const stylState2 = {
  themes: [] as any[],
  fallbackTheme: null as any,
};

Before(() => {
  stylState2.themes = [];
  stylState2.fallbackTheme = null;
});

// -- Given steps ---------------------------------------------------------

Given('VSCode extensions return themes without colors', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  // Clear themes cache
  (world.app.stylize.constructor as any).themesCache = null;
  // Return themes with no colors/tokenColors
  fn.vscodeapis.getVSCodeExtensionsThemes = () => [
    { id: 'test-theme-no-colors', extensionPath: '/tmp/ext' },
  ];
  fn.vscodeapis.getActiveThemeId = () => 'some-other-theme';
  // Single stub: returns null for the active theme id (forces fallback path),
  // returns the no-colors theme for any other themeId query.
  fn.vscodeapis.getVSCodeThemeJson = (args: any) => {
    if (args?.themeId === 'some-other-theme') return null;
    return [{ id: 'test-theme-no-colors', label: 'Test Theme' }];
  };
});

Given('VSCode extensions return themes that fail conversion', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  (world.app.stylize.constructor as any).themesCache = null;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => [
    { id: 'fail-theme', extensionPath: '/tmp/ext' },
  ];
  fn.vscodeapis.getVSCodeThemeJson = (args: any) => {
    if (args?.themeId === 'some-other-theme') return null;
    return [{
      id: 'fail-theme',
      label: 'Fail Theme',
      colors: { 'editor.background': '#ffffff' },
      tokenColors: [{ scope: 'comment', settings: { foreground: '#008000' } }],
    }];
  };
  // Make convertVSCodeThemeToShiki throw to exercise the fallback path
  (world.app.stylize as any).convertVSCodeThemeToShiki = () => {
    throw new Error('Simulated conversion failure');
  };
  fn.vscodeapis.getActiveThemeId = () => 'some-other-theme';
});

Given('VSCode extensions return empty themes with active theme available', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  (world.app.stylize.constructor as any).themesCache = null;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => [];
  fn.vscodeapis.getActiveThemeId = () => 'active-theme-id';
  fn.vscodeapis.getVSCodeThemeJson = (args: any) => {
    if (args?.themeId === 'active-theme-id') {
      return {
        colors: { 'editor.background': '#ffffff' },
        tokenColors: [{ scope: 'comment', settings: { foreground: '#008000' } }],
      };
    }
    return null;
  };
});

Given('VSCode extensions return empty themes with no active theme data', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  (world.app.stylize.constructor as any).themesCache = null;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => [];
  fn.vscodeapis.getActiveThemeId = () => 'missing-theme';
  fn.vscodeapis.getVSCodeThemeJson = () => null;
});

// -- When steps ----------------------------------------------------------

When('I get VS Code themes for coverage', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    stylState2.themes = (world.app.stylize as any).getVSCodeThemes();
    world.result = stylState2.themes;
  } catch (e) {
    world.error = e as Error;
    world.result = [];
  }
});

When('I convert a theme that causes error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Pass a theme whose colors getter throws mid-iteration. This forces the
  // try/catch in convertVSCodeThemeToShiki to take the fallback branch
  // (the previous implementation passed safe nulls and never exercised it).
  const badTheme = {
    name: 'error-theme',
    get colors() {
      throw new Error('Simulated colors access failure');
    },
    tokenColors: [],
  };
  try {
    stylState2.fallbackTheme = (world.app.stylize as any).convertVSCodeThemeToShiki(badTheme);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('the active theme result should have entries', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const themes = world.result as any[];
  assert.ok(Array.isArray(themes), 'Should return an array');
  assert.ok(themes.length > 0, 'Should have at least one theme entry');
});

Then('the fallback theme should be returned', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.ok(stylState2.fallbackTheme, 'Should return a fallback theme');
  assert.ok(stylState2.fallbackTheme.name, 'Fallback theme should have a name');
});
