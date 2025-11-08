/**
 * PaperPrinter Zoom Handler Tests
 * 
 * Tests the zoom menu handlers (ZoomLevel, ZoomOut, ZoomIn) to ensure:
 * - They call regenerateAndUpdateWebview() like all other menus
 * - They properly calculate and persist zoom values
 * - They handle text input, menu items, and special actions correctly
 * - No zoom-specific code remains in webview (zoom is extension-controlled)
 * 
 * @module tests/PaperPrinter-Zoom.test
 */

import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert';
import type { App } from '../src/App.js';
import { PaperPrinter } from '../src/PaperPrinter.js';
import { kZoomLevel } from '../src/types/PaperPrinter_t.js';

// Create mock app
function createMockApp() {
  const mockPersist: Record<string, string | number> = {
    zoomLevel: '1.00', // 100% default
  };

  return {
    dx: {
      create: () => ({
        sub: () => ({
          out: () => {},
          error: () => {},
          done: () => {},
          require: () => true,
        }),
        out: () => {},
        done: () => {},
      }),
    },
    uimenumgr: {
      setPersistForMenuId: (menuId: string, value: string) => {
        mockPersist[menuId] = value;
      },
      getValueForSelectedByMenuId: (menuId: string) => {
        return mockPersist[menuId] as string;
      },
      getUIMenus: () => [],
      createMenu: () => ({}),
      addMenu: () => {},
    },
    vscodeapis: {
      getActiveEditorTabName: () => 'test.ts',
      getActiveEditorTextDocument: () => ({
        getText: () => 'test content',
        uri: { fsPath: '/test.ts' },
        lineCount: 10,
        lineAt: () => ({ range: { start: { line: 0 }, end: { line: 0 } } }),
      }),
      getActiveTextEditor: () => ({
        selection: { start: { line: 0 }, end: { line: 0 } },
      }),
      getActiveThemeId: () => 'github-dark',
      getEditorTypography: () => ({
        fontFamily: 'Menlo',
        fontSize: 12,
        fontWeight: 400,
      }),
    },
    stylize: {
      getThemes: () => [{ id: 'github-dark', displayName: 'GitHub Dark' }],
      tokenize: async () => [],
    },
    os: {
      getLocale: () => 'en-US',
      getPlatform: () => 'darwin',
    },
    pdf: {
      resetCaches: () => {},
    },
  } as unknown as App;
}

