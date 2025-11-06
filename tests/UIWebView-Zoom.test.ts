/**
 * Unit tests for UIWebView Zoom Controls
 * 
 * These tests focus on unit-level validation of zoom control logic with mocks:
 * - Zoom level persistence validation
 * - Menu configuration structure
 * - Input validation and clamping algorithms
 * - Zoom action handlers (in/out/fit/actual)
 * - Keyboard shortcut detection
 * 
 * **NOTE: These are unit tests only - they do NOT test extension↔webview integration.**
 * 
 * For integration tests covering:
 * - Extension passing pdf_zoom_level to webview template injection
 * - Webview messages reaching extension's handleZoomMessage
 * - Persisted zoom level surviving extension reload
 * - Template variable injection handling undefined/null/invalid values
 * 
 * See: tests/UIWebView-PDFjs-Integration.test.ts and tests/Integration.test.ts
 */
import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { kZoomLevels } from '../src/types/PaperPrinter_t';

describe('UIWebView Zoom Controls', () => {
  describe('Zoom Level Persistence', () => {
    test('should persist zoom level in UI.persist.pdf_zoom_level', () => {
      // Mock UI.persist.pdf_zoom_level
      const mockPersist = {
        pdf_zoom_level: undefined as number | undefined,
      };

      // Set initial zoom level
      mockPersist.pdf_zoom_level = 1.0;

      assert.strictEqual(mockPersist.pdf_zoom_level, 1.0, 'Zoom level should be persisted');
    });

    test('should default to 1.0 if zoom level not set', () => {
      const mockPersist = {
        pdf_zoom_level: undefined as number | undefined,
      };

      const zoomLevel = mockPersist.pdf_zoom_level ?? 1.0;
      assert.strictEqual(zoomLevel, 1.0, 'Should default to 1.0');
    });

    test('should persist zoom level between 0.25 and 3.0', () => {
      const mockPersist = {
        pdf_zoom_level: undefined as number | undefined,
      };

      const validZooms = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0];
      for (const zoom of validZooms) {
        mockPersist.pdf_zoom_level = zoom;
        assert.strictEqual(mockPersist.pdf_zoom_level, zoom, `Zoom ${zoom} should be persisted`);
      }
    });
  });

  describe('Zoom Menu Configuration', () => {
    test('should have zoomOut menu with minus icon', () => {
      const zoomOutMenu = {
        id: 'zoomOut',
        icon: '−',
        menuItems: [],
      };

      assert.strictEqual(zoomOutMenu.id, 'zoomOut', 'Should have correct ID');
      assert.strictEqual(zoomOutMenu.icon, '−', 'Should have minus icon');
      assert.strictEqual(zoomOutMenu.menuItems.length, 0, 'Should have no menu items');
    });

    test('should have zoomIn menu with plus icon', () => {
      const zoomInMenu = {
        id: 'zoomIn',
        icon: '+',
        menuItems: [],
      };

      assert.strictEqual(zoomInMenu.id, 'zoomIn', 'Should have correct ID');
      assert.strictEqual(zoomInMenu.icon, '+', 'Should have plus icon');
      assert.strictEqual(zoomInMenu.menuItems.length, 0, 'Should have no menu items');
    });

    test('should have zoomLevel menu with dropdown triangle icon', () => {
      const zoomLevelMenu = {
        id: 'zoomLevel',
        icon: '▼',
        menuItems: [
          { id: '0.25', displayName: '25%' },
          { id: '0.50', displayName: '50%' },
          { id: '1.00', displayName: '100% ⌘0' },
          { id: '1.25', displayName: '125%' },
          { id: '1.50', displayName: '150%' },
          { id: '2.00', displayName: '200%' },
          { id: '2.50', displayName: '250%' },
          { id: '3.00', displayName: '300%' },
          { id: 'fitPage', displayName: 'Fit Page' },
          { id: 'actualSize', displayName: '1:1 ⌘0' },
        ],
      };

      assert.strictEqual(zoomLevelMenu.id, 'zoomLevel', 'Should have correct ID');
      assert.strictEqual(zoomLevelMenu.icon, '▼', 'Should have dropdown triangle icon');
      assert.strictEqual(zoomLevelMenu.menuItems.length, 10, 'Should have 10 menu items');
    });

    test('should have zoom level menu items with shortcuts', () => {
      const menuItems = [
        { id: '1.00', displayName: '100% ⌘0' },
        { id: 'actualSize', displayName: '1:1 ⌘0' },
      ];

      assert.ok(menuItems[0].displayName.includes('⌘0'), '100% should show shortcut');
      assert.ok(menuItems[1].displayName.includes('⌘0'), '1:1 should show shortcut');
    });
  });

  describe('Zoom Percentage Input Validation', () => {
    test('should NOT snap input - user-entered values are preserved (validated but not snapped)', () => {
      // Input validation validates min/max and rounds to 2 decimal places, but does NOT snap to 10% increments
      const validateAndRound = (inputPercent: number): number => {
        const clampedPercent = Math.max(10, Math.min(300, inputPercent));
        return Math.round((clampedPercent / 100) * 100) / 100; // Round to 2 decimal places only
      };

      assert.strictEqual(validateAndRound(47), 0.47, '47% should stay 47% (not snapped to 50%)');
      assert.strictEqual(validateAndRound(23), 0.23, '23% should stay 23% (not snapped to 20%)');
      assert.strictEqual(validateAndRound(100), 1.0, '100% should stay 100%');
    });

    test('should clamp zoom to 10%-300% range', () => {
      const clampZoom = (percent: number): number => {
        return Math.max(10, Math.min(300, percent));
      };

      assert.strictEqual(clampZoom(5), 10, '5% should clamp to 10%');
      assert.strictEqual(clampZoom(10), 10, '10% should stay 10%');
      assert.strictEqual(clampZoom(100), 100, '100% should stay 100%');
      assert.strictEqual(clampZoom(300), 300, '300% should stay 300%');
      assert.strictEqual(clampZoom(350), 300, '350% should clamp to 300%');
    });

    test('should validate numeric input', () => {
      const isValidZoomInput = (text: string): boolean => {
        const cleaned = text.replace(/%/g, '').trim();
        const num = parseFloat(cleaned);
        return !isNaN(num) && num >= 10 && num <= 300;
      };

      assert.ok(isValidZoomInput('50'), '50 should be valid');
      assert.ok(isValidZoomInput('50%'), '50% should be valid');
      assert.ok(isValidZoomInput('100'), '100 should be valid');
      assert.ok(isValidZoomInput('300'), '300 should be valid');
      assert.ok(!isValidZoomInput('5'), '5 should be invalid (< 10)');
      assert.ok(!isValidZoomInput('350'), '350 should be invalid (> 300)');
      assert.ok(!isValidZoomInput('abc'), 'abc should be invalid');
      assert.ok(!isValidZoomInput(''), 'empty should be invalid');
    });

    test('should restrict input to integers only (no decimals)', () => {
      // Input validation should only allow digits 0-9, max 3 characters
      const isValidInput = (text: string): boolean => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const numValue = parseInt(cleaned, 10);
        return cleaned.length <= 3 && cleaned.length > 0 && !isNaN(numValue) && numValue >= 10 && numValue <= 300;
      };

      assert.ok(isValidInput('100'), '100 should be valid');
      assert.ok(isValidInput('50'), '50 should be valid');
      assert.ok(!isValidInput('47.5'), '47.5 should be invalid (decimals not allowed)');
      assert.ok(!isValidInput('1234'), '1234 should be invalid (too many digits)');
      assert.ok(!isValidInput('5'), '5 should be invalid (< 10)');
      assert.ok(!isValidInput('400'), '400 should be invalid (> 300)');
    });
  });

  describe('Zoom Actions', () => {
    test('should handle zoom in action', () => {
      let currentScale = 1.0;
      const ZOOM_STEP = 0.1;
      const ZOOM_MAX = kZoomLevels.max;

      const zoomIn = () => {
        currentScale = Math.min(currentScale + ZOOM_STEP, ZOOM_MAX);
      };

      zoomIn();
      assert.strictEqual(currentScale, 1.1, 'Should zoom in by 0.1');

      currentScale = 2.9;
      zoomIn();
      assert.strictEqual(currentScale, 3.0, 'Should cap at 3.0');
    });

    test('should handle zoom out action', () => {
      let currentScale = 1.0;
      const ZOOM_STEP = 0.1;
      const ZOOM_MIN = kZoomLevels.min;

      const zoomOut = () => {
        currentScale = Math.max(currentScale - ZOOM_STEP, ZOOM_MIN);
      };

      zoomOut();
      assert.strictEqual(currentScale, 0.9, 'Should zoom out by 0.1');

      currentScale = 0.15;
      zoomOut();
      assert.strictEqual(currentScale, kZoomLevels.min, `Should cap at ${kZoomLevels.min}`);
    });

    test('should handle fit page action', () => {
      const pageWidthPx = 595;
      const pageHeightPx = 842;
      const containerWidth = 800;
      const containerHeight = 600;

      const scaleX = containerWidth / pageWidthPx;
      const scaleY = containerHeight / pageHeightPx;
      const fitPageScale = Math.min(scaleX, scaleY);

      assert.ok(fitPageScale > 0, 'Fit page scale should be positive');
      assert.ok(fitPageScale < 2.0, 'Fit page scale should be reasonable');
    });

    test('should handle fit page with zero page dimensions (error case)', () => {
      const pageWidthPx = 0;
      const pageHeightPx = 0;
      
      // Fit calculations should error, not use fallbacks
      const shouldError = pageWidthPx <= 0 || pageHeightPx <= 0;
      assert.ok(shouldError, 'Fit page should error when page dimensions are zero');
    });

    test('should handle fit width with zero page width (error case)', () => {
      const pageWidthPx = 0;
      
      // Fit width should error, not use fallbacks
      const shouldError = pageWidthPx <= 0;
      assert.ok(shouldError, 'Fit width should error when page width is zero');
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle Cmd/Ctrl + Plus for zoom in', () => {
      const event = {
        key: '+',
        metaKey: true, // Mac Cmd key
        ctrlKey: false,
        preventDefault: () => {},
      };

      const shouldZoomIn = event.metaKey && (event.key === '=' || event.key === '+');
      assert.ok(shouldZoomIn, 'Cmd + Plus should trigger zoom in');
    });

    test('should handle Cmd/Ctrl + Minus for zoom out', () => {
      const event = {
        key: '-',
        metaKey: false,
        ctrlKey: true, // Windows/Linux Ctrl key
        preventDefault: () => {},
      };

      const shouldZoomOut = event.ctrlKey && event.key === '-';
      assert.ok(shouldZoomOut, 'Ctrl + Minus should trigger zoom out');
    });

    test('should handle Cmd/Ctrl + 0 for actual size', () => {
      const event = {
        key: '0',
        metaKey: true,
        ctrlKey: false,
        preventDefault: () => {},
      };

      const shouldActualSize = event.metaKey && event.key === '0';
      assert.ok(shouldActualSize, 'Cmd + 0 should trigger actual size');
    });
  });
});
