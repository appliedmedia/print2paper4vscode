# Markdown Print Plan

## Overview

This document outlines the strategy for printing markdown files in two different modes:

1. **Raw Mode** - Print markdown source code with syntax highlighting (like any other code file)
2. **Rendered Mode** - Print the HTML-rendered version of the markdown content

## Current State

### What Works

- **Tab Detection**: `TabInspector.detectActiveTabCategory()` already distinguishes:
  - `'editor-nonmd'` - Regular code files
  - `'editor-md'` - Markdown files in edit mode
  - `'preview'` - Preview/webview tabs (includes markdown preview)

- **Raw Markdown Printing**: Currently works through existing code path
  - Markdown files are treated like any other language
  - Shiki provides syntax highlighting for markdown
  - Generates PDF with colored markdown syntax

### What Doesn't Work

- **Preview Tab Printing**: Currently shows error:
  ```typescript
  'Printing from preview tabs is not yet supported with the new PDF architecture'
  ```
- **Rendered Markdown Printing**: No mechanism to capture or print rendered HTML

## Research: VS Code Markdown Preview

### Built-in Markdown Preview

VS Code has a built-in markdown preview extension that:

- Opens markdown preview in a webview panel
- Uses `markdown.preview.showPreviewToSide` command
- Renders markdown to HTML internally
- Supports custom CSS themes
- Includes extensions (tables, code blocks, etc.)

### Available VS Code APIs

#### 1. Custom Markdown Preview API

VS Code provides `vscode.workspace.getConfiguration('markdown')` for markdown settings, but:

- ❌ No API to access preview HTML directly
- ❌ No API to hook into preview rendering
- ❌ Cannot extract HTML from preview webview

#### 2. Command API

```typescript
// Open markdown preview
await vscode.commands.executeCommand('markdown.showPreview', document.uri);

// Show preview to side
await vscode.commands.executeCommand('markdown.showPreviewToSide', document.uri);
```

But these only open the preview; they don't return HTML content.

#### 3. Markdown-it (VS Code's Internal Engine)

VS Code uses `markdown-it` internally for rendering, but:
- Not exposed via extension API
- Need to include as dependency to use directly

## Proposed Solution

### Architecture Overview

```text
Markdown File → Detect Mode → Print Appropriate Format

Mode Detection:
  ├─ Active Tab = Text Editor (languageId = 'markdown')
  │  └─ Print Raw Mode (current syntax highlighting)
  │
  └─ Active Tab = Webview Preview
     └─ Print Rendered Mode (HTML to PDF)
```

### Implementation Strategy

We propose a **three-phase approach** with increasing capabilities:

---

## Phase 1: Raw Markdown Printing (Already Works)

### Current Behavior

When printing from markdown editor:
- Extract markdown source via `TabInspector.getEditorSelectionOrAll()`
- Language ID = `'markdown'`
- Shiki tokenizes and highlights markdown syntax
- PDF shows colored markdown source (headers, lists, code blocks, etc.)

### Action Required

✅ **No changes needed** - this already works perfectly through existing code path.

**Validation**: Test that markdown files print with proper syntax highlighting.

---

## Phase 2: Mode Toggle for Markdown Files

### Problem

When editing markdown, user might want either:
- Raw markdown source (current behavior)
- Rendered HTML preview (new capability)

### Solution

Add a **Mode Menu** to the toolbar when printing markdown:

```text
Toolbar when languageId = 'markdown':
  [🖨 Print] [📄 Page] [🎨 Theme] [Tt Text] [📝 Markdown Mode]
                                              └─ Raw Source (default)
                                              └─ Rendered Preview
```

### Implementation

1. **Detect Markdown Context**:
   ```typescript
   // In PaperPrinter.createMenus()
   if (this.docInfo.languageId === 'markdown') {
     // Add markdown mode menu
     this.createMarkdownModeMenu();
   }
   ```

2. **Add Markdown Mode Menu**:
   ```typescript
   private menuItems_MarkdownMode(): UIMenuItem_t[] {
     return [
       { id: 'raw', displayName: 'Raw Source', iconSlotTriad: {...} },
       { id: 'rendered', displayName: 'Rendered Preview', iconSlotTriad: {...} }
     ];
   }
   ```

