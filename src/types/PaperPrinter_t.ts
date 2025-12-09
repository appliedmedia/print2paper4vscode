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

/**
 * Menu Item Value System - For menu items with dynamic or static values
 *
 * The `value` property on menu items is polymorphic and can be:
 * 1. **Literal number**: `value: 1.0` - Static numeric value (e.g., zoom level)
 * 2. **Literal string**: `value: "title"` - Static string content (e.g., header/footer template ID)
 * 3. **Resolver function**: `value: (dict) => ...` - Dynamic value computed from context
 *
 * Resolver Function Contract:
 * - Receives UIMenuItemDict_t validated by forceNumber() with all required keys present
 * - All dict values guaranteed to be finite numbers (non-zero unless explicitly set)
 * - Required keys: windowWidth, windowHeight, pageWidth, pageHeight
 * - Returns number | string | undefined based on computation
 * - NO defensive checks needed - dict is always valid when resolver is called
 *
 * Value Resolution Flow:
 * 1. UIMenuMgr.buildUIMenuItemDict() creates dict from context + PDF dimensions
 * 2. App.forceNumber(dict, useForZero=1, requiredKeys) validates all inputs
 * 3. Resolver function executes with guaranteed-valid dict
 * 4. Result flows to consumer who decides if/when to call forceNumber() on result
 *
 * Type Preservation:
 * - Keep results as number | string | undefined through the pipeline
 * - Only call forceNumber() at consumer level when numeric value is required
 * - This preserves flexibility for string values (headers/footers) vs numeric (zoom)
 */
export type UIMenuItemDict_t = Record<string, number>;
export type UIMenuItemValueFxn_t = (dict: UIMenuItemDict_t) => number | string | undefined;

// Print menu definition
export const kPrint = {
  id: 'print',
  displayName: 'Print',
  iconSlotTriad: { begin: '', main: '🖨', end: '' },
  altId: '',
  methodName: '',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: 'preview', displayName: 'Print with Preview' },
    { id: 'direct', displayName: 'Print' },
    { id: 'save', displayName: 'Save as PDF' },
  ],
} as const;
export type PrintMenuItems_t = (typeof kPrint.menuItems)[number]['id'];

// Page size menu definition
export const kPageSizeId = {
  id: 'pageSizeId',
  displayName: 'Size',
  iconSlotTriad: { begin: '', main: '', end: '' },
  altId: 'a4',
  methodName: 'PageSizeId',
  isFlyout: true,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    {
      id: 'letter',
      displayName: 'Letter (8.5" × 11")',
      width: 8.5,
      height: 11,
      unit: 'inches' as const,
    },
    {
      id: 'legal',
      displayName: 'Legal (8.5" × 14")',
      width: 8.5,
      height: 14,
      unit: 'inches' as const,
    },
    {
      id: 'tabloid',
      displayName: 'Tabloid (11" × 17")',
      width: 11,
      height: 17,
      unit: 'inches' as const,
    },
    { id: 'a3', displayName: 'A3 (297mm × 420mm)', width: 297, height: 420, unit: 'mm' as const },
    { id: 'a4', displayName: 'A4 (210mm × 297mm)', width: 210, height: 297, unit: 'mm' as const },
    { id: 'a5', displayName: 'A5 (148mm × 210mm)', width: 148, height: 210, unit: 'mm' as const },
  ],
} as const;
export type PageSizeIdMenuItems_t = (typeof kPageSizeId.menuItems)[number]['id'];
// Lookup helper for metadata by id
export const kPageSizeIdById = Object.fromEntries(
  kPageSizeId.menuItems.map(item => [item.id, item])
) as unknown as Record<
  PageSizeIdMenuItems_t,
  { width: number; height: number; unit: 'inches' | 'mm' }
>;

// Page orientation menu definition
export const kOrient = {
  id: 'orient',
  displayName: 'Orient',
  iconSlotTriad: { begin: '', main: '', end: '' },
  altId: 'portrait',
  methodName: '',
  isFlyout: true,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: 'portrait', displayName: '{{icon_orient_portrait_svg}} Portrait' },
    { id: 'landscape', displayName: '{{icon_orient_landscape_svg}} Landscape' },
  ],
} as const;
export type OrientMenuItems_t = (typeof kOrient.menuItems)[number]['id'];

