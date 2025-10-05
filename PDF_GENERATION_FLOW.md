# PDF Generation Flow Analysis

## 🚀 COMPLETE REFACTOR TODO LIST

### Phase 1: Simple Changes (Handler Simplification - DONE)
- ✅ Add `regenerateAndUpdateWebview()` method to PaperPrinter
- ✅ Simplify all 4 menu handlers to use the new method
- ✅ Eliminate ~110 lines of duplicated code

### Phase 2: YAML and SVG System (COMPLETED)
- ✅ Add YAML getter to PaperPrinter class
- ✅ Update PaperPrinter.yaml with new icon names (`icon_orient_portrait_svg`, etc.)
- ✅ Fix menuItems_Orient() to use template literals like margin
- ✅ Add menuItems_Margin() method
- ✅ Remove manual SVG handling from UIMenu.ts
- ✅ Update UIMenu.ts to remove `{{svg:...}}` processing

**Phase 2 Results:**
- No more manual SVG replacement bullshit
- Consistent template literal approach across all menu items
- PaperPrinter handles its own YAML loading and SVG processing
- UIMenu just uses the processed displayName as-is
- All icons have consistent `_svg` suffix naming

### Phase 3: Document Info Structure (COMPLETED)
- ✅ Create `docInfo` struct in PaperPrinter with `persist_` prefix
- ✅ Create `docInfo` struct in PDF class for computed values
- ✅ Add `localGlobalUpdate()` method for persistent variables
- ✅ Add getters/setters with `persist_` prefix (e.g., `get persist_themeChoice()`)
- ✅ Update PDF class to access via `this.app.paperprinter.docInfo`

**Phase 3 Results:**
- PaperPrinter has `docInfo` with document content + persistent user preferences
- PDF has `docInfo` with computed values (page dimensions, margins, etc.)
- `localGlobalUpdate()` method handles both local + global state updates
- Getters/setters use `persist_` prefix so callers know they're persistent
- PDF accesses PaperPrinter data via `this.app.paperprinter.docInfo`
- No more parameter passing of configuration structs

### Phase 4: Method Signatures and Parameters (COMPLETED)
- ✅ Add `pageBegin`/`pageEnd` parameters to Stylize.tokenize()
- ✅ Add `pageBegin`/`pageEnd` parameters to PDF.renderPage()
- ✅ Add `optPerLineHandler` parameter to Stylize.tokenize()
- ✅ Add `PDF.renderByLine()` method for incremental PDF building
- ✅ Add `PDF.finish()` method to complete PDF

**Phase 4 Results:**
- Stylize.tokenize() supports page range filtering (1,0=page1; 0,0=all; 1,2=pages1-2)
- optPerLineHandler callback enables parallel rendering architecture
- PDF.renderByLine() builds jsPDF incrementally with per-line processing
- PDF.finish() completes the PDF and resets state
- Method signatures support the new page-by-page rendering flow

### Phase 5: Margin System (COMPLETED)
- ✅ Add `persist_marginId` to PaperPrinter docInfo
- ✅ Create `MARGIN_IDS` const lookup table
- ✅ Add `getMarginPts()` method
- ✅ Add margin menu handler

**Phase 5 Results:**
- Margin system with 4 levels: none (0pts), minimal (5pts), normal (15pts), wide (30pts)
- Const lookup table for type-safe margin calculations
- Margin menu with SVG icons for visual selection
- Margin handler follows same pattern as other menu handlers
- getMarginPts() method converts margin ID to points

### Phase 6: Cleanup
- [ ] Remove old methods: `styleToPdf()`, `Converter_StyleToPdf`, `generatePdfFromTokens()`
- [ ] Update all method calls to use new signatures
- [ ] Test the complete flow

**Total: ~25 tasks across 6 phases**

---

## 📋 TABLE OF CONTENTS

### 🔍 UNDERSTANDING THE PROBLEM (Read First)