3. **Handle Mode Selection**:
   ```typescript
   private async handleSelection_MarkdownMode(
     menuId: MenuId_t,
     menuItemId: MenuItemId_t
   ): Promise<HandleSelection_t> {
     if (menuItemId === 'rendered') {
       // Render markdown to HTML and convert to PDF
       await this.generateRenderedMarkdownPdf();
     } else {
       // Use existing raw markdown path
       await this.generatePdf();
     }
     return { id: menuItemId, value: menuItemId };
   }
   ```

### User Experience

1. User edits markdown file
2. User triggers print command
3. Webview opens with toolbar
4. Default shows raw markdown with syntax highlighting
5. User clicks "Markdown Mode" → "Rendered Preview"
6. PDF regenerates showing rendered HTML

---

## Phase 3: Rendered Markdown PDF Generation

### Requirements

Convert markdown to HTML and generate PDF:

1. Parse markdown to HTML
2. Apply VS Code-compatible styles
3. Render HTML in PDF format
4. Preserve code blocks with syntax highlighting
5. Support tables, lists, images, links

### Option A: markdown-it + Custom Renderer ✅ **RECOMMENDED**

Use `markdown-it` (same as VS Code) with custom plugins:

```typescript
// Install dependencies
npm install markdown-it markdown-it-highlightjs

// In new file: src/MarkdownRenderer.ts
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export class MarkdownRenderer {
  private md: MarkdownIt;
  
  constructor(app: App) {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        // Use Shiki for code blocks (consistent with raw mode)
        return this.app.stylize.highlightCode(str, lang);
      }
    });
  }
  
  renderToHtml(markdown: string): string {
    return this.md.render(markdown);
  }
}
```

**Pros**:
- Same engine as VS Code (consistent rendering)
- Full control over HTML output
- Can use Shiki for code blocks (consistent highlighting)
- Supports all markdown-it plugins (tables, footnotes, etc.)

**Cons**:
- Need to implement HTML-to-PDF conversion
- Need to style HTML to match VS Code theme

### Option B: Puppeteer HTML-to-PDF ⚠️ **COMPLEX**

Render HTML in headless browser and capture PDF:

```typescript
import puppeteer from 'puppeteer';

async renderMarkdownToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}
```

**Pros**:
- Perfect HTML/CSS rendering
- Handles complex layouts automatically

**Cons**:
- Heavy dependency (Chromium binary)
- Slower performance
- More complex setup

### Option C: Use VS Code's Markdown API ❌ **NOT AVAILABLE**

VS Code doesn't expose markdown preview HTML via extension API.

---

## Recommended Implementation: Hybrid Approach

### Stage 1: HTML Generation (markdown-it)

```typescript
// src/MarkdownRenderer.ts
export class MarkdownRenderer {
  private app: App;
  private md: MarkdownIt;
  
  constructor(app: App) {
    this.app = app;
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false
    });
    
    // Use Shiki for code block highlighting
    this.md.set({
      highlight: (code, lang) => this.highlightCodeBlock(code, lang)
    });
  }
  
  private highlightCodeBlock(code: string, lang: string): string {
    // Use existing Shiki integration
    const tokens = this.app.stylize.tokenize(code, lang as LanguageId_t);
    return this.tokensToHtml(tokens);
  }
  
  renderToHtml(markdown: string, theme: string): string {
    const html = this.md.render(markdown);
    return this.wrapWithStyles(html, theme);
  }
  
  private wrapWithStyles(html: string, theme: string): string {
    // Apply VS Code theme styles
    const styles = this.getMarkdownStyles(theme);
    return `
      <html>
        <head>
          <style>${styles}</style>
        </head>
        <body class="vscode-${theme}">
          ${html}
        </body>
      </html>
    `;
  }
}
```

### Stage 2: HTML-to-PDF Conversion

Two approaches:

#### Approach 2A: jsPDF with HTML Plugin ⚠️ **LIMITED**

