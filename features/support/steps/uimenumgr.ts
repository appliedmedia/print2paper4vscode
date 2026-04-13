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

// Track dispatch calls
const dispatchState = { called: false };

Given('menu dispatch is mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  dispatchState.called = false;
  // Mock the dispatch on all menus
  const menus = world.app.uimenumgr.getUIMenus();
  for (const menu of menus) {
    const orig = menu.dispatchSelection.bind(menu);
    menu.dispatchSelection = async (menuItemId: string, contextDict: any) => {
      dispatchState.called = true;
      // Don't call original to avoid side effects
    };
  }
});

When(
  'I set context dict with key {string} value {string}',
  (t: TestCaseContext, key: string, value: string) => {
    const world = t.world as P2PWorld;
    world.app.uimenumgr.setContextDict({ [key]: value } as any);
  }
);

When('I validate menu item ID {string}', (t: TestCaseContext, id: string) => {
  const world = t.world as P2PWorld;
  world.result = world.app.uimenumgr.isMenuItemId(id);
});

When('I get persist for menu {string}', (t: TestCaseContext, menuId: string) => {
  const world = t.world as P2PWorld;
  world.result = world.app.uimenumgr.getPersistForMenuId(menuId as any);
});

When(
  'I handle menu item selected {string} with item {string}',
  async (t: TestCaseContext, menuId: string, menuItemId: string) => {
    const world = t.world as P2PWorld;
    try {
      await world.app.uimenumgr.handleMenuItemSelected(
        menuId as any, menuItemId as any, {} as any
      );
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'I get persist value for persistId {string} on menu {string}',
  (t: TestCaseContext, persistId: string, menuId: string) => {
    const world = t.world as P2PWorld;
    world.result = world.app.uimenumgr.getValueOfPersistIdForMenuId({
      menuId: menuId as any,
      persistId: persistId as any,
    });
  }
);

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

Then(
  'the context dict should contain key {string}',
  (t: TestCaseContext, key: string) => {
    const world = t.world as P2PWorld;
    const dict = (world.app.uimenumgr as any).contextDict;
    assert.ok(key in dict, `Context dict should contain key "${key}"`);
  }
);

Then('the validation result should be true', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, true, 'Should return true');
});

Then('the menu dispatch should have been called', (t: TestCaseContext) => {
  assert.ok(dispatchState.called, 'Menu dispatch should have been called');
});
