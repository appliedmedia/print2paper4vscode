import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import { isThemeId } from '../../../out/src/Stylize.js';

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

Given('VS Code extension themes are mocked with NLS labels', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const stylize = world.app.stylize;
  (stylize.constructor as any).themesCache = null;

  const fn = (stylize as any).fn;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => [
    { id: 'nls-theme', extensionPath: '/mock/ext' },
  ];
  fn.vscodeapis.getVSCodeThemeJson = () => ({
    id: 'nls-theme',
    label: '%themeLabel%',
    colors: { 'editor.background': '#ffffff' },
    tokenColors: [{ scope: 'comment', settings: { foreground: '#008000' } }],
  });
  fn.vscodeapis.getActiveThemeId = () => 'nls-theme';
  fn.os.fileRead = (args: any) => {
    if (typeof args === 'object' && args.path?.includes('nls')) {
      return { themeLabel: 'My NLS Theme' };
    }
    return null;
  };
  fn.os.pathJoin = (...parts: string[]) => parts.join('/');
});

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

When('I validate theme ID {string}', (t: TestCaseContext, id: string) => {
  const world = t.world as P2PWorld;
  world.result = String(isThemeId(id));
});

When(
  'I escape HTML {string}',
  (t: TestCaseContext, text: string) => {
    const world = t.world as P2PWorld;
    world.result = (world.app.stylize as any).escapeHtml(text);
  }
);

When('I generate HTML from mock tokens', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mockTokens = [
    [
      { content: 'const', color: '#0000ff', fontStyle: 1 },
      { content: ' x', color: '#000000', fontStyle: 0 },
    ],
    [
      { content: '// comment', color: '#008000', fontStyle: 2 },
    ],
  ];
  world.result = (world.app.stylize as any).generateHtmlFromTokens(mockTokens, 14, 1.5);
});

When('I convert a theme with background token colors', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.stylize.convertVSCodeThemeToShiki({
    name: 'bg-theme',
    colors: { 'editor.background': '#1e1e1e' },
    tokenColors: [
      {
        scope: 'comment',
        settings: { foreground: '#6a9955', background: '#1e1e1e' },
      },
    ],
  });
});

When('I convert a null theme', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Create a theme with a throwing getter to trigger the catch path
  const badTheme = { name: 'bad-theme' } as any;
  Object.defineProperty(badTheme, 'colors', {
    get: () => { throw new Error('simulated conversion error'); },
  });
  world.result = world.app.stylize.convertVSCodeThemeToShiki(badTheme);
});

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

Then(
  'the result should contain {string}',
  (t: TestCaseContext, expected: string) => {
    const world = t.world as P2PWorld;
    const result = String(world.result);
    assert.ok(result.includes(expected), `Result should contain "${expected}", got "${result}"`);
  }
);

Then('the theme data should have token colors', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const themeData = world.result as { tokenColors: unknown[] };
  assert.ok(themeData.tokenColors, 'Should have tokenColors');
  assert.ok(themeData.tokenColors.length > 0, 'Should have at least one token color');
  const first = themeData.tokenColors[0] as { settings: { background?: string } };
  assert.ok(first.settings.background, 'First token color should have background');
});

Then('the theme data should have a name', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const themeData = world.result as { name: string };
  assert.ok(typeof themeData.name === 'string', 'Should have a name');
  assert.ok(themeData.name.length > 0, 'Name should not be empty');
});
