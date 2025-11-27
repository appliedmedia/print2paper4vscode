# Markdown Rendering Implementation - Milestones & Next Steps

## Overview

Implementation plan for adding **Rendered Markdown Mode** to Print2Paper4VSCode extension. This allows users to print markdown files in two modes:
1. **Raw Mode** - Print markdown source with syntax highlighting (✅ ALREADY WORKS)
2. **Rendered Mode** - Print HTML-rendered markdown (🚧 NEW FEATURE)

## Architecture Summary

### Direct Rendering Approach (No Intermediate Format)

```text
Raw Markdown:
  Editor Text → Shiki Tokens → PDF.renderFromTokens() → jsPDF

Rendered Markdown:
  Editor Text → VS Code MD API → HTML → PDF.renderFromHTML() → jsPDF
```

**Key Insight**: The PDF document IS the common format. Both `renderFromTokens()` and `renderFromHTML()` are input adapters that feed the same underlying line-by-line rendering primitives.

### Code Reuse Strategy

**Identical Components (100% reuse):**
- `findCharacterBreakPoint()` - character wrapping logic
- `shouldBreakPage()` - page break detection
- `addPageBreak()` - new page creation
- `renderTextContent()` - text rendering with wrapping
- `doc.text()` - jsPDF rendering call
- Position tracking (`currentX`, `currentY`)

**Different Components:**
- `renderFromTokens()`: Set color, render, next line
- `renderFromHTML()`: Set font size/weight/style, handle spacing/indentation, call `renderTextContent()`

---

## Implementation Phases

### ✅ Phase 1: Validation (COMPLETE)

**Status**: Already working via existing code path
- Raw markdown printing works through Shiki tokenization
- `TabInspector.detectActiveTabCategory()` returns `'editor-md'`
- `PDF.renderTokenizedLine()` renders with syntax highlighting

**No changes required for this phase.**

---

### 🚧 Phase 2: HTML Rendering in PDF Class

**Timeline**: ~8 hours  
**Status**: Not started

#### Milestone 2.1: Setup & Refactoring
- [ ] Install `node-html-parser` dependency
- [ ] Rename `renderTokenizedLine()` → `renderFromTokens()` for clarity
- [ ] Ensure all callers use new name

**Deliverable**: Method renamed, no functionality changes

#### Milestone 2.2: Core HTML Infrastructure
- [ ] Add `renderFromHTML(html: string)` method
- [ ] Add `htmlElementHandlers` map for element dispatching
- [ ] Implement `renderHTMLElement(element)` dispatcher

**Deliverable**: Basic HTML parsing infrastructure in place

#### Milestone 2.3: Font Management
- [ ] Implement `getMarkdownFontInfo()` - reads `markdown.preview.*` settings
- [ ] Implement `getFontFromElementStyle(element)` - parses element style attributes

**Deliverable**: Font information extraction from settings and HTML

#### Milestone 2.4: Block Elements
- [ ] Implement `renderHeading(element, level)` for h1-h6
  - Font sizing based on level
  - Spacing before/after
  - Bold style
- [ ] Implement `renderParagraph(element)` 
  - Paragraph spacing
  - Calls `renderInlineContent()`

**Deliverable**: Headings and paragraphs render correctly

#### Milestone 2.5: Inline Elements
- [ ] Implement `renderInlineContent(element)` with inline handlers
- [ ] Add handlers for: `strong`, `b`, `em`, `i`, `code`
- [ ] Implement `renderTextContent(text)` - reuses character wrapping

**Deliverable**: Bold, italic, inline code render correctly

#### Milestone 2.6: Lists
- [ ] Implement `renderList(element)` for ul/ol
- [ ] Bullet rendering for unordered lists
- [ ] Number rendering for ordered lists
- [ ] Proper indentation

**Deliverable**: Lists render with correct bullets/numbers and indentation

