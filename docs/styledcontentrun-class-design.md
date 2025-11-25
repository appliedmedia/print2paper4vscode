# StyledContentRun as a Class

## Why a Class Instead of Interface?

### Benefits of a Class

1. **Validation**: Ensure data is valid at construction time
2. **Defaults**: Provide sensible default values automatically
3. **Factory Methods**: Easy creation of common patterns (headings, lists, etc.)
4. **Behavior**: Can have helper methods (clone, merge, etc.)
5. **Type Safety**: Constructor enforces required fields

### Interface Approach (Current)

```typescript
interface StyledContentRun {
  content: string;
  color?: string;
  fontSize?: number;
  // ...
}

// Usage - easy but no validation
const run: StyledContentRun = {
  content: "text",
  color: "not-a-valid-color", // Oops! No validation
  fontSize: -5  // Oops! Negative font size
};
```

### Class Approach (Proposed)

```typescript
class StyledContentRun {
  private constructor(
    public readonly content: string,
    public readonly color?: string,
    public readonly fontFamily?: string,
    public readonly fontSizePt?: number,
    public readonly fontWeight?: 'normal' | 'bold',
    public readonly fontStyle?: 'normal' | 'italic',
    public readonly backgroundColor?: string,
    public readonly blockType?: 'inline' | 'block',
    public readonly spacingBefore?: number,
    public readonly spacingAfter?: number,
    public readonly indentLevel?: number,
    public readonly indentSize?: number,
    public readonly prefix?: string
  ) {
    // Validation in constructor
    if (fontSizePt !== undefined && fontSizePt <= 0) {
      throw new Error('Font size must be positive');
    }
    if (color && !this.isValidColor(color)) {
      throw new Error(`Invalid color: ${color}`);
    }
  }
  
  private static isValidColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color) || 
           ['black', 'white', 'red', 'green', 'blue'].includes(color);
  }
  
  // Factory method: create with validation and defaults
  static create(options: {
    content: string;
    color?: string;
    fontFamily?: string;
    fontSizePt?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    backgroundColor?: string;
    blockType?: 'inline' | 'block';
    spacingBefore?: number;
    spacingAfter?: number;
    indentLevel?: number;
    indentSize?: number;
    prefix?: string;
  }): StyledContentRun {
    return new StyledContentRun(
      options.content,
      options.color,
      options.fontFamily,
      options.fontSizePt,
      options.fontWeight,
      options.fontStyle,
      options.backgroundColor,
      options.blockType || 'inline',  // Default
      options.spacingBefore,
      options.spacingAfter,
      options.indentLevel,
      options.indentSize || 20,  // Default indent size
      options.prefix
    );
  }
  
  // Factory methods for common patterns
  static heading1(content: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 24,
      fontWeight: 'bold',
      blockType: 'block',
      spacingBefore: 12,
      spacingAfter: 6
    });
  }
  
  static heading2(content: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 18,
      fontWeight: 'bold',
      blockType: 'block',
      spacingBefore: 10,
      spacingAfter: 5
    });
  }
  
  static paragraph(content: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 12,
      blockType: 'inline'
    });
  }
  
  static bold(content: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 12,
      fontWeight: 'bold',
      blockType: 'inline'
    });
  }
  
  static italic(content: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 12,
      fontStyle: 'italic',
      blockType: 'inline'
    });
  }
  
  static code(content: string, color?: string): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Courier',
      fontSizePt: 10,
      color,
      blockType: 'inline'
    });
  }
  
  static listItem(content: string, prefix: string, indentLevel: number = 1): StyledContentRun {
    return StyledContentRun.create({
      content,
      fontFamily: 'Helvetica',
      fontSizePt: 12,
      prefix,
      indentLevel,
      blockType: 'inline'
    });
  }
  
  static blockSpacer(spacingPt: number): StyledContentRun {
    return StyledContentRun.create({
      content: '',
      blockType: 'block',
      spacingAfter: spacingPt
    });
  }
  
  static lineBreak(): StyledContentRun {
    return StyledContentRun.create({
      content: '',
      blockType: 'block'
    });
  }
  
  // Helper method: create a copy with modifications
  withStyle(options: {
    color?: string;
    fontFamily?: string;
    fontSizePt?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    backgroundColor?: string;
  }): StyledContentRun {
    return StyledContentRun.create({
      content: this.content,
      color: options.color ?? this.color,
      fontFamily: options.fontFamily ?? this.fontFamily,
      fontSizePt: options.fontSizePt ?? this.fontSizePt,
      fontWeight: options.fontWeight ?? this.fontWeight,
      fontStyle: options.fontStyle ?? this.fontStyle,
      backgroundColor: options.backgroundColor ?? this.backgroundColor,
      blockType: this.blockType,
      spacingBefore: this.spacingBefore,
      spacingAfter: this.spacingAfter,
      indentLevel: this.indentLevel,
      indentSize: this.indentSize,
      prefix: this.prefix
    });
  }
  
  // Helper method: clone
  clone(): StyledContentRun {
    return StyledContentRun.create({
      content: this.content,
      color: this.color,
      fontFamily: this.fontFamily,
      fontSizePt: this.fontSizePt,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      backgroundColor: this.backgroundColor,
      blockType: this.blockType,
      spacingBefore: this.spacingBefore,
      spacingAfter: this.spacingAfter,
      indentLevel: this.indentLevel,
      indentSize: this.indentSize,
      prefix: this.prefix
    });
  }
  
  // Helper method: check if this is a block element
  isBlock(): boolean {
    return this.blockType === 'block';
  }
  
  // Helper method: check if this has content
  hasContent(): boolean {
    return this.content.length > 0;
  }
}
```

