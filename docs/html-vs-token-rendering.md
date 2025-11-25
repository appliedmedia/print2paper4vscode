# HTML vs Token Rendering Comparison

## Current Token-Based Rendering

### How It Works

**Input**: `ThemedToken[][]` (array of lines, each line has array of tokens)

**Each Token Contains**:
```typescript
{
  content: string;      // The text to render
  color: string;        // Hex color like "#FF0000"
  fontStyle?: number;   // Bit flags: 1=bold, 2=italic
}
```

**Rendering Process** (see `PDF.renderTokenizedLine()`):
```typescript
// For each line
for (const token of tokens) {
  const color = token.color || '#000000';
  let content = token.content;
  
  // Set color
  this.setTextColorFromWebColor(doc, color);
  
  // Process character-by-character for wrapping
  while (content.length > 0) {
    // Find how many chars fit on current line
    const charsToRender = this.findCharacterBreakPoint(content, xPos, ...);
    
    // Render the portion that fits
    const portionToRender = content.substring(0, charsToRender);
    doc.text(portionToRender, xPos, yPos);
    
    // Advance position
    xPos += doc.getTextWidth(portionToRender);
    content = content.substring(charsToRender);
    
    // Wrap to next line if needed
    if (content.length > 0) {
      yPos += lineHeight;
      xPos = leftMargin;
      if (shouldBreakPage(yPos)) addPageBreak();
    }
  }
}

// Move to next line
yPos += lineHeight;
```

**Key Features**:
- ✅ Character-by-character rendering
- ✅ Precise width calculations
- ✅ Automatic line wrapping
- ✅ Page break detection
- ✅ Color changes per token
- ✅ Position tracking

---

## HTML-Based Rendering (Proposed)

### HTML Structure from VS Code Markdown API

**Input**: HTML string from `mdApi.render(markdown)`

**Example HTML**:
```html
<h1>Title</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<pre><code class="language-typescript">const x = 1;</code></pre>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Approach 1: Parse HTML and Walk Elements (SIMILAR TO TOKENS)

```typescript
// Parse HTML into element tree
interface HtmlElement {
  tag: string;                    // 'p', 'h1', 'code', etc.
  content: string | HtmlElement[]; // Text content or child elements
  attrs: Record<string, string>;  // Attributes like class, style
}