#### Milestone 2.7: Code Blocks
- [ ] Implement `renderCodeBlock(element)` 
- [ ] Extract language from `class="language-*"`
- [ ] **Reuse existing Shiki tokenization!**
- [ ] Call `renderFromTokens()` for each line

**Deliverable**: Code blocks render with syntax highlighting

#### Milestone 2.8: Additional Elements
- [ ] Implement `renderBlockquote(element)` with indentation
- [ ] Implement `renderHorizontalRule()` for `<hr>` elements

**Deliverable**: Complete HTML rendering suite

**Phase 2 Exit Criteria**:
- All HTML element handlers implemented
- Unit tests pass for each element type
- Manual testing shows correct rendering

---

### 🚧 Phase 3: VS Code Markdown API Integration

**Timeline**: ~2 hours  
**Status**: Not started

#### Milestone 3.1: Markdown API Access
- [ ] Get VS Code markdown extension via `vscode.extensions.getExtension('vscode.markdown-language-features')`
- [ ] Activate extension if not active
- [ ] Access `mdApi.render()` method

**Deliverable**: Can call VS Code markdown renderer

#### Milestone 3.2: PDF Generation Method
- [ ] Add `generateRenderedMarkdownPdf()` to `PaperPrinter`
- [ ] Call `mdApi.render(markdown, document)` to get HTML
- [ ] Call `PDF.renderFromHTML(html)` to render
- [ ] Handle errors gracefully

**Deliverable**: End-to-end rendered markdown PDF generation

**Phase 3 Exit Criteria**:
- Can generate PDF from markdown using VS Code renderer
- Error handling for missing API
- Integration tests pass

---

### 🚧 Phase 4: Mode Selection UI

**Timeline**: ~1 hour  
**Status**: Not started

#### Milestone 4.1: Mode Picker
- [ ] Add quick pick dialog when printing markdown files
- [ ] Options: "Raw Source" vs "Rendered Preview"
- [ ] Route to appropriate generation method

**Deliverable**: User can choose markdown rendering mode

#### Milestone 4.2: Command Handler Update
- [ ] Update `handlePrintCommandFromVSCode()`
- [ ] Detect markdown files (`languageId === 'markdown'`)
- [ ] Show mode picker for markdown
- [ ] Direct to `generatePdf()` for raw or `generateRenderedMarkdownPdf()` for rendered

**Deliverable**: Complete user workflow with mode selection

**Phase 4 Exit Criteria**:
- Mode selection works for markdown files
- Non-markdown files bypass mode selection
- Both modes generate correct PDFs

---

### 🚧 Phase 5: Polish & Testing

**Timeline**: ~2 hours  
**Status**: Not started

#### Milestone 5.1: Settings Integration
- [ ] Respect `markdown.preview.fontFamily` setting
- [ ] Respect `markdown.preview.fontSize` setting
- [ ] Test with various font configurations

**Deliverable**: Font settings match user preferences

#### Milestone 5.2: Theme Integration
- [ ] Extract background colors from theme for code blocks
- [ ] Extract colors for blockquotes
- [ ] Test with light and dark themes

**Deliverable**: Theme-aware rendering

#### Milestone 5.3: Comprehensive Testing
- [ ] Test basic markdown (headings, paragraphs, bold, italic)
- [ ] Test lists (ordered, unordered, nested)
- [ ] Test code blocks with various languages
- [ ] Test complex documents (tables, nested blockquotes)
- [ ] Test edge cases (empty elements, special characters)

**Deliverable**: Robust markdown rendering

**Phase 5 Exit Criteria**:
- All settings respected
- Theme colors applied correctly
- Comprehensive test suite passes
- No regressions in raw markdown mode

---

## Implementation Timeline

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1: Validation | ✅ Complete | Trivial |
| Phase 2: HTML Rendering | 8 hours | High |
| Phase 3: VS Code API | 2 hours | Medium |
| Phase 4: Mode Selection | 1 hour | Low |
| Phase 5: Polish | 2 hours | Medium |
| **TOTAL** | **~14 hours** | **Medium-High** |

