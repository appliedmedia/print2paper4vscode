# Markdown Print Plan (Revised: Direct Rendering)

## Implementation Summary

**Status**: ✅ Complete - Architecture Refactored (2025-12-09)

All core functionality for markdown printing in both raw and rendered modes has been implemented with clean separation of concerns:

- ✅ HTML parsing and rendering infrastructure in PDF class
- ✅ VS Code markdown API integration using official `markdown.api.render` command
- ✅ Unified rendering architecture (tokens and HTML follow parallel paths)
- ✅ Stylize handles branching between tokenization and HTML rendering
- ✅ PDF.generatePdf() orchestrates complete flow for both modes
- ✅ PaperPrinter simplified - just calls generatePdf()
- ⚠️ Manual testing required before marking as complete

**Architecture Improvements** (Refactor completed 2025-12-09):

- Stylize.tokenize() returns `{ tokens? | html? }` without auto-rendering
- PDF.render() explicitly renders returned result
- PDF.addHeaderAndFooter() is now private (as it should be)
- PaperPrinter no longer knows about PDF internals
- Fixed double-rendering bug in code blocks

**To test the new functionality manually:**

1. Enable rendered markdown mode by setting `this.docInfo().useRenderedMd = true` (UI menu toggle not yet implemented - see Phase 6)
2. Open a markdown file in VS Code
3. Run the print command (Alt+P or context menu)
4. Verify both raw (syntax highlighted) and rendered (HTML) modes work correctly

## TODO List

### ✅ Phase 1: Validation (COMPLETE)

- ✅ Verify raw markdown printing works
- ✅ Test Shiki markdown syntax highlighting

### 🚧 Phase 2: HTML Rendering in PDF Class

- ✅ Install `node-html-parser` dependency
- ✅ Rename `PDF.renderTokenizedLine()` → `PDF.renderFromTokens()` for clarity
- ✅ Add `PDF.renderFromHTML(html: string)` method to parse and render HTML
- ✅ Add `htmlElementHandlers` map and `renderHTMLElement()` dispatcher method
- ✅ Add `getMarkdownFontInfo()` and `getFontFromElementStyle()` font helper methods
- ✅ Implement `renderHeading()` method for h1-h6 elements with font sizing
- ✅ Implement `renderParagraph()` method with spacing
- ✅ Implement `renderInlineContent()` with handlers for strong/b/em/i/code elements
- ✅ Implement `renderTextContent()` to reuse existing character wrapping logic
- ✅ Implement `renderList()` method for ul/ol with bullets and numbering
- ✅ Implement `renderCodeBlock()` to reuse Shiki tokenization for syntax highlighting
- ✅ Implement `renderBlockquote()` with indentation
- ✅ Implement `renderHorizontalRule()` method

### ✅ Phase 3: VS Code Markdown API Integration (COMPLETE)

- ✅ **DocInfo_PaperPrinter**: Add `useRenderedMd: boolean = false` property
- ✅ **VSCodeAPIs**: Add `getExtension_Markdown()` method to get extension reference
- ✅ **VSCodeAPIs**: Add `renderMarkdownToHtml(markdown, document)` wrapper method
- ✅ **PaperPrinter**: Update `generatePdf()` to branch on `this.docInfo.useRenderedMd` flag
- ☐ **Follow-up**: Create menu item to toggle `useRenderedMd` (see Phase 6 for details)

### ⚠️ Phase 4: Preview Tab Handling (INCORRECT APPROACH - TO BE REMOVED)

**The screenshot approach for preview tabs was implemented but is the WRONG solution.**

**Why it's wrong:**

- We should not screenshot preview tabs
- Instead, we should control the markdown rendering ourselves
- Need a menu toggle to switch between raw and rendered markdown views

**Code that was implemented (TO BE REMOVED):**

- ✅ **OSMac**: Add `getCurrentAppName()` - TO BE REMOVED
- ✅ **OSMac**: Add `getEditorWindowBounds()` - TO BE REMOVED
- ✅ **OSMac**: Add `getScreenDimensions()` - TO BE REMOVED
- ✅ **OSMac**: Add `screenshotWindow(bounds?)` - TO BE REMOVED
- ✅ **PaperPrinter**: `handlePreviewTabPrint()` - TO BE REMOVED
- ✅ **PaperPrinter**: `screenshotAndPrint()` - TO BE REMOVED
- ✅ AppleScript templates in OSMac.yaml - TO BE REMOVED

**Correct approach:**

- Add a top-level menu item that toggles between "Raw Markdown" and "Rendered Markdown"
- When user prints markdown, they choose which mode via the menu
- No need to detect or handle preview tabs differently

### 🚧 Phase 5: Fix Test Infrastructure

**⚠️ DO NOT pursue the vscode mock approach - it will not work for multiple reasons:**

1. **Mocking complexity**: VS Code's Extension API and markdown renderer are complex runtime dependencies that cannot be properly mocked without the actual VS Code environment
2. **Test accuracy**: Mocked tests would not validate actual behavior - markdown rendering happens through VS Code's extension, not our code
3. **Maintenance burden**: Any changes to VS Code APIs would require updating mocks
4. **False confidence**: Tests would pass but not validate real functionality

**The Right Approach**:

- ☐ Tests should run in VS Code test environment using `@vscode/test-electron` or similar
- ☐ Update test infrastructure to use VS Code's test runner instead of plain Node.js
- ☐ Tests need actual VS Code extension host to test markdown rendering
- ☐ Consider integration tests in VS Code environment rather than unit tests with mocks

**Current State**: Tests are broken due to vscode module imports, but fixing them requires proper VS Code test infrastructure, not mocks. This is a larger architectural change to the test system.

**Decision**: Defer test infrastructure overhaul to separate task. Current implementation compiles and can be manually tested in VS Code.

