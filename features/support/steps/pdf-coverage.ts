import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// Track header content (reset per scenario by Before hook to avoid stale
// state bleeding into scenarios that do not run the setup step).
const pdfState = {
  headerRendered: false,
  textCalls: [] as string[],
  fontSizeCalls: [] as number[],
};

Before(() => {
  pdfState.headerRendered = false;
  pdfState.textCalls = [];
  pdfState.fontSizeCalls = [];
});

// Create a mock jsPDF object with the methods addHeaderAndFooter needs
function createMockPdfDoc(pageTotal: number): any {
  let currentPage = 1;
  return {
    setFontSize: (size: number) => { pdfState.fontSizeCalls.push(size); },
    setTextColor: () => {},
    getTextWidth: () => 30,
    text: (text: string) => { pdfState.textCalls.push(text); },
    setPage: (p: number) => { currentPage = p; },
    addPage: () => {},
    getNumberOfPages: () => pageTotal,
    getCurrentPageInfo: () => ({ pageNumber: currentPage, pageTotal }),
    getPageWidth: () => 595,
    getPageHeight: () => 842,
    internal: { pageSize: { width: 595, getWidth: () => 595, height: 842, getHeight: () => 842 } },
  };
}

// Helper: set up a basic PDF document with mock pdfDoc
function setupPdfDoc(world: P2PWorld, pageTotal: number): void {
  const docInfo = world.app.pdf.docInfo();
  docInfo.pdfDoc = createMockPdfDoc(pageTotal);
  docInfo.pageSizeId = 'a4' as any;
  docInfo.orient = 'portrait' as any;
  docInfo.title = 'Test Document';
  docInfo.fontSizePx = 12;
  docInfo.lineHeightPx = 18;
  docInfo.marginId = 'normal' as any;

  // Install header/footer menu stubs
  const origGet = world.app.uimenumgr.getMenuItemIdSelected.bind(world.app.uimenumgr);
  world.app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
    if (typeof menuId === 'string' && (menuId.startsWith('header_') || menuId.startsWith('footer_'))) {
      return 'none';
    }
    try {
      return origGet(menuId);
    } catch {
      return undefined;
    }
  };
}

// -- Given steps ---------------------------------------------------------

Given('a PDF document with 0 page total', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc(world, 0);
});

Given('a PDF document is set up for headers', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc(world, 3);
});

Given('header_middle returns an invalid element', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const origGet = world.app.uimenumgr.getMenuItemIdSelected.bind(world.app.uimenumgr);
  world.app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
    if (menuId === 'header_middle') return 'invalidElement';
    if (typeof menuId === 'string' && (menuId.startsWith('header_') || menuId.startsWith('footer_'))) {
      return 'none';
    }
    try {
      return origGet(menuId);
    } catch {
      return undefined;
    }
  };
});

Given('a PDF document with throwing setPage', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc(world, 2);
  const docInfo = world.app.pdf.docInfo();
  // Mock setPage to throw
  (docInfo.pdfDoc as any).setPage = () => {
    throw new Error('Simulated setPage failure');
  };
});

Given('header positions return mixed values', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const origGet = world.app.uimenumgr.getMenuItemIdSelected.bind(world.app.uimenumgr);
  world.app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
    if (menuId === 'header_begin') return 'title';
    if (menuId === 'header_middle') return 'total'; // pageTotal=3, will produce content
    if (menuId === 'header_end') return 'page';
    if (typeof menuId === 'string' && menuId.startsWith('footer_')) return 'none';
    try {
      return origGet(menuId);
    } catch {
      return undefined;
    }
  };
});

// -- When steps ----------------------------------------------------------

When('I call addHeaderAndFooter with total element', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Set header_middle to 'total' with pageTotal=0
  world.app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
    if (menuId === 'header_middle') return 'total';
    return 'none';
  };
  try {
    (world.app.pdf as any).addHeaderAndFooter();
    pdfState.headerRendered = true;
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call addHeaderAndFooter', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).addHeaderAndFooter();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I render page totals', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).renderPageTotals();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('the header should have no content', (t: TestCaseContext) => {
  // If we got here without error, formatContent returned null for total with pageTotal=0.
  // We also need to prove that no header/footer text was rendered; assert that
  // pdfDoc.text() was never invoked with a user-visible string. setFontSize may
  // still be called during setup, so we assert only on text calls.
  assert.ok(pdfState.headerRendered, 'addHeaderAndFooter should have run');
  assert.deepStrictEqual(
    pdfState.textCalls,
    [],
    `No header/footer text should be rendered, got: ${JSON.stringify(pdfState.textCalls)}`
  );
});
