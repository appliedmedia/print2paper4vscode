# Markdown Print Plan (Revised: Direct Rendering)

## TODO List

### ✅ Phase 1: Validation (COMPLETE)
- [x] Verify raw markdown printing works
- [x] Test Shiki markdown syntax highlighting

### 🚧 Phase 2: HTML Rendering in PDF Class
- [ ] Install `node-html-parser` dependency
- [ ] Rename `PDF.renderTokenizedLine()` → `PDF.renderFromTokens()` for clarity
- [ ] Add `PDF.renderFromHTML(html: string)` method to parse and render HTML
- [ ] Add `htmlElementHandlers` map and `renderHTMLElement()` dispatcher method
- [ ] Add `getMarkdownFontInfo()` and `getFontFromElementStyle()` font helper methods
- [ ] Implement `renderHeading()` method for h1-h6 elements with font sizing
- [ ] Implement `renderParagraph()` method with spacing
- [ ] Implement `renderInlineContent()` with handlers for strong/b/em/i/code elements
- [ ] Implement `renderTextContent()` to reuse existing character wrapping logic
- [ ] Implement `renderList()` method for ul/ol with bullets and numbering
- [ ] Implement `renderCodeBlock()` to reuse Shiki tokenization for syntax highlighting
- [ ] Implement `renderBlockquote()` with indentation
- [ ] Implement `renderHorizontalRule()` method

### 🚧 Phase 3: VS Code Markdown API Integration
- [ ] Add VS Code markdown extension API integration to get rendered HTML
- [ ] Add `generateRenderedMarkdownPdf()` method to PaperPrinter

### 🚧 Phase 4: Mode Selection UI
- [ ] Add mode selection UI (Raw Source vs Rendered Preview) for markdown files
- [ ] Update `handlePrintCommandFromVSCode()` to check for markdown and show mode picker

### 🚧 Phase 5: Testing & Polish
- [ ] Test with basic markdown (headings, paragraphs, bold, italic)
- [ ] Test with lists (ordered and unordered, nested)
- [ ] Test with code blocks with syntax highlighting
- [ ] Test with complex markdown (blockquotes, tables, nested elements)
- [ ] Polish - Respect `markdown.preview.fontFamily` and `fontSize` settings
- [ ] Polish - Get background colors from theme for code/blockquotes
- [ ] Polish - Test with different VS Code themes

---

## Overview

Print markdown files in two modes:
1. **Raw Mode** - Print markdown source with syntax highlighting (already works)
2. **Rendered Mode** - Print HTML-rendered markdown (new feature)

## Architecture: Direct Rendering (No Intermediate Format)

```text
Raw Markdown:
  Editor Text → Shiki Tokens → PDF.renderFromTokens() → jsPDF

Rendered Markdown:
  Editor Text → VS Code MD API → HTML → PDF.renderFromHTML() → jsPDF
```

**Key Insight**: The PDF document IS the common format. No need for intermediate data structures.

**Unified Rendering**: Both `renderFromTokens()` and `renderFromHTML()` are input adapters that feed the same underlying line-by-line rendering primitives. They share:
- Character wrapping logic (`findCharacterBreakPoint()`)
- Page break detection (`shouldBreakPage()`)
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
      // TODO: Get background color from element style or theme
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
    // Get VS Code markdown extension
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
