import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('VS Code extension themes are mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const stylize = world.app.stylize;

  // Clear themes cache so getThemes rebuilds it
  (stylize.constructor as any).themesCache = null;

  const mockExtensions = [
    { id: 'mock-dark-theme', extensionPath: '/mock/ext' },
    { id: 'mock-light-theme', extensionPath: '/mock/ext' },
  ];

  const mockGetThemeJson = ({ themeId }: { themeId: string }) => ({
    id: themeId,
    label: themeId,
    colors: { 'editor.background': themeId.includes('dark') ? '#1e1e1e' : '#ffffff' },
    tokenColors: [
      {
        scope: 'comment',
        settings: { foreground: '#6a9955' },
      },
    ],
  });

  const mockGetActiveId = () => 'mock-dark-theme';

  // VSCodeAPIs is eagerly instantiated by App (line 93), so reg.use() binds
  // methods eagerly via value.bind(instance). Instance-level mocks are ignored.
  // Mock directly on Stylize's fn object to bypass the eagerly-bound references.
  const fn = (stylize as any).fn;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => mockExtensions;
  fn.vscodeapis.getVSCodeThemeJson = mockGetThemeJson;
  fn.vscodeapis.getActiveThemeId = mockGetActiveId;

  // Mock fileRead to avoid NLS file loading errors (returns empty)
  const origFileRead = fn.os.fileRead;
  fn.os.fileRead = (args: any) => {
    if (typeof args === 'object' && args.path?.includes('nls')) {
      return {};
    }
    return origFileRead(args);
  };
});

Given('the active theme ID matches a loaded theme', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Must mock on Stylize's fn object (eagerly-bound proxy bypass)
  (world.app.stylize as any).fn.vscodeapis.getActiveThemeId = () => 'mock-light-theme';
});

Given(
  'the active theme ID is {string}',
  (t: TestCaseContext, themeId: string) => {
    const world = t.world as P2PWorld;
    // Must mock on Stylize's fn object (eagerly-bound proxy bypass)
    (world.app.stylize as any).fn.vscodeapis.getActiveThemeId = () => themeId;
    // Clear themes cache to force rebuild
    (world.app.stylize.constructor as any).themesCache = null;
  }
);

// -- When steps ----------------------------------------------------------

When(
  'I get themes filtered by {string}',
  (t: TestCaseContext, filter: string) => {
    const world = t.world as P2PWorld;
    world.result = world.app.stylize.getThemes(filter);
  }
);

When('I get VS Code themes', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Clear static cache right before call to avoid parallel test contamination
  (world.app.stylize.constructor as any).themesCache = null;
  world.result = (world.app.stylize as any).getVSCodeThemes();
});

When('I resolve the active theme', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.stylize.resolveActiveTheme();
});

When(
  'I get Shiki themes filtered by {string}',
  (t: TestCaseContext, filter: string) => {
    const world = t.world as P2PWorld;
    world.result = (world.app.stylize as any).getShikiThemes(filter);
  }
);

// -- Then steps ----------------------------------------------------------

Then(
  'only themes matching {string} should be returned',
  (t: TestCaseContext, pattern: string) => {
    const world = t.world as P2PWorld;
    const themes = world.result as Array<{ id: string; displayName: string }>;
    assert.ok(Array.isArray(themes), 'Should return array');
    const regex = new RegExp(pattern, 'i');
    for (const theme of themes) {
      assert.ok(
        regex.test(theme.displayName),
        `Theme "${theme.displayName}" should match pattern "${pattern}"`
      );
    }
  }
);

Then('converted themes should be returned', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const themes = world.result as Array<{ id: string; themeData: unknown }>;
  assert.ok(Array.isArray(themes), 'Should return array');
  assert.ok(themes.length > 0, 'Should have at least one theme');
  // Converted themes have themeData set
  for (const theme of themes) {
    assert.ok(theme.themeData, `Theme "${theme.id}" should have themeData`);
  }
});

Then('the active theme should be first', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const themes = world.result as Array<{ id: string }>;
  assert.ok(themes.length > 0, 'Should have themes');
  assert.strictEqual(themes[0].id, 'mock-light-theme', 'Active theme should be first');
});

Then('a valid fallback theme should be returned', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const result = world.result as string;
  assert.ok(typeof result === 'string', 'Should return a string');
  assert.ok(result.length > 0, 'Should not be empty');
});

Then(
  'only Shiki themes matching {string} should be returned',
  (t: TestCaseContext, pattern: string) => {
    const world = t.world as P2PWorld;
    const themes = world.result as Array<{ id: string }>;
    assert.ok(Array.isArray(themes), 'Should return array');
    assert.ok(themes.length > 0, 'Should have matches');
    const regex = new RegExp(pattern, 'i');
    for (const theme of themes) {
      assert.ok(
        regex.test(theme.id),
        `Shiki theme "${theme.id}" should match "${pattern}"`
      );
    }
  }
);