---

## Key Technical Decisions

### ✅ Direct Rendering (No Intermediate Format)
Both `renderFromTokens()` and `renderFromHTML()` write directly to jsPDF. No intermediate data structures needed.

### ✅ Maximum Code Reuse
HTML rendering reuses all existing wrapping/paging helpers:
- Character wrapping logic
- Page break detection
- Text rendering primitives

### ✅ Markdown Preview Settings
Respect user's `markdown.preview.*` configuration for fonts and sizing.

### ✅ Code Blocks Use Existing Tokenization
When HTML contains code blocks, tokenize them with Shiki and render using `renderFromTokens()` - complete reuse of existing code highlighting.

### ✅ Simple Architecture
- `renderFromTokens()` - for code (existing)
- `renderFromHTML()` - for markdown (new)
- Shared helpers - for wrapping, paging, text rendering (existing)

No classes, no transformers, no intermediate formats. Just two rendering methods in the PDF class.

---

## Dependencies

### New Dependencies Required
```json
{
  "dependencies": {
    "node-html-parser": "^6.1.12"
  }
}
```

### Existing Dependencies (No Changes)
- `shiki` - Syntax highlighting
- `jspdf` - PDF generation
- VS Code Extension API v1.60.0+

---

## Success Criteria

### Must Have
- ✅ Raw markdown printing continues to work
- [ ] Rendered markdown printing works for all common elements
- [ ] Mode selection UI is intuitive
- [ ] Font settings are respected
- [ ] Code blocks have syntax highlighting
- [ ] No regressions in existing functionality

### Nice to Have
- [ ] Table rendering
- [ ] Image rendering (future enhancement)
- [ ] Advanced formatting (subscript, superscript)
- [ ] Toolbar toggle (vs quick pick) for mode switching

---

## Testing Strategy

### Unit Tests
- [ ] Test each HTML element handler independently
- [ ] Test font parsing from settings and styles
- [ ] Test character wrapping with HTML content
- [ ] Test page breaks with various content

### Integration Tests
- [ ] Test full markdown documents
- [ ] Test VS Code API integration
- [ ] Test mode selection workflow
- [ ] Test with various themes

### Manual Testing
- [ ] Test with real-world markdown documents
- [ ] Test with different VS Code themes
- [ ] Test with custom font settings
- [ ] Test performance with large documents

---

## Risk Assessment

### Low Risk
- Phase 1 (already complete)
- Phase 4 (simple UI addition)

### Medium Risk
- Phase 3 (VS Code API may change)
- Phase 5 (theme integration complexity)

### Higher Risk
- Phase 2 (most code changes, HTML parsing edge cases)
  - Mitigation: Incremental implementation by element type
  - Mitigation: Reuse existing primitives extensively
  - Mitigation: Comprehensive testing at each milestone

---

## Next Steps (Immediate)

1. **Install dependency**: `npm install node-html-parser@^6.1.12`
2. **Start Phase 2.1**: Rename `renderTokenizedLine()` → `renderFromTokens()`
3. **Verify tests pass**: Ensure renaming doesn't break anything
4. **Begin Phase 2.2**: Implement basic HTML parsing infrastructure

---

## Notes

- **Code Location**: All HTML rendering code goes in `src/PDF.ts`
- **No New Files**: No need for separate classes or modules
- **Naming Convention**: Follow existing patterns (`renderFromTokens`, `renderFromHTML`)
- **Documentation**: Add JSDoc comments for all new methods
- **Testing**: Update existing tests and add new ones as implementation progresses

---

## References

- **Implementation Plan**: `/workspace/docs/md-print-plan.md`
- **Developer Guide**: `/workspace/docs/AGENTS.md`
- **PDF Class**: `/workspace/src/PDF.ts`
- **PaperPrinter Class**: `/workspace/src/PaperPrinter.ts`
- **Stylize Class**: `/workspace/src/Stylize.ts`
