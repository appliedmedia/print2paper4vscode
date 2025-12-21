import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp, mockContext, mockVSCode } from './test-utils.js';
import { kMd, UIMenuItemDict_t } from '../src/types/PaperPrinter_t.js';
import { UIMenu } from '../src/UIMenu.js';

describe('Menu Visibility', () => {
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
      // kMd.isVisible is now: (dict: UIMenuItemDict_t) => dict.languageId === 'markdown'
      const isVisible = kMd.isVisible;
      
      return menuMgr.createMenu({
        id: kMd.id as any,
        displayName: kMd.displayName,
        iconSlotTriad: kMd.iconSlotTriad,
        isFlyout: kMd.isFlyout,
        isVisible: isVisible,
        menuItems: () => [], // Dummy items
        flyoutMenuItemIds: [],
        selectionHandler: async () => ({ id: '', value: '' }),
      });
    };

    // 2. Test Case: Markdown file
    // Set languageId to markdown
    app.pdf.docInfo().languageId = 'markdown';
    
    // Create menu
    const mdMenuVisible = createMdMenu();
    
    // Verify it is visible
    assert.strictEqual(mdMenuVisible.isVisible, true, 'Markdown menu should be visible for markdown files');
    
    // Verify HTML has correct class (or lack thereof)
    const htmlVisible = await mdMenuVisible.getHTML();
    assert.ok(!htmlVisible.includes('isVisible-false'), 'Visible menu should not have isVisible-false class');

    // 3. Test Case: Non-markdown file
    // Set languageId to something else
    app.pdf.docInfo().languageId = 'typescript';
    
    // Create menu
    const mdMenuHidden = createMdMenu();
    
    // Verify it is NOT visible
    assert.strictEqual(mdMenuHidden.isVisible, false, 'Markdown menu should be hidden for non-markdown files');
    
    // Verify HTML has correct class
    const htmlHidden = await mdMenuHidden.getHTML();
    assert.ok(htmlHidden.includes('isVisible-false'), 'Hidden menu should have isVisible-false class');
  });

  it('should handle boolean isVisible correctly', async () => {
    const menuMgr = app.uimenumgr;
    
    // Visible menu (isVisible = true)
    const visibleMenu = menuMgr.createMenu({
      id: 'test-visible' as any,
      displayName: 'Visible',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isVisible: true,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(visibleMenu.isVisible, true);
    
    // Hidden menu (isVisible = false)
    const hiddenMenu = menuMgr.createMenu({
      id: 'test-hidden' as any,
      displayName: 'Hidden',
      iconSlotTriad: { begin: '', main: '', end: '' },
      isVisible: false,
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(hiddenMenu.isVisible, false);
    const htmlHidden = await hiddenMenu.getHTML();
    assert.ok(htmlHidden.includes('isVisible-false'));
  });

  it('should default to visible if isVisible is undefined', () => {
    const menuMgr = app.uimenumgr;
    
    const menu = menuMgr.createMenu({
      id: 'test-default' as any,
      displayName: 'Default',
      iconSlotTriad: { begin: '', main: '', end: '' },
      // isVisible undefined
      menuItems: () => [],
      selectionHandler: async () => ({ id: '', value: '' }),
    });
    
    assert.strictEqual(menu.isVisible, true);
  });
});
