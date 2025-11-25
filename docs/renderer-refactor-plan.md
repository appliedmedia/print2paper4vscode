# Renderer Refactor: Generic PDF Writer Architecture

## Current Architecture (Token-Specific)

```
Shiki Tokens → renderTokenizedLine() → jsPDF
  (ThemedToken[])      ↓
                   - Set color
                   - Render text with wrapping
                   - Advance position
                   - Check page breaks
```

**Problem**: Rendering logic is coupled to token structure.

---

## Proposed Architecture (Generic)

```
┌─────────────────┐
│  Token Source   │
│ (Shiki tokens)  │
└────────┬────────┘
         │
         ↓
    [Transform]
         │
         ↓
┌────────────────┐         ┌─────────────────┐
│ HTML Source    │         │  Generic Format │
│(VS Code MD API)│────────→│  (RenderRun[])  │
└────────────────┘         └────────┬────────┘
                                    │
                                    ↓
                           ┌────────────────┐
                           │ Generic Renderer│
                           │  renderRun()   │
                           └────────┬────────┘
                                    │
                                    ↓
                                  jsPDF
```

---

## The Generic Format: "RenderRun"

A **RenderRun** is the minimal unit of formatted text that should be rendered together.

```typescript
/**
 * A run of text with consistent formatting
 * This is the universal intermediate format for all renderers
 */
interface RenderRun {
  // Required
  content: string;              // The text to render
  
  // Font formatting
  fontFamily?: string;          // 'Courier', 'Helvetica', 'Times'
  fontSizePt?: number;          // Font size in points (default: current)
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  
  // Color
  color?: string;               // Hex color like "#FF0000" (default: black)
  backgroundColor?: string;     // Background color (optional)
  
  // Block-level behavior
  blockType?: 'inline' | 'block';  // Default: 'inline'
  spacingBefore?: number;       // Points to add before (for headings, paragraphs)
  spacingAfter?: number;        // Points to add after
  
  // Indentation
  indentLevel?: number;         // For lists, blockquotes (default: 0)
  indentSize?: number;          // Points per indent level (default: 20)
  
  // Prefix (for lists)
  prefix?: string;              // "• " for bullets, "1. " for numbers
}
```

### Example: Token → RenderRun

```typescript
// Token from Shiki
const token: ThemedToken = {
  content: "const",
  color: "#0000FF"
};

// Converted to RenderRun
const run: RenderRun = {
  content: "const",
  color: "#0000FF",
  fontFamily: "Courier",
  fontSizePt: 12,
  blockType: 'inline'
};
```

### Example: HTML → RenderRun

```typescript
// HTML element
<h1>Big Title</h1>

// Converted to RenderRuns
const runs: RenderRun[] = [
  {
    content: "Big Title",
    fontFamily: "Helvetica",
    fontSizePt: 24,
    fontWeight: 'bold',
    color: "#000000",
    blockType: 'block',
    spacingBefore: 12,
    spacingAfter: 6
  }
];

// HTML with inline formatting
<p>Text with <strong>bold</strong> word</p>

// Converted to RenderRuns
const runs: RenderRun[] = [
  {
    content: "Text with ",
    fontFamily: "Helvetica",
    fontSizePt: 12,
    blockType: 'inline'
  },
  {
    content: "bold",
    fontFamily: "Helvetica",
    fontSizePt: 12,
    fontWeight: 'bold',
    blockType: 'inline'
  },
  {
    content: " word",
    fontFamily: "Helvetica",
    fontSizePt: 12,
    blockType: 'inline'
  }
];
```

---

## Refactored Architecture

### 1. Generic Renderer (Core)