---

## Usage Examples

### With Interface (Before)

```typescript
// Creating runs manually - verbose and error-prone
const runs: StyledContentRun[] = [
  {
    content: "Title",
    fontFamily: 'Helvetica',
    fontSizePt: 24,
    fontWeight: 'bold',
    blockType: 'block',
    spacingBefore: 12,
    spacingAfter: 6
  },
  {
    content: "Some text with ",
    fontFamily: 'Helvetica',
    fontSizePt: 12,
    blockType: 'inline'
  },
  {
    content: "bold",
    fontFamily: 'Helvetica',
    fontSizePt: 12,
    fontWeight: 'bold',
    blockType: 'inline'
  }
];
```

### With Class (After)

```typescript
// Creating runs with factory methods - concise and clear
const runs = [
  StyledContentRun.heading1("Title"),
  StyledContentRun.paragraph("Some text with "),
  StyledContentRun.bold("bold")
];
```

Much cleaner!

---

## Transformer Examples

### HTML Transformer

```typescript
class HtmlTransformer {
  async transformElement(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    
    switch (element.tagName) {
      case 'h1':
        runs.push(StyledContentRun.heading1(element.text));
        break;
        
      case 'h2':
        runs.push(StyledContentRun.heading2(element.text));
        break;
        
      case 'p':
        const inlineRuns = await this.transformInlineContent(element);
        runs.push(...inlineRuns);
        runs.push(StyledContentRun.lineBreak());
        break;
        
      case 'ul':
        const items = element.querySelectorAll('li');
        items.forEach((item, index) => {
          runs.push(StyledContentRun.listItem(item.text, '• ', 1));
          runs.push(StyledContentRun.lineBreak());
        });
        break;
    }
    
    return runs;
  }
  
  async transformInlineContent(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        runs.push(StyledContentRun.paragraph(child.text));
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        
        switch (el.tagName) {
          case 'strong':
          case 'b':
            runs.push(StyledContentRun.bold(el.text));
            break;
            
          case 'em':
          case 'i':
            runs.push(StyledContentRun.italic(el.text));
            break;
            
          case 'code':
            runs.push(StyledContentRun.code(el.text));
            break;
        }
      }
    }
    
    return runs;
  }
}
```

### Token Transformer

```typescript
class TokenTransformer {
  transform(tokens: ThemedToken[][], fontFamily: string, fontSize: number): StyledContentRun[] {
    const runs: StyledContentRun[] = [];
    
    for (const line of tokens) {
      for (const token of line) {
        if (token.content) {
          runs.push(
            StyledContentRun.code(token.content, token.color).withStyle({
              fontFamily,
              fontSizePt: fontSize,
              fontWeight: token.fontStyle & 1 ? 'bold' : 'normal',
              fontStyle: token.fontStyle & 2 ? 'italic' : 'normal'
            })
          );
        }
      }
      runs.push(StyledContentRun.lineBreak());
    }
    
    return runs;
  }
}
```

---

## Benefits of Class Approach

### 1. Validation ✅

```typescript
// This will throw an error
StyledContentRun.create({
  content: "text",
  fontSizePt: -5  // Error: Font size must be positive
});

// This will throw an error
StyledContentRun.create({
  content: "text",
  color: "not-a-color"  // Error: Invalid color
});
```

### 2. Factory Methods ✅

```typescript
// Instead of this:
{
  content: "Title",
  fontFamily: 'Helvetica',
  fontSizePt: 24,
  fontWeight: 'bold',
  blockType: 'block',
  spacingBefore: 12,
  spacingAfter: 6
}

// Just write:
StyledContentRun.heading1("Title")
```

### 3. Immutability ✅

```typescript
// All fields are readonly
const run = StyledContentRun.paragraph("text");
run.color = "#FF0000";  // Error: Cannot assign to readonly property

// Use withStyle() to create modified copy
const redRun = run.withStyle({ color: "#FF0000" });
```

