import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import { UIMenu } from '../../../out/src/UIMenu.js';

// State for tracking (reset per scenario by Before hook to avoid leak)
const ppState = {
  selectionResult: { id: '', value: '' as string | number | boolean },
};

Before(() => {
  ppState.selectionResult = { id: '', value: '' };
});

// -- Given steps ---------------------------------------------------------

Given(
  'header_begin is persisted as {string}',
  (t: TestCaseContext, value: string) => {
    const world = t.world as P2PWorld;
    const origGet = world.app.uimenumgr.getMenuItemIdSelected.bind(world.app.uimenumgr);
    world.app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
      if (menuId === 'header_begin') return value;
      try {
        return origGet(menuId);
      } catch {
        return undefined;
      }
    };
  }
);

Given('current zoom value is invalid', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const origGet = world.app.uimenumgr.getValueOfMenuItemIdSelected.bind(world.app.uimenumgr);
  world.app.uimenumgr.getValueOfMenuItemIdSelected = (menuId: string) => {
    if (menuId === 'zoomLevel') return 'not-a-number' as any;
    return origGet(menuId);
  };
});

// -- When steps ----------------------------------------------------------

When(
  'I select header_begin with item {string}',
  async (t: TestCaseContext, menuItemId: string) => {
    const world = t.world as P2PWorld;
    ppState.selectionResult = await (world.app.paperprinter as any).handleSelection_HeaderFooter({
      menuId: 'header_begin',
      menuItemId,
    });
  }
);

When('I select header_middle with the default item', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  ppState.selectionResult = await (world.app.paperprinter as any).handleSelection_HeaderFooter({
    menuId: 'header_middle',
    menuItemId: UIMenu.defaultId(),
  });
});

When('I select footer_middle with the default item', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  ppState.selectionResult = await (world.app.paperprinter as any).handleSelection_HeaderFooter({
    menuId: 'footer_middle',
    menuItemId: UIMenu.defaultId(),
  });
});

When('I call handleSelection_ZoomInOut with unknown menuId', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  ppState.selectionResult = await (world.app.paperprinter as any).handleSelection_ZoomInOut({
    menuId: 'unknownZoom',
    menuItemId: 'click',
  });
});

// -- Then steps ----------------------------------------------------------

Then('the selection should toggle to none', (t: TestCaseContext) => {
  assert.strictEqual(ppState.selectionResult.id, 'none', 'Should toggle to none');
  assert.strictEqual(ppState.selectionResult.value, 'none', 'Value should be none');
});

Then(
  'the selection should be {string}',
  (t: TestCaseContext, expected: string) => {
    assert.strictEqual(ppState.selectionResult.id, expected, `Selection id should be "${expected}"`);
  }
);

Then('the selection should have empty values', (t: TestCaseContext) => {
  assert.strictEqual(ppState.selectionResult.id, '', 'id should be empty');
  assert.strictEqual(ppState.selectionResult.value, '', 'value should be empty');
});

Then('the zoom should use fallback value', (t: TestCaseContext) => {
  // The "current zoom value is invalid" Given forces getValueOfMenuItemIdSelected
  // to return 'not-a-number', forcing handleSelection_ZoomInOut to fall back to
  // altValue (1.0) and increment by stepAmount. The zoom-in step stores the
  // returned {id, value} on world.result so we can assert the concrete math
  // (numeric, > 1.0 fallback base) instead of a vacuous world.error check.
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, 'Should not have errors');
  const selection = world.result as { id: unknown; value: unknown } | undefined;
  assert.ok(selection, 'zoom-in step should have stored the selection result');
  const numericZoom =
    typeof selection.value === 'number' ? selection.value : Number(selection.value);
  assert.ok(
    Number.isFinite(numericZoom) && numericZoom > 1.0,
    `Zoom should be numeric and > 1.0 fallback; got ${String(selection.value)}`
  );
});
