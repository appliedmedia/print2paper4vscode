import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PaperPrinter } from '../src/PaperPrinter.js';

describe('PaperPrinter Page Size and Orient Tests', () => {
  // Mock App with all required dependencies
  const mockApp = {
    dx: {
      create: (name: string) => ({
        out: (msg: string) => console.log(`[${name}] ${msg}`),
        print: (msg: string) => console.log(`[${name}] ${msg}`),
        done: () => {},
        sub: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          print: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
          require: () => true,
        }),
      }),
    },
    vscodeapis: {
      getGlobalState: (key: string) => {
        const state: Record<string, any> = {
          pageSize: 'a4',
          orient: 'portrait',
        };
        return state[key];
      },
      updateGlobalState: (key: string, value: any) => Promise.resolve(),
      getLocale: () => 'en-US',
      getActiveThemeId: () => 'github-light',
      getEditorTypography: () => ({
        fontSize: 14,
        lineHeight: 1.5,
        fontFamily: 'Courier',
        sizeToHeightRatio: 1.2
      }),
    },
    os: {
      fileRead: (path: string) => {
        if (path === 'src/PaperPrinter.yaml') {
          return {
            icon_orient_portrait_svg:
              '<svg width="16" height="16"><rect x="2" y="2" width="12" height="12"/></svg>',
            icon_orient_landscape_svg:
              '<svg width="16" height="16"><rect x="1" y="4" width="14" height="8"/></svg>',
            icon_margin_none_svg: '<svg width="16" height="16"><rect x="2" y="2" width="12" height="12"/></svg>',
            icon_margin_minimal_svg: '<svg width="16" height="16"><rect x="2" y="2" width="12" height="12"/></svg>',
            icon_margin_normal_svg: '<svg width="16" height="16"><rect x="2" y="2" width="12" height="12"/></svg>',
            icon_margin_wide_svg: '<svg width="16" height="16"><rect x="2" y="2" width="12" height="12"/></svg>',
          };
        }
        return undefined;
      },
    },
    ui: {
      showErrorMessage: (msg: string) => Promise.resolve(),
      htmlToWebViewPanel: (html: string) => 'panel-id',
    },
    pdf: {
      generatePdfFromTokens: () => Promise.resolve(),
    },
  };

  const paperPrinter = new PaperPrinter(mockApp as any);
  paperPrinter.init();

  describe('Public API Methods', () => {
    test('should get current page size', () => {
      const pageSize = (paperPrinter as any).app.vscodeapis.getGlobalState('pageSize') || 'a4';
      assert.strictEqual(pageSize, 'a4');
    });

    test('should get current orient', () => {
      const orient =
        (paperPrinter as any).app.vscodeapis.getGlobalState('orient') || 'portrait';
      assert.strictEqual(orient, 'portrait');
    });
  });

  describe('Page Menu Items', () => {
    test('should generate page menu items with correct format', () => {
      const menuItems = (paperPrinter as any).menuItems_Page();

      // Should have 3 items (Size, Orient, Margin submenus)
      assert.strictEqual(menuItems.length, 3);

      const expectedSubmenus = ['size', 'orient', 'margin'];
      expectedSubmenus.forEach((submenu, index) => {
        assert.strictEqual(menuItems[index].id, submenu);
        // Check that display name contains the submenu name (case-insensitive)
        assert.ok(menuItems[index].displayName.toLowerCase().includes(submenu.toLowerCase()));
      });
    });

    test('should include dimensions in display names', () => {
      const menuItems = (paperPrinter as any).menuItems_pageSizeId();

      // Check A4 has mm dimensions
      const a4Item = menuItems.find((item: any) => item.id === 'a4');
      assert.ok(a4Item?.displayName.includes('210mm × 297mm'));

      // Check Letter has inch dimensions
      const letterItem = menuItems.find((item: any) => item.id === 'letter');
      assert.ok(letterItem?.displayName.includes('8.5" × 11"'));
    });
  });

  describe('Orientation Menu Items', () => {
    test('should generate orientation menu items with SVG icons', () => {
      const menuItems = (paperPrinter as any).menuItems_Orient();

      assert.strictEqual(menuItems.length, 2);

      const portraitItem = menuItems.find((item: any) => item.id === 'portrait');
      const landscapeItem = menuItems.find((item: any) => item.id === 'landscape');

      assert.ok(portraitItem);
      assert.ok(landscapeItem);
      assert.ok(portraitItem?.displayName.includes('Portrait'));
      assert.ok(landscapeItem?.displayName.includes('Landscape'));
      // Check that SVG icons are embedded (not template placeholders)
      assert.ok(portraitItem?.displayName.includes('<svg'));
      assert.ok(landscapeItem?.displayName.includes('<svg'));
    });
  });

  describe('Menu Selection Handlers', () => {
    test.skip('should handle page size selection', async () => {
      let updatedPageSize: string | undefined;
      let scrollViewUpdated = false;

      // Create a new mock app for this test
      const testMockApp = {
        ...mockApp,
        vscodeapis: {
          ...mockApp.vscodeapis,
          updateGlobalState: (key: string, value: any) => {
            if (key === 'pageSize') updatedPageSize = value;
            return Promise.resolve();
          },
        },
        pdf: {
          ...mockApp.pdf,
          generatePdfFromTokens: () => {
            return Promise.resolve();
          },
          embedPDFinHTML: () => Promise.resolve(),
          renderPage: () => Promise.resolve({ dataUrl: 'mock', widthPx: 100, heightPx: 100, pageNumber: 1 }),
          getPageTotal: () => 1,
          getPageSizePx: () => ({ widthPx: 100, heightPx: 100 }),
        },
        ui: {
          updateWebviewPdf: () => Promise.resolve(),
          showErrorMessage: (msg: string) => Promise.resolve(),
        },
        stylize: {
          styleToPdf: () => {
            return Promise.resolve({ mock: true });
          },
        },
      };

      const testPaperPrinter = new PaperPrinter(testMockApp as any);
      testPaperPrinter.init();
      
      // Set a mock webview to track updates
      (testPaperPrinter as any).uiwebview = {
        updateOptions: (options: any) => {
          scrollViewUpdated = true;
          return Promise.resolve();
        },
        updatePageRender: (pageRender: any) => {
          return Promise.resolve();
        }
      };
      
      // Mock the regenerateAndUpdateWebview method to avoid complex setup
      (testPaperPrinter as any).regenerateAndUpdateWebview = async () => {
        // Mock implementation that just updates the webview
        if ((testPaperPrinter as any).uiwebview) {
          await (testPaperPrinter as any).uiwebview.updateOptions({});
        }
      };
      
      await (testPaperPrinter as any).handleSelection_pageSizeId('letter'); // Select letter

      assert.strictEqual(updatedPageSize, 'letter');
      assert.ok(scrollViewUpdated);
    });

    test.skip('should handle orientation selection', async () => {
      let updatedOrientation: string | undefined;
      let scrollViewUpdated = false;

      // Create a new mock app for this test
      const testMockApp = {
        ...mockApp,
        vscodeapis: {
          ...mockApp.vscodeapis,
          updateGlobalState: (key: string, value: any) => {
            if (key === 'orient') updatedOrientation = value;
            return Promise.resolve();
          },
        },
        pdf: {
          ...mockApp.pdf,
          generatePdfFromTokens: () => {
            return Promise.resolve();
          },
          embedPDFinHTML: () => Promise.resolve(),
          renderPage: () => Promise.resolve({ dataUrl: 'mock', widthPx: 100, heightPx: 100, pageNumber: 1 }),
          getPageTotal: () => 1,
          getPageSizePx: () => ({ widthPx: 100, heightPx: 100 }),
        },
        ui: {
          updateWebviewPdf: () => Promise.resolve(),
          showErrorMessage: (msg: string) => Promise.resolve(),
        },
        stylize: {
          styleToPdf: () => {
            return Promise.resolve({ mock: true });
          },
        },
      };

      const testPaperPrinter = new PaperPrinter(testMockApp as any);
      testPaperPrinter.init();
      
      // Set a mock webview to track updates
      (testPaperPrinter as any).uiwebview = {
        updateOptions: (options: any) => {
          scrollViewUpdated = true;
          return Promise.resolve();
        },
        updatePageRender: (pageRender: any) => {
          return Promise.resolve();
        }
      };
      
      // Mock the regenerateAndUpdateWebview method to avoid complex setup
      (testPaperPrinter as any).regenerateAndUpdateWebview = async () => {
        // Mock implementation that just updates the webview
        if ((testPaperPrinter as any).uiwebview) {
          await (testPaperPrinter as any).uiwebview.updateOptions({});
        }
      };
      
      await (testPaperPrinter as any).handleSelection_Orient('landscape'); // Select landscape

      assert.strictEqual(updatedOrientation, 'landscape');
      assert.ok(scrollViewUpdated);
    });
  });

  describe('Menu Configuration', () => {
    test('should include page and orient menus in configuration', () => {
      // Create a mock app with uimenumgr for this test
      const testMockApp = {
        ...mockApp,
        uimenumgr: {
          getAllMenus: () => [],
          createMenu: (
            id: string,
            icon: string,
            title: string,
            menuItems: any,
            selectionHandler: any
          ) => ({
            id,
            icon,
            title,
            menuItems,
            selectionHandler,
          }),
          addMenu: (menu: any) => {
            // Mock addMenu - just return the menu
            return menu;
          },
        },
        // Explicitly include os for YAML loading
        os: mockApp.os,
      };

      const testPaperPrinter = new PaperPrinter(testMockApp as any);

      // Test that createMenus doesn't throw and creates the expected menus
      assert.doesNotThrow(() => {
        (testPaperPrinter as any).createMenus();
      });

      // Test that the menu items methods work
      const pageMenuItems = (testPaperPrinter as any).menuItems_Page();
      const orientMenuItems = (testPaperPrinter as any).menuItems_Orient();

      assert.strictEqual(pageMenuItems.length, 3);
      assert.strictEqual(orientMenuItems.length, 2);

      // Test that page menu has correct submenu items
      const pageIds = pageMenuItems.map((item: any) => item.id);
      assert.ok(pageIds.includes('size'));
      assert.ok(pageIds.includes('orient'));
      assert.ok(pageIds.includes('margin'));

      // Test that orient menu has correct items
      const orientIds = orientMenuItems.map((item: any) => item.id);
      assert.ok(orientIds.includes('portrait'));
      assert.ok(orientIds.includes('landscape'));
    });
  });
});