### ☐ Phase 6: Add UI Menu Toggle (TODO)

**Goal**: Add a top-level menu item that toggles between "Raw Markdown" and "Rendered Markdown" modes.

**Requirements**:

- ☐ Add new menu item to UIMenu system (appears only when viewing markdown files)
- ☐ Menu item toggles `docInfo.useRenderedMd` on/off
- ☐ Menu shows current mode (checkmark or icon)
- ☐ Menu item label: "Markdown: Raw" vs "Markdown: Rendered"
- ☐ Persist user preference (save to VS Code global state)
- ☐ Update PaperPrinter to read persisted preference on startup

**Implementation Notes**:

Currently `useRenderedMd` must be set programmatically. This menu will allow users to switch modes without code changes. The menu should only appear when the active editor contains a markdown file.

**Location**: Top-level menu bar, next to existing print menus (zoom, orientation, etc.)

### 🚧 Phase 7: Testing & Polish

**Manual testing is required** - Extension must be loaded in VS Code.

**Test Cases**:

1. **Basic Markdown**
   - ☐ Headings (h1-h6)
   - ☐ Paragraphs
   - ☐ Bold and italic text
   - ☐ Inline code

2. **Lists**
   - ☐ Unordered lists
   - ☐ Ordered lists
   - ☐ Nested lists

3. **Code Blocks**
   - ☐ Fenced code blocks with language
   - ☐ Syntax highlighting verification

4. **Complex Elements**
   - ☐ Blockquotes
   - ☐ Horizontal rules
   - ☐ Mixed content

5. **Mode Switching**
   - ☐ Raw markdown (syntax highlighted source)
   - ☐ Rendered markdown (HTML output)

6. **Preview Tabs**
   - ☐ Screenshot prompt appears
   - ☐ Screenshot captures correctly
   - ☐ Print dialog opens

**Polish**:

- ✅ Respect `markdown.preview.fontFamily` and `fontSize` settings (implemented)
- ☐ Get background colors from theme for code/blockquotes (future enhancement)
- ☐ Test with different VS Code themes

**Time Estimate**: 2 hours

---

## Implementation Details

### What Was Implemented

#### Phase 2: HTML Rendering in PDF Class

- Installed `node-html-parser` dependency
- Renamed `PDF.renderTokenizedLine()` → `PDF.renderFromTokens()` with 2D token array signature
- Added `PDF.renderFromHTML(html: string)` method to parse and render HTML
- Implemented HTML element handlers:
  - `getMarkdownFontInfo()` and `getFontFromElementStyle()` - font extraction
  - `renderHeading()` - h1-h6 with automatic sizing
  - `renderParagraph()` - paragraphs with spacing
  - `renderInlineContent()` - bold, italic, code inline elements
  - `renderTextContent()` - reuses existing character wrapping logic
  - `renderList()` - ul/ol with bullets and numbering
  - `renderCodeBlock()` - reuses Shiki tokenization for syntax highlighting
  - `renderBlockquote()` - indented content
  - `renderHorizontalRule()` - hr element

#### Phase 3: VS Code Markdown API Integration

- Added `useRenderedMd: boolean` property to `DocInfo_PaperPrinter`
- Added `VSCodeAPIs.getExtension_Markdown()` method
- Added `VSCodeAPIs.renderMarkdownToHtml()` wrapper method
- Updated `PaperPrinter.generatePdf()` to branch on `useRenderedMd` flag

#### Phase 4: Preview Tab Handling

- Added `OSMac.getCurrentAppName()` with caching
- Added `OSMac.getEditorWindowBounds()` via AppleScript (gets window position and size)
- Added `OSMac.getScreenDimensions()` via AppleScript (fallback for bounds)
- Added `OSMac.screenshotWindow(bounds?)` using macOS `screencapture` command-line tool
- Added `PaperPrinter.handlePreviewTabPrint()` with user prompt
- Added `PaperPrinter.screenshotAndPrint()` with fallback

**AppleScript Templates Added to OSMac.yaml**:

```yaml
apple_script_get_current_app: |
  tell application "System Events"
    name of first application process whose frontmost is true
  end tell

apple_script_get_editor_bounds: |
  tell application "System Events"
    tell process "{{app_name}}"
      set frontWindow to front window
      set windowPosition to position of frontWindow
      set windowSize to size of frontWindow
      return (item 1 of windowPosition) & "," & (item 2 of windowPosition) & "," & (item 1 of windowSize) & "," & (item 2 of windowSize)
    end tell
  end tell

apple_script_get_screen_dimensions: |
  tell application "Finder"
    set screenBounds to bounds of window of desktop
    set screenWidth to (item 3 of screenBounds) - (item 1 of screenBounds)
    set screenHeight to (item 4 of screenBounds) - (item 2 of screenBounds)
    return screenWidth & "," & screenHeight
  end tell
```

**Note on Phase 4**: AppleScript is used to get window information, but the actual screenshot is taken using the macOS `screencapture` command-line tool, NOT AppleScript.

### Known Limitations

1. **Manual Mode Toggle**: Currently `useRenderedMd` must be set programmatically. UI menu toggle not yet implemented (see Phase 6 TODO).

2. **Background Colors**: Code blocks and blockquotes don't yet extract background colors from themes (noted as future enhancement).

3. **Table Support**: Markdown tables are not yet implemented (would need additional HTML handlers).

4. **Image Support**: Embedded images in markdown are not yet handled.

### Architecture Notes

**Unified Rendering Approach**:

- Both `renderFromTokens()` and `renderFromHTML()` use the same underlying primitives
- Character wrapping: `findCharacterBreakPoint()`
- Page breaking: `shouldBreakPage()`, `addPageBreak()`
- Text rendering: `renderTextContent()` reuses token rendering logic

**Font Resolution**:

