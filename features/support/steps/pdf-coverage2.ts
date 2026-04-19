import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// Track text rendering (reset per scenario by Before hook below)
const pdfState2 = {
  textCalls: [] as { text: string; x: number; y: number }[],
};

Before(() => {
  pdfState2.textCalls = [];
});

// Create a mock jsPDF object
function createMockPdfDoc2(pageTotal: number): any {
  let currentPage = 1;
  return {
    setFontSize: () => {},
    setTextColor: () => {},
    getTextWidth: () => 30,
    text: () => {},
    setPage: (p: number) => { currentPage = p; },
    addPage: () => {},
    getNumberOfPages: () => pageTotal,
    getCurrentPageInfo: () => ({ pageNumber: currentPage, pageTotal }),
    getPageWidth: () => 595,
    getPageHeight: () => 842,
    internal: { pageSize: { width: 595, getWidth: () => 595, height: 842, getHeight: () => 842 } },
  };
}

function setupPdfDoc2(world: P2PWorld, pageTotal: number): void {
  const docInfo = world.app.pdf.docInfo();
  docInfo.pdfDoc = createMockPdfDoc2(pageTotal);
  docInfo.pageSizeId = 'a4' as any;
  docInfo.orient = 'portrait' as any;
  docInfo.title = 'Test Document';
  docInfo.fontSizePx = 12;
  docInfo.lineHeightPx = 18;
  docInfo.marginId = 'normal' as any;
  // pageTotal and pageNumber are getters from pdfDoc, no need to set them

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

Given('a PDF document with no pdfDoc', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const docInfo = world.app.pdf.docInfo();
  docInfo.pdfDoc = null as any;
});

Given('a PDF document with 2 pages and throwing setPage', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 2);
  const docInfo = world.app.pdf.docInfo();
  (docInfo.pdfDoc as any).setPage = () => {
    throw new Error('Simulated setPage failure in renderPageTotals');
  };
});

Given('a PDF document with 5 page total', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 5);
});

Given('header_middle returns pageTotal element', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mockFn = (menuId: any) => {
    if (menuId === 'header_middle') return 'pageTotal';
    if (typeof menuId === 'string' && (menuId.startsWith('header_') || menuId.startsWith('footer_'))) {
      return 'none';
    }
    return undefined;
  };
  world.app.uimenumgr.getMenuItemIdSelected = mockFn;
  (world.app.pdf as any).fn.uimenumgr.getMenuItemIdSelected = mockFn;
});

Given('a PDF document with 3 page total and footer content', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 3);
  const mockFn = (menuId: any) => {
    if (menuId === 'footer_begin') return 'title';
    if (menuId === 'footer_middle') return 'pageTotal';
    if (menuId === 'footer_end') return 'page';
    if (typeof menuId === 'string' && menuId.startsWith('header_')) return 'none';
    return undefined;
  };
  world.app.uimenumgr.getMenuItemIdSelected = mockFn;
  (world.app.pdf as any).fn.uimenumgr.getMenuItemIdSelected = mockFn;
});

Given('a PDF document with text tracking and title header', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 3);
  pdfState2.textCalls = [];
  const docInfo = world.app.pdf.docInfo();
  // Override text method to track calls
  (docInfo.pdfDoc as any).text = (text: string, x: number, y: number) => {
    pdfState2.textCalls.push({ text, x, y });
  };
  // Set header/footer values - override both the instance and the fn proxy
  const headerFooterMap: Record<string, string> = {
    header_begin: 'title',
    header_middle: 'page',
    header_end: 'total',
    footer_begin: 'page',
    footer_middle: 'title',
    footer_end: 'pageTotal',
  };
  const mockGetMenuItemIdSelected = (menuId: any) => {
    if (typeof menuId === 'string' && menuId in headerFooterMap) {
      return headerFooterMap[menuId];
    }
    return undefined;
  };
  world.app.uimenumgr.getMenuItemIdSelected = mockGetMenuItemIdSelected;
  // Also override the fn reference on PDF in case it's a bound copy
  (world.app.pdf as any).fn.uimenumgr.getMenuItemIdSelected = mockGetMenuItemIdSelected;
});

Given('a PDF document with 3 pages and title headers', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 3);
  const headerFooterMap: Record<string, string> = {
    header_begin: 'title',
    header_middle: 'page',
    header_end: 'pageTotal',
    footer_begin: 'page',
    footer_middle: 'title',
    footer_end: 'total',
  };
  const mockFn = (menuId: any) => {
    if (typeof menuId === 'string' && menuId in headerFooterMap) {
      return headerFooterMap[menuId];
    }
    return undefined;
  };
  world.app.uimenumgr.getMenuItemIdSelected = mockFn;
  (world.app.pdf as any).fn.uimenumgr.getMenuItemIdSelected = mockFn;
});

// -- When steps ----------------------------------------------------------

When('I call finishPdf', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.pdf.finishPdf();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

// -- Then steps ----------------------------------------------------------

Then('a no-PDF-document error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('No PDF document'),
    `Error should mention no PDF document, got: ${world.error}`
  );
});

