"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocInfo_PDF = void 0;
const PaperPrinter_t_1 = require("./types/PaperPrinter_t");
const Coords_1 = require("./Coords");
/**
 * PDF_DocInfo - Document information and configuration for PDF
 *
 * This class contains all PDF-related properties and provides a clean interface
 * for accessing them. The main PDF class accesses these through this.docInfo.
 */
class DocInfo_PDF {
    static id = 'docinfo_pdf';
    reg;
    fn;
    // PDF document state
    currentPdfDoc = null;
    currentTokens = null;
    // PDF document wrapper - holds the jsPDF object and exposes interface methods
    pdfDoc = null;
    // PDF generation settings
    embedFonts = true;
    compress = true;
    quality = 0.92;
    // Page rendering settings
    pageWidthPts = 0;
    pageHeightPts = 0;
    // Margin settings (all 4 sides in points)
    marginTopPts = 15;
    marginBottomPts = 15;
    marginLeftPts = 15;
    marginRightPts = 15;
    // Font settings
    fontSizePts = 0;
    fontSizePx = 12; // Font size in pixels (source value)
    lineHeightPts = 0;
    lineHeightPx = 18; // Line height in pixels (source value)
    fontFamily = 'Courier';
    // Theme and styling
    theme = 'github-light';
    // Page settings
    pageSizeId = 'a4';
    orient = 'portrait';
    marginId = 'normal';
    // Document content (set by caller before generatePdf)
    code = '';
    languageId = 'typescript';
    title = '';
    // Temporary file tracking
    tempPdfs = [];
    constructor(args) {
        this.reg = args.reg;
        this.fn = this.reg.use('coords.pdfPtsToCssPx');
    }
    /**
     * Factory method to create DocInfo_PDF instances
     */
    static create(args) {
        return new DocInfo_PDF(args);
    }
    // Margin getter - calculates from current marginId
    // Always includes base 0.4 inch (28.8 pts) minimum margin for safe printing
    // Margin settings (none/minimal/normal/wide) are ADDED to this base
    get marginPts() {
        // Get margin setting from kMarginIdById (this is ADDED to base)
        const marginEntry = PaperPrinter_t_1.kMarginIdById[this.marginId] ?? PaperPrinter_t_1.kMarginIdById['normal'];
        const marginSettingPts = marginEntry.marginPts;
        // Total margin = base + setting
        const totalMarginPts = Coords_1.Coords.kMarginGutterMinPts + marginSettingPts;
        return {
            topMarginPts: totalMarginPts,
            bottomMarginPts: totalMarginPts,
            leftMarginPts: totalMarginPts,
            rightMarginPts: totalMarginPts,
        };
    }
    // Margin setter - sets all 4 sides
    set marginPts(value) {
        this.marginTopPts = value.topMarginPts;
        this.marginBottomPts = value.bottomMarginPts;
        this.marginLeftPts = value.leftMarginPts;
        this.marginRightPts = value.rightMarginPts;
    }
    // PDF interface methods - expose jsPDF functionality through docInfo
    /**
     * Get the current page number (1-indexed)
     */
    get pageNumber() {
        return this.getCurrentPageInfo().pageNumber;
    }
    /**
     * Get the total number of pages in the document
     * Uses getNumberOfPages() - this is the current jsPDF API (not deprecated in actual library)
     */
    get pageTotal() {
        if (!this.pdfDoc)
            return 0;
        // getNumberOfPages() is the correct API - not actually deprecated in jsPDF 2.5.2
        return this.pdfDoc.getNumberOfPages();
    }
    /**
     * Get the total number of pages in the document (method version)
     * @deprecated Use pageTotal property instead
     */
    getPageTotal() {
        return this.pageTotal;
    }
    /**
     * Get the number of pages in the document (alias for getPageTotal)
     * @deprecated Use pageTotal property instead
     */
    getNumberOfPages() {
        return this.pageTotal;
    }
    /**
     * Get the width of the current page in points
     */
    getPageWidth() {
        if (!this.pdfDoc)
            return 0;
        return this.pdfDoc.getPageWidth();
    }
    /**
     * Get the height of the current page in points
     */
    getPageHeight() {
        if (!this.pdfDoc)
            return 0;
        return this.pdfDoc.getPageHeight();
    }
    /**
     * Set the current page number
     * @param pageNumber The page number to set (1-indexed)
     */
    setPage(pageNumber) {
        if (this.pdfDoc) {
            this.pdfDoc.setPage(pageNumber);
        }
    }
    /**
     * Get information about the current page
     * Returns pageNumber and pageTotal
     */
    getCurrentPageInfo() {
        let pageNumber = 0;
        let pageTotal = 0;
        if (this.pdfDoc) {
            const info = this.pdfDoc.getCurrentPageInfo();
            pageNumber = info.pageNumber;
            pageTotal = this.pageTotal;
        }
        return { pageNumber, pageTotal };
    }
    /**
     * Get page dimensions in pixels (UI native format)
     * PDF layer uses points internally but exposes pixels for UI consumption
     */
    get pageSizePx() {
        if (!this.pdfDoc) {
            return { widthPx: 0, heightPx: 0 };
        }
        // Use Coords via registry
        const pageWidthPts = this.getPageWidth();
        const pageHeightPts = this.getPageHeight();
        return {
            widthPx: Math.round(this.fn.coords.pdfPtsToCssPx(pageWidthPts)),
            heightPx: Math.round(this.fn.coords.pdfPtsToCssPx(pageHeightPts)),
        };
    }
    /**
     * Get the PDF as an ArrayBuffer
     */
    asArrayBuffer() {
        return this.pdfDoc ? this.pdfDoc.output('arraybuffer') : new ArrayBuffer(0);
    }
    /**
     * Get the PDF as a data URL string
     */
    asDataUrl() {
        return this.pdfDoc ? this.pdfDoc.output('dataurlstring') : '';
    }
}
exports.DocInfo_PDF = DocInfo_PDF;
// end, DocInfo_PDF.ts
//# sourceMappingURL=DocInfo_PDF.js.map