```typescript
/**
 * Generic PDF renderer - works with RenderRun[]
 * This replaces the current renderTokenizedLine()
 */
class PDFRenderer {
  private doc: jsPDF;
  private xPos: number;
  private yPos: number;
  private leftMargin: number;
  private availableWidth: number;
  
  /**
   * Render a single run of text with formatting
   * This is the ONLY place that calls doc.text()
   */
  renderRun(run: RenderRun): void {
    // Apply formatting
    if (run.fontFamily) {
      this.doc.setFont(run.fontFamily, run.fontWeight || 'normal');
    }
    if (run.fontSizePt) {
      this.doc.setFontSize(run.fontSizePt);
    }
    if (run.color) {
      this.setTextColorFromWebColor(this.doc, run.color);
    }
    
    // Handle block spacing before
    if (run.blockType === 'block' && run.spacingBefore) {
      this.yPos += run.spacingBefore;
      this.xPos = this.leftMargin;
      if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
    }
    
    // Handle indentation
    const indent = (run.indentLevel || 0) * (run.indentSize || 20);
    const effectiveLeftMargin = this.leftMargin + indent;
    
    // Render prefix if present
    if (run.prefix) {
      this.doc.text(run.prefix, this.xPos, this.yPos);
      this.xPos += this.doc.getTextWidth(run.prefix);
    }
    
    // Render text with character-level wrapping (REUSED LOGIC)
    let remaining = run.content;
    while (remaining.length > 0) {
      const charsToRender = this.findCharacterBreakPoint(
        remaining,
        this.xPos,
        effectiveLeftMargin,
        this.availableWidth - indent
      );
      
      if (charsToRender === 0) {
        // Wrap to next line
        this.yPos += this.currentLineHeight;
        this.xPos = effectiveLeftMargin;
        if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
        continue;
      }
      
      const portion = remaining.substring(0, charsToRender);
      this.doc.text(portion, this.xPos, this.yPos);
      this.xPos += this.doc.getTextWidth(portion);
      remaining = remaining.substring(charsToRender);
    }
    
    // Handle block spacing after
    if (run.blockType === 'block') {
      this.yPos += this.currentLineHeight;
      if (run.spacingAfter) {
        this.yPos += run.spacingAfter;
      }
      this.xPos = this.leftMargin;
      if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
    }
  }
  
  /**
   * Render multiple runs in sequence
   */
  renderRuns(runs: RenderRun[]): void {
    for (const run of runs) {
      this.renderRun(run);
    }
  }
  
  // All the existing helper methods stay the same:
  // - findCharacterBreakPoint()
  // - shouldBreakPage()
  // - addPageBreak()
  // - setTextColorFromWebColor()
}
```

### 2. Token Transformer (Existing Source)

```typescript
/**
 * Transform Shiki tokens to RenderRuns
 */
class TokenToRunTransformer {
  transform(tokens: ThemedToken[][], fontFamily: string, fontSizePt: number): RenderRun[] {
    const runs: RenderRun[] = [];
    
    for (const line of tokens) {
      for (const token of line) {
        if (token.content) {
          runs.push({
            content: token.content,
            color: token.color || '#000000',
            fontFamily: fontFamily,
            fontSizePt: fontSizePt,
            fontWeight: (token.fontStyle & 1) ? 'bold' : 'normal',
            fontStyle: (token.fontStyle & 2) ? 'italic' : 'normal',
            blockType: 'inline'
          });
        }
      }
      
      // Add line break as a block run
      runs.push({
        content: '',
        blockType: 'block',
        spacingAfter: 0  // Uses current line height
      });
    }
    
    return runs;
  }
}
```

### 3. HTML Transformer (New Source)

