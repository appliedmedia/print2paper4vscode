import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- State for handler tracking ------------------------------------------

const handlerState = { called: false };

// -- Given steps ---------------------------------------------------------

Given(
  'a message handler is registered for type {string}',
  (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    handlerState.called = false;
    world.app.ui.registerMessageHandler({
      messageType: msgType,
      handler: async () => {
        handlerState.called = true;
      },
    });
  }
);

Given('a save operation that fails once then succeeds', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  let callCount = 0;
  // Store saveOperation on world.result for the When step
  world.result = async (_path: string) => {
    callCount++;
    if (callCount === 1) {
      throw new Error('Permission denied');
    }
    // Second call succeeds
  };

  // Mock showSaveDialog to always return a URI
  const original = world.app.vscodeapis.showSaveDialog;
  world.app.vscodeapis.showSaveDialog = async () => ({
    fsPath: '/tmp/test.pdf',
    path: '/tmp/test.pdf',
    toString: () => '/tmp/test.pdf',
  }) as any;

  // Mock showErrorMessage to simulate user clicking retry
  (world.app.ui as any)._origShowError = world.app.ui.showErrorMessage;
  world.app.ui.showErrorMessage = async () => 'Choose Different Location';

  // Mock uriToPath
  world.app.vscodeapis.uriToPath = (uri: any) => uri.fsPath || uri.toString();
});

Given('a save operation that always fails', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = async (_path: string) => {
    throw new Error('Permission denied');
  };

  // Mock showSaveDialog to always return a URI
  world.app.vscodeapis.showSaveDialog = async () => ({
    fsPath: '/tmp/test.pdf',
    path: '/tmp/test.pdf',
    toString: () => '/tmp/test.pdf',
  }) as any;

  // Mock uriToPath
  world.app.vscodeapis.uriToPath = (uri: any) => uri.fsPath || uri.toString();
});

Given('the user will cancel on error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.app.ui.showErrorMessage = async () => 'Cancel';
});

// -- When steps ----------------------------------------------------------

When(
  'a webview message of type {string} is received',
  async (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    try {
      await world.app.ui.handleWebviewMessage({
        type: msgType,
        message: 'test',
      } as any);
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'I call UI showWarningMessage with {string}',
  async (t: TestCaseContext, message: string) => {
    const world = t.world as P2PWorld;
    try {
      await world.app.ui.showWarningMessage(message);
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When('I choose a save location with the save operation', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const saveOp = world.result as (path: string) => Promise<void>;
  try {
    world.result = await world.app.ui.chooseSaveLocation('test.pdf', saveOp);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I choose a save location expecting failure', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const saveOp = world.result as (path: string) => Promise<void>;
  try {
    world.result = await world.app.ui.chooseSaveLocation('test.pdf', saveOp);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I choose a save location without a save operation', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Mock showSaveDialog to return a URI
  world.app.vscodeapis.showSaveDialog = async () => ({
    fsPath: '/tmp/output.pdf',
    path: '/tmp/output.pdf',
    toString: () => '/tmp/output.pdf',
  }) as any;
  world.app.vscodeapis.uriToPath = (uri: any) => uri.fsPath || uri.toString();

  try {
    world.result = await world.app.ui.chooseSaveLocation('output.pdf');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('the handler should have been called', (t: TestCaseContext) => {
  assert.strictEqual(handlerState.called, true, 'Handler should have been called');
});

Then('the save should succeed', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, 'Should not have an error');
  assert.ok(world.result, 'Should return a path');
});

Then('a save error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
});

Then('a path should be returned', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, 'Should not have an error');
  assert.ok(typeof world.result === 'string', 'Should return a string path');
  assert.ok((world.result as string).length > 0, 'Path should not be empty');
});
