import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('menus are created', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).createMenus();
});

Given('a new Print2Paper application without menus', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // App is created but no menus are registered - UIMenuMgr has empty menu list
  assert.ok(world.app, 'App should exist');
});

// -- When steps ----------------------------------------------------------

When('a menu isHidden resolver throws an error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mgr = world.app.uimenumgr;
  // Call the private method with a throwing isHidden function
  world.result = (mgr as any).getValueOfMenuFxnByCalcIsHidden(
    () => {
      throw new Error('Intentional isHidden failure');
    },
    'test-menu'
  );
});

When('a value resolver returns an object', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mgr = world.app.uimenumgr;
  // Resolver returns an object (unsupported type)
  world.result = (mgr as any).getValueOfMenuFxnByCalcValue(
    () => ({ unsupported: true }),
    'test-menu',
    'test-item'
  );
});

When('a value resolver throws an error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mgr = world.app.uimenumgr;
  world.result = (mgr as any).getValueOfMenuFxnByCalcValue(
    () => {
      throw new Error('Intentional resolver failure');
    },
    'test-menu',
    'test-item'
  );
});

When('I get the menu JavaScript', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.uimenumgr.getUIMenus_JS();
});

When('I get the menu CSS', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.uimenumgr.getUIMenus_CSS();
});

// -- Then steps ----------------------------------------------------------

Then('the menu should default to visible', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // isHidden = false means visible
  assert.strictEqual(world.result, false, 'Should default to visible (isHidden=false)');
});

Then('the resolved value should be undefined', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, undefined, 'Should return undefined on error');
});

Then('the result should be empty string', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, '', 'Should return empty string');
});
