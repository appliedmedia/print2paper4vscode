import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// State for tracking multiple handlers
const uiState = {
  handler1Called: false,
  handler2Called: false,
  trackedHandler: null as any,
  trackedCalled: false,
  textEditResult: null as any,
};

// -- Given steps ---------------------------------------------------------

Given(
  'a second handler is registered for type {string}',
  (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    uiState.handler1Called = false;
    uiState.handler2Called = false;

    // Re-register first handler with tracking
    // Clear existing and add both
    (world.app.ui as any).messageHandlers = new Map();
    world.app.ui.registerMessageHandler({
      messageType: msgType,
      handler: async () => {
        uiState.handler1Called = true;
      },
    });
    world.app.ui.registerMessageHandler({
      messageType: msgType,
      handler: async () => {
        uiState.handler2Called = true;
      },
    });
  }
);

Given(
  'a tracked handler is registered for type {string}',
  (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    uiState.trackedCalled = false;
    uiState.trackedHandler = async () => {
      uiState.trackedCalled = true;
    };
    world.app.ui.registerMessageHandler({
      messageType: msgType,
      handler: uiState.trackedHandler,
    });
  }
);

Given(
  'a throwing handler is registered for type {string}',
  (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    world.app.ui.registerMessageHandler({
      messageType: msgType,
      handler: async () => {
        throw new Error('Intentional handler failure');
      },
    });
  }
);

// -- When steps ----------------------------------------------------------

When(
  'the handler is unregistered for type {string}',
  (t: TestCaseContext, msgType: string) => {
    const world = t.world as P2PWorld;
    world.app.ui.unregisterMessageHandler({
      messageType: msgType,
      handler: uiState.trackedHandler,
    });
  }
);

When('a non-existent handler is unregistered', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.ui.unregisterMessageHandler({
      messageType: 'nonexistent-type',
      handler: async () => {},
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I render text_edit without constrain', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const menus = world.app.uimenumgr.getUIMenus();
  if (menus.length > 0) {
    uiState.textEditResult = (menus[0] as any).handleIconSlotTypes_main_text_edit(
      'test-item',
      undefined, // no constrain
      '100px',
      'test'
    );
  }
});

When('I call getHTML with a pre-visited menu', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const menus = world.app.uimenumgr.getUIMenus();
  if (menus.length > 0) {
    const menu = menus[0];
    const visited = new Set<string>([menu.id]);
    world.result = await menu.getHTML(visited);
  }
});

When('I call done on a menu', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const menus = world.app.uimenumgr.getUIMenus();
  if (menus.length > 0) {
    try {
      menus[0].done();
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
});

// -- Then steps ----------------------------------------------------------

Then('both handlers should have been called', (t: TestCaseContext) => {
  assert.ok(uiState.handler1Called, 'First handler should have been called');
  assert.ok(uiState.handler2Called, 'Second handler should have been called');
});

Then('the unregistered handler should not be called', (t: TestCaseContext) => {
  assert.strictEqual(uiState.trackedCalled, false, 'Unregistered handler should not be called');
});

Then('a handler error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('handler failure'),
    'Error should be from handler'
  );
});

Then('the text_edit result should be empty', (t: TestCaseContext) => {
  assert.ok(uiState.textEditResult, 'Should have a result');
  assert.strictEqual(uiState.textEditResult.html, '', 'HTML should be empty');
  assert.strictEqual(uiState.textEditResult.cssClass, '', 'cssClass should be empty');
});