1. Try to get font from HTML element's style attribute
2. Fall back to `markdown.preview.fontFamily` and `markdown.preview.fontSize` settings
3. Fall back to editor typography settings

**AppleScript Safety**:

⚠️ **CRITICAL**: The `app_name` variable in AppleScript templates comes directly from System Events and is **NOT sanitized**. It's safe because it's returned by the OS itself, not user input.

### Future Enhancements

- [ ] UI menu toggle for `useRenderedMd` (Phase 6 TODO - detailed plan above)
- [ ] Extract background colors from theme for code/blockquotes
- [ ] Add table support for rendered markdown
- [ ] Add image embedding support for rendered markdown
- [ ] Windows/Linux screenshot implementations (if screenshot approach is kept)

---

## Overview

Print markdown files in two modes:

1. **Raw Mode** - Print markdown source with syntax highlighting (already works)
2. **Rendered Mode** - Print HTML-rendered markdown (new feature)

## Architecture: Unified Rendering (Refactored 2025-12-09)

### Data Flow

```text
PaperPrinter.generatePdf()
  ↓
PDF.generatePdf({ useRenderedMd?, document? })
  ↓
  1. setupPdf() - Creates jsPDF document
  2. addHeaderAndFooter() - Adds header/footer to first page
  ↓
  3. Stylize.tokenize({ code, languageId, useRenderedMd?, document? })
     ↓
     ├─ markdown + useRenderedMd?
     │    → VSCodeAPIs.renderMarkdownToHtml() → { html }
     │
     └─ else
          → Shiki.codeToTokens() → { tokens }
  ↓
  4. PDF.render({ tokens? | html? })
     ↓
     ├─ html? → renderFromHTML(html) → (HTML element handlers)
     │                                   ↓
     │                              renderCodeBlock() → Stylize.tokenize()
     │                                                  → { tokens }
     │                                                  → renderFromTokens()
     │
     └─ tokens? → renderFromTokens(tokens)
  ↓
  5. finishPdf() - Walks all pages, re-renders headers/footers with correct page totals
```

### Key Architectural Principles

1. **Separation of Concerns**:
   - **Stylize**: Tokenization OR HTML rendering (no PDF knowledge)
   - **PDF**: Rendering to jsPDF (orchestrates flow)
   - **PaperPrinter**: Configuration only (no PDF internals)

2. **Parallel Paths**:
   - Tokens and HTML follow same flow through PDF.render()
   - Both use same primitives (page breaks, wrapping, headers/footers)

3. **No Automatic Rendering**:
   - Stylize.tokenize() returns data, doesn't render
   - PDF.render() explicitly renders result
   - Fixes double-rendering bug in code blocks

4. **Header/Footer Two-Pass System**:
   - Pass 1: During rendering (page totals unknown)
   - Pass 2: In finishPdf() - walks all pages with correct totals

### Unified Rendering Primitives

Both `renderFromTokens()` and `renderFromHTML()` use the same underlying primitives:

- Character wrapping logic (`findCharacterBreakPoint()`)
- Page break detection (`shouldBreakPage()`, `addPageBreak()`)
- Position tracking (`currentX`, `currentY`)
- Text rendering (`doc.text()`)

The rendering logic is unified; only the input parsing differs.

---

## Phase 1: Validation (Already Works) ✅

Raw markdown printing works through existing code path:

- `TabInspector.detectActiveTabCategory()` returns `'editor-md'`
- Shiki tokenizes markdown source
- `PDF.renderFromTokens()` renders with syntax highlighting

No changes required.

---

## Phase 2: Add Rendered Mode to PDF Class

### Step 1: Rename for Clarity

```typescript
// src/PDF.ts

class PDF {
  // Rename existing method
  renderFromTokens(lineNumber: number, tokens: ThemedToken[]): void {
    // Current renderTokenizedLine logic - unchanged
    for (const token of tokens) {
      const color = token.color || '#000000';
      this.setTextColorFromWebColor(this.doc, color);
      
      let content = token.content;
      while (content.length > 0) {
        const charsToRender = this.findCharacterBreakPoint(...);
        const portion = content.substring(0, charsToRender);
        this.doc.text(portion, this.currentX, this.currentY);
        this.currentX += this.doc.getTextWidth(portion);
        content = content.substring(charsToRender);
        
        if (content.length > 0) {
          this.currentY += this.currentLineHeight;
          this.currentX = this.leftMargin;
          if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
        }
      }
    }
    
    this.currentY += this.currentLineHeight;
    this.currentX = this.leftMargin;
  }
}
```

### Step 2: Add HTML Rendering

