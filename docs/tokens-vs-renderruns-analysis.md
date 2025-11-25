# Tokens vs RenderRuns: Which Middle Layer?

## The Question

Could we transform HTML → Tokens instead of HTML → RenderRuns?

```
Option A (Proposed):
HTML → RenderRun[] → Generic Renderer → jsPDF

Option B (Alternative):
HTML → ThemedToken[][] → Existing Token Renderer → jsPDF
```

---

## What Tokens Actually Support

### ThemedToken Structure (from Shiki)

```typescript
interface ThemedToken {
  content: string;      // The text
  color?: string;       // Hex color like "#FF0000"
  fontStyle?: number;   // Bit flags: 1=bold, 2=italic, 4=underline
}

// Organized as lines
type TokenizedCode = ThemedToken[][];
```

### Current Token Renderer Capabilities

Looking at `PDF.renderTokenizedLine()`:

```typescript
public renderTokenizedLine(lineNumber: number, tokens: ThemedToken[]): void {
  for (const token of tokens) {
    const color = token.color || '#000000';
    this.setTextColorFromWebColor(this.doc!, color);
    
    // ❌ Font size is GLOBAL (from docInfo.fontSizePx)
    // ❌ Font family is GLOBAL (from docInfo.fontFamily)  
    // ❌ No spacing between lines (just lineHeight)
    // ❌ No indentation support
    // ❌ No block vs inline concept
    // ❌ No prefixes (bullets, numbers)
    
    this.doc.text(content, xPos, yPos);
  }
  
  // Move to next line (all lines same height)
  this.currentY += this.currentLineHeight;
}
```

**What tokens CAN represent**:
- ✅ Text content
- ✅ Color per token
- ✅ Bold/italic via fontStyle bits

**What tokens CANNOT represent**:
- ❌ Different font sizes (h1 vs h2 vs p)
- ❌ Different font families (Helvetica vs Courier)
- ❌ Spacing between blocks (margins)
- ❌ Indentation (lists, blockquotes)
- ❌ Prefixes (bullets, numbers)
- ❌ Block vs inline elements

---

## Concrete Example: Can Tokens Represent This?

### HTML Input

```html
<h1>Big Title</h1>
<p>Normal text with <strong>bold</strong> word</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
<pre><code class="language-typescript">const x = 1;</code></pre>
```

### Attempt 1: Direct Conversion to Tokens

```typescript
// Line 0: h1 (needs 24pt font)
[
  { content: "Big Title", color: "#000000", fontStyle: 1 } // bold
]

// Problem: How do we make it 24pt? Token doesn't have fontSize!

// Line 1: Empty line for spacing?
[
  { content: "", color: "#000000" }
]

// Problem: How much spacing? Token has no spacing concept!

// Line 2: paragraph (needs 12pt font)
[
  { content: "Normal text with ", color: "#000000", fontStyle: 0 },
  { content: "bold", color: "#000000", fontStyle: 1 },
  { content: " word", color: "#000000", fontStyle: 0 }
]

// Problem: Font size would need to change from h1, but tokens don't support this!

// Line 3: list item (needs bullet prefix and indent)
[
  { content: "Item 1", color: "#000000", fontStyle: 0 }
]

// Problem: Where's the bullet? Tokens don't have prefix field!
// Problem: How do we indent? Tokens don't have indentation!
```

**Conclusion**: Can't represent the structure with raw tokens.

---

## Attempt 2: Abuse Token Content Field

### Encode Metadata in Content String

```typescript
// Hacky approach: Put control sequences in content
[
  { content: "<<H1>>Big Title<<SPACING:12>>", color: "#000000" }
]

// Then parse these in renderer?
if (token.content.startsWith('<<H1>>')) {
  doc.setFontSize(24);
  const actualContent = token.content.replace(/<<H1>>/, '');
  // ...
}
```

**Problems**:
1. ❌ Mixing data and control flow
2. ❌ Loss of type safety
3. ❌ Hard to parse and maintain
4. ❌ Would need to rewrite entire renderer anyway
5. ❌ Breaks token semantics (tokens should be pure data)

**Verdict**: Terrible idea.

---

## Attempt 3: Extend Token Interface

### Add Fields to ThemedToken

```typescript
interface ExtendedToken extends ThemedToken {
  content: string;
  color?: string;
  fontStyle?: number;
  
  // New fields for document structure
  fontSize?: number;        // For headings
  fontFamily?: string;      // For code vs text
  spacingBefore?: number;   // For margins
  spacingAfter?: number;
  indentLevel?: number;     // For lists
  prefix?: string;          // For bullets
  blockType?: 'inline' | 'block';
}
```

**Wait a minute... this IS RenderRun!**

We've just:
1. Extended the token interface
2. Added all the fields we need
3. Renamed it to ExtendedToken

