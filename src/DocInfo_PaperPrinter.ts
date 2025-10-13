import type { App } from './App';
import type { LanguageId_t } from './Stylize';

// Margin level type
export type MarginId_t = 'none' | 'minimal' | 'normal' | 'wide';

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
  public languageId: LanguageId_t = 'plaintext';
  public printTitle: string = 'Printable';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;

  constructor(app: App) {
    this.app = app;
  }

  // Margin in pixels for webview display
  get marginPx(): { topPx: number; bottomPx: number; leftPx: number; rightPx: number } {
    const marginIdToPx: { [key in MarginId_t]: number } = {
      none: 0, // 0px
      minimal: 7, // ~7px
      normal: 20, // ~20px
      wide: 40, // ~40px
    };

    // Get margin from menu's persistent state
    const menu = this.app.uimenumgr.getMenuById('marginId');
    const rawMarginId = menu.persist.marginId;
    const marginId: MarginId_t =
      typeof rawMarginId === 'string' && rawMarginId in marginIdToPx
        ? (rawMarginId as MarginId_t)
        : 'normal';
    const marginPx = marginIdToPx[marginId];

    return {
      topPx: marginPx,
      bottomPx: marginPx,
      leftPx: marginPx,
      rightPx: marginPx,
    };
  }
}

// end, DocInfo_PaperPrinter.ts