```typescript
// src/PDF.ts

import { parse, type HTMLElement, type Node, NodeType } from 'node-html-parser';

class PDF {
  /**
   * Render HTML-formatted markdown to PDF
   * Uses VS Code's markdown renderer output
   */
  renderFromHTML(html: string): void {
    const dx = this.dx.sub('renderFromHTML');
    
    try {
      const root = parse(html);
      
      for (const element of root.childNodes) {
        if (element.nodeType === NodeType.ELEMENT_NODE) {
          this.renderHTMLElement(element as HTMLElement);
        }
      }
      
      dx.out('Rendered HTML to PDF');
    } finally {
      dx.done();
    }
  }
  
  /**
   * HTML element handlers - maps tag name to render function
   */
  private readonly htmlElementHandlers: Record<string, (element: HTMLElement) => void> = {
    'h1': (el) => this.renderHeading(el, 1),
    'h2': (el) => this.renderHeading(el, 2),
    'h3': (el) => this.renderHeading(el, 3),
    'h4': (el) => this.renderHeading(el, 4),
    'h5': (el) => this.renderHeading(el, 5),
    'h6': (el) => this.renderHeading(el, 6),
    'p': (el) => this.renderParagraph(el),
    'ul': (el) => this.renderList(el),
    'ol': (el) => this.renderList(el),
    'pre': (el) => this.renderCodeBlock(el),
    'blockquote': (el) => this.renderBlockquote(el),
    'hr': () => this.renderHorizontalRule(),
  };
  
  /**
   * Render a single HTML element
   */
  private renderHTMLElement(element: HTMLElement): void {
    const dx = this.dx.sub('renderHTMLElement');
    
    const handler = this.htmlElementHandlers[element.tagName];
    if (handler) {
      handler(element);
    } else {
      dx.out(`Unknown element: ${element.tagName}`);
    }
    
    dx.done();
  }
  
  /**
   * Get font info from HTML element or markdown preview settings
   */
  private getMarkdownFontInfo(): { fontFamily: string; fontSize: number } {
    // Get markdown preview settings (these control what user sees in MD preview)
    const mdConfig = this.app.vscodeapis.getConfiguration('markdown');
    const mdFontFamily = mdConfig.get<string>('preview.fontFamily');
    const mdFontSize = mdConfig.get<number>('preview.fontSize');
    
    // Use markdown preview settings, or fall back to editor settings
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const fontFamily = mdFontFamily || editorTypo.fontFamily;
    const fontSize = mdFontSize || editorTypo.fontSize;
    
    return { fontFamily, fontSize };
  }
  
  /**
   * Extract font info from HTML element's style attribute
   * Returns null if no style info found
   */
  private getFontFromElementStyle(element: HTMLElement): { fontFamily?: string; fontSize?: number } | null {
    const style = element.getAttribute('style');
    if (!style) return null;
    
    const result: { fontFamily?: string; fontSize?: number } = {};
    
    // Parse font-family from style
    const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/i);
    if (fontFamilyMatch) {
      result.fontFamily = fontFamilyMatch[1].trim().replace(/['"]/g, '');
    }
    
    // Parse font-size from style
    const fontSizeMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)(px|pt|em)/i);
    if (fontSizeMatch) {
      const size = parseFloat(fontSizeMatch[1]);
      const unit = fontSizeMatch[2];
      
      if (unit === 'px') {
        result.fontSize = size;
      } else if (unit === 'pt') {
        result.fontSize = size * (96 / 72); // Convert pt to px
      } else if (unit === 'em') {
        const baseFontInfo = this.getMarkdownFontInfo();
        result.fontSize = size * baseFontInfo.fontSize;
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }
  
  /**
   * Render heading element
   */
  private renderHeading(element: HTMLElement, level: number): void {
    if (!this.docInfo.pdfDoc) return;
    
    // Try to get font from element style first
    const styleFont = this.getFontFromElementStyle(element);
    
    // Fall back to markdown preview settings
    const baseFontInfo = this.getMarkdownFontInfo();
    
    const fontFamily = styleFont?.fontFamily || baseFontInfo.fontFamily;
    const fontSize = styleFont?.fontSize || baseFontInfo.fontSize;
    
    // Calculate heading size if not specified in style
    // (HTML might have explicit font-size, or we calculate from base)
    let headingSize: number;
    if (styleFont?.fontSize) {
      headingSize = this.coords.cssPxToPdfPts(styleFont.fontSize);
    } else {
      const sizeMultipliers = [2.0, 1.5, 1.25, 1.1, 1.0, 0.9];
      const multiplier = sizeMultipliers[level - 1] || 1.0;
      headingSize = this.coords.cssPxToPdfPts(fontSize * multiplier);
    }
    
    // Spacing based on level
    const spacingBefore = Math.max(12 - level * 2, 4);
    const spacingAfter = Math.max(6 - level, 2);
    
    // Add spacing before
    this.currentY += spacingBefore;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Set heading font
    const jsPdfFont = this.mapFontFamilyToJsPDF(baseFontFamily, this.docInfo.pdfDoc);
    this.docInfo.pdfDoc.setFont(jsPdfFont, 'bold');
    this.docInfo.pdfDoc.setFontSize(headingSize);
    
    // Render text with wrapping (reuse existing logic)
    this.renderTextContent(element.text);
    
    // Add spacing after
    this.currentY += spacingAfter;
    
    // Reset to normal font
    this.docInfo.pdfDoc.setFontSize(this.docInfo.fontSizePts);
    this.docInfo.pdfDoc.setFont(jsPdfFont, 'normal');
  }
  
  /**
   * Render paragraph with inline formatting
   */
  private renderParagraph(element: HTMLElement): void {
    if (!this.docInfo.pdfDoc) return;
    
    // Process inline content (text, bold, italic, code, etc.)
    this.renderInlineContent(element);
    
    // Move to next line with spacing
    this.currentY += this.currentLineHeight;
    this.currentX = this.docInfo.marginPts.leftMarginPts;
    this.currentY += 6; // Paragraph spacing
    
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
  }
  
  /**
   * Inline element handlers - maps tag name to render function
   */
  private readonly inlineElementHandlers: Record<string, (element: HTMLElement, savedFont: any) => void> = {
    'strong': (el, savedFont) => {
      // Check if element has style attribute with font info
      const styleFont = this.getFontFromElementStyle(el);
      const fontName = styleFont?.fontFamily 
        ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo.pdfDoc!)
        : savedFont.fontName;
      
      this.docInfo.pdfDoc!.setFont(fontName, 'bold');
      this.renderTextContent(el.text);
      this.docInfo.pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
    },
    'b': (el, savedFont) => {
      const styleFont = this.getFontFromElementStyle(el);
      const fontName = styleFont?.fontFamily 
        ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo.pdfDoc!)
        : savedFont.fontName;
      
      this.docInfo.pdfDoc!.setFont(fontName, 'bold');
      this.renderTextContent(el.text);
      this.docInfo.pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
    },
    'em': (el, savedFont) => {
      const styleFont = this.getFontFromElementStyle(el);
      const fontName = styleFont?.fontFamily 
        ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo.pdfDoc!)
        : savedFont.fontName;
      
      this.docInfo.pdfDoc!.setFont(fontName, 'italic');
      this.renderTextContent(el.text);
      this.docInfo.pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
    },
    'i': (el, savedFont) => {
      const styleFont = this.getFontFromElementStyle(el);
      const fontName = styleFont?.fontFamily 
        ? this.mapFontFamilyToJsPDF(styleFont.fontFamily, this.docInfo.pdfDoc!)
        : savedFont.fontName;
      
      this.docInfo.pdfDoc!.setFont(fontName, 'italic');
      this.renderTextContent(el.text);
      this.docInfo.pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
    },
    'code': (el, savedFont) => {
      // For inline code, check element style first, then markdown preview settings
      const styleFont = this.getFontFromElementStyle(el);
      let monoFontFamily: string;
      
      if (styleFont?.fontFamily) {
        monoFontFamily = styleFont.fontFamily;
      } else {
        // Get monospace font from markdown preview settings or editor settings
        const editorTypo = this.app.vscodeapis.getEditorTypography();
        monoFontFamily = editorTypo.fontFamily;
      }
      
      const monoFont = this.mapFontFamilyToJsPDF(monoFontFamily, this.docInfo.pdfDoc!);
      this.docInfo.pdfDoc!.setFont(monoFont, 'normal');
      // Phase 5 polish: Get background color from element style or theme (see checklist line 45)
      this.renderTextContent(el.text);
      this.docInfo.pdfDoc!.setFont(savedFont.fontName, savedFont.fontStyle);
    },
  };
  
  /**
   * Render inline content (handles bold, italic, code, etc.)
   */
  private renderInlineContent(element: HTMLElement): void {
    if (!this.docInfo.pdfDoc) return;
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        // Plain text
        this.renderTextContent(child.text);
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const savedFont = this.docInfo.pdfDoc.getFont();
        
        const handler = this.inlineElementHandlers[el.tagName];
        if (handler) {
          handler(el, savedFont);
        } else {
          // Recursively process unknown inline elements
          this.renderInlineContent(el);
        }
      }
    }
  }
  
  /**
   * Render text content with character wrapping
   * REUSES existing character wrapping logic from renderFromTokens
   */
  private renderTextContent(text: string): void {
    if (!this.docInfo.pdfDoc || !text) return;
    
    const marginsPts = this.docInfo.marginPts;
    const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
    const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
    const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;
    
    let content = text;
    
    while (content.length > 0) {
      // REUSE existing findCharacterBreakPoint - same logic as tokens!
      const charsToRender = this.findCharacterBreakPoint(
        content,
        this.currentX,
        marginsPts.leftMarginPts,
        availableWidth
      );
      
      if (charsToRender === 0) {
        // Wrap to next line
        this.currentY += this.currentLineHeight;
        this.currentX = marginsPts.leftMarginPts;
        if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
        continue;
      }
      
      const portion = content.substring(0, charsToRender);
      this.docInfo.pdfDoc.text(portion, this.currentX, this.currentY);
      this.currentX += this.docInfo.pdfDoc.getTextWidth(portion);
      content = content.substring(charsToRender);
    }
  }
  
  /**
   * Render list (ul or ol)
   */
  private renderList(element: HTMLElement): void {
    const isOrdered = element.tagName === 'ol';
    let itemNumber = 1;
    const indentSize = 20; // Points
    
    const items = element.querySelectorAll('li');
    for (const item of items) {
      // Render prefix (bullet or number)
      const prefix = isOrdered ? `${itemNumber}. ` : '• ';
      
      // Save position for indent
      const savedLeftMargin = this.docInfo.marginPts.leftMarginPts;
      this.docInfo.marginPts.leftMarginPts += indentSize;
      this.currentX = this.docInfo.marginPts.leftMarginPts;
      
      // Render prefix
      if (this.docInfo.pdfDoc) {
        this.docInfo.pdfDoc.text(prefix, this.currentX, this.currentY);
        this.currentX += this.docInfo.pdfDoc.getTextWidth(prefix);
      }
      
      // Render item content
      this.renderInlineContent(item);
      
      // Move to next line
      this.currentY += this.currentLineHeight;
      this.currentX = this.docInfo.marginPts.leftMarginPts;
      this.currentY += 3; // Item spacing
      
      if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
      
      // Restore margin
      this.docInfo.marginPts.leftMarginPts = savedLeftMargin;
      
      if (isOrdered) itemNumber++;
    }
    
    // Add spacing after list
    this.currentY += 6;
  }
  
  /**
   * Render code block with syntax highlighting
   * REUSES existing Shiki tokenization!
   */
  private async renderCodeBlock(element: HTMLElement): Promise<void> {
    const codeElement = element.querySelector('code');
    if (!codeElement) return;
    
    const code = codeElement.text;
    const langClass = codeElement.classNames.find(c => c.startsWith('language-'));
    const lang = langClass ? langClass.replace('language-', '') : 'plaintext';
    
    // Add spacing before
    this.currentY += 6;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Save left margin and indent
    const savedLeftMargin = this.docInfo.marginPts.leftMarginPts;
    this.docInfo.marginPts.leftMarginPts += 20;
    this.currentX = this.docInfo.marginPts.leftMarginPts;
    
    // REUSE existing Shiki tokenization!
    const tokens = await this.app.stylize.tokenize(
      code,
      lang as LanguageId_t,
      this.docInfo.theme
    );
    
    // Set monospace font
    if (this.docInfo.pdfDoc) {
      const editorTypo = this.app.vscodeapis.getEditorTypography();
      const monoFont = this.mapFontFamilyToJsPDF(editorTypo.fontFamily, this.docInfo.pdfDoc);
      const savedFont = this.docInfo.pdfDoc.getFont();
      const savedSize = this.docInfo.pdfDoc.getFontSize();
      
      this.docInfo.pdfDoc.setFont(monoFont, 'normal');
      this.docInfo.pdfDoc.setFontSize(savedSize * 0.9);
      
      // REUSE existing renderFromTokens for each line!
      for (let i = 0; i < tokens.length; i++) {
        this.renderFromTokens(i, tokens[i]);
      }
      
      // Restore font
      this.docInfo.pdfDoc.setFont(savedFont.fontName, savedFont.fontStyle);
      this.docInfo.pdfDoc.setFontSize(savedSize);
    }
    
    // Restore margin
    this.docInfo.marginPts.leftMarginPts = savedLeftMargin;
    this.currentX = savedLeftMargin;
    
    // Add spacing after
    this.currentY += 6;
  }
  
  /**
   * Render blockquote with indentation
   */
  private renderBlockquote(element: HTMLElement): void {
    // Save left margin and indent
    const savedLeftMargin = this.docInfo.marginPts.leftMarginPts;
    this.docInfo.marginPts.leftMarginPts += 20;
    this.currentX = this.docInfo.marginPts.leftMarginPts;
    
    // Add spacing before
    this.currentY += 6;
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Render children
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        this.renderHTMLElement(child as HTMLElement);
      }
    }
    
    // Restore margin
    this.docInfo.marginPts.leftMarginPts = savedLeftMargin;
    this.currentX = savedLeftMargin;
    
    // Add spacing after
    this.currentY += 6;
  }
  
  /**
   * Render horizontal rule
   */
  private renderHorizontalRule(): void {
    if (!this.docInfo.pdfDoc) return;
    
    const marginsPts = this.docInfo.marginPts;
    const pageSize = this.getPageDimensions(this.docInfo.pageSizeId, this.docInfo.orient);
    const unit = this.getUnitForPageSize(this.docInfo.pageSizeId);
    const { widthPts: pageWidthPts } = this.pageSizeToPts(pageSize.width, pageSize.height, unit);
    const availableWidth = pageWidthPts - marginsPts.leftMarginPts - marginsPts.rightMarginPts;
    
    this.currentY += 6; // Spacing before
    if (this.shouldBreakPage(this.currentY)) this.addPageBreak();
    
    // Draw line
    this.docInfo.pdfDoc.setDrawColor('#cccccc');
    this.docInfo.pdfDoc.line(
      marginsPts.leftMarginPts,
      this.currentY,
      marginsPts.leftMarginPts + availableWidth,
      this.currentY
    );
    
    this.currentY += 6; // Spacing after
  }
}
```

