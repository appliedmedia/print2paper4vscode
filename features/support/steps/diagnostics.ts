import { Given, When, Then, After } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import { Diagnostics } from '../../../out/src/Diagnostics.js';

interface DxWorld extends P2PWorld {
  dx: Diagnostics;
  subDx: Diagnostics;
  furtherSubDx: Diagnostics;
  validationResult: boolean;
  capturedOutput: string;
  originalLog?: typeof console.log;
  chainResult: Diagnostics;
}

function startCapture(world: DxWorld): void {
  world.capturedOutput = '';
  if (!world.originalLog) {
    world.originalLog = console.log;
  }
  console.log = (...args: unknown[]) => {
    world.capturedOutput += args.map(a => String(a)).join(' ') + '\n';
  };
}

function stopCapture(world: DxWorld): void {
  if (world.originalLog) {
    console.log = world.originalLog;
    world.originalLog = undefined;
  }
}

// Guarantees console.log and Diagnostics global state are restored even if a
// scenario throws between startCapture() and stopCapture(). Without this hook
// a thrown assertion would leave console.log patched and leak capture into
// subsequent scenarios.
After((t: TestCaseContext) => {
  const world = t.world as DxWorld;
  if (world && world.originalLog) {
    stopCapture(world);
  }
  Diagnostics.reset();
  Diagnostics.debugOn(false);
});

// -- Given steps ----------------------------------------------------------

Given('a Diagnostics sub-context for {string} and {string}', (t: TestCaseContext, className: string, methodName: string) => {
  const world = t.world as DxWorld;
  world.dx = new Diagnostics({ name: className });
  world.subDx = world.dx.sub({ name: methodName });
});

// -- When steps -----------------------------------------------------------

When('I create a Diagnostics instance named {string}', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  world.dx = new Diagnostics({ name });
});

When('I create a sub-context named {string}', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  world.subDx = world.dx.sub({ name });
});

When('I chain three out calls', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.chainResult = world.dx.out('message1').out('message2').out('message3');
});

When('I validate present args requiring {string}', (t: TestCaseContext, key: string) => {
  const world = t.world as DxWorld;
  const args = { content: 'test', uri: 'file://test' };
  world.validationResult = world.subDx.require(args, [key]);
});

When('I validate args missing {string} requiring {string} and {string}', (t: TestCaseContext, _missingKey: string, key1: string, key2: string) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: 'test' }, [key1, key2]);
});

When('I validate args with undefined {string} requiring {string} and {string}', (t: TestCaseContext, _undefinedKey: string, key1: string, key2: string) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: 'test', uri: undefined }, [key1, key2]);
});

When('I validate args requiring no keys', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: 'test' }, []);
});

When('I validate args with a null value requiring that key', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: null, uri: 'test' }, ['content', 'uri']);
});

When('I validate args with an empty string value requiring that key', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: '', uri: 'test' }, ['content', 'uri']);
});

When('I validate args with a zero value requiring that key', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ count: 0, uri: 'test' }, ['count', 'uri']);
});

When('I validate args with a false value requiring that key', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ enabled: false, uri: 'test' }, ['enabled', 'uri']);
});

When('I create a debug-enabled Diagnostics for {string} and {string}', (t: TestCaseContext, className: string, methodName: string) => {
  const world = t.world as DxWorld;
  Diagnostics.reset();
  // Start capture before creating instances so all output is captured
  startCapture(world);
  world.dx = new Diagnostics({ name: className });
  world.subDx = world.dx.sub({ name: methodName });
  world.subDx.debugOn(true);
});

When('I validate requiring a missing key while capturing output', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.validationResult = world.subDx.require({ content: 'test' }, ['content', 'missingKey']);
  stopCapture(world);
});

When('I create a Diagnostics instance named {string} with debug on', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  world.dx = new Diagnostics({ name, debugOn: true });
});

When('I create a sub-context named {string} with debug off', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  world.subDx = world.dx.sub({ name, debugOn: false });
});

When('I create a further sub-context named {string}', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  world.furtherSubDx = world.subDx.sub({ name });
});

When('I set global debug to on', (_t: TestCaseContext) => {
  Diagnostics.debugOn(true);
});

