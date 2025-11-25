# Simpler Approach: Just Extend Tokens

## You're Right

In this codebase, **tokens already ARE "source chunks + styling"**. 

When Shiki returns:
```typescript
{ content: "const", color: "#0000FF", fontStyle: 1 }
```

That's not some abstract concept. It's literally:
- Text to render: `"const"`
- How to style it: blue color, bold

**So why invent "RenderRun"? Just extend what we have!**

---

## The Simpler Design

### Step 1: Extend ThemedToken

```typescript
import type { ThemedToken } from 'shiki';

/**
 * Extended token with document layout capabilities
 * Backwards compatible with ThemedToken (all new fields optional)
 */
export interface StyledToken extends ThemedToken {
  // From ThemedToken (existing)
  content: string;
  color?: string;
  fontStyle?: number;  // 1=bold, 2=italic
  
  // Extended for document layout (new)
  fontSize?: number;        // Points (default: current font size)
  fontFamily?: string;      // 'Courier', 'Helvetica', 'Times' (default: current)
  spacingBefore?: number;   // Points to add before this token
  spacingAfter?: number;    // Points to add after this token
  indentLevel?: number;     // Indent depth (default: 0)
  indentSize?: number;      // Points per indent level (default: 20)
  prefix?: string;          // "• " for bullets, "1. " for numbers
  blockType?: 'inline' | 'block';  // Default: 'inline'
}
```

**Key insight**: All Shiki tokens are already valid StyledTokens (all new fields are optional)!

---

## Step 2: Update Renderer to Handle Extended Fields

```typescript
// Current renderer (simplified)
renderTokenizedLine(tokens: ThemedToken[]): void {
  for (const token of tokens) {
    doc.setTextColor(token.color || '#000000');
    doc.text(token.content, x, y);
    x += doc.getTextWidth(token.content);
  }
  y += lineHeight;
}

// Updated renderer (handles extended fields)
renderToken(token: StyledToken): void {
  // Handle block spacing before
  if (token.spacingBefore) {
    this.yPos += token.spacingBefore;
    this.xPos = this.leftMargin;
    if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
  }
  
  // Apply formatting
  if (token.fontSize) {
    this.doc.setFontSize(token.fontSize);
  }
  if (token.fontFamily) {
    const weight = token.fontStyle & 1 ? 'bold' : 'normal';
    this.doc.setFont(token.fontFamily, weight);
  }
  if (token.color) {
    this.setTextColorFromWebColor(this.doc, token.color);
  }
  
  // Handle indentation
  const indent = (token.indentLevel || 0) * (token.indentSize || 20);
  const effectiveLeftMargin = this.leftMargin + indent;
  
  // Render prefix
  if (token.prefix) {
    this.doc.text(token.prefix, this.xPos, this.yPos);
    this.xPos += this.doc.getTextWidth(token.prefix);
  }
  
  // Render content with wrapping (EXISTING LOGIC - just reuse!)
  let content = token.content;
  while (content.length > 0) {
    const charsToRender = this.findCharacterBreakPoint(content, this.xPos, ...);
    const portion = content.substring(0, charsToRender);
    this.doc.text(portion, this.xPos, this.yPos);
    this.xPos += this.doc.getTextWidth(portion);
    content = content.substring(charsToRender);
    
    if (content.length > 0) {
      this.yPos += this.currentLineHeight;
      this.xPos = effectiveLeftMargin;
      if (this.shouldBreakPage(this.yPos)) this.addPageBreak();
    }
  }
  
  // Handle block behavior
  if (token.blockType === 'block') {
    this.yPos += this.currentLineHeight;
    this.xPos = this.leftMargin;
  }
  
  // Handle spacing after
  if (token.spacingAfter) {
    this.yPos += token.spacingAfter;
  }
}
```

---

## Step 3: Transformers Create StyledTokens

### Token Transformer (Identity Transform)

