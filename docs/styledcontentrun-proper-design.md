# StyledContentRun: Proper Design with Separation of Concerns

## The Problem with My Previous Design

I made StyledContentRun know about HTML semantics:

```typescript
// ❌ WRONG - HTML knowledge in data structure
class StyledContentRun {
  static heading1(content: string) { /* knows h1 = 24pt */ }
  static bold(content: string) { /* knows bold styling */ }
}
```

**This violates separation of concerns!** StyledContentRun should be a pure data structure.

---

## Correct Design: Pure Data Structure

### StyledContentRun Class (Data Only)

```typescript
import type { App } from './App';
import { Diagnostics } from './Diagnostics';

/**
 * StyledContentRun - Pure data structure for styled text
 * 
 * Represents a run of content with styling. NO business logic,
 * NO knowledge of HTML/Markdown/etc. Just validates and stores data.
 * 
 * Lifecycle: Instantiated once at app startup, lives on app.scrun
 */
export class StyledContentRun {
  private app: App;
  private dx: Diagnostics;
  
  // Instance properties for a single run
  public readonly content: string;
  public readonly color?: string;
  public readonly fontFamily?: string;
  public readonly fontSizePt?: number;
  public readonly fontWeight?: 'normal' | 'bold';
  public readonly fontStyle?: 'normal' | 'italic';
  public readonly backgroundColor?: string;
  public readonly blockType: 'inline' | 'block';
  public readonly spacingBefore?: number;
  public readonly spacingAfter?: number;
  public readonly indentLevel?: number;
  public readonly indentSize?: number;
  public readonly prefix?: string;
  
  constructor(app: App, options: StyledContentRunOptions) {
    this.app = app;
    this.dx = app.dx.sub('StyledContentRun');
    
    // Validate and assign
    this.content = options.content;
    this.color = options.color;
    this.fontFamily = options.fontFamily;
    this.fontSizePt = options.fontSizePt;
    this.fontWeight = options.fontWeight;
    this.fontStyle = options.fontStyle;
    this.backgroundColor = options.backgroundColor;
    this.blockType = options.blockType ?? 'inline';
    this.spacingBefore = options.spacingBefore;
    this.spacingAfter = options.spacingAfter;
    this.indentLevel = options.indentLevel;
    this.indentSize = options.indentSize ?? 20;
    this.prefix = options.prefix;
    
    // Basic validation
    if (this.fontSizePt !== undefined && this.fontSizePt <= 0) {
      this.dx.error('Font size must be positive');
    }
  }
  
  init(): void {
    // Lifecycle hook
  }
  
  done(): void {
    this.dx.done();
  }
  
  // Only validation/utility methods, NO factory methods
  isBlock(): boolean {
    return this.blockType === 'block';
  }
  
  hasContent(): boolean {
    return this.content.length > 0;
  }
  
  // Create a new run with modified properties
  with(changes: Partial<StyledContentRunOptions>): StyledContentRun {
    return new StyledContentRun(this.app, {
      content: changes.content ?? this.content,
      color: changes.color ?? this.color,
      fontFamily: changes.fontFamily ?? this.fontFamily,
      fontSizePt: changes.fontSizePt ?? this.fontSizePt,
      fontWeight: changes.fontWeight ?? this.fontWeight,
      fontStyle: changes.fontStyle ?? this.fontStyle,
      backgroundColor: changes.backgroundColor ?? this.backgroundColor,
      blockType: changes.blockType ?? this.blockType,
      spacingBefore: changes.spacingBefore ?? this.spacingBefore,
      spacingAfter: changes.spacingAfter ?? this.spacingAfter,
      indentLevel: changes.indentLevel ?? this.indentLevel,
      indentSize: changes.indentSize ?? this.indentSize,
      prefix: changes.prefix ?? this.prefix
    });
  }
}

export interface StyledContentRunOptions {
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

## HTML Transformer with Element Mapping

### HTML Element Constants (Transform Knowledge Lives Here!)

```typescript
// src/MarkdownRenderer.ts or similar

import type { App } from './App';
import type { StyledContentRunOptions } from './StyledContentRun';

/**
 * Markdown/HTML rendering constants
 * This is where HTML-to-styling knowledge lives, NOT in StyledContentRun!
 */
export class MarkdownRenderer {
  private app: App;
  