// Margin menu definition
export const kMarginId = {
  id: 'marginId',
  displayName: 'Margin',
  iconSlotTriad: { begin: '', main: '', end: '' },
  altId: 'normal',
  methodName: 'MarginId',
  isFlyout: true,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: 'none', displayName: '{{icon_margin_none_svg}} None', marginPts: 0 },
    { id: 'minimal', displayName: '{{icon_margin_minimal_svg}} Minimal', marginPts: 5 },
    { id: 'normal', displayName: '{{icon_margin_normal_svg}} Normal', marginPts: 15 },
    { id: 'wide', displayName: '{{icon_margin_wide_svg}} Wide', marginPts: 30 },
  ],
} as const;
export type MarginIdMenuItems_t = (typeof kMarginId.menuItems)[number]['id'];
// Lookup helper for metadata by id
export const kMarginIdById = Object.fromEntries(
  kMarginId.menuItems.map(item => [item.id, item])
) as unknown as Record<MarginIdMenuItems_t, { marginPts: number }>;

// Font size menu definition
export const kFontSizeId = {
  id: 'fontSizeId',
  displayName: 'Text',
  iconSlotTriad: { begin: '', main: 'Tt', end: '' },
  altId: '12',
  altValue: 12,
  methodName: '',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
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
} as const;
export type FontSizeIdMenuItems_t = (typeof kFontSizeId.menuItems)[number]['id'];

// Header/Footer position menu definition
export const kHeaderFooter = {
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
} as const;
export type HeaderFooterPosMenuItems_t = (typeof kHeaderFooter.menuItems)[number]['id'];
export type HeaderFooterPos_t = HeaderFooterPosMenuItems_t;
// Lookup helper for metadata by id
export const kHeaderFooterMenuItemsById = Object.fromEntries(
  kHeaderFooter.menuItems.map(item => [item.id, item])
) as unknown as Record<HeaderFooterPos_t, { id: string; displayName: string }>;

// Header menu definition
export const kHeader = {
  id: kHeaderFooter.id.header,
  displayName: kHeaderFooter.displayName.header,
  iconSlotTriad: { begin: '', main: '', end: '' },
  altId: '',
  methodName: '',
  isFlyout: true,
  flyoutMenuItemIds: kHeaderFooter.menuItems.map(
    item => `${kHeaderFooter.id.header}_${item.id}`
  ) as readonly string[],
  menuItems: kHeaderFooter.menuItems.map(item => ({
    id: `${kHeaderFooter.id.header}_${item.id}`,
    displayName: item.displayName,
  })),
} as const;

// Footer menu definition
export const kFooter = {
  id: kHeaderFooter.id.footer,
  displayName: kHeaderFooter.displayName.footer,
  iconSlotTriad: { begin: '', main: '', end: '' },
  altId: '',
  methodName: '',
  isFlyout: true,
  flyoutMenuItemIds: kHeaderFooter.menuItems.map(
    item => `${kHeaderFooter.id.footer}_${item.id}`
  ) as readonly string[],
  menuItems: kHeaderFooter.menuItems.map(item => ({
    id: `${kHeaderFooter.id.footer}_${item.id}`,
    displayName: item.displayName,
  })),
} as const;

// Page menu definition
export const kPage = {
  id: 'page',
  displayName: 'Page',
  iconSlotTriad: { begin: '', main: '📄', end: '' },
  altId: '',
  methodName: '',
  isFlyout: false,
  flyoutMenuItemIds: [kPageSizeId.id, kOrient.id, kMarginId.id, kHeader.id, kFooter.id] as const,
  menuItems: [
    { id: 'header', displayName: 'Header' },
    { id: 'footer', displayName: 'Footer' },
    { id: 'pageSizeId', displayName: 'Size' },
    { id: 'orient', displayName: 'Orient' },
    { id: 'marginId', displayName: 'Margin' },
  ],
} as const;
export type PageMenuItems_t = (typeof kPage.menuItems)[number]['id'];
// Lookup helper for metadata by id
export const kPageMenuItemsById = Object.fromEntries(
  kPage.menuItems.map(item => [item.id, item])
) as unknown as Record<PageMenuItems_t, { id: string; displayName: string }>;

// Header/Footer position menu IDs (all combinations of location + position)
export const kHeaderFooterMenuIds = [kHeader.id, kFooter.id].flatMap(location =>
  kHeaderFooter.menuItems.map(item => `${location}_${item.id}`)
) as readonly `${typeof kHeader.id | typeof kFooter.id}_${HeaderFooterPos_t}`[];

