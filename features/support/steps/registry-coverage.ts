import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('a component done method throws', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Register a fake component instance whose done() throws
  const reg = world.app.reg;
  const fakeComponent = {
    done() {
      throw new Error('Simulated done failure');
    },
  };
  reg.registerInstance('_fakeTestComponent', fakeComponent);
});

// -- When steps ----------------------------------------------------------

When('I invoke a lazy proxy for a missing instance', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const reg = world.app.reg;
  // Create a proxy via use() for a real component, then sabotage the instance map
  const fnResult = reg.use('os.fileRead');
  // Remove the instance to simulate a missing instance
  (reg as any)._instances.delete('os');
  (reg as any)._initialized.delete('os');
  // Also remove from components to ensure getInstance returns undefined
  const origComponents = (reg as any).components;
  (reg as any).components = origComponents.filter((c: any) => c.id !== 'os');
  try {
    fnResult.os.fileRead({ path: 'test.txt' });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  } finally {
    // Restore components
    (reg as any).components = origComponents;
  }
});

When('I invoke a lazy proxy for a non-function property', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const reg = world.app.reg;
  // Register a fake component class with a non-function property
  const fakeClass = class FakeNonFunc {
    static id = '_fakeNonFunc';
    notAFunction = 42;
  };
  (reg as any).components.push(fakeClass);
  const fnResult = reg.use('_fakeNonFunc.notAFunction');
  try {
    fnResult._fakeNonFunc.notAFunction();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call registry done', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // done() is called but we need it to handle the error from the fake component
  try {
    world.app.reg.done();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I use a non-function on a registered instance', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const reg = world.app.reg;
  // Register a fake instance with a non-function property
  reg.registerInstance('_fakeRegistered', { someValue: 42 });
  try {
    reg.use('_fakeRegistered.someValue');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('a missing instance error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('Failed to get instance') ||
    String(world.error).includes('not found'),
    `Error should mention missing instance, got: ${world.error}`
  );
});

Then('a not-a-function error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('not a function'),
    `Error should mention not a function, got: ${world.error}`
  );
});