  // Element style mappings - uses user's font preferences
  private getElementStyles(): Record<string, Partial<StyledContentRunOptions>> {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    const baseFontFamily = editorTypo.fontFamily;
    const baseFontSize = editorTypo.fontSize;
    
    // VS Code markdown styles - respects user's editor font
    return {
      h1: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize * 2.0,  // 2x base size
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 12,
        spacingAfter: 6
      },
      h2: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize * 1.5,  // 1.5x base size
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 10,
        spacingAfter: 5
      },
      h3: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize * 1.25,
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 8,
        spacingAfter: 4
      },
      h4: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize * 1.1,
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 6,
        spacingAfter: 3
      },
      h5: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 4,
        spacingAfter: 2
      },
      h6: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize * 0.9,
        fontWeight: 'bold',
        blockType: 'block',
        spacingBefore: 4,
        spacingAfter: 2
      },
      p: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        blockType: 'inline'
      },
      strong: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        fontWeight: 'bold',
        blockType: 'inline'
      },
      em: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        fontStyle: 'italic',
        blockType: 'inline'
      },
      code_inline: {
        fontFamily: editorTypo.fontFamily, // Use editor's monospace font
        fontSizePt: baseFontSize * 0.9,
        backgroundColor: '#f3f3f3',  // TODO: Get from theme
        blockType: 'inline'
      },
      code_block: {
        fontFamily: editorTypo.fontFamily,
        fontSizePt: baseFontSize * 0.9,
        backgroundColor: '#f5f5f5',  // TODO: Get from theme
        blockType: 'inline',
        indentLevel: 1
      },
      blockquote: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        blockType: 'inline',
        indentLevel: 1
      },
      li: {
        fontFamily: baseFontFamily,
        fontSizePt: baseFontSize,
        blockType: 'inline',
        indentLevel: 1
      }
    };
  }
  
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * Transform HTML to StyledContentRun instances
   */
  async transform(html: string): Promise<StyledContentRun[]> {
    const root = parse(html);
    const runs: StyledContentRun[] = [];
    
    for (const element of root.childNodes) {
      const elementRuns = await this.transformElement(element);
      runs.push(...elementRuns);
    }
    
    return runs;
  }
  
  private async transformElement(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    const styles = this.getElementStyles();
    
    switch (element.tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        runs.push(new StyledContentRun(this.app, {
          content: element.text,
          ...styles[element.tagName]
        }));
        break;
        
      case 'p':
        const inlineRuns = await this.transformInlineContent(element);
        runs.push(...inlineRuns);
        runs.push(new StyledContentRun(this.app, {
          content: '',
          blockType: 'block',
          spacingAfter: 6
        }));
        break;
        
      case 'ul':
      case 'ol':
        const listRuns = await this.transformList(element);
        runs.push(...listRuns);
        break;
        
      case 'pre':
        const codeRuns = await this.transformCodeBlock(element);
        runs.push(...codeRuns);
        break;
        
      case 'blockquote':
        const quoteRuns = await this.transformBlockquote(element);
        runs.push(...quoteRuns);
        break;
    }
    
    return runs;
  }
  
  private async transformInlineContent(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    const styles = this.getElementStyles();
    
    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        runs.push(new StyledContentRun(this.app, {
          content: child.text,
          ...styles.p
        }));
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        const el = child as HTMLElement;
        
        switch (el.tagName) {
          case 'strong':
          case 'b':
            runs.push(new StyledContentRun(this.app, {
              content: el.text,
              ...styles.strong
            }));
            break;
            
          case 'em':
          case 'i':
            runs.push(new StyledContentRun(this.app, {
              content: el.text,
              ...styles.em
            }));
            break;
            
          case 'code':
            runs.push(new StyledContentRun(this.app, {
              content: el.text,
              ...styles.code_inline
            }));
            break;
        }
      }
    }
    
    return runs;
  }
  
  private async transformCodeBlock(element: HTMLElement): Promise<StyledContentRun[]> {
    const codeElement = element.querySelector('code');
    if (!codeElement) return [];
    
    const code = codeElement.text;
    const lang = codeElement.classNames.find(c => c.startsWith('language-'))
      ?.replace('language-', '') || 'plaintext';
    
    // Get Shiki tokens (they already have color!)
    const shikiTokens = await this.app.stylize.tokenize(code, lang as LanguageId_t);
    
    // Transform tokens to runs
    const runs: StyledContentRun[] = [];
    const styles = this.getElementStyles();
    const codeStyle = styles.code_block;
    
    for (const line of shikiTokens) {
      for (const token of line) {
        if (token.content) {
          runs.push(new StyledContentRun(this.app, {
            content: token.content,
            color: token.color,
            fontFamily: codeStyle.fontFamily,
            fontSizePt: codeStyle.fontSizePt,
            fontWeight: token.fontStyle & 1 ? 'bold' : 'normal',
            fontStyle: token.fontStyle & 2 ? 'italic' : 'normal',
            backgroundColor: codeStyle.backgroundColor,
            blockType: 'inline',
            indentLevel: codeStyle.indentLevel
          }));
        }
      }
      // Line break
      runs.push(new StyledContentRun(this.app, {
        content: '',
        blockType: 'block'
      }));
    }
    
    // Add spacing before and after code block
    runs.unshift(new StyledContentRun(this.app, {
      content: '',
      blockType: 'block',
      spacingBefore: 6
    }));
    runs.push(new StyledContentRun(this.app, {
      content: '',
      blockType: 'block',
      spacingAfter: 6
    }));
    
    return runs;
  }
  
  private async transformList(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    const styles = this.getElementStyles();
    const isOrdered = element.tagName === 'ol';
    let itemNumber = 1;
    
    const items = element.querySelectorAll('li');
    for (const item of items) {
      const prefix = isOrdered ? `${itemNumber}. ` : '• ';
      
      const contentRuns = await this.transformInlineContent(item);
      
      // Add prefix to first run
      if (contentRuns.length > 0) {
        contentRuns[0] = contentRuns[0].with({
          prefix,
          indentLevel: 1
        });
        
        // Apply indent to remaining runs
        for (let i = 1; i < contentRuns.length; i++) {
          contentRuns[i] = contentRuns[i].with({ indentLevel: 1 });
        }
      }
      
      runs.push(...contentRuns);
      runs.push(new StyledContentRun(this.app, {
        content: '',
        blockType: 'block',
        spacingAfter: 3
      }));
      
      if (isOrdered) itemNumber++;
    }
    
    return runs;
  }
  
  private async transformBlockquote(element: HTMLElement): Promise<StyledContentRun[]> {
    const runs: StyledContentRun[] = [];
    
    for (const child of element.childNodes) {
      const childRuns = await this.transformElement(child as HTMLElement);
      
      // Apply indentation to all runs
      for (const run of childRuns) {
        runs.push(run.with({
          indentLevel: (run.indentLevel ?? 0) + 1
        }));
      }
    }
    
    return runs;
  }
}
```

---

## App Integration

```typescript
// src/App.ts

