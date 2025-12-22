import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp, mockContext, mockVSCode } from './test-utils.js';
import { kMd, kMd_languageId, UIMenuItemDict_t } from '../src/types/PaperPrinter_t.js';
import { UIMenu } from '../src/UIMenu.js';

describe('Menu Hidden', () => {
  let app: TestApp;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
  });

  afterEach(() => {
    app.done();
  });

  it('should correctly resolve kMd menu visibility based on languageId', async () => {
    // 1. Setup - Create menus via PaperPrinter (private method, but we can access UIMenuMgr directly)
    // Actually, PaperPrinter.createMenus is private.
    // But we can just create the menu manually using UIMenuMgr and kMd config for testing purposes
    // or trigger PaperPrinter.handlePrintCommandFromVSCode which calls createMenus.
    
    // Let's create the menu manually using UIMenuMgr to isolate the test
    const menuMgr = app.uimenumgr;
    
    // Function to create/recreate the menu (simulating dynamic evaluation)
    const createMdMenu = () => {
      // kMd.isHidden is now: (dict: UIMenuItemDict_t) => dict.languageId !== kMd_languageId
      const isHidden = kMd.isHidden;
      
      return menuMgr.createMenu({
        id: kMd.id as any,
        displayName: kMd.displayName,
        iconSlotTriad: kMd.iconSlotTriad,
        isFlyout: kMd.isFlyout,
        isHidden: isHidden,
        menuItems: () => kMd.menuItems.map(item => ({
          ...item,
          iconSlotTriad: { begin: '', main: '', end: '' }
        })) as any, // Realistic items with required iconSlotTriad
        flyoutMenuItemIds: [],
        selectionHandler: async (menuId, menuItemId) => ({ id: menuItemId, value: 0 }),
      });
    };

    // 2. Test Case: Markdown file
    // Set languageId to markdown
    app.pdf.docInfo().languageId = kMd_languageId;
    
    // Create menu
    const mdMenuVisible = createMdMenu();
    
    // Verify it is visible (not hidden)
    assert.strictEqual(mdMenuVisible.isHidden, false, 'Markdown menu should be visible (not hidden) for markdown files');
    
    // Verify HTML has correct class (or lack thereof)
    const htmlVisible = await mdMenuVisible.getHTML();
    assert.ok(!htmlVisible.includes('isHidden'), 'Visible menu should not have isHidden class');

    // 3. Test Case: Non-markdown file
    // Set languageId to something else
    app.pdf.docInfo().languageId = 'typescript';
    
    // Create menu
    const mdMenuHidden = createMdMenu();
    
    // Verify it is hidden
    assert.strictEqual(mdMenuHidden.isHidden, true, 'Markdown menu should be hidden for non-markdown files');
    
    // Verify HTML has correct class
    const htmlHidden = await mdMenuHidden.getHTML();
    assert.ok(htmlHidden.includes('isHidden'), 'Hidden menu should have isHidden class');
  });

  it('should handle boolean isHidden correctly', async () => {
    const menuMgr = app.uimenumgr;
    
    // Visible menu (isHidden = false)
    const visibleMenu = menuMgr.createMenu({
      id: 'test-visible' as any,
      displayName: 'Visible',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isHidden: false,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(visibleMenu.isHidden, false);
    
    // Hidden menu (isHidden = true)
    const hiddenMenu = menuMgr.createMenu({
      id: 'test-hidden' as any,
      displayName: 'Hidden',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isHidden: true,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(hiddenMenu.isHidden, true);
    const htmlHidden = await hiddenMenu.getHTML();
    assert.ok(htmlHidden.includes('isHidden'));
  });

  it('should default to visible (isHidden=false) if isHidden is undefined', () => {
    const menuMgr = app.uimenumgr;
    
    const menu = menuMgr.createMenu({
      id: 'test-default' as any,
      displayName: 'Default',
      iconSlotTriad: { begin: '', main: '', end: '' },
      // isHidden undefined
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(menu.isHidden, false);
  });
});
