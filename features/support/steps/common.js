import { Given, Then } from '@cucumber/node';
import { createTestApp, createMockContext, createMockVSCode } from '../world.js';

Given('a new Print2Paper application', (t) => {
  /** @type {import('../world.js').P2PWorld} */
  const world = t.world;
  try {
    world.app = createTestApp({ context: createMockContext(), vscode: createMockVSCode() });
    world.error = undefined;
  } catch (e) {
    world.error = e instanceof Error ? e : new Error(String(e));
  }
});

Then('no errors should occur', (t) => {
  /** @type {import('../world.js').P2PWorld} */
  const world = t.world;
  t.assert.strictEqual(world.error, undefined, `Unexpected error: ${world.error?.message}`);
  t.assert.ok(world.app, 'Application should have been created');
});

Then('the application should have registered components', (t) => {
  /** @type {import('../world.js').P2PWorld} */
  const world = t.world;
  t.assert.ok(world.app, 'Application must exist');
  const app = world.app;
  // Verify key components are registered and accessible
  t.assert.ok(app.reg, 'Registry should exist');
  t.assert.ok(app.vscodeapis, 'VSCodeAPIs component should be registered');
  t.assert.ok(app.ui, 'UI component should be registered');
  t.assert.ok(app.pdf, 'PDF component should be registered');
  t.assert.ok(app.coords, 'Coords component should be registered');
});
