import type { App } from './App';
import { Persist, type PersistProperties } from './Persist';

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
  public persist: Persist & PersistProperties;

  // Document content
  public rawCode: string = '';
  public languageId: string = '';
  public printTitle: string = 'Printable';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;
  public pageWidthPts: number = 0;
  public pageHeightPts: number = 0;

  constructor(app: App) {
    this.app = app;
    this.persist = new Persist(app) as Persist & PersistProperties;
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