---

## Phase 3: Get HTML from VS Code Markdown API

### Architecture: Proper Separation of Concerns

**VSCodeAPIs** - Wraps all VS Code API calls:

```typescript
// src/VSCodeAPIs.ts

/**
 * Get VS Code markdown language features extension
 */
getExtension_Markdown(): Extension<any> | undefined {
  return this.vscode.extensions.getExtension('vscode.markdown-language-features');
}

/**
 * Render markdown to HTML using VS Code's markdown extension
 * @param markdown - Markdown source text
 * @param document - VS Code TextDocument for context
 * @returns HTML string
 */
async renderMarkdownToHtml(markdown: string, document: TextDocument): Promise<string> {
  const dx = this.dx.sub('renderMarkdownToHtml');
  
  try {
    const mdExtension = this.getExtension_Markdown();
    
    if (!mdExtension) {
      throw new Error('VS Code markdown extension not found');
    }
    
    if (!mdExtension.isActive) {
      await mdExtension.activate();
    }
    
    const mdApi = mdExtension.exports;
    
    if (!mdApi || !mdApi.render) {
      throw new Error('Markdown render API not available');
    }
    
    const html = await mdApi.render(markdown, document);
    dx.out(`Rendered markdown to HTML (${html.length} chars)`);
    
    return html;
  } finally {
    dx.done();
  }
}
```