```typescript
/**
 * Transform HTML elements to RenderRuns
 */
class HtmlToRunTransformer {
  private app: App;
  
  async transform(html: string): Promise<RenderRun[]> {
    const root = parse(html);  // node-html-parser
    const runs: RenderRun[] = [];
    
    for (const element of root.childNodes) {
      const elementRuns = await this.transformElement(element);
      runs.push(...elementRuns);
    }
    
    return runs;
  }
  
  private async transformElement(element: HTMLElement): Promise<RenderRun[]> {
    const runs: RenderRun[] = [];
    
    switch (element.tagName) {
      case 'h1':
        runs.push({
          content: element.text,
          fontFamily: 'Helvetica',
          fontSizePt: 24,
          fontWeight: 'bold',
          blockType: 'block',
          spacingBefore: 12,
          spacingAfter: 6
        });
        break;
        
      case 'h2':
        runs.push({
          content: element.text,
          fontFamily: 'Helvetica',
          fontSizePt: 18,
          fontWeight: 'bold',
          blockType: 'block',
          spacingBefore: 10,
          spacingAfter: 5
        });
        break;
        
      case 'p':
        // Handle inline elements within paragraph
        const inlineRuns = await this.transformInlineContent(element);
        runs.push(...inlineRuns);
        
        // Add block spacing after paragraph
        runs.push({
          content: '',
          blockType: 'block',
          spacingAfter: 6
        });
        break;
        
      case 'ul':
      case 'ol':
        const listRuns = await this.transformList(element);
        runs.push(...listRuns);
        break;
        
      case 'pre':
        // CODE BLOCK - REUSE TOKEN TRANSFORMER!
        const codeRuns = await this.transformCodeBlock(element);
        runs.push(...codeRuns);
        break;
        
      case 'blockquote':
        const quoteRuns = await this.transformBlockquote(element);
        runs.push(...quoteRuns);
        break;
        
      default:
        // Skip unknown elements
        break;
    }
    
    return runs;
  }
  
  private async transformInlineContent(element: HTMLElement): Promise<RenderRun[]> {
    const runs: RenderRun[] = [];
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        // Plain text
        runs.push({
          content: child.text,
          fontFamily: 'Helvetica',
          fontSizePt: 12,
          blockType: 'inline'
        });
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        
        switch (el.tagName) {
          case 'strong':
          case 'b':
            runs.push({
              content: el.text,
              fontFamily: 'Helvetica',
              fontSizePt: 12,
              fontWeight: 'bold',
              blockType: 'inline'
            });
            break;
            
          case 'em':
          case 'i':
            runs.push({
              content: el.text,
              fontFamily: 'Helvetica',
              fontSizePt: 12,
              fontStyle: 'italic',
              blockType: 'inline'
            });
            break;
            
          case 'code':
            runs.push({
              content: el.text,
              fontFamily: 'Courier',
              fontSizePt: 11,
              backgroundColor: '#f3f3f3',
              blockType: 'inline'
            });
            break;
            
          default:
            // Recursively process unknown elements
            const childRuns = await this.transformInlineContent(el);
            runs.push(...childRuns);
            break;
        }
      }
    }
    
    return runs;
  }
  
  private async transformList(element: HTMLElement): Promise<RenderRun[]> {
    const runs: RenderRun[] = [];
    const isOrdered = element.tagName === 'ol';
    let itemNumber = 1;
    
    const items = element.querySelectorAll('li');
    for (const item of items) {
      const prefix = isOrdered ? `${itemNumber}. ` : '• ';
      
      // Get item content
      const contentRuns = await this.transformInlineContent(item);
      
      // Add prefix to first run
      if (contentRuns.length > 0) {
        contentRuns[0].prefix = prefix;
        contentRuns[0].indentLevel = 1;
        
        // Apply indent to all runs in this item
        for (const run of contentRuns) {
          run.indentLevel = 1;
        }
      }
      
      runs.push(...contentRuns);
      
      // Add spacing after list item
      runs.push({
        content: '',
        blockType: 'block',
        spacingAfter: 3
      });
      
      if (isOrdered) itemNumber++;
    }
    
    return runs;
  }
  
  private async transformCodeBlock(element: HTMLElement): Promise<RenderRun[]> {
    const codeElement = element.querySelector('code');
    if (!codeElement) return [];
    
    const code = codeElement.text;
    const lang = codeElement.classNames.find(c => c.startsWith('language-'))
      ?.replace('language-', '') || 'plaintext';
    
    // REUSE TOKEN TRANSFORMER!
    // 1. Tokenize with Shiki
    const tokens = await this.app.stylize.tokenize(code, lang as LanguageId_t);
    
    // 2. Transform tokens to runs
    const transformer = new TokenToRunTransformer();
    const runs = transformer.transform(tokens, 'Courier', 10);
    
    // 3. Apply code block styling
    for (const run of runs) {
      run.backgroundColor = '#f5f5f5';
      run.indentLevel = 1;
    }
    
    // Add spacing before and after
    runs.unshift({
      content: '',
      blockType: 'block',
      spacingBefore: 6
    });
    
    runs.push({
      content: '',
      blockType: 'block',
      spacingAfter: 6
    });
    
    return runs;
  }
  
  private async transformBlockquote(element: HTMLElement): Promise<RenderRun[]> {
    const runs: RenderRun[] = [];
    
    // Process all children
    for (const child of element.childNodes) {
      const childRuns = await this.transformElement(child as HTMLElement);
      
      // Apply indentation to all runs
      for (const run of childRuns) {
        run.indentLevel = (run.indentLevel || 0) + 1;
      }
      
      runs.push(...childRuns);
    }
    
    return runs;
  }
}
```

