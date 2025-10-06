/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 * 
 * This class provides a clean interface to PaperPrinter's document-related properties
 * through getters/setters that map directly to the owner's fields.
 */
export class PaperPrinter_DocInfo {
  private owner: any;
  private app: any;

  constructor(owner: any, app: any) {
    this.owner = owner;
    this.app = app;
  }

  // Document content
  get rawCode(): string {
    return this.owner.rawCode;
  }
  set rawCode(value: string) {
    this.owner.rawCode = value;
  }

  get languageId(): string {
    return this.owner.languageId;
  }
  set languageId(value: string) {
    this.owner.languageId = value;
  }

  get printTitle(): string {
    return this.owner.printTitle;
  }
  set printTitle(value: string) {
    this.owner.printTitle = value;
  }

  // User preferences (persistent)
  get persist_theme(): string {
    return this.owner.docInfo._persist_theme || 'github-light';
  }
  set persist_theme(value: string) {
    this.owner.docInfo._persist_theme = value;
    this.owner.localGlobalUpdate(this.owner.docInfo, 'theme', value);
  }

  get persist_fontSizePx(): number {
    return this.owner.persist_fontSizePx;
  }
  set persist_fontSizePx(value: number) {
    this.owner.persist_fontSizePx = value;
  }

  get persist_pageSizeId(): string {
    return this.owner.pageSizeId;
  }
  set persist_pageSizeId(value: string) {
    this.owner.pageSizeId = value;
  }

  get persist_orient(): string {
    return this.owner.orient;
  }
  set persist_orient(value: string) {
    this.owner.orient = value;
  }

  get persist_marginId(): string {
    return this.owner.marginId;
  }
  set persist_marginId(value: string) {
    this.owner.marginId = value;
  }

  // Computed values
  get lineHeightPx(): number {
    return this.owner.lineHeightPx;
  }

  get pageWidthPx(): number {
    return this.owner.pageWidthPx;
  }

  get pageHeightPx(): number {
    return this.owner.pageHeightPx;
  }

  get pageWidthPts(): number {
    return this.owner.pageWidthPts;
  }

  get pageHeightPts(): number {
    return this.owner.pageHeightPts;
  }

  get marginPts(): { topPts: number; bottomPts: number; leftPts: number; rightPts: number } {
    return this.owner.getMarginPts();
  }
}