When('I set global debug to off', (_t: TestCaseContext) => {
  Diagnostics.debugOn(false);
});

When('I create a Diagnostics named {string} and capture output', (t: TestCaseContext, name: string) => {
  const world = t.world as DxWorld;
  Diagnostics.reset();
  startCapture(world);
  world.dx = new Diagnostics({ name });
});

When('I call print with message {string}', (t: TestCaseContext, message: string) => {
  const world = t.world as DxWorld;
  world.chainResult = world.dx.print(message);
});

When('I create a debug sub-context for {string} and {string} and capture output', (t: TestCaseContext, className: string, methodName: string) => {
  const world = t.world as DxWorld;
  Diagnostics.reset();
  startCapture(world);
  world.dx = new Diagnostics({ name: className, debugOn: true });
  world.subDx = world.dx.sub({ name: methodName });
});

When('I call done with message {string}', (t: TestCaseContext, message: string) => {
  const world = t.world as DxWorld;
  world.chainResult = world.subDx.done(message);
});

When('I call done without a message', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  world.chainResult = world.subDx.done();
});

When('I call error with message {string}', (t: TestCaseContext, message: string) => {
  const world = t.world as DxWorld;
  world.chainResult = world.dx.error(message);
});

When('I create a no-app debug sub-context for {string} and {string} and capture output', (t: TestCaseContext, className: string, methodName: string) => {
  const world = t.world as DxWorld;
  Diagnostics.reset();
  startCapture(world);
  world.dx = new Diagnostics({ name: className, debugOn: true, parent: null, app: null });
  world.subDx = world.dx.sub({ name: methodName });
});

When('I output the same message {int} times then a different one', (t: TestCaseContext, count: number) => {
  const world = t.world as DxWorld;
  const repeatedMessage = 'Duplicate message test';
  for (let i = 0; i < count; i++) {
    world.subDx.out(repeatedMessage);
  }
  world.subDx.out('Different message');
  stopCapture(world);
});

// -- Then steps -----------------------------------------------------------

Then('the instance should be a Diagnostics object', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.ok(world.dx instanceof Diagnostics);
});

Then('the sub-context should be a Diagnostics object', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.ok(world.subDx instanceof Diagnostics);
});

Then('each call should return the same Diagnostics instance', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.chainResult, world.dx);
});

Then('the validation should pass', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.validationResult, true);
});

Then('the validation should fail', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.validationResult, false);
});

Then('the captured output should include {string}', (t: TestCaseContext, expected: string) => {
  const world = t.world as DxWorld;
  assert.ok(
    world.capturedOutput.includes(expected),
    `Expected output to contain "${expected}" but got: ${world.capturedOutput}`
  );
});

Then('the sub-context debug should be on', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.subDx.debugOn(), true);
});

Then('the sub-context debug should be off', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.subDx.debugOn(), false);
});

Then('the further sub-context debug should be on', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.furtherSubDx.debugOn(), true);
});

Then('the parent debug should still be on', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.dx.debugOn(), true);
});

Then('global debug should be on', (_t: TestCaseContext) => {
  assert.strictEqual(Diagnostics.debugOn(), true);
});

Then('global debug should be off', (_t: TestCaseContext) => {
  assert.strictEqual(Diagnostics.debugOn(), false);
});

Then('the instance debug should be on', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.strictEqual(world.dx.debugOn(), true);
});

Then('the print call should support chaining', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  stopCapture(world);
  assert.strictEqual(world.chainResult, world.dx);
});

Then('the done call should support chaining', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  stopCapture(world);
  assert.strictEqual(world.chainResult, world.subDx);
});

Then('the error call should support chaining', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  stopCapture(world);
  assert.strictEqual(world.chainResult, world.dx);
});

Then('the captured output should include duplicate indicator', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.ok(
    world.capturedOutput.includes('↑ x'),
    `Expected duplicate indicator in output: ${world.capturedOutput}`
  );
});

Then('the captured output should include warning bookends', (t: TestCaseContext) => {
  const world = t.world as DxWorld;
  assert.ok(
    world.capturedOutput.includes('\u26a0\ufe0f'),
    `Expected warning bookends in output: ${world.capturedOutput}`
  );
});
