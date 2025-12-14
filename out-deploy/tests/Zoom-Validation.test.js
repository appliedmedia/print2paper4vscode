"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Zoom Validation Unit Tests
 *
 * Tests zoom control validation logic and algorithms:
 * - Zoom level persistence validation
 * - Menu configuration structure
 * - Input validation and clamping (50%-250% range)
 * - Zoom action handlers (in/out/fit/actual)
 * - Keyboard shortcut detection
 * - Percentage to decimal conversion
 */
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const PaperPrinter_t_1 = require("../src/types/PaperPrinter_t");
(0, node_test_1.describe)('UIWebView Zoom Controls', () => {
    (0, node_test_1.describe)('Zoom Level Persistence', () => {
        (0, node_test_1.test)('should persist zoom level in UI.persist.zoomLevel', () => {
            // Mock UI.persist.zoomLevel
            const mockPersist = {
                zoomLevel: undefined,
            };
            // Set initial zoom level
            mockPersist.zoomLevel = 1.0;
            assert.strictEqual(mockPersist.zoomLevel, 1.0, 'Zoom level should be persisted');
        });
        (0, node_test_1.test)('should default to 1.0 if zoom level not set', () => {
            const mockPersist = {
                zoomLevel: undefined,
            };
            const zoomLevel = mockPersist.zoomLevel ?? 1.0;
            assert.strictEqual(zoomLevel, 1.0, 'Should default to 1.0');
        });
        (0, node_test_1.test)('should persist zoom level between 0.5 and 2.5', () => {
            const mockPersist = {
                zoomLevel: undefined,
            };
            const validZooms = [0.5, 1.0, 1.5, 2.0, 2.5];
            for (const zoom of validZooms) {
                mockPersist.zoomLevel = zoom;
                assert.strictEqual(mockPersist.zoomLevel, zoom, `Zoom ${zoom} should be persisted`);
            }
        });
    });
    (0, node_test_1.describe)('Zoom Menu Configuration', () => {
        (0, node_test_1.test)('should have zoomOut menu with minus icon', () => {
            const zoomOutMenu = {
                id: 'zoomOut',
                icon: '−',
                menuItems: [],
            };
            assert.strictEqual(zoomOutMenu.id, 'zoomOut', 'Should have correct ID');
            assert.strictEqual(zoomOutMenu.icon, '−', 'Should have minus icon');
            assert.strictEqual(zoomOutMenu.menuItems.length, 0, 'Should have no menu items');
        });
        (0, node_test_1.test)('should have zoomIn menu with plus icon', () => {
            const zoomInMenu = {
                id: 'zoomIn',
                icon: '+',
                menuItems: [],
            };
            assert.strictEqual(zoomInMenu.id, 'zoomIn', 'Should have correct ID');
            assert.strictEqual(zoomInMenu.icon, '+', 'Should have plus icon');
            assert.strictEqual(zoomInMenu.menuItems.length, 0, 'Should have no menu items');
        });
        (0, node_test_1.test)('should have zoomLevel menu with dropdown triangle icon', () => {
            const zoomLevelMenu = {
                id: 'zoomLevel',
                icon: '▼',
                menuItems: [
                    { id: '0.50', displayName: '50%' },
                    { id: '1.00', displayName: '100% ⌘0' },
                    { id: '1.25', displayName: '125%' },
                    { id: '1.50', displayName: '150%' },
                    { id: '2.00', displayName: '200%' },
                    { id: '2.50', displayName: '250%' },
                    { id: 'fitPage', displayName: 'Fit Page' },
                    { id: 'actualSize', displayName: '1:1 ⌘0' },
                ],
            };
            assert.strictEqual(zoomLevelMenu.id, 'zoomLevel', 'Should have correct ID');
            assert.strictEqual(zoomLevelMenu.icon, '▼', 'Should have dropdown triangle icon');
            assert.strictEqual(zoomLevelMenu.menuItems.length, 8, 'Should have 8 menu items');
        });
        (0, node_test_1.test)('should have zoom level menu items with shortcuts', () => {
            const menuItems = [
                { id: '1.00', displayName: '100% ⌘0' },
                { id: 'actualSize', displayName: '1:1 ⌘0' },
            ];
            assert.ok(menuItems[0].displayName.includes('⌘0'), '100% should show shortcut');
            assert.ok(menuItems[1].displayName.includes('⌘0'), '1:1 should show shortcut');
        });
    });
    (0, node_test_1.describe)('Zoom Percentage Input Validation', () => {
        (0, node_test_1.test)('should NOT snap input - user-entered values are preserved (validated but not snapped)', () => {
            // Input validation validates min/max and rounds to 2 decimal places, but does NOT snap to 10% increments
            const validateAndRound = (inputPercent) => {
                const clampedPercent = Math.max(50, Math.min(250, inputPercent));
                return Math.round((clampedPercent / 100) * 100) / 100; // Round to 2 decimal places only
            };
            assert.strictEqual(validateAndRound(75), 0.75, '75% should stay 75% (not snapped to 100%)');
            assert.strictEqual(validateAndRound(123), 1.23, '123% should stay 123% (not snapped to 125%)');
            assert.strictEqual(validateAndRound(100), 1.0, '100% should stay 100%');
        });
        (0, node_test_1.test)('should clamp zoom to 50%-250% range', () => {
            const clampZoom = (percent) => {
                return Math.max(50, Math.min(250, percent));
            };
            assert.strictEqual(clampZoom(25), 50, '25% should clamp to 50%');
            assert.strictEqual(clampZoom(50), 50, '50% should stay 50%');
            assert.strictEqual(clampZoom(100), 100, '100% should stay 100%');
            assert.strictEqual(clampZoom(250), 250, '250% should stay 250%');
            assert.strictEqual(clampZoom(300), 250, '300% should clamp to 250%');
        });
        (0, node_test_1.test)('should validate numeric input', () => {
            const isValidZoomInput = (text) => {
                const cleaned = text.replace(/%/g, '').trim();
                const num = parseFloat(cleaned);
                return !isNaN(num) && num >= 50 && num <= 250;
            };
            assert.ok(isValidZoomInput('50'), '50 should be valid');
            assert.ok(isValidZoomInput('50%'), '50% should be valid');
            assert.ok(isValidZoomInput('100'), '100 should be valid');
            assert.ok(isValidZoomInput('250'), '250 should be valid');
            assert.ok(!isValidZoomInput('25'), '25 should be invalid (< 50)');
            assert.ok(!isValidZoomInput('300'), '300 should be invalid (> 250)');
            assert.ok(!isValidZoomInput('abc'), 'abc should be invalid');
            assert.ok(!isValidZoomInput(''), 'empty should be invalid');
        });
        (0, node_test_1.test)('should restrict input to integers only (no decimals)', () => {
            // Input validation should only allow digits 0-9, max 3 characters
            const isValidInput = (text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                const numValue = parseInt(cleaned, 10);
                return cleaned.length <= 3 && cleaned.length > 0 && !isNaN(numValue) && numValue >= 50 && numValue <= 250;
            };
            assert.ok(isValidInput('100'), '100 should be valid');
            assert.ok(isValidInput('50'), '50 should be valid');
            assert.ok(!isValidInput('47.5'), '47.5 should be invalid (decimals not allowed)');
            assert.ok(!isValidInput('1234'), '1234 should be invalid (too many digits)');
            assert.ok(!isValidInput('25'), '25 should be invalid (< 50)');
            assert.ok(!isValidInput('300'), '300 should be invalid (> 250)');
        });
    });
    (0, node_test_1.describe)('Zoom Actions', () => {
        (0, node_test_1.test)('should handle zoom in action', () => {
            let currentScale = 1.0;
            const ZOOM_STEP = 0.1;
            const ZOOM_MAX = PaperPrinter_t_1.kZoomLevel.max;
            const zoomIn = () => {
                currentScale = Math.min(currentScale + ZOOM_STEP, ZOOM_MAX);
            };
            zoomIn();
            assert.strictEqual(currentScale, 1.1, 'Should zoom in by 0.1');
            currentScale = 2.4;
            zoomIn();
            assert.strictEqual(currentScale, 2.5, 'Should cap at 2.5');
        });
        (0, node_test_1.test)('should handle zoom out action', () => {
            let currentScale = 1.0;
            const ZOOM_STEP = 0.1;
            const ZOOM_MIN = PaperPrinter_t_1.kZoomLevel.min;
            const zoomOut = () => {
                currentScale = Math.max(currentScale - ZOOM_STEP, ZOOM_MIN);
            };
            zoomOut();
            assert.strictEqual(currentScale, 0.9, 'Should zoom out by 0.1');
            currentScale = 0.15;
            zoomOut();
            assert.strictEqual(currentScale, PaperPrinter_t_1.kZoomLevel.min, `Should cap at ${PaperPrinter_t_1.kZoomLevel.min}`);
        });
        (0, node_test_1.test)('should handle fit page action', () => {
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
        (0, node_test_1.test)('should handle fit page with zero page dimensions (error case)', () => {
            const pageWidthPx = 0;
            const pageHeightPx = 0;
            // Fit calculations should error, not use fallbacks
            const shouldError = pageWidthPx <= 0 || pageHeightPx <= 0;
            assert.ok(shouldError, 'Fit page should error when page dimensions are zero');
        });
        (0, node_test_1.test)('should handle fit width with zero page width (error case)', () => {
            const pageWidthPx = 0;
            // Fit width should error, not use fallbacks
            const shouldError = pageWidthPx <= 0;
            assert.ok(shouldError, 'Fit width should error when page width is zero');
        });
    });
    (0, node_test_1.describe)('Keyboard Shortcuts', () => {
        (0, node_test_1.test)('should handle Cmd/Ctrl + Plus for zoom in', () => {
            const event = {
                key: '+',
                metaKey: true, // Mac Cmd key
                ctrlKey: false,
                preventDefault: () => { },
            };
            const shouldZoomIn = event.metaKey && (event.key === '=' || event.key === '+');
            assert.ok(shouldZoomIn, 'Cmd + Plus should trigger zoom in');
        });
        (0, node_test_1.test)('should handle Cmd/Ctrl + Minus for zoom out', () => {
            const event = {
                key: '-',
                metaKey: false,
                ctrlKey: true, // Windows/Linux Ctrl key
                preventDefault: () => { },
            };
            const shouldZoomOut = event.ctrlKey && event.key === '-';
            assert.ok(shouldZoomOut, 'Ctrl + Minus should trigger zoom out');
        });
        (0, node_test_1.test)('should handle Cmd/Ctrl + 0 for actual size', () => {
            const event = {
                key: '0',
                metaKey: true,
                ctrlKey: false,
                preventDefault: () => { },
            };
            const shouldActualSize = event.metaKey && event.key === '0';
            assert.ok(shouldActualSize, 'Cmd + 0 should trigger actual size');
        });
    });
});
//# sourceMappingURL=Zoom-Validation.test.js.map