1. **[Current Call Chain](#current-call-chain)** - Maps the existing execution flow from `PaperPrinter` → `Stylize` → `PDF`
   - Shows how parameters are (or aren't) being passed through
   - Identifies where things go wrong

2. **[Critical Issues](#critical-issues)** - The four major fuck-ups in current architecture
   - Missing parameters throughout the chain
   - `generatePdfFromTokens()` only renders page 1
   - Confusing circular dependencies
   - Global state instead of explicit parameters

3. **[What Should Happen](#what-should-happen)** - Brief overview of correct flow
   - How parameters should be passed
   - What each component should do

4. **[Architecture Questions](#architecture-questions)** - Questions about why things are the way they are
   - Why does `generatePdfFromTokens()` return PDFDoc?
   - What is `this.pdfDoc` used for? (Answer: Print/Save operations)

### 🛠️ THE SOLUTION (Execute in This Order)

**PHASE 1: Type Definitions**

5. **[STANDARDIZED OPTIONS STRUCTURE](#standardized-options-structure)** - Define `PDFDocInfo` interface
   - **DO THIS FIRST** - Create `src/types/PDFDocInfo_t.ts`
   - Single source of truth for all PDF configuration
   - All measurements in points (not pixels)
   - Includes: title, pageSizeId, orient, dimensions, fonts, theme, margins

**PHASE 2: Core Refactor**

6. **[PROPOSED REFACTOR](#proposed-refactor)** - Complete architectural overhaul
   - **Step 1:** Add `Stylize.tokenize()` - simple tokenization without PDF generation
   - **Step 2:** Add `PDF.setTokensAndConfig(tokens, docInfo)` - store tokens + config
   - **Step 3:** Add `PDF.generateFullDocument()` - create complete multi-page jsPDF
   - **Step 4:** Add `PaperPrinter.createPDFDocInfo()` - convert pixels to points, create PDFDocInfo
   - **Step 5:** Update `PaperPrinter.generatePdf()` - use new tokenize + configure flow
   - **Step 6:** Update `PageRender` interface to use `PDFDocInfo`
   - **Step 7:** Test Print/Save operations
   - **Step 8:** Test webview page rendering
   - **Step 9:** Remove old methods: `styleToPdf()`, `Converter_StyleToPdf`, `generatePdfFromTokens()`

**PHASE 3: Menu Handler Cleanup**

7. **[MENU HANDLERS REFACTOR](#menu-handlers-refactor)** - Eliminate duplicated regeneration code
   - **Step 1:** Add `regenerateAndUpdateWebview()` method to PaperPrinter
   - **Step 2:** Simplify all 4 menu handlers (Theme, Text, Page, Orient) to:
     1. Update their ONE property
     2. Call `regenerateAndUpdateWebview()`
     3. Return selection
   - **Result:** Eliminate ~110 lines of duplicated bullshit

### 📊 Summary Stats

**Code Deletions:**

- `Stylize.styleToPdf()` and `Converter_StyleToPdf` class
- `PDF.generatePdfFromTokens()`
- ~110 lines of duplicated menu handler code

**Code Additions:**

- `src/types/PDFDocInfo_t.ts` - new type definition
- `Stylize.tokenize()` - ~30 lines
- `PDF.setTokensAndConfig()` - ~15 lines
- `PDF.generateFullDocument()` - ~40 lines
- `PDF.renderTokensToPage()` - ~25 lines
- `PaperPrinter.createPDFDocInfo()` - ~40 lines
- `PaperPrinter.regenerateAndUpdateWebview()` - ~30 lines

**Net Result:** Less code, clearer architecture, correct multi-page PDF generation

---

## Current Call Chain

### Initial PDF Generation (openWebView)

```
1. PaperPrinter.openWebView()
   ↓
2. PaperPrinter.generatePdf()
   - Calls: this.app.stylize.styleToPdf(this.rawCode, this.languageId, options)
   - Options: { fontSize, lineHeight, title, theme }
   - **MISSING: pageSizeId, orient** ❌
   ↓
3. Stylize.styleToPdf()
   - Creates Converter_StyleToPdf instance
   - Calls: converter.convert(code, languageId, opts)
   ↓
4. Converter_StyleToPdf.convert()
   - Generates tokens from code
   - Extracts font info from options
   - Calls: generatePdfDocument(tokens, fontInfo, title)
   - **MISSING: theme, pageSizeId, orient** ❌
   ↓
5. Converter_StyleToPdf.generatePdfDocument()
   - Calls: this.app.pdf.generatePdfFromTokens(tokens, fontFamily, fontSizePx, lineHeightPx, title)
   - **MISSING: theme, pageSizeId, orient** ❌
   ↓
6. PDF.generatePdfFromTokens()
   - **READS pageSizeId and orient from GLOBAL STATE** ❌
   - Calls: this.setTokens(tokens) to store tokens
   - Creates renderOptions with hardcoded theme: 'github-light' ❌
   - Calls: this.renderPage(1, renderOptions) **ONLY RENDERS PAGE 1** ❌
   - Creates new jsPDF document from page 1 data URL
   - Returns PDFDoc (but it's broken for multi-page)
```

### Per-Page Rendering (scroll view)

```
1. UIScrollView.requestPageRender(pageNumber)
   ↓
2. PageRender.renderPage(pageNumber, options)
   - Options: { fontFamily, fontSize, lineHeight, theme, pageSizeId, orient }
   ↓
3. PDF.renderPage(pageNumber, options)
   - Uses this.currentTokens (set by generatePdfFromTokens)
   - Extracts tokens for specific page
   - Calls: generatePdfPage(pageTokens, options)
   - Returns PageData with data URL
   ↓
4. PDF.generatePdfPage()
   - Creates single-page jsPDF document
   - Renders tokens to that page
   - Returns PDFDoc
```

## Critical Issues

### 1. **Missing Parameters Throughout Chain**

- `theme` is passed to `styleToPdf()` but never makes it to `generatePdfFromTokens()`
- `pageSizeId` and `orient` are stored in `PaperPrinter` but not passed through
- `generatePdfFromTokens()` reads `pageSizeId`/`orient` from **global state** instead of parameters

### 2. **generatePdfFromTokens() Only Renders Page 1**

Line 400 in PDF.ts:

```typescript
// For backward compatibility, render only the first page
const pageData = await this.renderPage(1, renderOptions);
```

This is **completely broken** for multi-page documents! It:

- Only renders page 1
- Creates a new jsPDF from page 1's data URL
- Returns that as the "full" PDF
- Subsequent pages never get into the PDFDoc

### 3. **Confusing Architecture**

- `generatePdfFromTokens()` is supposed to create the **full multi-page PDF**
- But it calls `renderPage(1)` which is supposed to **extract a single page**
- Then it reconstructs a jsPDF from that single page's data URL
- This creates a circular/confusing dependency

### 4. **Global State Instead of Parameters**

```typescript
// PDF.ts line 382-385
const pageSizeId = (this.app.vscodeapis.getGlobalState('pageSizeId') || 'a4') as PageSizeId;
const orient = (this.app.vscodeapis.getGlobalState('orient') || 'portrait') as
  | 'portrait'
  | 'landscape';
```

Configuration should be **passed explicitly**, not read from global state.

## What Should Happen

### Correct Flow

1. **PaperPrinter.generatePdf()** should pass ALL options (theme, pageSizeId, orient) down the chain
2. **generatePdfFromTokens()** should:
   - Accept theme, pageSizeId, orient as parameters
   - Create the **full multi-page jsPDF document** from ALL tokens
   - Store that document for later page extraction
   - NOT call renderPage() at all
3. **renderPage()** should:
   - Extract a specific page from the already-created multi-page document
   - Return it as PageData
   - NOT create new jsPDF documents

### Required Changes

1. Add parameters to function signatures:
   - `styleToPdf()` needs pageSizeId, orient
   - `Converter_StyleToPdf.convert()` needs theme, pageSizeId, orient
   - `generatePdfDocument()` needs theme, pageSizeId, orient
   - `generatePdfFromTokens()` needs theme, pageSizeId, orient

2. Remove global state reads from `generatePdfFromTokens()`

3. Rewrite `generatePdfFromTokens()` to:
   - Create full multi-page jsPDF directly
   - NOT call renderPage()
   - Store the complete document

4. Ensure `renderPage()` extracts pages from the stored multi-page document

## Architecture Questions

- Why does `generatePdfFromTokens()` return a PDFDoc when we already have `this.currentTokens` and page-based rendering?
- Should we even keep `generatePdfFromTokens()` or just use `setTokens()` + `renderPage()`?
- What is the PDFDoc returned by `generatePdf()` actually used for? (It's stored in `this.pdfDoc` but when is it accessed?)

**Answer:** `this.pdfDoc` is used for Print/Save operations (lines 59-63, 415-419 in PaperPrinter.ts)

---

## PROPOSED REFACTOR

### Key Insight

`styleToPdf()` is just tokenization + broken PDF generation. The real work is:

1. **Tokenization** (Stylize responsibility)
2. **Token storage with render config** (PDF responsibility)
3. **Page extraction on-demand** (PDF responsibility)
4. **Full document generation for Print/Save** (PDF responsibility)

### New Architecture

#### 1. Simplify Stylize

**Remove:** `styleToPdf()` and entire `Converter_StyleToPdf` class

**Add:** Simple tokenization method:

```typescript
// Stylize.ts
async tokenize(
  code: string,
  languageId: LanguageId,
  theme?: string
): Promise<ThemedToken[][]> {
  const dx = this.dx.sub('tokenize');

  try {
    const highlighter = await this.getHighlighterForLanguage(languageId);
    const themeToUse = theme || this.resolveActiveTheme();

    // Load theme if not already loaded
    if (!highlighter.getLoadedThemes().includes(themeToUse)) {
      await highlighter.loadTheme(themeToUse);
    }

    const tokens = highlighter.codeToThemedTokens(code, languageId, themeToUse);
    dx.out(`Tokenized ${tokens.length} lines with theme ${themeToUse}`);
    return tokens;
  } catch (error) {
    dx.out(`Error tokenizing: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

#### 2. Simplify PDF Class

**Remove:** `generatePdfFromTokens()` entirely (it's doing too much and doing it wrong)

**Keep:** `setTokens()` but enhance it to store render options:

```typescript
// PDF.ts
private currentRenderOptions: RenderOptions | null = null;

setTokensAndConfig(
  tokens: ThemedToken[][],
  options: {
    fontFamily: string;
    fontSizePx: number;
    lineHeightPx: number;
    theme: string;
    pageSizeId: PageSizeId;
    orient: 'portrait' | 'landscape';
  }
): void {
  const dx = this.dx.sub('setTokensAndConfig');

  this.currentTokens = tokens;
  this.pageBreaks = this.calculatePageBreaks(tokens);
  this.pageTotal = this.pageBreaks.length;

  // Store render options for later use
  this.currentRenderOptions = {
    fontFamily: options.fontFamily,
    fontSize: options.fontSizePx,
    lineHeight: options.lineHeightPx,
    theme: options.theme,
    pageSizeId: options.pageSizeId,
    orient: options.orient,
  };

  dx.out(`Configured: ${tokens.length} lines, ${this.pageTotal} pages, ${options.pageSizeId} ${options.orient}`);
  dx.done();
}
```

**Keep:** `renderPage()` as-is (already works correctly)

**Add:** New method for Print/Save operations:

```typescript
// PDF.ts
async generateFullDocument(): Promise<PDFDoc> {
  const dx = this.dx.sub('generateFullDocument');

  try {
    if (!this.currentTokens || !this.currentRenderOptions) {
      throw new Error('Must call setTokensAndConfig() before generating full document');
    }

    const opts = this.currentRenderOptions;

    // Get page dimensions
    const pageSize = this.getPageDimensions(opts.pageSizeId, opts.orient);
    const unit = this.getUnitForPageSize(opts.pageSizeId);
    const { widthPts, heightPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);

    // Create multi-page jsPDF document
    const doc = new jsPDF({
      orientation: opts.orient,
      unit: 'pt',
      format: [widthPts, heightPts],
    });

    // Render all pages
    for (let pageNum = 1; pageNum <= this.pageTotal; pageNum++) {
      if (pageNum > 1) {
        doc.addPage([widthPts, heightPts], opts.orient);
      }

      // Extract tokens for this page
      const pageTokens = this.extractTokensForPage(this.currentTokens, pageNum);

      // Render tokens to current page
      await this.renderTokensToPage(doc, pageTokens, opts);

      dx.out(`Rendered page ${pageNum}/${this.pageTotal}`);
    }

    dx.out(`Generated full ${this.pageTotal}-page document`);
    return new PDFDocWrapper(doc);
  } catch (error) {
    dx.out(`Error generating full document: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}

// Helper method to render tokens to current jsPDF page
private async renderTokensToPage(
  doc: jsPDF,
  tokens: ThemedToken[][],
  options: RenderOptions
): Promise<void> {
  // Convert pixel units to points
  const fontSizePts = this.pxToPts(options.fontSize);
  const lineHeightPts = this.pxToPts(options.lineHeight);

  // Set font
  doc.setFont(options.fontFamily);
  doc.setFontSize(fontSizePts);

  // Get margins
  const marginPts = this.pxToPts(20); // 20px margins
  let yPts = marginPts;

  // Render each line
  for (const line of tokens) {
    let xPts = marginPts;

    for (const token of line) {
      // Set color
      this.setTokenColor(doc, token);

      // Draw text
      doc.text(token.content, xPts, yPts);

      // Advance x position
      xPts += doc.getTextWidth(token.content);
    }

    // Advance y position
    yPts += lineHeightPts;
  }
}
```

#### 3. Simplify PaperPrinter

**Change:** `generatePdf()` to just tokenize + configure:

```typescript
// PaperPrinter.ts
private async generatePdf(): Promise<void> {
  const dx = this.dx.sub('generatePdf');

  try {
    // Tokenize the code
    const tokens = await this.app.stylize.tokenize(
      this.rawCode,
      this.languageId,
      this.currentThemeChoice
    );

    // Configure PDF renderer with all options
    this.app.pdf.setTokensAndConfig(tokens, {
      fontFamily: this.getCurrentFontFamily(),
      fontSizePx: this.computeFontSizePx(),
      lineHeightPx: this.computeLineHeightPx(this.computeFontSizePx()),
      theme: this.currentThemeChoice || 'github-light',
      pageSizeId: this.pageSizeId,
      orient: this.orient,
    });

    // Generate full document for Print/Save operations
    this.pdfDoc = await this.app.pdf.generateFullDocument();

    dx.out('PDF generation complete');
  } catch (error) {
    dx.out(`Error in generatePdf: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

**No changes needed** to Print/Save handlers - they already use `this.pdfDoc`

#### 4. No Changes Needed for Page-Based Rendering

The `PageRender` interface and `UIScrollView.requestPageRender()` already work correctly:

- They call `pdf.renderPage(pageNumber, options)` with explicit options
- `renderPage()` uses `this.currentTokens` and generates single-page PDFs
- Returns `PageData` for webview display

### Summary of Changes

**Deletions:**

- `Stylize.styleToPdf()`
- `Stylize.Converter_StyleToPdf` class
- `PDF.generatePdfFromTokens()`

**Additions:**

- `Stylize.tokenize()` - simple tokenization
- `PDF.setTokensAndConfig()` - store tokens + render config
- `PDF.generateFullDocument()` - create multi-page jsPDF
- `PDF.renderTokensToPage()` - helper for full doc generation

**Modifications:**

- `PaperPrinter.generatePdf()` - use new tokenize + configure flow
- Menu handlers in `PaperPrinter` - already correct, just need to call new `generatePdf()`

### Benefits

1. **Explicit parameter passing** - no more global state reads
2. **Separation of concerns** - tokenization vs rendering vs document generation
3. **Correct multi-page PDF** - `this.pdfDoc` contains ALL pages
4. **No circular dependencies** - `generateFullDocument()` doesn't call `renderPage()`
5. **Less code** - remove entire `Converter_StyleToPdf` class and broken `generatePdfFromTokens()`

### Migration Path

1. Add new methods (`tokenize`, `setTokensAndConfig`, `generateFullDocument`)
2. Update `PaperPrinter.generatePdf()` to use new flow
3. Test Print/Save operations with multi-page documents
4. Test webview page-based rendering (should still work)
5. Remove old methods once verified working

### Risks

- `renderPage()` currently calls `generatePdfPage()` which creates single-page jsPDF documents
- This is fine for webview display (returns data URL)
- But `generateFullDocument()` needs to render ALL pages into ONE jsPDF
- Need to ensure `renderTokensToPage()` correctly positions text on each page

---

## STANDARDIZED OPTIONS STRUCTURE

### Problem

Currently using inconsistent option structures:

- `RenderOptions` - used by PDF rendering
- `ScrollOptions` - used by UIScrollView
- Various ad-hoc option objects passed around
- Mixing pixels and points throughout the codebase
- No single source of truth for document configuration

### Solution: PDFDocInfo

Create a single, consistent structure that represents ALL information needed to generate a PDF document.

**Units:** All measurements in **points** (jsPDF's native unit). Convert from pixels at the boundary (PaperPrinter).

**Location:** `src/types/PDFDocInfo_t.ts`

```typescript
/**
 * Complete PDF document configuration
 * All measurements in points (pt) - jsPDF's native unit
 * 1 inch = 72 points
 * Conversion: points = pixels * 72 / 96
 */
export interface PDFDocInfo {
  // ============================================================================
  // Document Properties
  // ============================================================================

  /** Document title (for metadata and file naming) */
  title: string;

  /** Page size identifier (e.g., 'a4', 'letter') */
  pageSizeId: PageSizeId;

  /** Page orientation */
  orient: 'portrait' | 'landscape';

  /** Page width in points (derived from pageSizeId + orient) */
  pageWidthPts: number;

  /** Page height in points (derived from pageSizeId + orient) */
  pageHeightPts: number;

  // ============================================================================
  // Typography
  // ============================================================================

  /** Font family (e.g., 'Courier New', 'Monaco') */
  fontFamily: string;

  /** Font size in points */
  fontSizePts: number;

  /** Line height in points */
  lineHeightPts: number;

  // ============================================================================
  // Styling
  // ============================================================================

  /** Syntax highlighting theme (e.g., 'github-light', 'monokai') */
  theme: string;

  // ============================================================================
  // Layout
  // ============================================================================

  /** Top margin in points */
  marginTopPts: number;

  /** Right margin in points */
  marginRightPts: number;

  /** Bottom margin in points */
  marginBottomPts: number;

  /** Left margin in points */
  marginLeftPts: number;
}
```

### Usage Throughout Codebase

#### 1. PaperPrinter - Creates PDFDocInfo

**Responsibility:** Convert pixel-based user preferences to point-based PDFDocInfo

```typescript
// PaperPrinter.ts
private createPDFDocInfo(): PDFDocInfo {
  const dx = this.dx.sub('createPDFDocInfo');

  // Get pixel values from user preferences
  const fontSizePx = this.computeFontSizePx();
  const lineHeightPx = this.computeLineHeightPx(fontSizePx);

  // Convert to points
  const fontSizePts = this.app.pdf.pxToPts(fontSizePx);
  const lineHeightPts = this.app.pdf.pxToPts(lineHeightPx);

  // Get page dimensions
  const { widthPts, heightPts } = this.app.pdf.getPageDimensionsPts(
    this.pageSizeId,
    this.orient
  );

  // Standard margins (20px = ~15pts)
  const marginPts = this.app.pdf.pxToPts(20);

  const docInfo: PDFDocInfo = {
    // Document
    title: this.printTitle || 'Print Output',
    pageSizeId: this.pageSizeId,
    orient: this.orient,
    pageWidthPts: widthPts,
    pageHeightPts: heightPts,

    // Typography
    fontFamily: this.getCurrentFontFamily(),
    fontSizePts,
    lineHeightPts,

    // Styling
    theme: this.currentThemeChoice || 'github-light',

    // Layout
    marginTopPts: marginPts,
    marginRightPts: marginPts,
    marginBottomPts: marginPts,
    marginLeftPts: marginPts,
  };

  dx.out(`Created PDFDocInfo: ${docInfo.pageSizeId} ${docInfo.orient}, ${docInfo.fontSizePts}pt/${docInfo.lineHeightPts}pt`);
  dx.done();
  return docInfo;
}

private async generatePdf(): Promise<void> {
  const dx = this.dx.sub('generatePdf');

  try {
    // Create document info
    const docInfo = this.createPDFDocInfo();

    // Tokenize the code
    const tokens = await this.app.stylize.tokenize(
      this.rawCode,
      this.languageId,
      docInfo.theme
    );

    // Configure PDF renderer
    this.app.pdf.setTokensAndConfig(tokens, docInfo);

    // Generate full document for Print/Save
    this.pdfDoc = await this.app.pdf.generateFullDocument();

    dx.out('PDF generation complete');
  } catch (error) {
    dx.out(`Error in generatePdf: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

#### 2. PDF Class - Stores and Uses PDFDocInfo

```typescript
// PDF.ts
export class PDF implements PageRender {
  private currentTokens: ThemedToken[][] | null = null;
  private currentDocInfo: PDFDocInfo | null = null; // Replaces currentRenderOptions
  private pageBreaks: number[] = [];
  private pageTotal: number = 0;

  setTokensAndConfig(tokens: ThemedToken[][], docInfo: PDFDocInfo): void {
    const dx = this.dx.sub('setTokensAndConfig');

    this.currentTokens = tokens;
    this.currentDocInfo = docInfo;
    this.pageBreaks = this.calculatePageBreaks(tokens, docInfo);
    this.pageTotal = this.pageBreaks.length;

    dx.out(
      `Configured: ${tokens.length} lines, ${this.pageTotal} pages, ${docInfo.pageSizeId} ${docInfo.orient}`
    );
    dx.done();
  }

  async generateFullDocument(): Promise<PDFDoc> {
    const dx = this.dx.sub('generateFullDocument');

    try {
      if (!this.currentTokens || !this.currentDocInfo) {
        throw new Error('Must call setTokensAndConfig() before generating document');
      }

      const docInfo = this.currentDocInfo;

      // Create multi-page jsPDF
      const doc = new jsPDF({
        orientation: docInfo.orient,
        unit: 'pt',
        format: [docInfo.pageWidthPts, docInfo.pageHeightPts],
      });

      // Render all pages
      for (let pageNum = 1; pageNum <= this.pageTotal; pageNum++) {
        if (pageNum > 1) {
          doc.addPage([docInfo.pageWidthPts, docInfo.pageHeightPts], docInfo.orient);
        }

        const pageTokens = this.extractTokensForPage(this.currentTokens, pageNum);
        this.renderTokensToPage(doc, pageTokens, docInfo);

        dx.out(`Rendered page ${pageNum}/${this.pageTotal}`);
      }

      dx.out(`Generated full ${this.pageTotal}-page document`);
      return new PDFDocWrapper(doc);
    } catch (error) {
      dx.out(`Error generating full document: ${error}`);
      throw error;
    } finally {
      dx.done();
    }
  }

  async renderPage(pageNumber: number, docInfo: PDFDocInfo): Promise<PageData> {
    // Changed signature from (pageNumber, options) to (pageNumber, docInfo)
    const dx = this.dx.sub('renderPage');

    // Validate and render single page
    const pageTokens = this.extractTokensForPage(this.currentTokens, pageNumber);
    const pdfDoc = this.generateSinglePagePdf(pageTokens, docInfo);

    const pageData: PageData = {
      dataUrl: pdfDoc.asDataUrl(),
      widthPx: Math.round(this.ptsToPx(docInfo.pageWidthPts)),
      heightPx: Math.round(this.ptsToPx(docInfo.pageHeightPts)),
      pageNumber,
    };

    dx.done();
    return pageData;
  }

  private renderTokensToPage(doc: jsPDF, tokens: ThemedToken[][], docInfo: PDFDocInfo): void {
    // All values already in points, no conversion needed
    doc.setFont(docInfo.fontFamily);
    doc.setFontSize(docInfo.fontSizePts);

    let yPts = docInfo.marginTopPts;
    const maxXPts = docInfo.pageWidthPts - docInfo.marginRightPts;

    for (const line of tokens) {
      let xPts = docInfo.marginLeftPts;

      for (const token of line) {
        this.setTokenColor(doc, token);
        doc.text(token.content, xPts, yPts);
        xPts += doc.getTextWidth(token.content);
      }

      yPts += docInfo.lineHeightPts;
    }
  }
}
```

#### 3. UIScrollView - Converts PDFDocInfo to ScrollOptions

**Keep ScrollOptions** for the webview-specific configuration, but populate it from PDFDocInfo:

```typescript
// UIScrollView.ts
export interface ScrollOptions {
  title?: string;
  // Store PDFDocInfo directly instead of individual fields
  docInfo?: PDFDocInfo;
}

// When requesting page render:
async requestPageRender(pageNumber: number): Promise<PageData> {
  const dx = this.dx.sub('requestPageRender');

  if (!this.options.docInfo) {
    throw new Error('No document info configured');
  }

  // Pass complete PDFDocInfo to renderPage
  const pageData = await this.pageRender.renderPage(pageNumber, this.options.docInfo);

  this.pageCache.set(pageNumber, pageData);
  return pageData;
}
```

#### 4. PageRender Interface - Uses PDFDocInfo

```typescript
// src/types/PageRender_t.ts
export interface PageRender {
  /**
   * Render a specific page
   * @param pageNumber - Page number (1-indexed)
   * @param docInfo - Complete document configuration
   */
  renderPage(pageNumber: number, docInfo: PDFDocInfo): Promise<PageData>;

  /**
   * Get total number of pages
   */
  getPageTotal(): number;

  /**
   * Get page size in pixels (for webview layout)
   */
  getPageSizePx(): { widthPx: number; heightPx: number };
}
```

### Benefits

1. **Single source of truth** - one structure for all PDF configuration
2. **Type safety** - TypeScript enforces correct usage
3. **Unit consistency** - all measurements in points, convert once at boundary
4. **Clear dependencies** - easy to see what's needed for PDF generation
5. **Easy to extend** - add new properties in one place
6. **Self-documenting** - comprehensive JSDoc comments

### Migration Steps

1. Create `src/types/PDFDocInfo_t.ts` with interface
2. Add `createPDFDocInfo()` to PaperPrinter
3. Update `PDF.setTokensAndConfig()` to accept PDFDocInfo
4. Update `PDF.renderPage()` signature to use PDFDocInfo
5. Update `PageRender` interface
6. Update `UIScrollView.requestPageRender()` to pass PDFDocInfo
7. Remove old `RenderOptions` type
8. Update all menu handlers to regenerate PDFDocInfo

### Deprecation Path

**Phase 1:** Add PDFDocInfo alongside RenderOptions
**Phase 2:** Update all call sites to use PDFDocInfo
**Phase 3:** Remove RenderOptions entirely

---

## MENU HANDLERS REFACTOR

### Current Problem

The menu selection handlers in `PaperPrinter.ts` are **completely fucked** with duplicated code:

```typescript
// handleSelection_Theme
async handleSelection_Theme(selectedId: string): Promise<string> {
  // ... validation ...
  this.currentThemeChoice = selectedId;

  const sizePx = this.computeFontSizePx();
  const lhPx = this.computeLineHeightPx(sizePx);
  this.pdfDoc = await this.app.stylize.styleToPdf(this.rawCode, this.languageId, {
    fontSize: sizePx,
    lineHeight: lhPx,
    title: this.printTitle,
    theme: this.currentThemeChoice,
  });

  const pageRender: PageRender = {
    renderPage: this.app.pdf.renderPage.bind(this.app.pdf),
    getPageTotal: this.app.pdf.getPageTotal.bind(this.app.pdf),
    getPageSizePx: this.app.pdf.getPageSizePx.bind(this.app.pdf),
  };

  if (this.currentWebView) {
    await this.currentWebView.updatePageRender(pageRender);
    await this.currentWebView.updateOptions({ theme: selectedId });
  }

  return selectedId;
}

// handleSelection_Text (EXACT SAME PATTERN)
async handleSelection_Text(selectedId: string): Promise<string> {
  // ... validation ...
  this.currentFontSize = fontSize;

  const lhPx = this.computeLineHeightPx(fontSize);
  this.pdfDoc = await this.app.stylize.styleToPdf(this.rawCode, this.languageId, {
    fontSize: fontSize,
    lineHeight: lhPx,
    title: this.printTitle,
    theme: this.currentThemeChoice,
  });

  const pageRender: PageRender = { /* same shit */ };

  if (this.currentWebView) {
    await this.currentWebView.updatePageRender(pageRender);
    await this.currentWebView.updateOptions({ fontSizePx: fontSize, lineHeightPx: lhPx });
  }

  return selectedId;
}

// handleSelection_Page (EXACT SAME PATTERN AGAIN)
// handleSelection_Orient (AND AGAIN)
```

**Every handler duplicates:**

1. Property update
2. Full PDF regeneration
3. PageRender construction
4. Webview update

### Solution: Single Regeneration Method

**Create one generic regeneration method** that handles ALL the common work:

```typescript
// PaperPrinter.ts

/**
 * Regenerate PDF and update webview after any option change
 * This is the ONLY place that should regenerate PDFs for menu changes
 */
private async regenerateAndUpdateWebview(): Promise<void> {
  const dx = this.dx.sub('regenerateAndUpdateWebview');

  try {
    // Create fresh PDFDocInfo from current state
    const docInfo = this.createPDFDocInfo();

    // Tokenize with current theme
    const tokens = await this.app.stylize.tokenize(
      this.rawCode,
      this.languageId,
      docInfo.theme
    );

    // Configure PDF renderer
    this.app.pdf.setTokensAndConfig(tokens, docInfo);

    // Generate full document for Print/Save
    this.pdfDoc = await this.app.pdf.generateFullDocument();

    // Update webview if it exists
    if (this.currentWebView) {
      // Clear cached pages (forces re-render on next scroll)
      await this.currentWebView.clearAllPages();

      dx.out('Webview updated with new configuration');
    }

    dx.out('PDF regenerated successfully');
  } catch (error) {
    dx.out(`Error regenerating PDF: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

**Simplified menu handlers:**

```typescript
// Theme handler - ONLY updates theme, then regenerates
async handleSelection_Theme(selectedId: string): Promise<string> {
  const dx = this.dx.sub('handleSelection_Theme');

  try {
    // Handle default/current selection
    const currentTheme = this.currentThemeChoice || this.app.vscodeapis.getActiveThemeId();
    if (selectedId === UIMenu.defaultId()) {
      dx.done();
      return currentTheme;
    }

    // Update theme
    this.currentThemeChoice = selectedId;
    dx.out(`Theme changed to: ${selectedId}`);

    // Regenerate everything
    await this.regenerateAndUpdateWebview();

    dx.done();
    return selectedId;
  } catch (error) {
    this.app.ui.showErrorMessage(`Failed to update theme: ${String(error)}`);
    dx.done();
    return '';
  }
}

// Font size handler - ONLY updates font size, then regenerates
async handleSelection_Text(selectedId: string): Promise<string> {
  const dx = this.dx.sub('handleSelection_Text');

  try {
    // Handle default/current selection
    if (selectedId === UIMenu.defaultId()) {
      dx.done();
      return String(this.currentFontSize);
    }

    // Update font size
    const fontSize = parseInt(selectedId, 10);
    if (isNaN(fontSize)) {
      dx.done();
      return '';
    }

    this.currentFontSize = fontSize;
    dx.out(`Font size changed to: ${fontSize}px`);

    // Regenerate everything
    await this.regenerateAndUpdateWebview();

    dx.done();
    return selectedId;
  } catch (error) {
    this.app.ui.showErrorMessage(`Failed to update font size: ${String(error)}`);
    dx.done();
    return '';
  }
}

// Page size handler - ONLY updates page size, then regenerates
async handleSelection_Page(selectedId: string): Promise<string> {
  const dx = this.dx.sub('handleSelection_Page');

  try {
    // Handle default/current selection
    if (selectedId === UIMenu.defaultId()) {
      dx.done();
      return this.pageSizeId;
    }

    // Update page size
    if (!PAGE_SIZE_IDS.includes(selectedId as PageSizeId)) {
      dx.done();
      return '';
    }

    this.pageSizeId = selectedId as PageSizeId;
    dx.out(`Page size changed to: ${selectedId}`);

    // Regenerate everything
    await this.regenerateAndUpdateWebview();

    dx.done();
    return selectedId;
  } catch (error) {
    this.app.ui.showErrorMessage(`Failed to update page size: ${String(error)}`);
    dx.done();
    return '';
  }
}

// Orientation handler - ONLY updates orientation, then regenerates
async handleSelection_Orient(selectedId: string): Promise<string> {
  const dx = this.dx.sub('handleSelection_Orient');

  try {
    // Handle default/current selection
    if (selectedId === UIMenu.defaultId()) {
      dx.done();
      return this.orient;
    }

    // Update orientation
    if (selectedId !== 'portrait' && selectedId !== 'landscape') {
      dx.done();
      return '';
    }

    this.orient = selectedId;
    dx.out(`Orientation changed to: ${selectedId}`);

    // Regenerate everything
    await this.regenerateAndUpdateWebview();

    dx.done();
    return selectedId;
  } catch (error) {
    this.app.ui.showErrorMessage(`Failed to update orientation: ${String(error)}`);
    dx.done();
    return '';
  }
}
```

### Benefits

1. **DRY (Don't Repeat Yourself)** - regeneration logic in ONE place
2. **Single source of truth** - `createPDFDocInfo()` reads all current properties
3. **Less code** - handlers are 20 lines instead of 50+
4. **Easier to maintain** - fix bugs once, not four times
5. **Consistent behavior** - all handlers use same regeneration path
6. **Better error handling** - errors caught in one place

### Handler Responsibilities

**Menu handlers should ONLY:**

1. Validate selection
2. Update their ONE property
3. Call `regenerateAndUpdateWebview()`
4. Return selection for checkmark

**Menu handlers should NEVER:**

- Manually create PageRender objects
- Directly call `styleToPdf` or tokenization
- Manually call `updatePageRender` or `updateOptions`
- Duplicate any regeneration logic

### Implementation Order

1. Add `regenerateAndUpdateWebview()` method
2. Update `openWebView()` to use `regenerateAndUpdateWebview()` instead of `generatePdf()`
3. Simplify `handleSelection_Theme()` to use new method
4. Simplify `handleSelection_Text()` to use new method
5. Simplify `handleSelection_Page()` to use new method
6. Simplify `handleSelection_Orient()` to use new method
7. Remove old `generatePdf()` if no longer needed (or keep as alias)

### Code Reduction

**Before:** ~200 lines of duplicated regeneration logic across 4 handlers
**After:** ~30 lines in `regenerateAndUpdateWebview()` + ~15 lines per handler = ~90 lines total

**Savings:** ~110 lines of duplicated bullshit eliminated
