/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 * 
 * This class contains all document-related properties and provides a clean interface
 * for accessing them. The main PaperPrinter class accesses these through this.docInfo.
 */
export class PaperPrinter_DocInfo {
  private owner: any;
  private app: any;

  // Document content
  public rawCode: string = '';
  public languageId: string = '';
  public printTitle: string = 'Printable';

  // User preferences (persistent)
  private _persist_theme: string = 'github-light';
  public persist_fontSizePx: number = 12;
  public persist_pageSizeId: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' = 'a4';
  public persist_orient: 'portrait' | 'landscape' = 'portrait';
  public persist_marginId: 'none' | 'minimal' | 'normal' | 'wide' = 'normal';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  constructor(owner: any, app: any) {
    this.owner = owner;
    this.app = app;
  }

  // Theme getter/setter with global state sync
  get persist_theme(): string {
    return this._persist_theme;
  }
  set persist_theme(value: string) {
    this._persist_theme = value;
    this.owner.localGlobalUpdate(this, 'theme', value);
  }

  // Computed line height
  get lineHeightPx(): number {
    return this.persist_fontSizePx * 1.2;
  }

  // Margin in points
  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    return this.owner.getMarginPts();
  }
}