**DocInfo_PaperPrinter** - Add markdown rendering flag:

```typescript
// src/DocInfo_PaperPrinter.ts

export class DocInfo_PaperPrinter {
  // ... existing properties ...
  
  // Flag to control markdown rendering mode
  // false = raw source with syntax highlighting (default)
  // true = rendered HTML from VS Code markdown API
  public useRenderedMd: boolean = false;
  
  // ... rest of class ...
}
```

**PaperPrinter** - Orchestrates workflow (update existing method):

```typescript
// src/PaperPrinter.ts

async generatePdf(): Promise<void> {
  const dx = this.dx.sub('generatePdf');
  
  try {
    // Setup PDF
    this.app.pdf.setupPdf();
    this.app.pdf.addHeaderAndFooter();
    
    // Branch based on content type and useRenderedMd flag
    if (this.docInfo.languageId === 'markdown' && this.docInfo.useRenderedMd) {
      // Rendered markdown mode: Get HTML from VS Code markdown API
      const editor = this.app.vscodeapis.getActiveTextEditor();
      if (!editor) throw new Error('No active editor');
      
      const html = await this.app.vscodeapis.renderMarkdownToHtml(
        this.docInfo.rawCode,
        editor.document
      );
      
      // Render HTML to PDF
      await this.app.pdf.renderFromHTML(html);
    } else {
      // Raw source mode: Tokenize with Shiki (works for all languages including markdown)
      const tokens = await this.app.stylize.tokenize(
        this.docInfo.rawCode,
        this.docInfo.languageId,
        this.docInfo.theme
      );
      
      // Render tokens to PDF
      this.app.pdf.renderFromTokens(tokens);
    }
    
    // Finish PDF
    this.app.pdf.finishPdf();
    
    dx.out('PDF generation complete');
  } catch (error) {
    dx.error(`Failed to generate PDF: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

