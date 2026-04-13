import { Given, When } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('PDF docInfo has valid code', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const docInfo = world.app.pdf.docInfo();
  docInfo.code = 'const x = 1;';
  docInfo.languageId = 'javascript' as any;
  docInfo.title = 'test.js';
});

Given('tokenize is mocked to throw', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Mock at the fn level on PDF (eagerly-bound proxy bypass if needed)
  (world.app.pdf as any).fn.stylize.tokenize = async () => {
    throw new Error('Mock tokenize failure');
  };
});

// -- When steps ----------------------------------------------------------

When('I render with empty result', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await (world.app.pdf as any).render({});
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I finish PDF without document', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.pdf.finishPdf();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I check shouldBreakPage without PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = String((world.app.pdf as any).shouldBreakPage(100));
});

When('I add page break without PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).addPageBreak();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I render page totals without PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).renderPageTotals();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I print with preview without generating', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.pdf.printWithPreview('test');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I print directly without generating', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.pdf.printDirectly('test');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I generate PDF', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await world.app.pdf.generatePdf();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});