import { StyledContentRun } from './StyledContentRun';
import { MarkdownRenderer } from './MarkdownRenderer';

export class App {
  // ... existing properties
  
  public markdownRenderer: MarkdownRenderer;
  
  constructor(context: ExtensionContext, vscode: typeof VSCode) {
    // ... existing initialization
    
    this.markdownRenderer = new MarkdownRenderer(this);
  }
  
  async init(): Promise<void> {
    // ... existing init calls
    
    this.markdownRenderer.init();
  }
  
  done(): void {
    // ... existing done calls
    
    this.markdownRenderer.done();
  }
}
```

---

## Key Points

### 1. Separation of Concerns ✅

**StyledContentRun**: Pure data structure, no HTML knowledge
**MarkdownRenderer**: Has all HTML-to-styling mapping knowledge

### 2. Respects User Preferences ✅

```typescript
const editorTypo = this.app.vscodeapis.getEditorTypography();
const baseFontFamily = editorTypo.fontFamily;  // User's chosen font!
const baseFontSize = editorTypo.fontSize;      // User's chosen size!
```

### 3. Lifecycle Management ✅

```typescript
// Hung off app
this.markdownRenderer = new MarkdownRenderer(this);

// Has init() and done()
this.markdownRenderer.init();
this.markdownRenderer.done();
```

### 4. No Hardcoded Fonts ✅

All fonts come from:
- User's editor typography settings
- VS Code theme (for colors/backgrounds)
- Markdown renderer's actual styling

### 5. VS Code Markdown Renderer Consideration ✅

TODO: We should query what fonts the VS Code markdown renderer actually uses:
- Check `markdown.styles` configuration
- Inspect rendered markdown HTML for actual font-family
- Match those fonts in our PDF output

---

## What About VS Code's Markdown Font?

Good point - VS Code's markdown preview has its own font settings:

```typescript
// Get markdown preview font settings
const mdConfig = vscode.workspace.getConfiguration('markdown');
const mdFontFamily = mdConfig.get<string>('preview.fontFamily');
const mdFontSize = mdConfig.get<number>('preview.fontSize');

// Use these if available, otherwise fall back to editor settings
const baseFontFamily = mdFontFamily || editorTypo.fontFamily;
const baseFontSize = mdFontSize || editorTypo.fontSize;
```

Should probably respect `markdown.preview.*` settings for rendered markdown!

---

## Correct Architecture

```
┌─────────────────────────────────────────┐
│              App                        │
│  ├─ stylize (tokenizer)                │
│  ├─ markdownRenderer (HTML → runs)     │
│  └─ pdf (renderer: runs → jsPDF)       │
└─────────────────────────────────────────┘
                │
                ↓
         ┌──────────────┐
         │ User prints  │
         └──────┬───────┘
                │
                ↓
    ┌───────────────────────┐
    │  MarkdownRenderer     │
    │  - Has element styles │
    │  - Uses user's fonts  │
    │  - Creates runs       │
    └───────┬───────────────┘
            │
            ↓
    ┌───────────────────────┐
    │  StyledContentRun[]   │
    │  - Pure data          │
    │  - No business logic  │
    └───────┬───────────────┘
            │
            ↓
    ┌───────────────────────┐
    │  PDF Renderer         │
    │  - Renders runs       │
    │  - Handles wrapping   │
    │  - Manages pages      │
    └───────────────────────┘
```

Much cleaner separation!
