import type { App } from './App';

// Margin level type and lookup table
export type MarginId = 'none' | 'minimal' | 'normal' | 'wide';
export const MARGIN_IDS = {
  none: 0,      // 0pts
  minimal: 5,   // ~7px
  normal: 15,   // ~20px  
  wide: 30      // ~40px
} as const;

/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 * 
 * This class contains all document-related properties and provides a clean interface
 * for accessing them. The main PaperPrinter class accesses these through this.docInfo.
 */
export class DocInfo_PaperPrinter {
  private app: App;

  // Document content
  public rawCode: string = '';
  public languageId: string = '';
  public printTitle: string = 'Printable';

  // User preferences (persistent)
  private _persist_theme: string = 'github-light';
  public persist_fontSizePx: number = 12;
  public persist_pageSizeId: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' = 'a4';
  public persist_orient: 'portrait' | 'landscape' = 'portrait';
  public persist_marginId: MarginId = 'normal';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  constructor(app: App) {
    this.app = app;
  }

  // Theme getter/setter with global state sync
  get persist_theme(): string {
    return this._persist_theme;
  }
  set persist_theme(value: string) {
    this._persist_theme = value;
    // Note: global state sync should be handled by the calling class
  }

  // Computed line height
  get lineHeightPx(): number {
    return this.persist_fontSizePx * 1.2;
  }

  // Margin in points - self-contained, no delegates
  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    const marginValue = MARGIN_IDS[this.persist_marginId];
    return {
      topPts: marginValue,
      bottomPts: marginValue,
      leftPts: marginValue,
      rightPts: marginValue
    };
  }
}