```typescript
import jsPDF from 'jspdf';
import 'jspdf-html2canvas';

const doc = new jsPDF();
await doc.html(htmlString, {
  callback: (doc) => doc.save('output.pdf'),
  x: 10,
  y: 10
});
```

**Limitations**:
- Limited CSS support
- Poor table rendering
- No flexbox/grid support

#### Approach 2B: Custom HTML Parser for jsPDF ✅ **RECOMMENDED**

```typescript
// src/HtmlToPdf.ts
export class HtmlToPdf {
  private app: App;
  
  constructor(app: App) {
    this.app = app;
  }
  
  async convertToPdf(html: string, docInfo: DocInfo_PDF): Promise<void> {
    // Parse HTML to DOM-like structure
    const dom = this.parseHtml(html);
    
    // Initialize PDF
    const doc = docInfo.pdfDoc;
    if (!doc) throw new Error('PDF document not initialized');
    
    // Render each element
    for (const element of dom.children) {
      await this.renderElement(element, doc, docInfo);
    }
  }
  
  private renderElement(element: HtmlElement, doc: jsPDF, docInfo: DocInfo_PDF): void {
    switch (element.tag) {
      case 'h1': this.renderHeading(element, doc, 1); break;
      case 'h2': this.renderHeading(element, doc, 2); break;
      case 'p': this.renderParagraph(element, doc); break;
      case 'code': this.renderCodeBlock(element, doc); break;
      case 'table': this.renderTable(element, doc); break;
      // ... more element types
    }
  }
}
```

**Benefits**:
- Full control over PDF rendering
- Consistent with existing PDF generation
- Can reuse existing Shiki/PDF code
- No external dependencies

---

## Phase 4: Preview Tab Printing (Future)

### Challenge

When markdown preview is open:
- Active tab = webview (not text editor)
- Cannot access preview HTML directly
- Cannot determine which file is being previewed

### Potential Solutions

#### Option 1: Detect Preview Context

```typescript
// Detect if active webview is markdown preview
const activePanel = vscode.window.activeTabGroup.activeTab;
if (activePanel?.input?.uri?.scheme === 'markdown-preview') {
  // Extract source file URI
  const sourceUri = /* extract from preview URI */;
  
  // Load source markdown
  const markdown = await vscode.workspace.fs.readFile(sourceUri);
  
  // Render to PDF
  await this.generateRenderedMarkdownPdf(markdown.toString());
}
```

#### Option 2: User Action Required

Show dialog:
```text
"Markdown preview detected. Print options:
  [ ] Print rendered markdown
  [ ] Print source code
  
[Which file?] dropdown with recent markdown files"
```

#### Option 3: Command Palette Integration

Add separate commands:
- `Print2Paper: Print Markdown (Raw)`
- `Print2Paper: Print Markdown (Rendered)`
- `Print2Paper: Print Markdown Preview`

---

## Implementation Checklist

### Phase 1: Validation (Immediate)
- [ ] Test raw markdown printing
- [ ] Verify Shiki markdown syntax highlighting
- [ ] Document current behavior

### Phase 2: Mode Toggle (Core Feature)
- [ ] Add markdown mode menu to toolbar
- [ ] Implement menu item handler
- [ ] Add mode selection persistence
- [ ] Update UI when mode changes

### Phase 3: Rendered Markdown (New Feature)
- [ ] Install markdown-it dependency
- [ ] Create `MarkdownRenderer.ts`
- [ ] Implement markdown-to-HTML conversion
- [ ] Create `HtmlToPdf.ts`
- [ ] Implement HTML element renderers:
  - [ ] Headings (h1-h6)
  - [ ] Paragraphs with inline formatting (bold, italic, code)
  - [ ] Lists (ordered, unordered, nested)
  - [ ] Code blocks (with Shiki highlighting)
  - [ ] Blockquotes
  - [ ] Tables
  - [ ] Images (if supported)
  - [ ] Links (as text or URLs)
- [ ] Apply VS Code theme styles
- [ ] Test with complex markdown documents