// Render element (similar to renderTokenizedLine)
function renderElement(element: HtmlElement, xPos: number, yPos: number) {
  // Set formatting based on tag
  switch (element.tag) {
    case 'h1':
      doc.setFontSize(24);
      doc.setFont('Helvetica', 'bold');
      break;
    case 'h2':
      doc.setFontSize(18);
      doc.setFont('Helvetica', 'bold');
      break;
    case 'p':
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'normal');
      break;
    case 'code':
      doc.setFont('Courier', 'normal');
      break;
  }
  
  // Render text content (similar to token rendering)
  if (typeof element.content === 'string') {
    let text = element.content;
    
    while (text.length > 0) {
      // Find break point (SAME as token rendering)
      const charsToRender = findCharacterBreakPoint(text, xPos, ...);
      const portion = text.substring(0, charsToRender);
      
      doc.text(portion, xPos, yPos);
      xPos += doc.getTextWidth(portion);
      text = text.substring(charsToRender);
      
      if (text.length > 0) {
        yPos += lineHeight;
        xPos = leftMargin;
        if (shouldBreakPage(yPos)) addPageBreak();
      }
    }
  }
  
  // Render child elements recursively
  if (Array.isArray(element.content)) {
    for (const child of element.content) {
      [xPos, yPos] = renderElement(child, xPos, yPos);
    }
  }
  
  // Return updated position
  return [xPos, yPos];
}
```

**Comparison**:

| Feature | Token Rendering | HTML Rendering |
|---------|----------------|----------------|
| Input structure | Flat (tokens per line) | Hierarchical (nested elements) |
| Character wrapping | ✅ Same | ✅ Same |
| Width calculation | ✅ Same | ✅ Same |
| Page breaks | ✅ Same | ✅ Same |
| Formatting | Color only | Font size, weight, family |
| Inline changes | Per token | Per element |
| Complexity | Simple (linear) | Moderate (recursive) |

---

## Feasibility Assessment

### What's the Same ✅

Both approaches use identical low-level rendering:

1. **Text measurement**: `doc.getTextWidth(text)`
2. **Text rendering**: `doc.text(text, x, y)`
3. **Line wrapping**: Character-by-character break point detection
4. **Page breaks**: Y position threshold checking
5. **Position tracking**: Update `xPos`, `yPos` after each render

### What's Different 🔄

**Token Rendering**:
- Flat structure (no nesting)
- Color is the only variable
- One font size throughout
- Simple sequential processing

**HTML Rendering**:
- Nested structure (recursion needed)
- Multiple formatting variables (size, weight, family)
- Different font sizes per element
- Need to handle inline vs block elements

### Key Challenges 🚧

1. **Block vs Inline Elements**:
   ```html
   <p>Text with <strong>bold</strong> word</p>
   ```
   - `<p>` is block (new line before/after)
   - `<strong>` is inline (continues on same line)

2. **Font Size Changes**:
   ```html
   <p>Normal text</p>
   <h1>Big heading</h1>
   ```
   - Need to recalculate `lineHeight` when font size changes
   - Page break threshold changes with font size

3. **Lists and Indentation**:
   ```html
   <ul>
     <li>Item 1</li>
     <li>Item 2</li>
   </ul>
   ```
   - Need to track indentation level
   - Add bullet characters or numbers

4. **Code Blocks with Syntax Highlighting**:
   ```html
   <pre><code class="language-typescript">const x = 1;</code></pre>
   ```
   - Need to tokenize code content
   - Apply Shiki highlighting (REUSE existing token renderer!)
   - Render with background color

---

## Recommended Approach: Hybrid Strategy

### Use Token Renderer for Code Blocks ✅

```typescript
// When we encounter a code block in HTML
if (element.tag === 'code' && element.attrs.class?.startsWith('language-')) {
  const lang = element.attrs.class.replace('language-', '');
  const code = element.content as string;
  
  // REUSE existing Shiki tokenization!
  const tokens = await app.stylize.tokenize(code, lang as LanguageId_t);
  
  // REUSE existing token renderer!
  for (let i = 0; i < tokens.length; i++) {
    app.pdf.renderTokenizedLine(i, tokens[i]);
  }
  
  // Done! Code block rendered with syntax highlighting
}
```

### Simple HTML Parser for Markdown Elements

```typescript
class MarkdownHtmlRenderer {
  private doc: jsPDF;
  private xPos: number;
  private yPos: number;
  private lineHeight: number;
  
  async renderHtml(html: string): Promise<void> {
    const elements = this.parseHtml(html);
    
    for (const element of elements) {
      await this.renderElement(element);
    }
  }
  
  private async renderElement(element: HtmlElement): Promise<void> {
    switch (element.tag) {
      case 'h1':
        this.renderHeading(element, 1);
        break;
      case 'h2':
        this.renderHeading(element, 2);
        break;
      case 'h3':
        this.renderHeading(element, 3);
        break;
      case 'p':
        this.renderParagraph(element);
        break;
      case 'code':
        await this.renderCodeBlock(element); // Uses Shiki + token renderer
        break;
      case 'ul':
        this.renderList(element, 'bullet');
        break;
      case 'ol':
        this.renderList(element, 'numbered');
        break;
      case 'blockquote':
        this.renderBlockquote(element);
        break;
      case 'table':
        this.renderTable(element);
        break;
      default:
        // Skip unknown tags
        break;
    }
  }
  
