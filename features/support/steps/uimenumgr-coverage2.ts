import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- When steps ----------------------------------------------------------

When('I get value with invalid args', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.uimenumgr as any).getValueOfMenuItemIdForMenuId({});
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I handle text_edit selection for zoomLevel', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.uimenumgr.handleMenuItemSelected(
      'zoomLevel' as any,
      'zoomLevel' as any,
      { display: '150' } as any
    );
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I handle menu item with invalid transformed value', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.uimenumgr.handleMenuItemSelected(
      'zoomLevel' as any,
      'zoomLevel' as any,
      { display: '!@#$%' } as any
    );
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Given steps ---------------------------------------------------------

Given('zoomLevel persist has a saved value', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Set a persisted zoom value so the iconSlotTriad path can read it
  (world.app.paperprinter as any).zoomLevel_setTextEdit(1.5);
});

When('I get value for zoomLevel with menuItemId equal to menuId', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = world.app.uimenumgr.getValueOfMenuItemIdForMenuId({
      menuId: 'zoomLevel' as any,
      menuItemId: 'zoomLevel',
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I get value for zoomLevel fitWidth item', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = world.app.uimenumgr.getValueOfMenuItemIdForMenuId({
      menuId: 'zoomLevel' as any,
      menuItemId: 'fitWidth',
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('an invalid-args error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('invalid arguments') || String(world.error).includes('Invalid'),
    `Error should mention invalid arguments, got: ${world.error}`
  );
});

Then('the zoom value result should be numeric', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.ok(world.result !== undefined, 'Result should not be undefined');
  // Verify the result is numeric (either a number or a string that parses to
  // a finite number). Previously the step only checked "defined", which let
  // non-numeric values pass and masked broken zoom math.
  const numericValue =
    typeof world.result === 'number'
      ? world.result
      : typeof world.result === 'string'
        ? Number(world.result)
        : NaN;
  assert.ok(
    Number.isFinite(numericValue),
    `Expected numeric zoom value, got: ${String(world.result)}`
  );
});