**PDF** - Two separate rendering methods:

```typescript
// src/PDF.ts

/**
 * Render tokens to PDF (for code with syntax highlighting)
 * @param tokens - 2D array from Shiki: tokens[lineIndex][tokenIndex]
 */
renderFromTokens(tokens: ThemedToken[][]): void {
  for (let lineNum = 0; lineNum < tokens.length; lineNum++) {
    const lineTokens = tokens[lineNum];
    // Render each token with color, handle wrapping, page breaks
    // (existing renderTokenizedLine logic, just iterate internally)
  }
}

/**
 * Render HTML to PDF (for markdown rendered preview)
 * @param html - HTML string from VS Code markdown API
 */
async renderFromHTML(html: string): Promise<void> {
  const root = parse(html); // node-html-parser
  
  for (const element of root.childNodes) {
    if (element.nodeType === NodeType.ELEMENT_NODE) {
      this.renderHTMLElement(element as HTMLElement);
    }
  }
  
  // Uses htmlElementHandlers map to dispatch h1, p, ul, etc.
  // Each handler calls existing primitives: findCharacterBreakPoint, 
  // shouldBreakPage, renderTextContent, etc.
}
```

**Key Point**: Two separate, independent methods. No "mode" stored. Just branch at call time.

---

## Phase 4: Preview Tab Screenshot Handling

### Problem

VS Code markdown preview tabs use private webview content that cannot be directly accessed. We cannot extract HTML or text from preview tabs.

### Solution: Screenshot + Print (macOS)

When user tries to print from a preview tab:

```typescript
// src/PaperPrinter.ts

async handlePrintCommandFromVSCode(): Promise<void> {
  const category = this.app.tabinspector.detectActiveTabCategory();
  
  if (category === 'preview') {
    // Preview tabs: screenshot and print
    const message = 'Due to VS Code\'s implementation of private data in Preview tabs, ' +
                    'they cannot be printed except via screenshot. Do that?';
    
    const choice = await this.app.ui.showQuickPick([
      { label: 'Take Screenshot & Print', value: 'yes' },
      { label: 'Cancel', value: 'no' }
    ]);
    
    if (choice === 'yes') {
      await this.screenshotAndPrint();
    }
    return;
  }
  
  // ... rest of normal flow for editor tabs ...
}

private async screenshotAndPrint(): Promise<void> {
  // Try to get window bounds (works for Cursor, VS Code, etc.)
  let bounds = await this.app.os.getEditorWindowBounds();
  
  // If bounds unavailable, fall back to full screen
  if (!bounds) {
    this.dx.out('Window bounds unavailable, using full screen screenshot');
    bounds = undefined; // screenshotWindow will use full screen
  }
  
  // Take screenshot (window bounds or full screen)
  const screenshotPath = await this.app.os.screenshotWindow(bounds);
  
  // Print screenshot using existing print workflow
  await this.app.os.fileOpenPrintDialog(screenshotPath);
}
```

### macOS Implementation

```typescript
// src/OSMac.ts

private currentAppName: string | null = null;

/**
 * Get the name of the currently frontmost application (Cursor, Code, etc.)
 * Cache it for subsequent operations
 */
async getCurrentAppName(): Promise<string> {
  if (this.currentAppName) {
    return this.currentAppName;
  }
  
  const result = await this.executeAppleScript('apple_script_get_current_app');
  this.currentAppName = result.trim();
  return this.currentAppName;
}

/**
 * Check if we can get window bounds via AppleScript
 */
async canGetWindowBounds(): Promise<boolean> {
  try {
    const appName = await this.getCurrentAppName();
    await this.executeAppleScript('apple_script_check_window_bounds', { app_name: appName });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current editor window bounds via AppleScript
 * Works with Cursor, VS Code, or any VS Code-based editor
 */
async getEditorWindowBounds(): Promise<{ x: number; y: number; width: number; height: number } | null> {
  try {
    const appName = await this.getCurrentAppName();
    const result = await this.executeAppleScript('apple_script_get_editor_bounds', { app_name: appName });
    // Parse "x,y,width,height" from AppleScript output
    const parts = result.trim().split(',').map(s => parseInt(s.trim()));
    if (parts.length === 4) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get screen dimensions via AppleScript
 */
async getScreenDimensions(): Promise<{ width: number; height: number }> {
  const result = await this.executeAppleScript('apple_script_get_screen_dimensions');
  const parts = result.trim().split(',').map(s => parseInt(s.trim()));
  if (parts.length === 2) {
    return { width: parts[0], height: parts[1] };
  }
  // Fallback to reasonable defaults
  return { width: 1920, height: 1080 };
}

/**
 * Take screenshot of window or full screen
 * Uses macOS screencapture command
 */
async screenshotWindow(bounds?: { x: number; y: number; width: number; height: number }): Promise<string> {
  const tempPath = this.pathJoin(this.app.vscodeapis.getDir_Temp(), `screenshot_${Date.now()}.png`);
  
  if (bounds) {
    // Targeted screenshot with window bounds
    await this.execAsync(`screencapture -R${bounds.x},${bounds.y},${bounds.width},${bounds.height} "${tempPath}"`);
  } else {
    // Full screen screenshot
    await this.execAsync(`screencapture "${tempPath}"`);
  }
  
  return tempPath;
}
```

### AppleScript Templates (OSMac.yaml)

**⚠️ CRITICAL: Do NOT sanitize or escape `app_name` variable!**

The `app_name` value comes directly from AppleScript's `name of first application process whose frontmost is true` and must be used **exactly as-is** when passed to subsequent AppleScript commands. AppleScript returns valid process names (e.g., "Cursor", "Code") that are safe to use in `tell process "{{app_name}}"` statements. Any sanitization, escaping, or modification will break the process lookup and cause AppleScript to fail.

