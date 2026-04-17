import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('no active text editor is open', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const vscode = (world.app.vscodeapis as any).vscode;
  vscode.window.activeTextEditor = undefined;
});

Given('no active tab group exists', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const vscode = (world.app.vscodeapis as any).vscode;
  vscode.window.tabGroups = { activeTabGroup: undefined };
});

Given(
  'a document with URI {string}',
  (t: TestCaseContext, uri: string) => {
    const world = t.world as P2PWorld;
    world.result = {
      uri: { toString: () => uri },
      fileName: uri,
    };
  }
);

// -- When steps ----------------------------------------------------------

When('I get the active tab name', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.vscodeapis.getActiveTabName();
});

When('I get the descriptive name', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const doc = world.result as any;
  world.result = world.app.vscodeapis.getDescriptiveName(doc);
});

When(
  'I call showWarningMessage with {string}',
  (t: TestCaseContext, message: string) => {
    const world = t.world as P2PWorld;
    world.result = world.app.vscodeapis.showWarningMessage(message);
  }
);

// -- Then steps ----------------------------------------------------------

Then('the result should be the tab group label', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // The mock has tabGroups.activeTabGroup.activeTab.label set
  assert.ok(typeof world.result === 'string', 'Should return a string');
  assert.ok((world.result as string).length > 0, 'Should not be empty');
});

Then(
  'the result should equal {string}',
  (t: TestCaseContext, expected: string) => {
    const world = t.world as P2PWorld;
    assert.strictEqual(world.result, expected);
  }
);

Then('the result should be a resolved Promise', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.result instanceof Promise, 'Should be a Promise');
  const resolved = await world.result;
  // showWarningMessage mock returns undefined (no user interaction)
  assert.strictEqual(resolved, undefined);
});
