import { Given, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

/**
 * Shared step definitions for Print2Paper Gherkin scenarios.
 *
 * Every step function receives (t: TestCaseContext, ...args).
 * The world object is at t.world and typed as P2PWorld.
 */

// -- Given steps ----------------------------------------------------------

Given('a new Print2Paper application', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.app, 'App should have been created by WorldCreator');
});

Given('the application is initialized', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.app, 'App should have been created by WorldCreator');
  assert.ok(world.app.reg, 'Registry should exist after initialization');
});

// -- Then steps -----------------------------------------------------------

Then('no errors should occur', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
});

Then('the application should have the {string} component', (t: TestCaseContext, componentId: string) => {
  const world = t.world as P2PWorld;
  const instance = world.app.reg.getInstance(componentId);
  assert.ok(instance, `Component '${componentId}' should be registered`);
});
