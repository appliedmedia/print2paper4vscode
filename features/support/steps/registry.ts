import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- When steps ----------------------------------------------------------

When('I call use with an unknown component ID', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.reg.use('nonexistent.someMethod');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call a non-existent method via lazy proxy', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    // 'os' is a real component, but 'totallyFakeMethod' does not exist on it
    const fn = world.app.reg.use('os.totallyFakeMethod');
    // Calling the lazy proxy triggers the error
    (fn as Record<string, Record<string, Function>>).os.totallyFakeMethod();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Given steps ---------------------------------------------------------

Given('a component whose done method throws', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Register a fake component instance with a throwing done()
  world.app.reg.registerInstance('throwingComponent', {
    done() {
      throw new Error('Intentional done() failure');
    },
  });
  // Add to initialized set so it gets cleaned up
  (world.app.reg as unknown as { _initialized: Set<string> })._initialized.add(
    'throwingComponent'
  );
});

// -- When steps (continued) ----------------------------------------------

When('I call done on the registry', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.reg.done();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then(
  'an error should be thrown containing {string}',
  (t: TestCaseContext, expected: string) => {
    const world = t.world as P2PWorld;
    assert.ok(world.error, 'Expected an error to be thrown');
    assert.ok(
      world.error.message.includes(expected),
      `Error message "${world.error.message}" should contain "${expected}"`
    );
  }
);
