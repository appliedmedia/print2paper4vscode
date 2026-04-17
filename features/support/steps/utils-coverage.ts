import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// Get Utils instance from the app
function getUtils(world: P2PWorld): any {
  return world.app.reg.getInstance('utils');
}

// -- When steps ----------------------------------------------------------

When('I call forceNumbers with missing required keys', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const utils = getUtils(world);
  world.result = utils.forceNumbers(
    { existingKey: 42 },
    1,
    ['existingKey', 'missingKey1', 'missingKey2']
  );
});

When('I call forceNumbers with empty dict', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const utils = getUtils(world);
  world.result = utils.forceNumbers({}, 1);
});

When('I call forceContent with null', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const utils = getUtils(world);
  world.result = utils.forceContent(null, 'default');
});

When('I call forceContents with required keys', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const utils = getUtils(world);
  world.result = utils.forceContents(
    { key1: 'value1' },
    'empty',
    ['key1', 'key2', 'key3']
  );
});

// -- Then steps ----------------------------------------------------------

Then('the result should contain the required keys', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const result = world.result as Record<string, number>;
  assert.ok(result, 'Result should exist');
  assert.ok('existingKey' in result, 'Should have existingKey');
  assert.ok('missingKey1' in result, 'Should have missingKey1');
  assert.ok('missingKey2' in result, 'Should have missingKey2');
});

Then('the result should have a fallback key', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const result = world.result as Record<string, number>;
  assert.ok(result, 'Result should exist');
  assert.ok('0' in result, 'Should have fallback key "0"');
});

Then('the force content result should be the default value', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, 'default', 'Should return useForEmpty value');
});

Then('the result should contain all required keys', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const result = world.result as Record<string, string>;
  assert.ok(result, 'Result should exist');
  assert.ok('key1' in result, 'Should have key1');
  assert.ok('key2' in result, 'Should have key2');
  assert.ok('key3' in result, 'Should have key3');
  assert.strictEqual(result.key1, 'value1', 'key1 should keep its value');
  assert.strictEqual(result.key2, 'empty', 'key2 should use default');
  assert.strictEqual(result.key3, 'empty', 'key3 should use default');
});