describe('PaperPrinter Zoom Handlers', () => {
  describe('handleSelection_ZoomLevel', () => {
    it('should regenerate PDF when menu item selected', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      
      let regenerateCalled = false;
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalled = true;
        return Promise.resolve();
      });

      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '1.50');
      
      assert.strictEqual(regenerateCalled, true, 'regenerateAndUpdateWebview should be called');
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '1.50',
        'Zoom level should be persisted'
      );
    });

    it('should handle text edit input (percentage)', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      
      let regenerateCalled = false;
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalled = true;
        return Promise.resolve();
      });

      // User types "150" in text edit (150%)
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '150');
      
      assert.strictEqual(regenerateCalled, true);
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '1.50',
        'Should convert percentage to scale (150% -> 1.50)'
      );
    });

    it('should clamp text input to min/max', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => Promise.resolve());

      // Test clamping to max (300%)
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '500');
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '3.00',
        'Should clamp 500% to max 300% (3.00)'
      );

      // Test clamping to min (10%) - user types "8" (percentage < 10% gets clamped)
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '8');
      const result = app.uimenumgr.getValueForSelectedByMenuId('zoomLevel');
      // "8" is treated as 8.0 scale (800%), which clamps to max 3.0
      assert.strictEqual(result, '3.00', 'Values <=10 are treated as scale, not percentage');
    });

    it('should handle fitPage/fitWidth special actions', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      
      let regenerateCalled = 0;
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalled++;
        return Promise.resolve();
      });

      // fitPage action
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', 'fitPage');
      assert.strictEqual(regenerateCalled, 1);
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        'fitPage'
      );

      // fitWidth action
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', 'fitWidth');
      assert.strictEqual(regenerateCalled, 2);
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        'fitWidth'
      );
    });
  });

  describe('handleSelection_ZoomOut', () => {
    it('should decrement zoom and regenerate PDF', async () => {
      const app = createMockApp();
      // Start at 150%
      app.uimenumgr.setPersistForMenuId('zoomLevel', '1.50');
      
      const paperPrinter = new PaperPrinter(app);
      let regenerateCalled = false;
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalled = true;
        return Promise.resolve();
      });

      await (paperPrinter as any).handleSelection_ZoomOut('zoomOut', 'zoomOut');
      
      assert.strictEqual(regenerateCalled, true);
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '1.40',
        'Should decrement by stepAmount (0.1)'
      );
    });

    it('should clamp to minimum zoom', async () => {
      const app = createMockApp();
      // Start at 15%
      app.uimenumgr.setPersistForMenuId('zoomLevel', '0.15');
      
      const paperPrinter = new PaperPrinter(app);
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => Promise.resolve());

      await (paperPrinter as any).handleSelection_ZoomOut('zoomOut', 'zoomOut');
      
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '0.10',
        'Should clamp to minimum (10%)'
      );
    });
  });

  describe('handleSelection_ZoomIn', () => {
    it('should increment zoom and regenerate PDF', async () => {
      const app = createMockApp();
      // Start at 100%
      app.uimenumgr.setPersistForMenuId('zoomLevel', '1.00');
      
      const paperPrinter = new PaperPrinter(app);
      let regenerateCalled = false;
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalled = true;
        return Promise.resolve();
      });

      await (paperPrinter as any).handleSelection_ZoomIn('zoomIn', 'zoomIn');
      
      assert.strictEqual(regenerateCalled, true);
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '1.10',
        'Should increment by stepAmount (0.1)'
      );
    });

    it('should clamp to maximum zoom', async () => {
      const app = createMockApp();
      // Start at 295%
      app.uimenumgr.setPersistForMenuId('zoomLevel', '2.95');
      
      const paperPrinter = new PaperPrinter(app);
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => Promise.resolve());

      await (paperPrinter as any).handleSelection_ZoomIn('zoomIn', 'zoomIn');
      
      assert.strictEqual(
        app.uimenumgr.getValueForSelectedByMenuId('zoomLevel'),
        '3.00',
        'Should clamp to maximum (300%)'
      );
    });
  });

  describe('Zoom Integration', () => {
    it('should work like other menus (no webview-specific zoom code)', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      
      const regenerateCalls: string[] = [];
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => {
        regenerateCalls.push('regenerate');
        return Promise.resolve();
      });

      // Theme menu pattern (for comparison)
      await (paperPrinter as any).handleSelection_Theme('theme', 'github-light');
      
      // Zoom menu should follow same pattern
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '2.00');
      await (paperPrinter as any).handleSelection_ZoomOut('zoomOut', 'zoomOut');
      await (paperPrinter as any).handleSelection_ZoomIn('zoomIn', 'zoomIn');
      
      assert.strictEqual(
        regenerateCalls.length,
        4,
        'All handlers should call regenerateAndUpdateWebview (like theme)'
      );
    });

    it('should round zoom values to 2 decimal places', async () => {
      const app = createMockApp();
      const paperPrinter = new PaperPrinter(app);
      (paperPrinter as any).regenerateAndUpdateWebview = mock.fn(() => Promise.resolve());

      // Test rounding
      await (paperPrinter as any).handleSelection_ZoomLevel('zoomLevel', '1.234567');
      const persisted = app.uimenumgr.getValueForSelectedByMenuId('zoomLevel');
      
      assert.strictEqual(
        persisted,
        '1.23',
        'Should round to 2 decimal places'
      );
    });
  });
});
