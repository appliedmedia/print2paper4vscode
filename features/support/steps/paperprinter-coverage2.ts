import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// State for tracking (reset per scenario by Before hook below)
const ppState2 = {
  printResult: { id: '', value: '' as string | number | boolean },
  mdResult: { id: '', value: '' as string | number | boolean },
  regenerateCompleted: false,
};

Before(() => {
  ppState2.printResult = { id: '', value: '' };
  ppState2.mdResult = { id: '', value: '' };
  ppState2.regenerateCompleted = false;
});

// -- Given steps ---------------------------------------------------------

Given('generatePdf is mocked to produce a ready PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.pdf.printWithPreview = async () => {};
  (world.app.paperprinter as any).fn.pdf.printDirectly = async () => {};
  (world.app.paperprinter as any).fn.pdf.saveAsPDF = async () => {};
});

Given('generatePdf is mocked to produce no PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => false;
});

Given('generatePdf is mocked with throwing print', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.pdf.printWithPreview = async () => {
    throw new Error('Simulated print failure');
  };
  (world.app.paperprinter as any).fn.pdf.printDirectly = async () => {
    throw new Error('Simulated print failure');
  };
  (world.app.paperprinter as any).fn.pdf.saveAsPDF = async () => {
    throw new Error('Simulated save failure');
  };
});

Given('regenerateAndUpdateWebview dependencies are mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  ppState2.regenerateCompleted = false;
  (world.app.paperprinter as any).fn.pdf.resetCaches = () => {};
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.uiwebview.displayPdfPanel = async () => {};
});

Given('regenerateAndUpdateWebview mocked for failure', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.pdf.resetCaches = () => {};
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => false;
});

// -- When steps ----------------------------------------------------------

When(
  'I select print with menuItemId {string}',
  async (t: TestCaseContext, menuItemId: string) => {
    const world = t.world as P2PWorld;
    try {
      ppState2.printResult = await (world.app.paperprinter as any).handleSelection_Print({
        menuId: 'print',
        menuItemId,
      });
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'I select markdown mode {string}',
  async (t: TestCaseContext, menuItemId: string) => {
    const world = t.world as P2PWorld;
    try {
      ppState2.mdResult = await (world.app.paperprinter as any).handleSelection_Md({
        menuId: 'md',
        menuItemId,
      });
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When('I call regenerateAndUpdateWebview', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await (world.app.paperprinter as any).regenerateAndUpdateWebview();
    ppState2.regenerateCompleted = true;
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call regenerateAndUpdateWebview expecting error', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await (world.app.paperprinter as any).regenerateAndUpdateWebview();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('the print action should complete', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.ok(ppState2.printResult, 'Print result should exist');
});

Then('the md selection should have a value', (t: TestCaseContext) => {
  assert.ok(ppState2.mdResult, 'Md result should exist');
  assert.ok(ppState2.mdResult.id, 'Md result should have an id');
  // Step name says "should have a value" — enforce that literally so an
  // empty-string value does not silently pass and mask regressions.
  assert.notStrictEqual(
    ppState2.mdResult.value,
    undefined,
    'Md result should have a value (not undefined)'
  );
  assert.notStrictEqual(
    ppState2.mdResult.value,
    null,
    'Md result should have a value (not null)'
  );
  assert.notStrictEqual(
    ppState2.mdResult.value,
    '',
    'Md result should have a non-empty value'
  );
});

Then('the regenerate should complete', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.ok(ppState2.regenerateCompleted, 'regenerateAndUpdateWebview should have completed');
});

Then('a PDF generation error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('PDF') || String(world.error).includes('not generated'),
    `Error should mention PDF, got: ${world.error}`
  );
});

Given('print command dependencies are mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.tabinspector.getEditorSelectionOrAll = () => ({
    text: 'const x = 1;',
    languageId: 'javascript',
    name: 'test-file.js',
  });
  (world.app.paperprinter as any).fn.vscodeapis.getActiveTextEditor = () => ({
    selection: { isEmpty: true, start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
  });
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.uiwebview.displayPdfPanel = async () => {};
});

Given('print command returns no content', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.tabinspector.getEditorSelectionOrAll = () => null;
});

Given('print command dependencies are mocked with selection', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.tabinspector.getEditorSelectionOrAll = () => ({
    text: 'const x = 1;\nconst y = 2;\nconst z = 3;',
    languageId: 'javascript',
    name: 'test-file.js',
  });
  (world.app.paperprinter as any).fn.vscodeapis.getActiveTextEditor = () => ({
    selection: { isEmpty: false, start: { line: 0, character: 0 }, end: { line: 2, character: 14 } },
  });
  (world.app.paperprinter as any).generatePdf = async () => {};
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.uiwebview.displayPdfPanel = async () => {};
});

Given('print request dependencies are mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.pdf.readyToPrint = () => true;
  (world.app.paperprinter as any).fn.pdf.printWithPreview = async () => {};
  (world.app.paperprinter as any).fn.pdf.printDirectly = async () => {};
  (world.app.paperprinter as any).fn.pdf.saveAsPDF = async () => {};
  // Set up docInfo with printTitle
  (world.app.paperprinter as any).docInfo().printTitle = 'Test Print';
});

Given('editor font size is set to 15', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.paperprinter as any).fn.vscodeapis.getEditorTypography = () => ({
    fontSize: 15,
    fontFamily: 'Monaco',
    lineHeight: 1.5,
  });
});

When('I call handlePrintCommandFromVSCode', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await (world.app.paperprinter as any).handlePrintCommandFromVSCode();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When(
  'I call handlePrintRequest with type {string}',
  async (t: TestCaseContext, printType: string) => {
    const world = t.world as P2PWorld;
    try {
      await (world.app.paperprinter as any).handlePrintRequest(printType);
      world.error = null;
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When('I check the font size menu items', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = (world.app.paperprinter as any).menuItems_Text();
});

Then('the font size menu should include 15', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const items = world.result as any[];
  assert.ok(items, 'Menu items should exist');
  // menuItems_Text() stores id as String(editorSize), so compare as string only.
  const has15 = items.some((item: any) => item.id === '15');
  assert.ok(has15, `Should include size 15, got ids: ${items.map((i: any) => i.id).join(',')}`);
});