### Phase 4: Preview Tab Support (Future)
- [ ] Research preview tab detection
- [ ] Implement source file extraction
- [ ] Add preview-specific command
- [ ] Handle edge cases

---

## Technical Considerations

### Theme Consistency

Rendered markdown should match VS Code's markdown preview theme:

```typescript
// Get markdown preview CSS
const getMarkdownStyles = (theme: string): string => {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: ${theme === 'dark' ? '#d4d4d4' : '#333333'};
      background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
    }
    
    h1 { font-size: 2em; border-bottom: 1px solid #ccc; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; }
    
    code {
      font-family: 'Courier New', monospace;
      background: ${theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
      padding: 2px 4px;
      border-radius: 3px;
    }
    
    pre code {
      display: block;
      padding: 10px;
      overflow-x: auto;
    }
    
    /* ... more styles ... */
  `;
};
```

### Code Block Highlighting

Reuse existing Shiki integration:

```typescript
// In MarkdownRenderer
private async highlightCodeBlock(code: string, lang: string): Promise<string> {
  const tokens = await this.app.stylize.tokenize(code, lang as LanguageId_t);
  return this.tokensToHtml(tokens);
}

private tokensToHtml(tokens: ThemedToken[][]): string {
  return tokens.map(line => {
    const spans = line.map(token => 
      `<span style="color: ${token.color}">${escapeHtml(token.content)}</span>`
    ).join('');
    return `<div class="line">${spans}</div>`;
  }).join('\n');
}
```

### Page Breaking

HTML-to-PDF conversion needs smart page breaking:

```typescript
// Track vertical position during rendering
private renderWithPageBreaks(elements: HtmlElement[], doc: jsPDF): void {
  let yPos = doc.internal.pageSize.getHeight() - marginBottom;
  
  for (const element of elements) {
    const elementHeight = this.calculateHeight(element);
    
    if (yPos + elementHeight > pageHeight) {
      // Add new page
      doc.addPage();
      yPos = marginTop;
    }
    
    this.renderElement(element, doc, yPos);
    yPos += elementHeight;
  }
}
```

### Image Handling

For images in markdown:

```typescript
// Option 1: Skip images
if (element.tag === 'img') {
  return `[Image: ${element.alt}]`;
}

// Option 2: Embed images (future)
if (element.tag === 'img') {
  const imageData = await loadImage(element.src);
  doc.addImage(imageData, 'PNG', x, y, width, height);
}
```

---

## Alternative Approaches Considered

### ❌ Markdown-pdf (npm package)

**Why Not:**
- External dependency with limited control
- Doesn't integrate with VS Code themes
- No access to Shiki highlighting
- Generates PDFs independently (can't reuse our PDF object)

### ❌ Webview HTML Capture

**Why Not:**
- No API to extract HTML from VS Code's markdown preview
- Security restrictions prevent webview access
- Would require reverse-engineering preview content

### ❌ Chromium PDF Generation

**Why Not:**
- Heavy dependency (~300MB Chromium binary)
- Overkill for markdown rendering
- Slower performance
- Deployment complexity

---

## Testing Strategy

### Unit Tests

```typescript
// tests/MarkdownRenderer.test.ts
describe('MarkdownRenderer', () => {
  it('should render basic markdown to HTML', () => {
    const md = '# Hello\nWorld';
    const html = renderer.renderToHtml(md, 'light');
    assert(html.includes('<h1>Hello</h1>'));
    assert(html.includes('<p>World</p>'));
  });
  
  it('should highlight code blocks with Shiki', () => {
    const md = '```typescript\nconst x = 1;\n```';
    const html = renderer.renderToHtml(md, 'dark-plus');
    assert(html.includes('color:'));
    assert(html.includes('const'));
  });
});

