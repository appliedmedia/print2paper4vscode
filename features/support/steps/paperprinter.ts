import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// Track regenerate calls and zoom values
const state = {
  regenerateCalled: false,
  zoomResult: { id: '', value: '' as string | number | boolean },
  initialZoom: 1.0,
};

// -- Given steps ---------------------------------------------------------

Given('regenerateAndUpdateWebview is mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.regenerateCalled = false;
  (world.app.paperprinter as any).regenerateAndUpdateWebview = async () => {
    state.regenerateCalled = true;
  };
});

Given('the current zoom is at maximum', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Set current zoom to max (2.5) via zoomLevel_setTextEdit AND persist
  (world.app.paperprinter as any).zoomLevel_setTextEdit(2.5);
  // Also mock getValueOfMenuItemIdSelected to return 2.5 so ZoomInOut reads it
  const origGet = world.app.uimenumgr.getValueOfMenuItemIdSelected.bind(world.app.uimenumgr);
  world.app.uimenumgr.getValueOfMenuItemIdSelected = (menuId: string) => {
    if (menuId === 'zoomLevel') return 2.5;
    return origGet(menuId);
  };
  state.initialZoom = 2.5;
});

// -- When steps ----------------------------------------------------------

When('I select a non-default zoom level', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_ZoomLevel({
    menuId: 'zoomLevel',
    menuItemId: '1.25',
  });
});

When('I select a non-default markdown mode', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    state.zoomResult = await (world.app.paperprinter as any).handleSelection_Md({
      menuId: 'md',
      menuItemId: 'md_render',
    });
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I click the zoom in button', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Record initial zoom
  if (state.initialZoom === 1.0) {
    // Default case - set to 1.0
    (world.app.paperprinter as any).zoomLevel_setTextEdit(1.0);
  }
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_ZoomInOut({
    menuId: 'zoomIn',
    menuItemId: 'zoomIn',
  });
  // Also expose on world.result so coverage scenarios can make concrete assertions
  world.result = state.zoomResult;
});

When('I click the zoom out button', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).zoomLevel_setTextEdit(1.0);
  state.initialZoom = 1.0;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_ZoomInOut({
    menuId: 'zoomOut',
    menuItemId: 'zoomOut',
  });
});

When('I select a non-default theme', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_Theme({
    menuId: 'theme',
    menuItemId: 'github-dark',
  });
});

When('I select a non-default font size', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_Text({
    menuId: 'fontSizeId',
    menuItemId: '16',
  });
});

When('I select a non-default page size', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_PageSizeId({
    menuId: 'pageSizeId',
    menuItemId: 'a4',
  });
});

When('I select a non-default orientation', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_Orient({
    menuId: 'orient',
    menuItemId: 'landscape',
  });
});

When('I select a non-default margin', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.zoomResult = await (world.app.paperprinter as any).handleSelection_MarginId({
    menuId: 'marginId',
    menuItemId: 'narrow',
  });
});

When('menus are created again', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const before = world.app.uimenumgr.getUIMenus().length;
  (world.app.paperprinter as any).createMenus();
  const after = world.app.uimenumgr.getUIMenus().length;
  world.result = { before, after };
});

// -- Then steps ----------------------------------------------------------

Then('the zoom value should be persisted', (t: TestCaseContext) => {
  assert.ok(state.regenerateCalled, 'regenerateAndUpdateWebview should have been called');
  assert.ok(state.zoomResult.id, 'Should return an id');
});

Then('the zoom should increase', (t: TestCaseContext) => {
  assert.ok(state.regenerateCalled, 'regenerateAndUpdateWebview should have been called');
  const newZoom = state.zoomResult.value as number;
  assert.ok(newZoom > 1.0, `Zoom ${newZoom} should be greater than 1.0`);
});

Then('the zoom should decrease', (t: TestCaseContext) => {
  assert.ok(state.regenerateCalled, 'regenerateAndUpdateWebview should have been called');
  const newZoom = state.zoomResult.value as number;
  assert.ok(newZoom < 1.0, `Zoom ${newZoom} should be less than 1.0`);
});

Then('the zoom should remain at maximum', (t: TestCaseContext) => {
  const newZoom = state.zoomResult.value as number;
  assert.strictEqual(newZoom, 2.5, 'Zoom should be clamped at maximum 2.5');
});

Then('the selection result should have an id', (t: TestCaseContext) => {
  assert.ok(state.zoomResult.id, 'Selection result should have an id');
  assert.ok(state.zoomResult.value, 'Selection result should have a value');
});

Then('the menu count should not change', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const counts = world.result as { before: number; after: number };
  assert.strictEqual(counts.before, counts.after, 'Menu count should not change on second createMenus');
});