```typescript
/**
 * Transform Shiki tokens to StyledTokens
 * Since ThemedToken is a subset of StyledToken, this is mostly pass-through
 */
class TokenTransformer {
  transform(tokens: ThemedToken[][], fontFamily: string, fontSize: number): StyledToken[] {
    const output: StyledToken[] = [];
    
    for (const line of tokens) {
      for (const token of line) {
        // StyledToken extends ThemedToken, so we can just add fields
        output.push({
          ...token,  // Spread existing token (content, color, fontStyle)
          fontFamily,
          fontSize,
          blockType: 'inline'
        });
      }
      
      // Line break as block token
      output.push({
        content: '',
        blockType: 'block'
      });
    }
    
    return output;
  }
}
```

### HTML Transformer

```typescript
/**
 * Transform HTML elements to StyledTokens
 */
class HtmlTransformer {
  async transform(html: string): Promise<StyledToken[]> {
    const root = parse(html);
    const tokens: StyledToken[] = [];
    
    for (const element of root.childNodes) {
      const elementTokens = await this.transformElement(element);
      tokens.push(...elementTokens);
    }
    
    return tokens;
  }
  
  private async transformElement(element: HTMLElement): Promise<StyledToken[]> {
    const tokens: StyledToken[] = [];
    
    switch (element.tagName) {
      case 'h1':
        tokens.push({
          content: element.text,
          fontFamily: 'Helvetica',
          fontSize: 24,
          fontStyle: 1,  // bold
          blockType: 'block',
          spacingBefore: 12,
          spacingAfter: 6
        });
        break;
        
      case 'h2':
        tokens.push({
          content: element.text,
          fontFamily: 'Helvetica',
          fontSize: 18,
          fontStyle: 1,  // bold
          blockType: 'block',
          spacingBefore: 10,
          spacingAfter: 5
        });
        break;
        
      case 'p':
        const inlineTokens = await this.transformInlineContent(element);
        tokens.push(...inlineTokens);
        tokens.push({
          content: '',
          blockType: 'block',
          spacingAfter: 6
        });
        break;
        
      case 'ul':
      case 'ol':
        const listTokens = await this.transformList(element);
        tokens.push(...listTokens);
        break;
        
      case 'pre':
        // CODE BLOCK - get Shiki tokens and convert!
        const codeTokens = await this.transformCodeBlock(element);
        tokens.push(...codeTokens);
        break;
    }
    
    return tokens;
  }
  
  private async transformCodeBlock(element: HTMLElement): Promise<StyledToken[]> {
    const codeElement = element.querySelector('code');
    if (!codeElement) return [];
    
    const code = codeElement.text;
    const lang = codeElement.classNames.find(c => c.startsWith('language-'))
      ?.replace('language-', '') || 'plaintext';
    
    // Get Shiki tokens
    const shikiTokens = await this.app.stylize.tokenize(code, lang as LanguageId_t);
    
    // Transform to StyledTokens with code block styling
    const transformer = new TokenTransformer();
    const styledTokens = transformer.transform(shikiTokens, 'Courier', 10);
    
    // Add code block background and indentation
    for (const token of styledTokens) {
      token.backgroundColor = '#f5f5f5';
      token.indentLevel = 1;
    }
    
    // Add spacing
    styledTokens.unshift({
      content: '',
      blockType: 'block',
      spacingBefore: 6
    });
    styledTokens.push({
      content: '',
      blockType: 'block',
      spacingAfter: 6
    });
    
    return styledTokens;
  }
  
  private async transformInlineContent(element: HTMLElement): Promise<StyledToken[]> {
    const tokens: StyledToken[] = [];
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        tokens.push({
          content: child.text,
          fontFamily: 'Helvetica',
          fontSize: 12,
          blockType: 'inline'
        });
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        
        switch (el.tagName) {
          case 'strong':
          case 'b':
            tokens.push({
              content: el.text,
              fontFamily: 'Helvetica',
              fontSize: 12,
              fontStyle: 1,  // bold
              blockType: 'inline'
            });
            break;
            
          case 'em':
          case 'i':
            tokens.push({
              content: el.text,
              fontFamily: 'Helvetica',
              fontSize: 12,
              fontStyle: 2,  // italic
              blockType: 'inline'
            });
            break;
            
          case 'code':
            tokens.push({
              content: el.text,
              fontFamily: 'Courier',
              fontSize: 11,
              backgroundColor: '#f3f3f3',
              blockType: 'inline'
            });
            break;
        }
      }
    }
    
    return tokens;
  }
  
  private async transformList(element: HTMLElement): Promise<StyledToken[]> {
    const tokens: StyledToken[] = [];
    const isOrdered = element.tagName === 'ol';
    let itemNumber = 1;
    
    const items = element.querySelectorAll('li');
    for (const item of items) {
      const prefix = isOrdered ? `${itemNumber}. ` : '• ';
      
      const contentTokens = await this.transformInlineContent(item);
      
      // Add prefix to first token
      if (contentTokens.length > 0) {
        contentTokens[0].prefix = prefix;
        contentTokens[0].indentLevel = 1;
        
        // Apply indent to all tokens in this item
        for (const token of contentTokens) {
          token.indentLevel = 1;
        }
      }
      
      tokens.push(...contentTokens);
      tokens.push({
        content: '',
        blockType: 'block',
        spacingAfter: 3
      });
      
      if (isOrdered) itemNumber++;
    }
    
    return tokens;
  }
}
```