  private renderHeading(element: HtmlElement, level: number): void {
    // Set font size based on level
    const sizes = { 1: 24, 2: 18, 3: 14, 4: 12, 5: 10, 6: 10 };
    const size = sizes[level as keyof typeof sizes] || 12;
    
    this.doc.setFontSize(size);
    this.doc.setFont('Helvetica', 'bold');
    
    // Render text content (reuse character wrapping logic)
    this.renderText(element.content as string);
    
    // Add spacing after heading
    this.yPos += this.lineHeight * 0.5;
    
    // Reset font
    this.doc.setFontSize(12);
    this.doc.setFont('Helvetica', 'normal');
  }
  
  private renderParagraph(element: HtmlElement): void {
    // Handle inline formatting (bold, italic, code)
    if (Array.isArray(element.content)) {
      for (const child of element.content) {
        this.renderInline(child);
      }
    } else {
      this.renderText(element.content);
    }
    
    // Add spacing after paragraph
    this.yPos += this.lineHeight * 0.5;
  }
  
  private renderInline(element: HtmlElement): void {
    // Save current font
    const savedFont = this.doc.getFont();
    
    // Apply inline formatting
    if (element.tag === 'strong' || element.tag === 'b') {
      this.doc.setFont(savedFont.fontName, 'bold');
    } else if (element.tag === 'em' || element.tag === 'i') {
      this.doc.setFont(savedFont.fontName, 'italic');
    } else if (element.tag === 'code') {
      this.doc.setFont('Courier', 'normal');
    }
    
    // Render text
    this.renderText(element.content as string);
    
    // Restore font
    this.doc.setFont(savedFont.fontName, savedFont.fontStyle);
  }
  
  private renderText(text: string): void {
    // REUSE EXACT LOGIC from renderTokenizedLine!
    let remaining = text;
    
    while (remaining.length > 0) {
      const charsToRender = this.findCharacterBreakPoint(remaining, this.xPos, ...);
      const portion = remaining.substring(0, charsToRender);
      
      this.doc.text(portion, this.xPos, this.yPos);
      this.xPos += this.doc.getTextWidth(portion);
      remaining = remaining.substring(charsToRender);
      
      if (remaining.length > 0) {
        this.yPos += this.lineHeight;
        this.xPos = this.leftMargin;
        if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
      }
    }
  }
  
  private async renderCodeBlock(element: HtmlElement): Promise<void> {
    const lang = element.attrs.class?.replace('language-', '') || 'plaintext';
    const code = element.content as string;
    
    // Add background color for code block
    const oldY = this.yPos;
    
    // REUSE existing Shiki tokenization!
    const tokens = await this.app.stylize.tokenize(code, lang as LanguageId_t);
    
    // REUSE existing token renderer!
    for (let i = 0; i < tokens.length; i++) {
      this.app.pdf.renderTokenizedLine(i, tokens[i]);
    }
    
    // Update position after code block
    this.yPos = this.app.pdf.currentY;
    this.xPos = this.app.pdf.currentX;
    
    // Add spacing after code block
    this.yPos += this.lineHeight * 0.5;
  }
  
  private renderList(element: HtmlElement, type: 'bullet' | 'numbered'): void {
    const items = element.content as HtmlElement[];
    let itemNumber = 1;
    
    for (const item of items) {
      if (item.tag !== 'li') continue;
      
      // Render bullet or number
      const prefix = type === 'bullet' ? '• ' : `${itemNumber}. `;
      this.doc.text(prefix, this.xPos, this.yPos);
      this.xPos += this.doc.getTextWidth(prefix);
      
      // Render item content (might be nested)
      if (Array.isArray(item.content)) {
        for (const child of item.content) {
          this.renderInline(child);
        }
      } else {
        this.renderText(item.content);
      }
      
      // Move to next line
      this.yPos += this.lineHeight;
      this.xPos = this.leftMargin;
      
      if (type === 'numbered') itemNumber++;
    }
    
    // Add spacing after list
    this.yPos += this.lineHeight * 0.5;
  }
  