### 4. Type Safety ✅

```typescript
// Constructor enforces required fields
StyledContentRun.create({});  // Error: content is required

// Factory methods have correct types
const h1 = StyledContentRun.heading1("Title");  // Type: StyledContentRun
```

### 5. Helper Methods ✅

```typescript
const run = StyledContentRun.heading1("Title");

if (run.isBlock()) {
  // Handle block element
}

if (run.hasContent()) {
  // Has actual text
}

const copy = run.clone();
```

---

## Potential Concerns

### 1. "Too Much Boilerplate?"

**No** - factory methods actually reduce boilerplate:

```typescript
// Before (interface):
const runs = [
  { content: "Title", fontFamily: 'Helvetica', fontSizePt: 24, fontWeight: 'bold', blockType: 'block', spacingBefore: 12, spacingAfter: 6 },
  { content: "Text", fontFamily: 'Helvetica', fontSizePt: 12, blockType: 'inline' }
];

// After (class):
const runs = [
  StyledContentRun.heading1("Title"),
  StyledContentRun.paragraph("Text")
];
```

Much shorter!

### 2. "Performance Overhead?"

**Minimal** - modern JS engines optimize classes well. And we're not creating millions of these.

### 3. "Harder to Serialize?"

**No** - can add toJSON/fromJSON methods if needed:

```typescript
class StyledContentRun {
  toJSON(): object {
    return {
      content: this.content,
      color: this.color,
      // ... all properties
    };
  }
  
  static fromJSON(json: any): StyledContentRun {
    return StyledContentRun.create(json);
  }
}
```

---

## Final Class Design

```typescript
/**
 * A run of content with consistent styling.
 * Immutable - use factory methods or withStyle() to create variants.
 */
export class StyledContentRun {
  private constructor(
    public readonly content: string,
    public readonly color?: string,
    public readonly fontFamily?: string,
    public readonly fontSizePt?: number,
    public readonly fontWeight?: 'normal' | 'bold',
    public readonly fontStyle?: 'normal' | 'italic',
    public readonly backgroundColor?: string,
    public readonly blockType?: 'inline' | 'block',
    public readonly spacingBefore?: number,
    public readonly spacingAfter?: number,
    public readonly indentLevel?: number,
    public readonly indentSize?: number,
    public readonly prefix?: string
  ) {
    // Validation
    if (fontSizePt !== undefined && fontSizePt <= 0) {
      throw new Error('Font size must be positive');
    }
  }
  
  static create(options: StyledContentRunOptions): StyledContentRun {
    return new StyledContentRun(
      options.content,
      options.color,
      options.fontFamily,
      options.fontSizePt,
      options.fontWeight,
      options.fontStyle,
      options.backgroundColor,
      options.blockType || 'inline',
      options.spacingBefore,
      options.spacingAfter,
      options.indentLevel,
      options.indentSize || 20,
      options.prefix
    );
  }
  
  // Factory methods for common patterns
  static heading1(content: string): StyledContentRun { /* ... */ }
  static heading2(content: string): StyledContentRun { /* ... */ }
  static paragraph(content: string): StyledContentRun { /* ... */ }
  static bold(content: string): StyledContentRun { /* ... */ }
  static italic(content: string): StyledContentRun { /* ... */ }
  static code(content: string, color?: string): StyledContentRun { /* ... */ }
  static listItem(content: string, prefix: string, level?: number): StyledContentRun { /* ... */ }
  static lineBreak(): StyledContentRun { /* ... */ }
  
  // Helper methods
  withStyle(options: Partial<StyledContentRunOptions>): StyledContentRun { /* ... */ }
  clone(): StyledContentRun { /* ... */ }
  isBlock(): boolean { /* ... */ }
  hasContent(): boolean { /* ... */ }
}

interface StyledContentRunOptions {
  content: string;
  color?: string;
  fontFamily?: string;
  fontSizePt?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  backgroundColor?: string;
  blockType?: 'inline' | 'block';
  spacingBefore?: number;
  spacingAfter?: number;
  indentLevel?: number;
  indentSize?: number;
  prefix?: string;
}
```

---

## Recommendation

**Yes, make it a class!**

Benefits:
- ✅ Cleaner transformer code (factory methods)
- ✅ Type safety and validation
- ✅ Immutability enforced
- ✅ Helper methods for common operations
- ✅ Consistent defaults
- ✅ Better encapsulation

The factory methods alone make it worth it. Compare:
```typescript
// Interface (verbose)
{ content: "Title", fontFamily: 'Helvetica', fontSizePt: 24, fontWeight: 'bold', blockType: 'block', spacingBefore: 12, spacingAfter: 6 }

// Class (concise)
StyledContentRun.heading1("Title")
```

Much better developer experience!
