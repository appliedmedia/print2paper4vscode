/**
 * PaperPrinter Type Definitions
 *
 * Single source of truth for all document configuration and business logic types.
 * All page size, orientation, margin, and font types are defined here.
 */

// Page size type and values
export type PageSizeId_t = 'letter' | 'legal' | 'a3' | 'a4' | 'a5';
export const kPageSizeIds: PageSizeId_t[] = ['letter', 'legal', 'a3', 'a4', 'a5'];

// Page orientation type and values
export type OrientationId_t = 'portrait' | 'landscape';
export const kOrientationIds: OrientationId_t[] = ['portrait', 'landscape'];

// Margin level type and values
export type MarginId_t = 'none' | 'minimal' | 'normal' | 'wide';
export const kMarginIds: MarginId_t[] = ['none', 'minimal', 'normal', 'wide'];

// Font size type and values
export type FontSizeId_t = '8' | '10' | '12' | '14' | '16' | '18' | '20' | '24';
export const kFontSizeIds: FontSizeId_t[] = ['8', '10', '12', '14', '16', '18', '20', '24'];

// end, PaperPrinter_t.ts

