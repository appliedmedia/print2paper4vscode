import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import fs from 'node:fs';

// State for tracking
const osState = {
  originalHtml: '',
};

// -- Given steps ---------------------------------------------------------

Given('extensionRoot is cleared', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.os as any).extensionRoot = undefined;
});

Given('fs.writeFileSync is mocked to throw', (t: TestCaseContext) => {
  // We mock at the OS level by making resolveDir succeed but writeFileSync fail
  const origWriteFileSync = fs.writeFileSync;
  const _restore = () => {
    fs.writeFileSync = origWriteFileSync;
  };
  fs.writeFileSync = (() => {
    _restore();
    throw new Error('Simulated write failure');
  }) as any;
});

Given('getPanelForUriConversion returns null', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.os as any).fn.vscodeapis.getPanelForUriConversion = () => null;
});

// -- When steps ----------------------------------------------------------

When('I resolve a dir with null byte path', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.os as any).resolveDir('/tmp/\0bad');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I resolve a dir with empty path', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.os as any).resolveDir('   ');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I resolve a dir with relative path', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.os as any).resolveDir('./relative/path');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I write a file that fails', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.os.fileWrite({
      dir: '/tmp' as any,
      filename: 'test-fail.txt' as any,
      content: 'test',
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I read an extension-relative file', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.os.fileRead({ path: 'config.yaml' });
});

When('I convert HTML src paths to URI', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  osState.originalHtml = '<img src="images/logo.png">';
  world.result = world.app.os.htmlSrcPathToURI({
    html: osState.originalHtml,
    webviewPanelId: 'test-panel' as any,
  });
});

When(
  'I sanitize filename {string}',
  (t: TestCaseContext, name: string) => {
    const world = t.world as P2PWorld;
    world.result = world.app.os.sanitizeFileName(name);
  }
);

When('I read Shiki light themes', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.os.readShikiLightThemes();
});

// -- Then steps ----------------------------------------------------------

Then('a bad path error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('Bad dir path'),
    `Error should mention bad path, got: ${world.error}`
  );
});

Then('a write error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown a write error');
});

Then('the result should equal the original HTML', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, osState.originalHtml, 'HTML should be unchanged');
});

