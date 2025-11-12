import type { App } from './App';
import type { LanguageId_t } from './Stylize';
import type { MarginIdMenuItems_t } from './types/PaperPrinter_t';

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
  public languageId: LanguageId_t = 'typescript'; // Default to TypeScript for a coding extension
  public printTitle: string = 'Printable';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;

  constructor(app: App) {
    this.app = app;
  }

  // Margin in pixels for webview display
  get marginPx(): { topPx: number; bottomPx: number; leftPx: number; rightPx: number } {
    const marginIdToPx: { [key in MarginIdMenuItems_t]: number } = {
      none: 0, // 0px
      minimal: 7, // ~7px
      normal: 20, // ~20px
      wide: 40, // ~40px
    };

    // Get margin from menu's persistent state
    // Handle case where menu doesn't exist (e.g., in tests)
    let marginId: MarginIdMenuItems_t = 'normal'; // Default to 'normal'
    try {
      const menu = this.app.uimenumgr.getMenuById('marginId');
      const rawMarginId = menu.persist.marginId;
      marginId =
        typeof rawMarginId === 'string' && rawMarginId in marginIdToPx
          ? (rawMarginId as MarginIdMenuItems_t)
          : 'normal';
    } catch {
      // Menu doesn't exist, use default 'normal' margin
      marginId = 'normal';
    }
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