// Header/Footer submenu content types (referenced from kHeaderFooter.subMenuItems)
export type HeaderFooterSubmenuMenuItems_t = (typeof kHeaderFooter.subMenuItems)[number]['id'];
export type HeaderFooterSubmenu_t = HeaderFooterSubmenuMenuItems_t;
// Lookup helper for metadata by id
export const kHeaderFooterSubmenuById = Object.fromEntries(
  kHeaderFooter.subMenuItems.map(item => [item.id, item])
) as unknown as Record<HeaderFooterSubmenu_t, { template: string }>;

// Theme menu definition
export const kTheme = {
  id: 'theme',
  displayName: 'Theme',
  iconSlotTriad: { begin: '', main: '🎨', end: '' },
  altId: 'github-light',
  methodName: '',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [], // Themes are dynamically loaded from Shiki
} as const;

export const kZoomOut = {
  id: 'zoomOut',
  displayName: 'Zoom Out',
  iconSlotTriad: { begin: ' ', main: '−', end: '' },
  altId: '',
  methodName: 'ZoomInOut', // Shared handler with zoomIn
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [],
  shortcutCode: 'Minus' as const, // KeyboardEvent.code for minus key
} as const;

export const kZoomIn = {
  id: 'zoomIn',
  displayName: 'Zoom In',
  iconSlotTriad: { begin: '', main: '+', end: '' },
  altId: '',
  methodName: 'ZoomInOut', // Shared handler with zoomOut
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [],
  shortcutCode: 'Equal' as const, // KeyboardEvent.code for =/+ key (main keyboard)
} as const;

// Markdown rendering mode menu items (only visible for markdown files)
export const kMd_Raw = {
  id: 'raw',
  displayName: 'Raw',
  value: false, // false = use Shiki syntax highlighting
} as const;

export const kMd_Render = {
  id: 'render',
  displayName: 'Render',
  value: true, // true = use VS Code markdown.api.render
} as const;

// Markdown rendering mode menu
export const kMd = {
  id: 'md',
  displayName: 'Markdown',
  iconSlotTriad: { begin: '', main: '.md', end: '' },
  altId: kMd_Raw.id, // Default to raw mode
  methodName: 'Md',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: kMd_Raw.id, displayName: kMd_Raw.displayName },
    { id: kMd_Render.id, displayName: kMd_Render.displayName },
  ],
} as const;
export type MdMenuItems_t = (typeof kMd.menuItems)[number]['id'];

export const kZoomLevel = {
  id: 'zoomLevel',
  displayName: 'Zoom Level',
  iconSlotTriad: {
    begin: ' ',
    main: {
      type: 'text_edit' as const,
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
        display: (persist: string | number | undefined): number | undefined => {
          // Convert scale (0.5-2.5) to percentage (50-250)
          const scale = typeof persist === 'number' ? persist : parseFloat(String(persist));
          return isNaN(scale) ? undefined : Math.round(scale * 100);
        },
        persist: (display: string | number | undefined): number | undefined => {
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
  flyoutMenuItemIds: [] as const,
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
      value: (dict: UIMenuItemDict_t) => dict.windowWidth / dict.pageWidth,
    },
    // fitPage: scale page to fit both width and height in viewport (use smaller ratio)
    // Formula: Math.min of width and height ratios (ensures entire page visible)
    // Dict guaranteed valid by forceNumber (all values finite, non-zero)
    {
      id: 'fitPage',
      displayName: 'Fit Page',
      value: (dict: UIMenuItemDict_t) => {
        const widthScale = dict.windowWidth / dict.pageWidth;
        const heightScale = dict.windowHeight / dict.pageHeight;
        return Math.min(widthScale, heightScale);
      },
    },
  ],
} as const;
export type ZoomLevelMenuItems_t = (typeof kZoomLevel.menuItems)[number]['id'];

// All menu constants - shared across PaperPrinter and UIMenu
export const kMenus = [
  kPrint,
  kPage,
  kPageSizeId,
  kOrient,
  kMarginId,
  kHeader,
  kFooter,
  kTheme,
  kFontSizeId,
  kZoomOut,
  kZoomLevel,
  kZoomIn,
  kMd,
] as const;

// end, PaperPrinter_t.ts
