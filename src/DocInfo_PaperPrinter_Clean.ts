import type { App } from './App';
import { Persist } from './Persist';

export class DocInfo_PaperPrinter {
  private app: App;
  private persist: Persist;

  // Document content
  public rawCode: string = '';
  public languageId: string = '';
  public printTitle: string = 'Printable';

  // User preferences (persistent) - these get bound to global state
  // No need for private _persist_* properties - Persist handles storage
  public persist_theme: string = 'github-light';
  public persist_fontSizePx: number = 12;
  public persist_pageSizeId: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' = 'a4';
  public persist_orient: 'portrait' | 'landscape' = 'portrait';
  public persist_marginId: 'none' | 'minimal' | 'normal' | 'wide' = 'normal';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  constructor(app: App) {
    this.app = app;
    this.persist = new Persist(app);
    
    // Bind all persistent properties
    this.persist.bind(this, 'theme', 'theme');
    this.persist.bind(this, 'fontSizePx', 'fontSizePx');
    this.persist.bind(this, 'pageSizeId', 'pageSizeId');
    this.persist.bind(this, 'orient', 'orient');
    this.persist.bind(this, 'marginId', 'marginId');
    
    // Initialize from global state
    this.persist.initialize();
  }

  // Computed properties
  get lineHeightPx(): number {
    return this.persist_fontSizePx * 1.2;
  }
}