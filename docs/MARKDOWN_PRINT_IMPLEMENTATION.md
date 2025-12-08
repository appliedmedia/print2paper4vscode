# Markdown Print Implementation Notes

## What Was Implemented

### Phase 2: HTML Rendering in PDF Class ✅

- Installed `node-html-parser` dependency
- Renamed `PDF.renderTokenizedLine()` → `PDF.renderFromTokens()` with 2D token array signature
- Added `PDF.renderFromHTML(html: string)` method to parse and render HTML
- Implemented HTML element handlers:
  - `getMarkdownFontInfo()` and `getFontFromElementStyle()` - font extraction
  - `renderHeading()` - h1-h6 with automatic sizing
  - `renderParagraph()` - paragraphs with spacing
  - `renderInlineContent()` - bold, italic, code inline elements
  - `renderTextContent()` - reuses existing character wrapping logic
  - `renderList()` - ul/ol with bullets and numbering
  - `renderCodeBlock()` - reuses Shiki tokenization for syntax highlighting
  - `renderBlockquote()` - indented content
  - `renderHorizontalRule()` - hr element

### Phase 3: VS Code Markdown API Integration ✅

- Added `useRenderedMd: boolean` property to `DocInfo_PaperPrinter`
- Added `VSCodeAPIs.getExtension_Markdown()` method
- Added `VSCodeAPIs.renderMarkdownToHtml()` wrapper method
- Updated `PaperPrinter.generatePdf()` to branch on `useRenderedMd` flag

### Phase 4: INCORRECT APPROACH - TO BE REMOVED ⚠️

**The screenshot approach for preview tabs was implemented but is the WRONG solution.**

**Why it's wrong:**
- We should not screenshot preview tabs
- Instead, we should control the markdown rendering ourselves
- Need a menu toggle to switch between raw and rendered markdown views

**Code to remove:**
- `OSMac.getCurrentAppName()` - TO BE REMOVED
- `OSMac.getEditorWindowBounds()` - TO BE REMOVED
- `OSMac.getScreenDimensions()` - TO BE REMOVED
- `OSMac.screenshotWindow()` - TO BE REMOVED
- `PaperPrinter.handlePreviewTabPrint()` - TO BE REMOVED
- `PaperPrinter.screenshotAndPrint()` - TO BE REMOVED
- AppleScript templates in OSMac.yaml - TO BE REMOVED

**Correct approach:**
- Add a top-level menu item that toggles between "Raw Markdown" and "Rendered Markdown"
- When user prints markdown, they choose which mode via the menu
- No need to detect or handle preview tabs differently

## Known Limitations

1. **Menu Toggle Not Yet Implemented**: Need to add menu item to toggle `useRenderedMd` on/off

2. **Background Colors**: Code blocks and blockquotes don't yet extract background colors from themes (noted as future enhancement).

3. **Table Support**: Markdown tables are not yet implemented (would need additional HTML handlers).

4. **Image Support**: Embedded images in markdown are not yet handled.

## Architecture Notes

### Unified Rendering Approach

- Both `renderFromTokens()` and `renderFromHTML()` use the same underlying primitives
- Character wrapping: `findCharacterBreakPoint()`
- Page breaking: `shouldBreakPage()`, `addPageBreak()`
- Text rendering: `renderTextContent()` reuses token rendering logic

### Font Resolution

1. Try to get font from HTML element's style attribute
2. Fall back to `markdown.preview.fontFamily` and `markdown.preview.fontSize` settings
3. Fall back to editor typography settings

## Future Enhancements

- [ ] Add top-level menu item to toggle `useRenderedMd` on/off
- [ ] Extract background colors from theme for code/blockquotes
- [ ] Add table support
- [ ] Add image embedding support