// tests/HtmlToPdf.test.ts
describe('HtmlToPdf', () => {
  it('should convert HTML to PDF', async () => {
    const html = '<h1>Test</h1><p>Content</p>';
    await converter.convertToPdf(html, docInfo);
    assert(docInfo.pdfDoc);
    assert(docInfo.pageTotal > 0);
  });
});
```

### Integration Tests

```typescript
// tests/Markdown-Integration.test.ts
describe('Markdown Printing Integration', () => {
  it('should print raw markdown with syntax highlighting', async () => {
    // Test raw mode
  });
  
  it('should print rendered markdown as HTML', async () => {
    // Test rendered mode
  });
  
  it('should toggle between raw and rendered modes', async () => {
    // Test mode switching
  });
});
```

### Manual Testing

1. **Simple markdown**: Headers, paragraphs, lists
2. **Code blocks**: Multiple languages with syntax highlighting
3. **Complex markdown**: Tables, nested lists, blockquotes
4. **Long documents**: Page breaking, headers/footers
5. **Theme switching**: Light/dark themes, custom themes

---

## Dependencies

### Required

```json
{
  "dependencies": {
    "markdown-it": "^14.0.0"
  }
}
```

### Optional (Future)

```json
{
  "dependencies": {
    "markdown-it-anchor": "^8.6.7",      // Heading anchors
    "markdown-it-toc-done-right": "^4.2.0", // Table of contents
    "markdown-it-footnote": "^4.0.0",    // Footnotes
    "markdown-it-task-lists": "^2.1.1"   // GitHub-style task lists
  }
}
```

---

## Success Criteria

### Phase 1
- [x] Raw markdown prints with Shiki syntax highlighting
- [x] Works with existing print workflow

### Phase 2
- [ ] Markdown mode menu appears for markdown files
- [ ] Toggle between raw and rendered modes works
- [ ] Mode selection persists across sessions

### Phase 3
- [ ] Rendered markdown shows proper HTML formatting
- [ ] Code blocks use Shiki highlighting (consistent with raw mode)
- [ ] Tables, lists, and formatting render correctly
- [ ] Multi-page documents with proper page breaks
- [ ] Theme styles match VS Code markdown preview

### Phase 4
- [ ] Preview tab detection works
- [ ] Source file extraction from preview context
- [ ] Seamless printing from preview tab

---

## Timeline Estimate

- **Phase 1 Validation**: 1 hour (testing only)
- **Phase 2 Mode Toggle**: 4-6 hours (UI + handlers)
- **Phase 3 Rendered Mode**: 16-24 hours (markdown-it + HTML-to-PDF)
  - markdown-it integration: 4 hours
  - HTML parser: 6 hours
  - Element renderers: 8 hours
  - Theme styles: 4 hours
  - Testing: 4 hours
- **Phase 4 Preview Support**: 8-12 hours (detection + edge cases)

**Total**: 29-43 hours for complete implementation

---

## Questions for User

1. **Priority**: Which phase should we implement first?
   - Phase 2 (mode toggle) enables user choice
   - Phase 3 (rendered mode) provides the actual feature
   - Both can be done together

2. **Image Handling**: How should we handle images in rendered markdown?
   - Skip them with `[Image: alt-text]` placeholder?
   - Attempt to embed them (more complex)?
   - Let user decide via menu option?

3. **Preview Tab Detection**: Should we prioritize preview tab printing?
   - Users can currently open source and print from there
   - Preview tab support is more convenient but complex

4. **Default Mode**: For markdown files, what should be the default?
   - Raw source (current behavior, no surprises)
   - Rendered preview (more useful for documentation)
   - Remember last selection per file?

---

## Conclusion

The recommended approach is:

1. **Start with Phase 2** - Add mode toggle to establish UI pattern
2. **Implement Phase 3** - Build markdown-it + HTML-to-PDF converter
3. **Test thoroughly** - Ensure rendering quality matches VS Code
4. **Consider Phase 4** - Add preview tab support if requested

This provides maximum value with minimal external dependencies while maintaining consistency with the existing codebase architecture.

The hybrid approach (markdown-it for HTML + custom HTML-to-PDF) gives us:
- ✅ Full control over rendering
- ✅ Consistency with existing PDF generation
- ✅ Theme integration
- ✅ No heavy dependencies
- ✅ Extensible for future enhancements

**Next Steps**: Get user feedback on priorities and proceed with implementation.