```yaml
apple_script_get_current_app: |
  tell application "System Events"
    name of first application process whose frontmost is true
  end tell

apple_script_get_editor_bounds: |
  tell application "System Events"
    tell process "{{app_name}}"
      set frontWindow to front window
      set windowPosition to position of frontWindow
      set windowSize to size of frontWindow
      return (item 1 of windowPosition) & "," & (item 2 of windowPosition) & "," & (item 1 of windowSize) & "," & (item 2 of windowSize)
    end tell
  end tell

apple_script_check_window_bounds: |
  tell application "System Events"
    if exists process "{{app_name}}" then
      return true
    end if
  end tell

apple_script_get_screen_dimensions: |
  tell application "Finder"
    set screenBounds to bounds of window of desktop
    set screenWidth to (item 3 of screenBounds) - (item 1 of screenBounds)
    set screenHeight to (item 4 of screenBounds) - (item 2 of screenBounds)
    return screenWidth & "," & screenHeight
  end tell
```

### Fallback Strategy

If window bounds cannot be obtained:

- Get screen dimensions via AppleScript
- Screenshot entire screen using `screencapture` (no bounds)
- Print the screenshot as usual

No user interaction required - fully automated.

---

## Shared Code Analysis

### What's Reused Between renderFromTokens and renderFromHTML?

**Identical (100% reuse):**

1. `findCharacterBreakPoint()` - character wrapping logic
2. `shouldBreakPage()` - page break detection
3. `addPageBreak()` - new page creation
4. `renderTextContent()` - text rendering with wrapping
5. `doc.text()` - jsPDF rendering call
6. Position tracking (`currentX`, `currentY`)

**Different:**

- `renderFromTokens()`: Just set color, render, next line
- `renderFromHTML()`: Set font size/weight/style, handle spacing/indentation, then call `renderTextContent()`

**Key Insight**: The core wrapping/paging logic is already extracted into helper methods. Both rendering methods use these same helpers.

---

## Dependencies

```json
{
  "dependencies": {
    "node-html-parser": "^6.1.12"
  }
}
```

---

## Implementation Checklist

### Phase 1: Validation ✅

- [x] Verify raw markdown printing works
- [x] Test Shiki markdown syntax highlighting

### Phase 2: Add HTML Rendering

- [x] Install `node-html-parser`
- [x] Rename `renderTokenizedLine()` → `renderFromTokens()`
- [x] Add `renderFromHTML()` method
- [x] Add HTML element rendering methods:
  - [x] `renderHTMLElement()` - dispatcher
  - [x] `renderHeading()` - h1-h6
  - [x] `renderParagraph()` - p with inline formatting
  - [x] `renderInlineContent()` - bold, italic, code
  - [x] `renderTextContent()` - text with wrapping (reuses existing logic)
  - [x] `renderList()` - ul, ol with bullets/numbers
  - [x] `renderCodeBlock()` - reuses Shiki tokenization
  - [x] `renderBlockquote()` - indented content
  - [x] `renderHorizontalRule()` - hr element
- [ ] Test HTML rendering (requires manual testing)

### Phase 3: VS Code Integration

- [x] Get markdown extension API
- [x] Call `mdApi.render()` to get HTML
- [x] Add branching logic in `generatePdf()` method
- [ ] Test with various markdown documents (requires manual testing)

### Phase 4: Mode Selection

- [x] Add `useRenderedMd` flag to DocInfo
- [x] Handle mode choice in print command
- [ ] Add menu item to toggle mode (future enhancement)
- [ ] Test mode switching (requires manual testing)

### Phase 5: Polish

- [x] Respect `markdown.preview.fontFamily` setting
- [x] Respect `markdown.preview.fontSize` setting
- [ ] Get background colors from theme (future enhancement)
- [ ] Test with different themes (requires manual testing)
- [ ] Test with complex markdown (tables, nested lists, etc.) (requires manual testing)

---

## Timeline Estimate

- Phase 1 (Validation): ✅ 30 min - testing only (COMPLETE)
- Phase 2 (HTML Rendering): ✅ 8 hours (COMPLETE)
  - Setup: 1 hour
  - Basic elements (h1-6, p): 2 hours
  - Inline formatting (bold, italic, code): 1 hour
  - Lists: 2 hours
  - Code blocks: 1 hour (reuses tokens!)
  - Blockquotes, hr: 1 hour
- Phase 3 (VS Code API): ✅ 2 hours (COMPLETE)
- Phase 4 (Preview tabs): ✅ 2 hours (COMPLETE)
- Phase 5 (Test Infrastructure): 🚧 4-6 hours (IN PROGRESS)
  - Investigation: 1 hour
  - Fix vscode mocks: 2-3 hours
  - Write new tests: 1-2 hours
- Phase 6 (Polish & Manual Testing): 2 hours (PENDING)

### Time Summary

- **Total Estimated**: 18-20 hours
- **Completed**: 12.5 hours (Phases 1-4)
- **Remaining**: 5.5-7.5 hours (Phases 5-6)

---

## Key Decisions

### ✅ Direct rendering (no intermediate format)

Both `renderFromTokens()` and `renderFromHTML()` write directly to jsPDF.

### ✅ Maximum code reuse

HTML rendering reuses all the existing wrapping/paging helpers.

### ✅ Markdown preview settings

Respect user's `markdown.preview.*` configuration.

### ✅ Code blocks use existing tokenization

When HTML has code blocks, we tokenize them with Shiki and render using `renderFromTokens()`.

### ✅ Simple architecture

- `renderFromTokens()` - for code
- `renderFromHTML()` - for markdown
- Shared helpers - for wrapping, paging, text rendering

No classes, no transformers, no intermediate formats. Just two rendering methods in the PDF class.
