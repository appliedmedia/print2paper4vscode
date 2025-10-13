/**
 * PaperPrinter Type Definitions
 *
 * Single source of truth for all document configuration and business logic types.
 * All page size, orientation, margin, and font types are defined here.
 *
 * Naming convention:
 * - Constants: kFoo (singular with k prefix, NOT plural) - defined FIRST with 'as const'
 * - Types: Foo_t (singular with _t suffix) - derived from constant using typeof
 *
 * This ensures the const is the single source of truth and types stay in sync.
 */

// Page size: const first, type derived
export const kPageSizeId = ['letter', 'legal', 'a3', 'a4', 'a5'] as const;
export type PageSizeId_t = (typeof kPageSizeId)[number];

// Page orientation: const first, type derived (no "Id" suffix - key is just "orient")
export const kOrient = ['portrait', 'landscape'] as const;
export type Orient_t = (typeof kOrient)[number];

// Margin level: const first, type derived
export const kMarginId = ['none', 'minimal', 'normal', 'wide'] as const;
export type MarginId_t = (typeof kMarginId)[number];

// Font size: const first, type derived
export const kFontSizeId = ['8', '10', '12', '14', '18', '20', '24', '32', '48'] as const;
export type FontSizeId_t = (typeof kFontSizeId)[number];

// end, PaperPrinter_t.ts