But now:
- ❌ It's not a real Shiki token anymore
- ❌ Need to rewrite renderTokenizedLine() to handle new fields
- ❌ Can't use Shiki's token types directly
- ❌ Why call it a "token" if it's not from a tokenizer?

**Verdict**: Just call it RenderRun and be honest about what it is.

---

## Attempt 4: Metadata Alongside Tokens

### Store Metadata Separately

```typescript
interface TokenLine {
  tokens: ThemedToken[];
  metadata: {
    fontSize?: number;
    fontFamily?: string;
    spacingBefore?: number;
    spacingAfter?: number;
    indentLevel?: number;
    prefix?: string;
  };
}

const lines: TokenLine[] = [
  {
    tokens: [{ content: "Big Title", color: "#000000" }],
    metadata: { fontSize: 24, fontFamily: "Helvetica", spacingAfter: 12 }
  },
  {
    tokens: [{ content: "Normal text", color: "#000000" }],
    metadata: { fontSize: 12, fontFamily: "Helvetica" }
  }
];
```

**Problems**:
1. ❌ Split data structure (tokens + metadata)
2. ❌ Need to pass both to renderer
3. ❌ Still need to rewrite renderer to handle metadata
4. ❌ More complex than just having one unified format

**Verdict**: More complex than RenderRun, no benefit.

---

## The Fundamental Issue

### Tokens Are Line-Oriented

```typescript
// Tokens represent lines of code
ThemedToken[][] = [
  [token, token, token],  // Line 1
  [token, token],         // Line 2
  [token]                 // Line 3
]
```

All lines have:
- Same font size
- Same font family
- Same line height
- No concept of spacing between lines
- No indentation
- No structural prefixes

### Documents Are Block-Oriented

```typescript
// Documents have block structure
[
  Heading (24pt, spacing before/after),
  Paragraph (12pt, spacing after),
  List (
    Item (indented, with bullet),
    Item (indented, with bullet)
  ),
  CodeBlock (10pt monospace, background color)
]
```

Blocks have:
- Variable font sizes
- Variable font families
- Variable spacing
- Indentation
- Prefixes
- Block vs inline semantics

**Tokens weren't designed for this!**

---

## What Would We Need to Change?

### If We Use Tokens as Middle Layer

```typescript
// Current renderer (simplified)
renderTokenizedLine(tokens: ThemedToken[]): void {
  for (const token of tokens) {
    doc.setTextColor(token.color);
    doc.text(token.content, x, y);
  }
  y += lineHeight;
}

// Would need to become...
renderTokenizedLine(tokens: ExtendedToken[], metadata: LineMetadata): void {
  // Handle spacing before
  if (metadata.spacingBefore) {
    y += metadata.spacingBefore;
  }
  
  // Change font size
  if (metadata.fontSize) {
    doc.setFontSize(metadata.fontSize);
  }
  
  // Change font family
  if (metadata.fontFamily) {
    doc.setFont(metadata.fontFamily);
  }
  
  // Handle indentation
  if (metadata.indentLevel) {
    x += metadata.indentLevel * 20;
  }
  
  // Render prefix
  if (metadata.prefix) {
    doc.text(metadata.prefix, x, y);
    x += doc.getTextWidth(metadata.prefix);
  }
  
  // Render tokens
  for (const token of tokens) {
    doc.setTextColor(token.color);
    
    // Handle inline vs block
    if (token.blockType === 'block') {
      x = leftMargin;
      y += lineHeight;
    }
    
    doc.text(token.content, x, y);
  }
  
  // Handle spacing after
  if (metadata.spacingAfter) {
    y += metadata.spacingAfter;
  }
}
```

**We've completely rewritten the renderer!** And added complexity with split data structure.

### If We Use RenderRuns as Middle Layer

```typescript
// New renderer (simplified)
renderRun(run: RenderRun): void {
  // All formatting in one place
  doc.setFontSize(run.fontSize || 12);
  doc.setFont(run.fontFamily || 'Helvetica');
  doc.setTextColor(run.color || '#000000');
  
  // Handle spacing
  if (run.spacingBefore) y += run.spacingBefore;
  
  // Handle indentation
  if (run.indentLevel) x += run.indentLevel * 20;
  
  // Handle prefix
  if (run.prefix) {
    doc.text(run.prefix, x, y);
    x += doc.getTextWidth(run.prefix);
  }
  
  // Render content
  doc.text(run.content, x, y);
  
  // Handle block vs inline
  if (run.blockType === 'block') {
    x = leftMargin;
    y += lineHeight;
  }
  
  // Handle spacing after
  if (run.spacingAfter) y += run.spacingAfter;
}
```

**Same complexity, but cleaner data structure** (everything in one object).

---

## The Semantic Problem

### What Is a "Token"?

From Wikipedia:
> "Lexical analysis is the process of converting a sequence of characters into a sequence of tokens."