---

## Usage Examples

### Example 1: Render Code (Current Workflow)

```typescript
// OLD WAY (current)
const tokens = await stylize.tokenize(code, 'typescript');
for (let i = 0; i < tokens.length; i++) {
  pdf.renderTokenizedLine(i, tokens[i]);
}

// NEW WAY (refactored)
const tokens = await stylize.tokenize(code, 'typescript');
const transformer = new TokenToRunTransformer();
const runs = transformer.transform(tokens, 'Courier', 12);
const renderer = new PDFRenderer(docInfo.pdfDoc);
renderer.renderRuns(runs);
```

### Example 2: Render Markdown (New Feature)

```typescript
// Get HTML from VS Code
const mdApi = vscode.extensions.getExtension('vscode.markdown-language-features').exports;
const html = await mdApi.render(markdownText, document);

// Transform to runs
const transformer = new HtmlToRunTransformer(app);
const runs = await transformer.transform(html);

// Render (SAME RENDERER!)
const renderer = new PDFRenderer(docInfo.pdfDoc);
renderer.renderRuns(runs);
```

### Example 3: Mixed Content

```typescript
// Render some code, then markdown, then more code
const codeRuns = tokenTransformer.transform(codeTokens, 'Courier', 12);
const markdownRuns = await htmlTransformer.transform(markdownHtml);
const moreCodeRuns = tokenTransformer.transform(moreTokens, 'Courier', 12);

// Render all together
const allRuns = [...codeRuns, ...markdownRuns, ...moreCodeRuns];
renderer.renderRuns(allRuns);
```

---

## Refactoring Strategy

### Phase 1: Extract Generic Renderer (4 hours)

1. Create `RenderRun` interface
2. Create `PDFRenderer` class with `renderRun()` method
3. Extract character wrapping logic (no changes, just move)
4. Extract page break logic (no changes, just move)
5. Test with simple runs

### Phase 2: Create Token Transformer (2 hours)

1. Create `TokenToRunTransformer` class
2. Implement `transform()` method
3. Update `renderTokenizedLine()` to use new renderer
4. Test code printing (should work exactly as before)

### Phase 3: Create HTML Transformer (8 hours)

1. Install `node-html-parser`
2. Create `HtmlToRunTransformer` class
3. Implement element handlers:
   - Headings (h1-h6)
   - Paragraphs with inline formatting
   - Lists (ul, ol)
   - Code blocks (reuse token transformer!)
   - Blockquotes
4. Test markdown rendering

### Phase 4: Integration (2 hours)

1. Add VS Code markdown API integration
2. Add mode toggle (raw vs rendered)
3. Wire up transformers based on mode
4. Test both modes

**Total: 16 hours** (vs 24 hours without refactoring)

---

## Benefits of This Architecture

### 1. Separation of Concerns ✅

```
┌──────────────┐
│ Source Format│  ← Input-specific (tokens, HTML, etc.)
└──────┬───────┘
       │
       ↓
  [Transform]     ← Format-specific logic
       │
       ↓
┌──────────────┐
│ RenderRun[]  │  ← Universal intermediate format
└──────┬───────┘
       │
       ↓
  [Render]        ← Format-agnostic (ONE renderer for all)
       │
       ↓
┌──────────────┐
│    jsPDF     │  ← Output
└──────────────┘
```

### 2. Code Reuse ✅

- **Current approach**: Duplicate rendering logic for each format
- **New approach**: Write once, use for all formats

### 3. Easy to Add New Formats ✅

Want to render RTF? JSON? XML?

