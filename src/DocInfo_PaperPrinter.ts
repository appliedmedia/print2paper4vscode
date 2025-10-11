import type { App } from './App';
import { Persist } from './Persist';

// Margin level type
export type MarginId = 'none' | 'minimal' | 'normal' | 'wide';

/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 * 
 * This class contains all document-related properties and provides a clean interface
 * for accessing them. The main PaperPrinter class accesses these through this.docInfo.
 */
export class DocInfo_PaperPrinter {
  private app: App;
  public persist: Persist;

  // Document content
  public rawCode: string = '';
  public languageId: string = '';
  public printTitle: string = 'Printable';

  // User preferences (persistent) - these will be moved to persist class
  private _persist_theme: string = 'github-light';
  public persist_fontSizePx: number = 12;
  public persist_pageSizeId: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' = 'a4';
  public persist_orient: 'portrait' | 'landscape' = 'portrait';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  constructor(app: App) {
    this.app = app;
    this.persist = new Persist(app);
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

  // Margin in pixels for webview display
  get marginPx(): { topPx: number; bottomPx: number; leftPx: number; rightPx: number } {
    const marginIdToPx: { [key in MarginId]: number } = {
      none: 0,      // 0px
      minimal: 7,   // ~7px
      normal: 20,   // ~20px  
      wide: 40      // ~40px
    };
    
    const marginPx = marginIdToPx[this.persist.marginId as MarginId];
    
    return {
      topPx: marginPx,
      bottomPx: marginPx,
      leftPx: marginPx,
      rightPx: marginPx
    };
  }

}