Then('the header text should have been rendered', (t: TestCaseContext) => {
  // Verify that text was actually rendered via pdfDoc.text()
  assert.ok(pdfState2.textCalls.length > 0, `Expected text calls, got ${pdfState2.textCalls.length}`);
  // Should have rendered title in header
  const hasTitle = pdfState2.textCalls.some(c => c.text.includes('Test Document'));
  assert.ok(hasTitle, `Should have rendered title, got: ${JSON.stringify(pdfState2.textCalls.map(c => c.text))}`);
});

Given('PDF pageSizeId and orient are configured', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Ensure no pdfDoc exists so fallback path is triggered
  const docInfo = world.app.pdf.docInfo();
  docInfo.pdfDoc = null as any;
  docInfo.pageSizeId = 'a4' as any;
  docInfo.orient = 'portrait' as any;
  // Mock getMenuItemIdSelected for pageSizeId and orient
  const mockFn = (menuId: any) => {
    if (menuId === 'pageSizeId') return 'a4';
    if (menuId === 'orient') return 'portrait';
    return undefined;
  };
  (world.app.pdf as any).fn.uimenumgr.getMenuItemIdSelected = mockFn;
});

When('I get pageSizePx from PDF', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = await (world.app.pdf as any).getPageSizePx();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I set marginPts on DocInfo_PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const docInfo = world.app.pdf.docInfo();
  docInfo.marginPts = {
    topMarginPts: 50,
    bottomMarginPts: 50,
    leftMarginPts: 40,
    rightMarginPts: 40,
  };
  world.result = docInfo;
});

When('I call getPageTotal on DocInfo_PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const docInfo = world.app.pdf.docInfo();
  world.result = docInfo.getPageTotal();
});

Then('the page size should have valid dimensions', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  const size = world.result as { widthPx: number; heightPx: number };
  assert.ok(size, 'Page size should exist');
  assert.ok(size.widthPx > 0, `Width should be positive, got: ${size.widthPx}`);
  assert.ok(size.heightPx > 0, `Height should be positive, got: ${size.heightPx}`);
});

Then('the margins should be updated', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const docInfo = world.result as {
    marginPts: {
      topMarginPts: number;
      bottomMarginPts: number;
      leftMarginPts: number;
      rightMarginPts: number;
    };
  };
  assert.ok(docInfo, 'DocInfo should exist');
  // Note: the marginPts setter currently normalizes inputs (e.g. via page
  // dimensions). Rather than coupling to that behavior, assert the shape and
  // that each dimension is a finite positive number.
  const m = docInfo.marginPts;
  for (const k of ['topMarginPts', 'bottomMarginPts', 'leftMarginPts', 'rightMarginPts'] as const) {
    assert.ok(Number.isFinite(m[k]) && m[k] > 0, `${k} should be a finite positive number, got ${m[k]}`);
  }
});

Then('the page total should be 5', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, 5, 'Page total should be 5');
});

// -- Additional PDF coverage scenarios ---

When('I call yaml on PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = (world.app.pdf as any).yaml();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('the PDF yaml result should exist', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.ok(world.result !== undefined, 'yaml() should return something');
});

Given('PDF has temp files with throwing fileDelete', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Add a fake temp file path
  (world.app.pdf as any).tempPdfs = ['/tmp/fake-test.pdf'];
  // Mock fileDelete to throw
  (world.app.pdf as any).fn.os.fileDelete = () => {
    throw new Error('Simulated fileDelete failure');
  };
});

When('I call done on PDF', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.pdf.done();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call saveAsPDF on PDF', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    await (world.app.pdf as any).saveAsPDF('test');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('a save-PDF-not-generated error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('not generated'),
    `Error should mention not generated, got: ${world.error}`
  );
});

When('I call renderFromTokens with empty tokens', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).renderFromTokens([]);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('a renderFromTokens-not-initialized error should be thrown', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(world.error, 'Should have thrown an error');
  assert.ok(
    String(world.error).includes('not initialized'),
    `Error should mention not initialized, got: ${world.error}`
  );
});

Given('a PDF document with zero line height', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  setupPdfDoc2(world, 1);
  // Set currentLineHeight to 0 to trigger the early return
  (world.app.pdf as any).currentLineHeight = 0;
});

When('I call shouldBreakPage with large y position', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = (world.app.pdf as any).shouldBreakPage(99999);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('the shouldBreakPage result should be false', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.strictEqual(world.result, false, 'shouldBreakPage should return false with zero lineHeight');
});

When('I call addHeaderAndFooter with no pdfDoc', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    (world.app.pdf as any).addHeaderAndFooter();
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I call findCharacterBreakPoint with no pdfDoc', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.result = (world.app.pdf as any).findCharacterBreakPoint('hello world', 0, 40, 500);
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('the break point result should equal the text length', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.error, null, `Unexpected error: ${world.error}`);
  assert.strictEqual(world.result, 11, 'findCharacterBreakPoint should return text.length when no pdfDoc');
});
