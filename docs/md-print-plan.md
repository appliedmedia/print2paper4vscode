# Markdown Print Plan (Revised: Direct Rendering)

## Overview

Print markdown files in two modes:
1. **Raw Mode** - Print markdown source with syntax highlighting (already works)
2. **Rendered Mode** - Print HTML-rendered markdown (new feature)

## Architecture: Direct Rendering (No Intermediate Format)

```
Raw Markdown:
  Editor Text → Shiki Tokens → PDF.renderFromTokens() → jsPDF

Rendered Markdown:
  Editor Text → VS Code MD API → HTML → PDF.renderFromHTML() → jsPDF
```

**Key Insight**: The PDF document IS the common format. No need for intermediate data structures.

---

## Phase 1: Validation (Already Works) ✅

Raw markdown printing works through existing code path:
- `TabInspector.detectActiveTabCategory()` returns `'editor-md'`
- Shiki tokenizes markdown source
- `PDF.renderFromTokens()` renders with syntax highlighting

**No changes needed.**

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
   * Render a single HTML element
   */
  private renderHTMLElement(element: HTMLElement): void {
    const dx = this.dx.sub('renderHTMLElement');
    
    switch (element.tagName) {
      case 'h1':
        this.renderHeading(element, 1);
        break;
      case 'h2':
        this.renderHeading(element, 2);
        break;
      case 'h3':
        this.renderHeading(element, 3);
        break;
      case 'h4':
        this.renderHeading(element, 4);
        break;
      case 'h5':
        this.renderHeading(element, 5);
        break;
      case 'h6':
        this.renderHeading(element, 6);
        break;
      case 'p':
        this.renderParagraph(element);
        break;
      case 'ul':
      case 'ol':
        this.renderList(element);
        break;
      case 'pre':
        this.renderCodeBlock(element);
        break;
      case 'blockquote':
        this.renderBlockquote(element);
        break;
      case 'hr':
        this.renderHorizontalRule();
        break;
      default:
        // Skip unknown elements
        dx.out(`Unknown element: ${element.tagName}`);
        break;
    }
    
    dx.done();
  }
  
  /**
   * Render heading element
   */
  private renderHeading(element: HTMLElement, level: number): void {
    if (!this.docInfo.pdfDoc) return;
    
    // Get user's base font settings
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const baseFontFamily = editorTypo.fontFamily;
    const baseFontSize = editorTypo.fontSize;
    
    // Calculate heading size (2x, 1.5x, 1.25x, 1.1x, 1x, 0.9x)
    const sizeMultipliers = [2.0, 1.5, 1.25, 1.1, 1.0, 0.9];
    const multiplier = sizeMultipliers[level - 1] || 1.0;
    const headingSize = this.coords.cssPxToPdfPts(baseFontSize * multiplier);
    
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
        
        switch (el.tagName) {
          case 'strong':
          case 'b':
            this.docInfo.pdfDoc.setFont(savedFont.fontName, 'bold');
            this.renderTextContent(el.text);
            this.docInfo.pdfDoc.setFont(savedFont.fontName, savedFont.fontStyle);
            break;
            
          case 'em':
          case 'i':
            this.docInfo.pdfDoc.setFont(savedFont.fontName, 'italic');
            this.renderTextContent(el.text);
            this.docInfo.pdfDoc.setFont(savedFont.fontName, savedFont.fontStyle);
            break;
            
          case 'code':
            const editorTypo = this.app.vscodeapis.getEditorTypography();
            const monoFont = this.mapFontFamilyToJsPDF(editorTypo.fontFamily, this.docInfo.pdfDoc);
            this.docInfo.pdfDoc.setFont(monoFont, 'normal');
            // TODO: Add background color for inline code
            this.renderTextContent(el.text);
            this.docInfo.pdfDoc.setFont(savedFont.fontName, savedFont.fontStyle);
            break;
            
          default:
            // Recursively process unknown inline elements
            this.renderInlineContent(el);
            break;
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

### VS Code Markdown API Integration

```typescript
// src/PaperPrinter.ts

async handlePrintCommandFromVSCode(): Promise<void> {
  const category = this.app.tabinspector.detectActiveTabCategory();
  
  if (category === 'preview') {
    this.dx.error('Printing from preview tabs not yet supported');
    return;
  }
  
  const info = this.app.tabinspector.getEditorSelectionOrAll();
  if (!info || !info.text || !info.languageId) {
    this.dx.error('No active editor or content found');
    return;
  }
  
  this.docInfo.rawCode = info.text.trim();
  this.docInfo.languageId = info.languageId as LanguageId_t;
  this.docInfo.printTitle = info.name;
  
  // Check if markdown
  const isMarkdown = info.languageId === 'markdown';
  
  if (isMarkdown) {
    // Show mode selection
    const mode = await this.app.ui.showQuickPick([
      { label: 'Raw Source', value: 'raw' },
      { label: 'Rendered Preview', value: 'rendered' }
    ]);
    
    if (mode === 'rendered') {
      await this.generateRenderedMarkdownPdf();
    } else {
      await this.generatePdf(); // Existing raw mode
    }
  } else {
    await this.generatePdf(); // Non-markdown files
  }
  
  // Display in webview
  this.uiwebview = new UIWebView(this.app);
  this.uiwebview.init();
  await this.uiwebview.displayPdfPanel();
}

/**
 * Generate PDF from rendered markdown
 */
private async generateRenderedMarkdownPdf(): Promise<void> {
  const dx = this.dx.sub('generateRenderedMarkdownPdf');
  
  try {
    // Get VS Code's markdown extension
    const mdExtension = this.app.vscodeapis.getExtension('vscode.markdown-language-features');
    
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
    
    // Get active document
    const editor = this.app.vscodeapis.getActiveTextEditor();
    if (!editor) {
      throw new Error('No active editor');
    }
    
    // Render markdown to HTML using VS Code's API
    const html = await mdApi.render(this.docInfo.rawCode, editor.document);
    
    dx.out(`Rendered markdown to HTML (${html.length} chars)`);
    
    // Setup PDF
    this.app.pdf.setupPdf();
    this.app.pdf.addHeaderAndFooter();
    
    // Render HTML to PDF
    await this.app.pdf.renderFromHTML(html);
    
    // Finish PDF
    this.app.pdf.finishPdf();
    
    dx.out(`Generated PDF from rendered markdown`);
  } catch (error) {
    dx.error(`Failed to generate rendered markdown PDF: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

---

## Phase 4: Add Mode Toggle to UI

### Option A: Quick Pick (Simple)

```typescript
// User triggers print on markdown file
// → Show quick pick: "Raw Source" or "Rendered Preview"
// → Generate PDF in chosen mode
```

### Option B: Toolbar Menu (Advanced)

```typescript
// Add "Markdown Mode" menu to toolbar (only for markdown files)
// User can toggle between modes and see live updates
```

**Recommendation**: Start with Option A (quick pick), add Option B later if needed.

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
- [ ] Install `node-html-parser`
- [ ] Rename `renderTokenizedLine()` → `renderFromTokens()`
- [ ] Add `renderFromHTML()` method
- [ ] Add HTML element rendering methods:
  - [ ] `renderHTMLElement()` - dispatcher
  - [ ] `renderHeading()` - h1-h6
  - [ ] `renderParagraph()` - p with inline formatting
  - [ ] `renderInlineContent()` - bold, italic, code
  - [ ] `renderTextContent()` - text with wrapping (reuses existing logic)
  - [ ] `renderList()` - ul, ol with bullets/numbers
  - [ ] `renderCodeBlock()` - reuses Shiki tokenization
  - [ ] `renderBlockquote()` - indented content
  - [ ] `renderHorizontalRule()` - hr element
- [ ] Test HTML rendering

### Phase 3: VS Code Integration
- [ ] Get markdown extension API
- [ ] Call `mdApi.render()` to get HTML
- [ ] Add `generateRenderedMarkdownPdf()` method
- [ ] Test with various markdown documents

### Phase 4: Mode Selection
- [ ] Add quick pick for mode selection
- [ ] Handle mode choice in print command
- [ ] Test mode switching

### Phase 5: Polish
- [ ] Respect `markdown.preview.fontFamily` setting
- [ ] Respect `markdown.preview.fontSize` setting
- [ ] Get background colors from theme
- [ ] Test with different themes
- [ ] Test with complex markdown (tables, nested lists, etc.)

---

## Timeline Estimate

- Phase 1 (Validation): 30 min - testing only
- Phase 2 (HTML Rendering): 8 hours
  - Setup: 1 hour
  - Basic elements (h1-6, p): 2 hours
  - Inline formatting (bold, italic, code): 1 hour
  - Lists: 2 hours
  - Code blocks: 1 hour (reuses tokens!)
  - Blockquotes, hr: 1 hour
- Phase 3 (VS Code API): 2 hours
- Phase 4 (Mode selection): 1 hour
- Phase 5 (Polish): 2 hours

**Total: ~14 hours**

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
