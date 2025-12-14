"use strict";
/**
 * PaperPrinter Type Definitions
 *
 * Single source of truth for all document configuration and business logic types.
 * All page size, orientation, margin, and font types are defined here.
 * Also includes UI menu structure definitions with iconSlotTriad support.
 *
 * Naming convention:
 * - Constants: kFoo (singular with k prefix) - object with id as key, metadata as value
 * - Types: Foo_t (singular with _t suffix) - derived using `keyof typeof kFoo`
 *
 * Icon Slot Triad Structure:
 * - begin: Left-most icon position
 * - main: Center icon position (can be text_edit widget descriptor)
 * - end: Right-most icon position
 * - Menu ID constants: kFoo_id = 'foo' - the menu ID string
 *
 * Each const object contains ALL metadata (displayName, dimensions, etc.) in ONE place.
 * This eliminates duplicate lookups and keeps everything in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.kMenus = exports.kZoomLevel = exports.kMd = exports.kMd_Render = exports.kMd_Raw = exports.kZoomIn = exports.kZoomOut = exports.kTheme = exports.kHeaderFooterSubmenuById = exports.kHeaderFooterMenuIds = exports.kPageMenuItemsById = exports.kPage = exports.kFooter = exports.kHeader = exports.kHeaderFooterMenuItemsById = exports.kHeaderFooter = exports.kFontSizeId = exports.kMarginIdById = exports.kMarginId = exports.kOrient = exports.kPageSizeIdById = exports.kPageSizeId = exports.kPrint = void 0;
// Print menu definition
exports.kPrint = {
    id: 'print',
    displayName: 'Print',
    iconSlotTriad: { begin: '', main: '🖨', end: '' },
    altId: '',
    methodName: '',
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [
        { id: 'preview', displayName: 'Print with Preview' },
        { id: 'direct', displayName: 'Print' },
        { id: 'save', displayName: 'Save as PDF' },
    ],
};
// Page size menu definition
exports.kPageSizeId = {
    id: 'pageSizeId',
    displayName: 'Size',
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: 'a4',
    methodName: 'PageSizeId',
    isFlyout: true,
    flyoutMenuItemIds: [],
    menuItems: [
        {
            id: 'letter',
            displayName: 'Letter (8.5" × 11")',
            width: 8.5,
            height: 11,
            unit: 'inches',
        },
        {
            id: 'legal',
            displayName: 'Legal (8.5" × 14")',
            width: 8.5,
            height: 14,
            unit: 'inches',
        },
        {
            id: 'tabloid',
            displayName: 'Tabloid (11" × 17")',
            width: 11,
            height: 17,
            unit: 'inches',
        },
        { id: 'a3', displayName: 'A3 (297mm × 420mm)', width: 297, height: 420, unit: 'mm' },
        { id: 'a4', displayName: 'A4 (210mm × 297mm)', width: 210, height: 297, unit: 'mm' },
        { id: 'a5', displayName: 'A5 (148mm × 210mm)', width: 148, height: 210, unit: 'mm' },
    ],
};
// Lookup helper for metadata by id
exports.kPageSizeIdById = Object.fromEntries(exports.kPageSizeId.menuItems.map(item => [item.id, item]));
// Page orientation menu definition
exports.kOrient = {
    id: 'orient',
    displayName: 'Orient',
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: 'portrait',
    methodName: '',
    isFlyout: true,
    flyoutMenuItemIds: [],
    menuItems: [
        { id: 'portrait', displayName: '{{icon_orient_portrait_svg}} Portrait' },
        { id: 'landscape', displayName: '{{icon_orient_landscape_svg}} Landscape' },
    ],
};
// Margin menu definition
exports.kMarginId = {
    id: 'marginId',
    displayName: 'Margin',
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: 'normal',
    methodName: 'MarginId',
    isFlyout: true,
    flyoutMenuItemIds: [],
    menuItems: [
        { id: 'none', displayName: '{{icon_margin_none_svg}} None', marginPts: 0 },
        { id: 'minimal', displayName: '{{icon_margin_minimal_svg}} Minimal', marginPts: 5 },
        { id: 'normal', displayName: '{{icon_margin_normal_svg}} Normal', marginPts: 15 },
        { id: 'wide', displayName: '{{icon_margin_wide_svg}} Wide', marginPts: 30 },
    ],
};
// Lookup helper for metadata by id
exports.kMarginIdById = Object.fromEntries(exports.kMarginId.menuItems.map(item => [item.id, item]));
// Font size menu definition
exports.kFontSizeId = {
    id: 'fontSizeId',
    displayName: 'Text',
    iconSlotTriad: { begin: '', main: 'Tt', end: '' },
    altId: '12',
    altValue: 12,
    methodName: '',
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [
        { id: '8', displayName: '8px' },
        { id: '9', displayName: '9px' },
        { id: '10', displayName: '10px' },
        { id: '11', displayName: '11px' },
        { id: '12', displayName: '12px' },
        { id: '14', displayName: '14px' },
        { id: '18', displayName: '18px' },
        { id: '20', displayName: '20px' },
        { id: '24', displayName: '24px' },
        { id: '32', displayName: '32px' },
        { id: '48', displayName: '48px' },
    ],
};
// Header/Footer position menu definition
exports.kHeaderFooter = {
    id: {
        header: 'header',
        footer: 'footer',
    },
    displayName: {
        header: 'Header',
        footer: 'Footer',
    },
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: '',
    none: 'none',
    menuItems: [
        { id: 'begin', displayName: '⇤' },
        { id: 'middle', displayName: ' ◇' },
        { id: 'end', displayName: '⇥' },
    ],
    subMenuItems: [
        { id: 'title', displayName: 'Title', template: '{{title}}' },
        { id: 'page', displayName: '#', template: 'Page {{#}}' },
        { id: 'total', displayName: 'Total', template: '{{pageTotal}}' },
        { id: 'pageTotal', displayName: '#+Total', template: 'Page {{#}} of {{pageTotal}}' },
    ],
};
// Lookup helper for metadata by id
exports.kHeaderFooterMenuItemsById = Object.fromEntries(exports.kHeaderFooter.menuItems.map(item => [item.id, item]));
// Header menu definition
exports.kHeader = {
    id: exports.kHeaderFooter.id.header,
    displayName: exports.kHeaderFooter.displayName.header,
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: '',
    methodName: '',
    isFlyout: true,
    flyoutMenuItemIds: exports.kHeaderFooter.menuItems.map(item => `${exports.kHeaderFooter.id.header}_${item.id}`),
    menuItems: exports.kHeaderFooter.menuItems.map(item => ({
        id: `${exports.kHeaderFooter.id.header}_${item.id}`,
        displayName: item.displayName,
    })),
};
// Footer menu definition
exports.kFooter = {
    id: exports.kHeaderFooter.id.footer,
    displayName: exports.kHeaderFooter.displayName.footer,
    iconSlotTriad: { begin: '', main: '', end: '' },
    altId: '',
    methodName: '',
    isFlyout: true,
    flyoutMenuItemIds: exports.kHeaderFooter.menuItems.map(item => `${exports.kHeaderFooter.id.footer}_${item.id}`),
    menuItems: exports.kHeaderFooter.menuItems.map(item => ({
        id: `${exports.kHeaderFooter.id.footer}_${item.id}`,
        displayName: item.displayName,
    })),
};
// Page menu definition
exports.kPage = {
    id: 'page',
    displayName: 'Page',
    iconSlotTriad: { begin: '', main: '📄', end: '' },
    altId: '',
    methodName: '',
    isFlyout: false,
    flyoutMenuItemIds: [exports.kPageSizeId.id, exports.kOrient.id, exports.kMarginId.id, exports.kHeader.id, exports.kFooter.id],
    menuItems: [
        { id: 'header', displayName: 'Header' },
        { id: 'footer', displayName: 'Footer' },
        { id: 'pageSizeId', displayName: 'Size' },
        { id: 'orient', displayName: 'Orient' },
        { id: 'marginId', displayName: 'Margin' },
    ],
};
// Lookup helper for metadata by id
exports.kPageMenuItemsById = Object.fromEntries(exports.kPage.menuItems.map(item => [item.id, item]));
// Header/Footer position menu IDs (all combinations of location + position)
exports.kHeaderFooterMenuIds = [exports.kHeader.id, exports.kFooter.id].flatMap(location => exports.kHeaderFooter.menuItems.map(item => `${location}_${item.id}`));
// Lookup helper for metadata by id
exports.kHeaderFooterSubmenuById = Object.fromEntries(exports.kHeaderFooter.subMenuItems.map(item => [item.id, item]));
// Theme menu definition
exports.kTheme = {
    id: 'theme',
    displayName: 'Theme',
    iconSlotTriad: { begin: '', main: '🎨', end: '' },
    altId: 'github-light',
    methodName: '',
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [], // Themes are dynamically loaded from Shiki
};
exports.kZoomOut = {
    id: 'zoomOut',
    displayName: 'Zoom Out',
    iconSlotTriad: { begin: ' ', main: '−', end: '' },
    altId: '',
    methodName: 'ZoomInOut', // Shared handler with zoomIn
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [],
    shortcutCode: 'Minus', // KeyboardEvent.code for minus key
};
exports.kZoomIn = {
    id: 'zoomIn',
    displayName: 'Zoom In',
    iconSlotTriad: { begin: '', main: '+', end: '' },
    altId: '',
    methodName: 'ZoomInOut', // Shared handler with zoomOut
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [],
    shortcutCode: 'Equal', // KeyboardEvent.code for =/+ key (main keyboard)
};
// Markdown rendering mode menu items (only visible for markdown files)
exports.kMd_Raw = {
    id: 'raw',
    displayName: 'Raw',
    value: false, // false = use Shiki syntax highlighting
};
exports.kMd_Render = {
    id: 'render',
    displayName: 'Render',
    value: true, // true = use VS Code markdown.api.render
};
// Markdown rendering mode menu
exports.kMd = {
    id: 'md',
    displayName: 'Markdown',
    iconSlotTriad: { begin: '', main: '.md', end: '' },
    altId: exports.kMd_Raw.id, // Default to raw mode
    methodName: 'Md',
    isFlyout: false,
    flyoutMenuItemIds: [],
    menuItems: [
        { id: exports.kMd_Raw.id, displayName: exports.kMd_Raw.displayName, value: exports.kMd_Raw.value },
        { id: exports.kMd_Render.id, displayName: exports.kMd_Render.displayName, value: exports.kMd_Render.value },
    ],
};
exports.kZoomLevel = {
    id: 'zoomLevel',
    displayName: 'Zoom Level',
    iconSlotTriad: {
        begin: ' ',
        main: {
            type: 'text_edit',
            constrain: {
                // All three properties work together as a cohesive validation strategy:
                // - regex: Real-time validation during typing (blocks invalid keystrokes)
                //   Use one extra digit (0,4) vs max digits (3) to allow temporary editing
                // - min/max: Final validation on blur (clamps value to valid range)
                //
                // NOTE: Text edit width is auto-calculated as: string(max).length + 1 ch
                //       For max: 250 → width: 4ch, for max: 999 → width: 4ch, for max: 1000 → width: 5ch
                regex: '^\\d{0,4}$', // Only 2 backslashes! Becomes data-{{ns_}}constrain_regex
                min: 50,
                max: 250,
            },
            transform: {
                // Transforms handle their own type conversion using forceNumber
                display: (persist) => {
                    // Convert scale (0.5-2.5) to percentage (50-250)
                    const scale = typeof persist === 'number' ? persist : parseFloat(String(persist));
                    return isNaN(scale) ? undefined : Math.round(scale * 100);
                },
                persist: (display) => {
                    // Convert percentage (50-250) back to scale (0.5-2.5)
                    const percent = typeof display === 'number' ? display : parseFloat(String(display));
                    return isNaN(percent) ? undefined : percent / 100;
                },
            },
            persistId: 'zoomLevel_value',
        },
        end: '%▼',
    },
    altId: '1.00',
    altValue: 1.0,
    methodName: 'ZoomLevel',
    isFlyout: false,
    flyoutMenuItemIds: [],
    min: 0.5,
    max: 2.5,
    stepAmount: 0.1,
    menuItems: [
        { id: '0.50', displayName: '50%', value: 0.5 },
        { id: '0.75', displayName: '75%', value: 0.75 },
        { id: '0.90', displayName: '90%', value: 0.9 },
        {
            id: '1.00',
            displayName: '100% (1:1)',
            shortcut: 'Ctrl/Cmd + 0',
            shortcutCode: 'Digit0',
            value: 1.0,
        },
        { id: '1.25', displayName: '125%', value: 1.25 },
        { id: '1.50', displayName: '150%', value: 1.5 },
        { id: '2.00', displayName: '200%', value: 2.0 },
        { id: '2.50', displayName: '250%', value: 2.5 },
        // fitWidth: scale page to fill window width
        // Formula: windowWidth / pageWidth (e.g., 1200/595 = 2.016 = scale up to fit)
        // Dict guaranteed valid by forceNumber (all values finite, non-zero)
        {
            id: 'fitWidth',
            displayName: 'Fit Width',
            value: (dict) => dict.windowWidth / dict.pageWidth,
        },
        // fitPage: scale page to fit both width and height in viewport (use smaller ratio)
        // Formula: Math.min of width and height ratios (ensures entire page visible)
        // Dict guaranteed valid by forceNumber (all values finite, non-zero)
        {
            id: 'fitPage',
            displayName: 'Fit Page',
            value: (dict) => {
                const widthScale = dict.windowWidth / dict.pageWidth;
                const heightScale = dict.windowHeight / dict.pageHeight;
                return Math.min(widthScale, heightScale);
            },
        },
    ],
};
// All menu constants - shared across PaperPrinter and UIMenu
exports.kMenus = [
    exports.kPrint,
    exports.kPage,
    exports.kPageSizeId,
    exports.kOrient,
    exports.kMarginId,
    exports.kHeader,
    exports.kFooter,
    exports.kTheme,
    exports.kFontSizeId,
    exports.kZoomOut,
    exports.kZoomLevel,
    exports.kZoomIn,
    exports.kMd,
];
// end, PaperPrinter_t.ts
//# sourceMappingURL=PaperPrinter_t.js.map