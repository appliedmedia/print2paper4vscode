import type { FnImport_t } from './types/Registry_t';
import type { Registry } from './Registry';
import type { LanguageId_t } from './Stylize';
import type { MarginIdMenuItems_t } from './types/PaperPrinter_t';

/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 *
 * This class contains all document-related properties and provides a clean interface
 * for accessing them. The main PaperPrinter class accesses these through this.docInfo.
 */
export class DocInfo_PaperPrinter {
  static readonly id = 'docinfo_paperprinter';
  private reg: Registry;
  private fn: FnImport_t;

  // Document content
  public rawCode: string = '';
  public languageId: LanguageId_t = 'typescript'; // Default to TypeScript for a coding extension
  public printTitle: string = 'Printable';

  // Computed values (read-only)
  public pageWidthPx: number = 0;
  public pageHeightPx: number = 0;

  private constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    this.fn = this.reg.use('persist.get');
  }
  
  /**
   * Factory method to create DocInfo_PaperPrinter instances
   */
  static create(args: { reg: Registry }): DocInfo_PaperPrinter {
    return new DocInfo_PaperPrinter(args);
  }

  // Margin in pixels for webview display
  get marginPx(): { topPx: number; bottomPx: number; leftPx: number; rightPx: number } {
    const marginIdToPx: { [key in MarginIdMenuItems_t]: number } = {
      none: 0, // 0px
      minimal: 7, // ~7px
      normal: 20, // ~20px
      wide: 40, // ~40px
    };

    // Get margin from persist singleton
    const rawMarginId = this.fn.persist.get('marginId');
    const marginId: MarginIdMenuItems_t =
      typeof rawMarginId === 'string' && rawMarginId in marginIdToPx
        ? (rawMarginId as MarginIdMenuItems_t)
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
