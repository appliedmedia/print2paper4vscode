import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp, mockContext, mockVSCode } from './test-utils.js';
import { kMd, kMd_languageId, UIMenuItemDict_t } from '../src/types/PaperPrinter_t.js';
import { MenuId_t, UIMenuItem_t } from '../src/types/UIMenu_t.js';

describe('Menu Hidden', () => {
  let app: TestApp;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
  });

  afterEach(() => {
    app.done();
  });

  it('flips kMd visibility on languageId change without recreating the menu', async () => {
    // Regression: isHidden used to be eagerly resolved in createMenu, so a kMd
    // menu built before languageId was set was permanently frozen as hidden.
    // The fix defers resolution to getHTML — a single menu instance must
    // observe later changes to docInfo().languageId.
    const menuMgr = app.uimenumgr;
    const menu = menuMgr.createMenu({
      id: kMd.id,
      displayName: kMd.displayName,
      iconSlotTriad: kMd.iconSlotTriad,
      isFlyout: kMd.isFlyout,
      isHidden: kMd.isHidden,
      menuItems: () =>
        kMd.menuItems.map(item => ({
          ...item,
          iconSlotTriad: { begin: '', main: '', end: '' },
        })) as UIMenuItem_t[],
      flyoutMenuItemIds: [],
      selectionHandler: async (_menuId, menuItemId) => ({ id: menuItemId, value: 0 }),
    });
    menuMgr.addMenu(menu);

    // Non-markdown — must render hidden
    app.pdf.docInfo().languageId = 'typescript';
    assert.strictEqual(menuMgr.getIsHiddenOfMenuId(kMd.id), true);
    const htmlHidden = await menu.getHTML();
    assert.ok(htmlHidden.includes('isHidden'), 'kMd hidden when languageId=typescript');

    // Flip to markdown on the SAME menu instance — must render visible
    app.pdf.docInfo().languageId = kMd_languageId;
    assert.strictEqual(menuMgr.getIsHiddenOfMenuId(kMd.id), false);
    const htmlVisible = await menu.getHTML();
    assert.ok(!htmlVisible.includes('isHidden'), 'kMd visible when languageId=markdown');
  });

  it('runs the isHidden resolver fresh on every getHTML, not at construction', async () => {
    const menuMgr = app.uimenumgr;
    let calls = 0;
    const resolver = (_dict: UIMenuItemDict_t): boolean => {
      calls += 1;
      // Odd → hide, even → show. Proves each render evaluates fresh.
      return calls % 2 === 1;
    };

    const menu = menuMgr.createMenu({
      id: 'test-fresh' as MenuId_t,
      displayName: 'Fresh',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isHidden: resolver,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    menuMgr.addMenu(menu);

    assert.strictEqual(calls, 0, 'resolver must not run during createMenu');

    const html1 = await menu.getHTML();
    assert.strictEqual(calls, 1, 'first getHTML evaluates resolver exactly once');
    assert.ok(html1.includes('isHidden'), 'odd call → hidden');

    const html2 = await menu.getHTML();
    assert.strictEqual(calls, 2, 'second getHTML evaluates resolver again');
    assert.ok(!html2.includes('isHidden'), 'even call → visible');
  });

  it('handles boolean isHidden via getIsHiddenOfMenuId', async () => {
    const menuMgr = app.uimenumgr;

    const visibleMenu = menuMgr.createMenu({
      id: 'test-visible' as MenuId_t,
      displayName: 'Visible',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isHidden: false,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    menuMgr.addMenu(visibleMenu);
    assert.strictEqual(menuMgr.getIsHiddenOfMenuId('test-visible' as MenuId_t), false);
    assert.ok(!(await visibleMenu.getHTML()).includes('isHidden'));

    const hiddenMenu = menuMgr.createMenu({
      id: 'test-hidden' as MenuId_t,
      displayName: 'Hidden',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isHidden: true,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    menuMgr.addMenu(hiddenMenu);
    assert.strictEqual(menuMgr.getIsHiddenOfMenuId('test-hidden' as MenuId_t), true);
    assert.ok((await hiddenMenu.getHTML()).includes('isHidden'));
  });

  it('defaults undefined isHidden to visible (false)', async () => {
    const menuMgr = app.uimenumgr;
    const menu = menuMgr.createMenu({
      id: 'test-default' as MenuId_t,
      displayName: 'Default',
      iconSlotTriad: { begin: '', main: '', end: '' },
      // isHidden omitted
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    menuMgr.addMenu(menu);

    assert.strictEqual(menu.isHidden, undefined, 'raw stored value is undefined');
    assert.strictEqual(menuMgr.getIsHiddenOfMenuId('test-default' as MenuId_t), false);
    assert.ok(!(await menu.getHTML()).includes('isHidden'));
  });
});