```typescript
class RtfToRunTransformer {
  transform(rtf: string): RenderRun[] {
    // Parse RTF
    // Convert to runs
    // Done! Generic renderer handles the rest
  }
}
```

### 4. Testability ✅

```typescript
// Test transformers independently
describe('TokenToRunTransformer', () => {
  it('should convert tokens to runs', () => {
    const tokens = [/* ... */];
    const runs = transformer.transform(tokens);
    expect(runs[0].content).toBe('const');
    expect(runs[0].color).toBe('#0000FF');
  });
});

// Test renderer independently
describe('PDFRenderer', () => {
  it('should render runs to PDF', () => {
    const runs = [
      { content: 'test', fontSizePt: 12, blockType: 'inline' }
    ];
    renderer.renderRuns(runs);
    // Verify PDF output
  });
});
```

### 5. Performance ✅

- Transform once, render once (no redundant conversions)
- Can optimize transformers independently
- Can cache transformed runs if needed

---

## Comparison with Current Approach

### Current (Token-Specific)

```typescript
// Tightly coupled to token structure
public renderTokenizedLine(lineNumber: number, tokens: ThemedToken[]): void {
  for (const token of tokens) {
    // Token-specific logic here
    const color = token.color;
    const content = token.content;
    // ... rendering logic ...
  }
}
```

**Problems**:
- ❌ Can't reuse for HTML
- ❌ Rendering logic mixed with token handling
- ❌ Hard to test independently

### Refactored (Generic)

```typescript
// Generic rendering
public renderRun(run: RenderRun): void {
  // Apply formatting from run
  // Render content
  // Handle spacing
}

// Token-specific transformer
class TokenToRunTransformer {
  transform(tokens: ThemedToken[][]): RenderRun[] {
    // Convert tokens to runs
  }
}

// HTML-specific transformer
class HtmlToRunTransformer {
  transform(html: string): RenderRun[] {
    // Convert HTML to runs
  }
}
```

**Benefits**:
- ✅ Generic renderer works with any format
- ✅ Clean separation of concerns
- ✅ Easy to test each part
- ✅ Easy to add new formats

---

## The "Middle Format" Answer

**Yes, `RenderRun` is the middle format!**

It captures the essential information needed for rendering:
- ✅ **What** to render: `content`
- ✅ **How** to format it: `fontFamily`, `fontSizePt`, `fontWeight`, `color`
- ✅ **Where** to position it: `blockType`, `spacingBefore`, `spacingAfter`, `indentLevel`
- ✅ **Special behavior**: `prefix` (for lists)

**All source formats transform to RenderRun[]:**
- Tokens → RenderRun[]
- HTML → RenderRun[]
- RTF → RenderRun[] (future)
- XML → RenderRun[] (future)

**One renderer handles them all:**
```typescript
renderer.renderRuns(runs);  // Works for ANY source!
```

---

## Implementation Plan

### Step 1: Define RenderRun Interface ✅
- Create types file
- Document all fields
- Add validation helpers

### Step 2: Extract Generic Renderer ✅
- Move rendering primitives to PDFRenderer class
- Keep all wrapping/page break logic (unchanged)
- Test with hardcoded RenderRun[] examples

### Step 3: Create Token Transformer ✅
- Convert existing token rendering to transformer
- Update renderTokenizedLine() to use generic renderer
- Verify code printing still works

### Step 4: Create HTML Transformer ✅
- Implement element-to-run conversion
- Reuse token transformer for code blocks
- Test markdown rendering

### Step 5: Integration ✅
- Add VS Code markdown API
- Wire up transformers
- Add UI toggle for mode selection

---

## Conclusion

**Yes, absolutely refactor to a generic renderer!**

The refactoring:
- ✅ Makes the code cleaner (separation of concerns)
- ✅ Makes it easier to add new formats (just write a transformer)
- ✅ Reuses 100% of rendering logic (no duplication)
- ✅ Makes testing easier (test transformers and renderer independently)
- ✅ Actually SAVES time (16 hours vs 24 hours)

The **RenderRun** intermediate format is simple, complete, and format-agnostic. It's the perfect abstraction point!