  private renderBlockquote(element: HtmlElement): void {
    // Increase left margin for indent
    const oldMargin = this.leftMargin;
    this.leftMargin += 20;
    this.xPos = this.leftMargin;
    
    // Render content
    if (Array.isArray(element.content)) {
      for (const child of element.content) {
        this.renderElement(child);
      }
    } else {
      this.renderText(element.content);
    }
    
    // Restore margin
    this.leftMargin = oldMargin;
    this.xPos = oldMargin;
    
    // Add spacing after blockquote
    this.yPos += this.lineHeight * 0.5;
  }
  
  private renderTable(element: HtmlElement): void {
    // Tables are complex - simplified version:
    // 1. Calculate column widths
    // 2. Render header row
    // 3. Render data rows
    // 4. Draw borders
    
    // For MVP: Convert to plain text representation
    this.renderText('[Table content - detailed rendering TBD]');
    this.yPos += this.lineHeight;
  }
}
```

---

## Feasibility: ✅ YES, Very Similar!

### What We Can Reuse (90% of the work)

1. **Character wrapping logic**: `findCharacterBreakPoint()` - IDENTICAL
2. **Page break detection**: `shouldBreakPage()` - IDENTICAL  
3. **Page break handling**: `addPageBreak()` - IDENTICAL
4. **Text measurement**: `doc.getTextWidth()` - IDENTICAL
5. **Text rendering**: `doc.text()` - IDENTICAL
6. **Code block highlighting**: REUSE entire token renderer!

### What We Need to Add (10% new work)

1. **HTML parser**: Convert HTML string to element tree (~100 lines)
2. **Element dispatcher**: Route element types to handlers (~50 lines)
3. **Heading renderer**: Set font size, render, restore (~30 lines)
4. **Paragraph renderer**: Handle inline formatting (~40 lines)
5. **List renderer**: Add bullets/numbers, indent (~60 lines)
6. **Blockquote renderer**: Indent and render (~30 lines)
7. **Table renderer**: Grid layout (can be MVP text version) (~100 lines)

**Total new code**: ~400 lines
**Reused code**: ~1000 lines from existing token renderer

---

## Implementation Complexity

### Difficulty Rating: 🟢 MODERATE (Not Hard!)

**Why it's feasible**:
- ✅ 90% of rendering logic already exists
- ✅ Code blocks REUSE token renderer completely
- ✅ HTML parsing is well-understood (many libraries available)
- ✅ Markdown HTML is simpler than general HTML (no CSS, no JS)
- ✅ We control the input (VS Code's markdown API output)

**Why it's not too complex**:
- 📦 Can use lightweight HTML parser like `node-html-parser` (20KB)
- 📝 Markdown HTML is predictable (limited tag set)
- 🔄 Recursive rendering is straightforward
- 🎨 No CSS parsing needed (we set styles in code)

---

## Comparison with Original Proposal

### Original Plan: markdown-it + Custom HTML Renderer

**Problems**:
- ❌ Need to install markdown-it
- ❌ Need to configure all plugins
- ❌ Output might differ from VS Code preview
- ❌ Need to maintain markdown-it configuration

### NEW Plan: VS Code API + HTML Renderer

**Advantages**:
- ✅ Zero markdown dependencies
- ✅ Uses VS Code's actual renderer
- ✅ Perfect match with preview
- ✅ Automatic plugin support (GFM, math, mermaid)
- ✅ Reuses 90% of existing code

---

## Proof of Concept

### Step 1: Simple HTML Parser

```typescript
import { parse } from 'node-html-parser';

const html = '<h1>Title</h1><p>Paragraph</p>';
const root = parse(html);

