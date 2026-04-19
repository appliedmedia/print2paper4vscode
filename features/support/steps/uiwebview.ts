import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// Track mock calls (reset per scenario by Before hook below to prevent
// cross-scenario state bleeding if a scenario fails or runs out of order).
const state = {
  menuItemSelectedCalled: false,
  menuItemSelectedArgs: null as any,
  persistedPosition: null as number | null,
};

Before(() => {
  state.menuItemSelectedCalled = false;
  state.menuItemSelectedArgs = null;
  state.persistedPosition = null;
});

// Helper: create a mock docInfo that passes initial pdfDoc check
function makeMockDocInfo(overrides: Record<string, unknown> = {}) {
  return {
    pdfDoc: overrides.pdfDoc !== undefined ? overrides.pdfDoc : {},
    asArrayBuffer: overrides.asArrayBuffer !== undefined
      ? overrides.asArrayBuffer
      : () => new ArrayBuffer(10),
    asDataUrl: () => 'data:application/pdf;base64,test',
    pageTotal: overrides.pageTotal !== undefined ? overrides.pageTotal : 1,
    pageSizePx: overrides.pageSizePx !== undefined
      ? overrides.pageSizePx
      : { widthPx: 612, heightPx: 792 },
    title: 'Test PDF',
  };
}

// -- Given steps ---------------------------------------------------------

Given('a PDF docInfo with null arrayBuffer', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const uiwebview = world.app.uiwebview;
  (uiwebview as any).fn.pdf.docInfo = () => makeMockDocInfo({
    asArrayBuffer: () => null,
  });
});

Given('a PDF docInfo with zero pageTotal', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const uiwebview = world.app.uiwebview;
  (uiwebview as any).fn.pdf.docInfo = () => makeMockDocInfo({
    pageTotal: 0,
  });
});

Given('a PDF docInfo with null pageSizePx', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const uiwebview = world.app.uiwebview;
  (uiwebview as any).fn.pdf.docInfo = () => makeMockDocInfo({
    pageSizePx: null,
  });
});

Given('handleMenuItemSelected on UIMenuMgr is mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  state.menuItemSelectedCalled = false;
  state.menuItemSelectedArgs = null;
  const uiwebview = world.app.uiwebview;
  (uiwebview as any).fn.uimenumgr.handleMenuItemSelected = async (
    menuId: string, menuItemId: string, contextDict: unknown
  ) => {
    state.menuItemSelectedCalled = true;
    state.menuItemSelectedArgs = { menuId, menuItemId, contextDict };
  };
});

// -- When steps ----------------------------------------------------------

When('I display the PDF panel', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.uiwebview.displayPdfPanel();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When(
  'I send a dragEnd message with left position {int}',
  async (t: TestCaseContext, left: number) => {
    const world = t.world as P2PWorld;
    state.persistedPosition = null;
    // Mock persist.set on the UIWebView fn level
    const uiwebview = world.app.uiwebview;
    (uiwebview as any).fn.persist.set = (id: string, value: number) => {
      state.persistedPosition = value;
    };
    // Call handleDragEnd directly (private, bypass via any)
    await (uiwebview as any).handleDragEnd({ type: 'dragEnd', left });
  }
);

When('I send a menuItemSelected message', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const uiwebview = world.app.uiwebview;
  await (uiwebview as any).handleMenuItemSelected({
    type: 'menuItemSelected',
    menuId: 'testMenu',
    menuItemId: 'testItem',
    contextDict: {},
  });
});

When(
  'I send a dx message with content {string}',
  async (t: TestCaseContext, message: string) => {
    const world = t.world as P2PWorld;
    const uiwebview = world.app.uiwebview;
    await (uiwebview as any).handleDxMessage({ type: 'dx', message });
  }
);

// -- Then steps ----------------------------------------------------------

Then(
  'the toolbar position should be persisted as {int}',
  (t: TestCaseContext, expected: number) => {
    assert.strictEqual(state.persistedPosition, expected, 'Position should be persisted');
  }
);

Then('the menu selection should be forwarded', (t: TestCaseContext) => {
  assert.ok(state.menuItemSelectedCalled, 'handleMenuItemSelected should have been called');
  assert.ok(state.menuItemSelectedArgs, 'menuItemSelectedArgs should be set');
  assert.strictEqual(state.menuItemSelectedArgs.menuId, 'testMenu');
  assert.strictEqual(state.menuItemSelectedArgs.menuItemId, 'testItem');
});