Tokens are output of **lexical analysis** (tokenization/lexing):
- Identifiers: `variable_name`
- Keywords: `const`, `if`, `class`
- Operators: `+`, `=`, `->`
- Literals: `"string"`, `123`

In syntax highlighting:
- Tokens get colors based on their type
- All within a single language/context
- Flat structure (tokens in sequence)

### What We're Actually Doing

We're doing **document layout**:
- Different font sizes (typography)
- Different font families (typeface selection)
- Spacing and margins (layout)
- Indentation (structure)
- Block vs inline (document model)

This is NOT tokenization. This is **document rendering**.

**Using "tokens" for this is semantically wrong.**

---

## Code Blocks: The One Place Tokens Belong

### In Markdown Code Blocks

````markdown
```typescript
const x = 1;
```
````

**This IS tokenization!** We're:
1. Extracting the code
2. Running it through Shiki tokenizer
3. Getting colored tokens
4. Rendering them

**Tokens are perfect here** because it's actual code being syntax-highlighted.

### How This Works with RenderRuns

```typescript
// HTML transformer encounters code block
async transformCodeBlock(element: HTMLElement): Promise<RenderRun[]> {
  const code = element.text;
  const lang = element.className;
  
  // Step 1: Tokenize with Shiki (tokens are RIGHT here!)
  const tokens = await stylize.tokenize(code, lang);
  
  // Step 2: Transform tokens to runs
  const tokenRuns = tokenTransformer.transform(tokens);
  
  // Step 3: Add code block styling
  for (const run of tokenRuns) {
    run.backgroundColor = '#f5f5f5';
    run.fontFamily = 'Courier';
  }
  
  return tokenRuns;
}
```

**We're not losing tokens!** They're still used for code. We're just:
1. Transforming them to a common format
2. Adding code-block-specific styling
3. Passing to generic renderer

---

## Performance Comparison

### Option A: Tokens as Middle Layer

```
HTML → Parse → Extract tokens → Extend token data → Extended renderer
     (100ms)   (50ms)          (metadata split)     (complex logic)
```

### Option B: RenderRuns as Middle Layer

```
HTML → Parse → Create runs → Generic renderer
     (100ms)   (50ms)       (clean logic)
```

**Same performance**, but Option B has:
- ✅ Cleaner data structure
- ✅ Simpler renderer logic
- ✅ Better type safety
- ✅ Correct semantics

---

## Real-World Analogy

### Trying to Use Tokens for Document Layout

This is like trying to use LEGO bricks to build a house:

**LEGO (Tokens)**:
- All same size
- Snap together in grid
- Great for toys

**House (Document)**:
- Variable sizes needed (walls, windows, doors)
- Different materials (wood, glass, concrete)
- Structural elements (foundation, roof)

You COULD try to build a house with LEGO:
- Make big walls by connecting thousands of bricks
- Paint bricks different colors for materials
- Stack bricks high for tall walls

But it would be:
- ❌ Inefficient
- ❌ Fragile
- ❌ Wrong tool for the job

**Better approach**: Use proper building materials (lumber, concrete, etc.)

Similarly:
- ❌ Don't abuse tokens for document layout
- ✅ Use proper document representation (RenderRuns)

---

## The Verdict

### ❌ Tokens as Middle Layer

**Pros**:
- Already have token renderer (kind of)

**Cons**:
- ❌ Tokens lack essential fields (fontSize, fontFamily, spacing, indentation)
- ❌ Would need to extend token interface (making it RenderRun anyway)
- ❌ Would need to completely rewrite renderer (so no reuse!)
- ❌ Split data structure (tokens + metadata) or hacky encoding
- ❌ Semantically wrong (tokens are for lexical analysis, not layout)
- ❌ More complex than just using proper format

### ✅ RenderRuns as Middle Layer

**Pros**:
- ✅ Has all needed fields out of the box
- ✅ Clean, unified data structure
- ✅ Semantically correct (runs are for formatted text)
- ✅ Can still use tokens where appropriate (code blocks)
- ✅ Generic renderer is simpler than extended token renderer
- ✅ Easy to add new source formats

**Cons**:
- Need to write new renderer (but cleaner than extending token renderer)

---

## Final Answer

**No, tokens should NOT be the middle layer.**

Tokens are great for what they do: representing syntax-highlighted code. But they're the wrong abstraction for document structure.

The right approach is:

1. **Use tokens where they belong**: Code blocks (Shiki tokenization)
2. **Transform to common format**: Both tokens and HTML → RenderRuns
3. **Render with generic renderer**: One renderer for all content

This gives us:
- ✅ Correct semantics (tokens for code, runs for layout)
- ✅ Clean data structures
- ✅ Simpler renderer
- ✅ Easy to extend

**Tokens and RenderRuns serve different purposes:**
- **Tokens**: Lexical units with colors (syntax highlighting)
- **RenderRuns**: Formatted text with layout (document rendering)

Don't force tokens to do a job they weren't designed for!