for (const element of root.childNodes) {
  console.log(element.tagName, element.text);
}
// Output:
// h1 Title
// p Paragraph
```

### Step 2: Render Simple Elements

```typescript
async function renderMarkdownHtml(html: string): Promise<void> {
  const root = parse(html);
  
  for (const element of root.childNodes) {
    switch (element.tagName) {
      case 'h1':
        doc.setFontSize(24);
        doc.text(element.text, xPos, yPos);
        yPos += 30;
        doc.setFontSize(12);
        break;
        
      case 'p':
        doc.text(element.text, xPos, yPos);
        yPos += 20;
        break;
        
      case 'pre':
        // REUSE token renderer for code!
        const code = element.querySelector('code')?.text || '';
        const lang = element.querySelector('code')?.classNames[0]?.replace('language-', '') || 'plaintext';
        const tokens = await stylize.tokenize(code, lang as LanguageId_t);
        for (let i = 0; i < tokens.length; i++) {
          pdf.renderTokenizedLine(i, tokens[i]);
        }
        yPos = pdf.currentY;
        break;
    }
  }
}
```

### Step 3: Add Character Wrapping (Reuse Existing!)

```typescript
// Just copy findCharacterBreakPoint from PDF.ts
// It already works perfectly!
```

---

## Timeline Estimate (Revised)

### Phase 1: HTML Parser Integration (4 hours)
- Install `node-html-parser` (5 min)
- Create `MarkdownHtmlRenderer` class (1 hour)
- Implement element tree walker (1 hour)
- Test with simple HTML (2 hours)

### Phase 2: Basic Elements (6 hours)
- Headings (h1-h6) - 1 hour
- Paragraphs with inline formatting - 2 hours
- Lists (ul, ol) - 2 hours
- Blockquotes - 1 hour

### Phase 3: Code Blocks with Syntax Highlighting (2 hours)
- Detect code blocks - 30 min
- Extract language and code - 30 min
- Call existing Shiki tokenizer - 30 min
- Call existing token renderer - 30 min

### Phase 4: Advanced Elements (6 hours)
- Tables - 4 hours
- Images (placeholder or embed) - 2 hours

### Phase 5: VS Code API Integration (2 hours)
- Get markdown extension API - 30 min
- Call render method - 30 min
- Handle both editor and preview cases - 1 hour

### Phase 6: Testing (4 hours)
- Unit tests - 2 hours
- Integration tests - 2 hours

**Total: 24 hours** (vs 29-43 hours in original plan)

---

## Decision Matrix

| Criteria | Token Rendering | HTML Rendering | Verdict |
|----------|----------------|----------------|---------|
| Code reuse | ✅ Current | ✅ 90% reuse | EQUAL |
| Complexity | 🟢 Simple | 🟡 Moderate | HTML slightly harder |
| Implementation time | ✅ Done | 🟡 24 hours | Token wins (already done) |
| Markdown support | ❌ No structure | ✅ Full structure | HTML wins |
| VS Code compatibility | ✅ Via Shiki | ✅ Via API | EQUAL |
| Dependencies | ✅ Zero new | 🟡 node-html-parser | Token wins |
| Maintenance | ✅ Stable | 🟡 Need to update | Token wins |

---

## Final Recommendation

### ✅ HTML Rendering is Feasible and Similar!

**Key Insight**: The low-level rendering (text, wrapping, page breaks) is IDENTICAL. The only difference is:
- Tokens: Flat list with colors
- HTML: Tree structure with formatting

**Code Reuse**: 90% of PDF.ts rendering logic can be reused!

**Complexity**: Moderate (not hard) - mostly about element dispatch and recursion

**Timeline**: 24 hours for complete implementation

### Implementation Strategy

1. **Keep raw markdown printing** (already works)
2. **Add VS Code markdown API** (use official renderer)
3. **Build HTML renderer** that reuses existing PDF rendering
4. **REUSE token renderer** for code blocks (zero changes!)
5. **Add mode toggle** in UI (raw vs rendered)

This gives us:
- ✅ Perfect match with VS Code preview
- ✅ Syntax highlighting in code blocks (existing code)
- ✅ All markdown features (via VS Code API)
- ✅ Minimal new code (mostly element dispatch)
- ✅ No markdown-it dependency

**Bottom line**: Yes, we can walk HTML elements just like we walk tokens. The rendering primitives are the same!
