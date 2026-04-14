import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('getVSCodeExtensionsThemes is mocked to throw', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  (world.app.stylize.constructor as any).themesCache = null;
  fn.vscodeapis.getVSCodeExtensionsThemes = () => {
    throw new Error('Simulated extension failure');
  };
});

Given('fileRead is mocked to return null for Stylize.yaml', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const fn = (world.app.stylize as any).fn;
  const origFileRead = fn.os.fileRead;
  fn.os.fileRead = (args: any) => {
    if (typeof args === 'object' && args.path?.includes('Stylize.yaml')) {
      return null;
    }
    return origFileRead(args);
  };
});

// -- When steps ----------------------------------------------------------

When('I tokenize with an invalid language ID', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.stylize.tokenize({
      code: 'test',
      languageId: 'nonexistent-language-xyz-999' as any,
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I generate HTML from mock tokens expecting error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mockTokens = [
    [
      { content: 'const', color: '#0000ff', fontStyle: 1 },
      { content: ' x', color: '#000000', fontStyle: 0 },
    ],
  ];
  try {
    (world.app.stylize as any).generateHtmlFromTokens(mockTokens, 14, 1.5);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When(
  'I create an HTML page with title {string}',
  (t: TestCaseContext, title: string) => {
    const world = t.world as P2PWorld;
    world.result = (world.app.stylize as any).createHtmlPage(
      '<pre>code</pre>',
      14,
      1.5,
      title
    );
  }
);

// -- Then steps ----------------------------------------------------------

Then('a tokenize error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
});

Then('a template error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown a template error');
  assert.ok(
    String(world.error).includes('template') || String(world.error).includes('Template'),
    'Error should mention template'
  );
});
