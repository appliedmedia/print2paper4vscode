/**
 * PaperPrinter Type Definitions
 *
 * Single source of truth for all document configuration and business logic types.
 * All page size, orientation, margin, and font types are defined here.
 * Also includes UI menu structure definitions.
 *
 * Naming convention:
 * - Constants: kFoo (singular with k prefix) - object with id as key, metadata as value
 * - Types: Foo_t (singular with _t suffix) - derived using `keyof typeof kFoo`
 * - Menu ID constants: kFoo_id = 'foo' - the menu ID string
 *
 * Each const object contains ALL metadata (displayName, dimensions, etc.) in ONE place.
 * This eliminates duplicate lookups and keeps everything in sync.
 */

// Print menu definition
export const kPrint = {
  id: 'print',
  displayName: 'Print',
  iconSlotTriad: { begin: '', main: '🖨', end: '' },
  alt: '',
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
  alt: 'a4',
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
  alt: 'portrait',
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
  alt: 'normal',
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
  alt: '12',
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
  alt: '',
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
  alt: '',
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
  alt: '',
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
  alt: '',
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
  alt: 'github-light',
  methodName: '',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [], // Themes are dynamically loaded from Shiki
} as const;

export const kZoomOut = {
  id: 'zoomOut',
  displayName: 'Zoom Out',
  iconSlotTriad: { begin: ' ', main: '−', end: '' },
  alt: '',
  methodName: 'ZoomOut',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [],
  shortcutCode: 'Minus' as const, // KeyboardEvent.code for minus key
} as const;

export const kZoomIn = {
  id: 'zoomIn',
  displayName: 'Zoom In',
  iconSlotTriad: { begin: '', main: '+', end: '' },
  alt: '',
  methodName: 'ZoomIn',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [],
  shortcutCode: 'Equal' as const, // KeyboardEvent.code for =/+ key (main keyboard)
} as const;

export const kZoomLevel = {
  id: 'zoomLevel',
  displayName: 'Zoom Level',
  iconSlotTriad: {
    begin: ' ',
    main: 'text_edit: {"width": "3ch", "constraints_regex": "^\\\\d{0,3}$", "value_min": 10, "value_max": 300}',
    end: '%▼',
  },
  alt: '1.00',
  methodName: 'ZoomLevel',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  min: 0.1,
  max: 3.0,
  stepAmount: 0.1,
  menuItems: [
    { id: '0.10', displayName: '10%', value: 0.1 },
    { id: '0.25', displayName: '25%', value: 0.25 },
    { id: '0.50', displayName: '50%', value: 0.5 },
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
    { id: '3.00', displayName: '300%', value: 3.0 },
    { id: 'fitPage', displayName: 'Fit Page' },
    { id: 'fitWidth', displayName: 'Fit Width' },
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
] as const;

// end, PaperPrinter_t.ts
