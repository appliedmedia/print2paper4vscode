"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocInfo_PaperPrinter = void 0;
/**
 * PaperPrinter_DocInfo - Document information and configuration for PaperPrinter
 *
 * This class contains all document-related properties and provides a clean interface
 * for accessing them. The main PaperPrinter class accesses these through this.docInfo.
 */
class DocInfo_PaperPrinter {
    static id = 'docinfo_paperprinter';
    reg;
    fn;
    // Document content
    rawCode = '';
    languageId = 'typescript'; // Default to TypeScript for a coding extension
    printTitle = 'Printable';
    // Computed values (read-only)
    pageWidthPx = 0;
    pageHeightPx = 0;
    constructor(args) {
        this.reg = args.reg;
        this.fn = this.reg.use('persist.get');
    }
    /**
     * Factory method to create DocInfo_PaperPrinter instances
     */
    static create(args) {
        return new DocInfo_PaperPrinter(args);
    }
    // Margin in pixels for webview display
    get marginPx() {
        const marginIdToPx = {
            none: 0, // 0px
            minimal: 7, // ~7px
            normal: 20, // ~20px
            wide: 40, // ~40px
        };
        // Get margin from persist singleton
        const rawMarginId = this.fn.persist.get('marginId');
        const marginId = typeof rawMarginId === 'string' && rawMarginId in marginIdToPx
            ? rawMarginId
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
exports.DocInfo_PaperPrinter = DocInfo_PaperPrinter;
// end, DocInfo_PaperPrinter.ts
//# sourceMappingURL=DocInfo_PaperPrinter.js.map