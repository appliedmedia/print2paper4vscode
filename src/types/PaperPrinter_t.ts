/**
 * PaperPrinter Type Definitions
 *
 * Single source of truth for all document configuration and business logic types.
 * All page size, orientation, margin, and font types are defined here.
 *
 * Naming convention:
 * - Constants: kFoo (singular with k prefix) - object with id as key, metadata as value
 * - Types: Foo_t (singular with _t suffix) - derived using `keyof typeof kFoo`
 *
 * Each const object contains ALL metadata (displayName, dimensions, etc.) in ONE place.
 * This eliminates duplicate lookups and keeps everything in sync.
 */

// Page size: id → metadata (displayName, dimensions, unit)
export const kPageSizeId = {
  letter: { displayName: 'Letter (8.5" × 11")', width: 8.5, height: 11, unit: 'inches' as const },
  legal: { displayName: 'Legal (8.5" × 14")', width: 8.5, height: 14, unit: 'inches' as const },
  tabloid: { displayName: 'Tabloid (11" × 17")', width: 11, height: 17, unit: 'inches' as const },
  a3: { displayName: 'A3 (297mm × 420mm)', width: 297, height: 420, unit: 'mm' as const },
  a4: { displayName: 'A4 (210mm × 297mm)', width: 210, height: 297, unit: 'mm' as const },
  a5: { displayName: 'A5 (148mm × 210mm)', width: 148, height: 210, unit: 'mm' as const },
} as const;
export type PageSizeId_t = keyof typeof kPageSizeId;
export const kPageSizeId_alt: PageSizeId_t = 'a4';

// Page orientation: id → metadata (displayName with embedded SVG template)
export const kOrient = {
  portrait: { displayName: '{{icon_orient_portrait_svg}} Portrait' },
  landscape: { displayName: '{{icon_orient_landscape_svg}} Landscape' },
} as const;
export type Orient_t = keyof typeof kOrient;
export const kOrient_alt: Orient_t = 'portrait';

// Margin level: id → metadata (displayName with embedded SVG template)
export const kMarginId = {
  none: { displayName: '{{icon_margin_none_svg}} None' },
  minimal: { displayName: '{{icon_margin_minimal_svg}} Minimal' },
  normal: { displayName: '{{icon_margin_normal_svg}} Normal' },
  wide: { displayName: '{{icon_margin_wide_svg}} Wide' },
} as const;
export type MarginId_t = keyof typeof kMarginId;
export const kMarginId_alt: MarginId_t = 'normal';

// Font size: id → metadata (displayName in pixels)
export const kFontSizeId = {
  '8': { displayName: '8px' },
  '9': { displayName: '9px' },
  '10': { displayName: '10px' },
  '11': { displayName: '11px' },
  '12': { displayName: '12px' },
  '14': { displayName: '14px' },
  '18': { displayName: '18px' },
  '20': { displayName: '20px' },
  '24': { displayName: '24px' },
  '32': { displayName: '32px' },
  '48': { displayName: '48px' },
} as const;
export type FontSizeId_t = keyof typeof kFontSizeId;
export const kFontSizeId_alt: FontSizeId_t = '12';

// Theme alternative (not part of a const object, so separate)
export const kTheme_alt: string = 'github-light';

// end, PaperPrinter_t.ts