---

## Architecture Diagram

```
Code → Shiki → ThemedToken[] ──────────┐
                                       │
                                       ↓
                              [Optional Extension]
                                       │
                                       ↓
                                 StyledToken[]
                                       ↑
                                       │
HTML → VS Code API → HTML → Transform ┘
                                       │
                                       ↓
                              Updated Renderer
                               (handles both
                              ThemedToken and
                               StyledToken)
                                       ↓
                                     jsPDF
```

---

## Why This Is Better

### 1. Conceptually Simpler ✅

**Before**: "We have tokens, but we need RenderRuns, which are like tokens but different"

**Now**: "We have tokens. Some have extra fields, some don't. Renderer handles both."

### 2. Backwards Compatible ✅

```typescript
// Old code still works (ThemedToken is subset of StyledToken)
const shikiTokens: ThemedToken[] = await stylize.tokenize(code, lang);
renderer.renderTokens(shikiTokens);  // Works!

// New code uses extended fields
const htmlTokens: StyledToken[] = await htmlTransformer.transform(html);
renderer.renderTokens(htmlTokens);  // Also works!
```

### 3. No New Concepts ✅

**Before**: Learn about tokens AND RenderRuns

**Now**: Just tokens. Some have more fields.

### 4. Natural Evolution ✅

Token already means "content + styling" in this codebase. We're just adding more styling options:
- Was: color, bold/italic
- Now: also font size, font family, spacing, indentation

### 5. Same Code Reuse ✅

Still reuse all the rendering primitives:
- `findCharacterBreakPoint()` - same
- `shouldBreakPage()` - same
- Text wrapping logic - same
- Character-by-character rendering - same

---

## Implementation

### Step 1: Define StyledToken (1 hour)

```typescript
// src/types/StyledToken_t.ts
import type { ThemedToken } from 'shiki';

export interface StyledToken extends ThemedToken {
  content: string;
  color?: string;
  fontStyle?: number;
  
  // Extended fields
  fontSize?: number;
  fontFamily?: string;
  spacingBefore?: number;
  spacingAfter?: number;
  indentLevel?: number;
  indentSize?: number;
  prefix?: string;
  blockType?: 'inline' | 'block';
  backgroundColor?: string;
}
```

### Step 2: Update Renderer (4 hours)

```typescript
// Update PDF.renderTokenizedLine() → PDF.renderToken()
// Add handling for extended fields
// Keep all existing wrapping/paging logic
```

### Step 3: Create Transformers (8 hours)

```typescript
// TokenTransformer: ThemedToken[] → StyledToken[]
// HtmlTransformer: HTML → StyledToken[]
```

### Step 4: Integration (2 hours)

```typescript
// Wire up VS Code markdown API
// Add mode toggle
// Test both code and markdown
```

**Total: 15 hours** (simpler than 16 with RenderRun, and conceptually cleaner!)

---

## The Key Realization

**In this codebase, "token" doesn't mean "lexical unit from a tokenizer".**

**It means: "A piece of content with formatting metadata."**

So extending it to support more formatting is natural, not semantic abuse.

---

## Final Answer

You're right. Let's not invent "RenderRun". Let's just:

1. Extend `ThemedToken` → `StyledToken`
2. Update renderer to handle extended fields
3. Transformers produce `StyledToken[]`
4. Done!

**Simpler, cleaner, and no new concepts to learn.**
