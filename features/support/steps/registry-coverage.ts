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
  // Back up everything we mutate BEFORE creating the proxy, so we can fully
  // restore the Registry state in the finally block. Also clear 'os' from
  // _instances/_initialized before reg.use() so the proxy actually takes the
  // lazy path rather than binding to an already-resolved instance.
  const origComponents = (reg as any).components;
  const hadOsInstance = (reg as any)._instances.has('os');
  const origOsInstance = (reg as any)._instances.get('os');
  const hadOsInitialized = (reg as any)._initialized.has('os');
  try {
    (reg as any)._instances.delete('os');
    (reg as any)._initialized.delete('os');
    const fnResult = reg.use('os.fileRead');
    // Force getInstance() miss on invocation
    (reg as any).components = origComponents.filter((c: any) => c.id !== 'os');
    fnResult.os.fileRead({ path: 'test.txt' });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  } finally {
    (reg as any).components = origComponents;
    if (hadOsInstance) (reg as any)._instances.set('os', origOsInstance);
    if (hadOsInitialized) (reg as any)._initialized.add('os');
  }
});

When('I invoke a lazy proxy for a non-function property', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const reg = world.app.reg;
  // Register a fake component class with a non-function property; restore
  // components in finally so this step is fully self-contained.
  const fakeClass = class FakeNonFunc {
    static id = '_fakeNonFunc';
    notAFunction = 42;
  };
  const origComponents = (reg as any).components;
  (reg as any).components = [...origComponents, fakeClass];
  try {
    const fnResult = reg.use('_fakeNonFunc.notAFunction');
    fnResult._fakeNonFunc.notAFunction();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  } finally {
    (reg as any).components = origComponents;
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
