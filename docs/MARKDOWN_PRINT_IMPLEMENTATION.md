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

### Phase 4: Preview Tab Handling ✅

- Added `OSMac.getCurrentAppName()` with caching
- Added `OSMac.getEditorWindowBounds()` via AppleScript
- Added `OSMac.getScreenDimensions()` via AppleScript
- Added `OSMac.screenshotWindow(bounds?)` using screencapture
- Added `PaperPrinter.handlePreviewTabPrint()` with user prompt
- Added `PaperPrinter.screenshotAndPrint()` with fallback

### AppleScript Templates Added

```yaml
apple_script_get_current_app: |
  tell application "System Events"
    name of first application process whose frontmost is true
  end tell

apple_script_get_editor_bounds: |
  tell application "System Events"
    tell process "{{app_name}}"
      set frontWindow to front window
      set windowPosition to position of frontWindow
      set windowSize to size of frontWindow
      return (item 1 of windowPosition) & "," & (item 2 of windowPosition) & "," & (item 1 of windowSize) & "," & (item 2 of windowSize)
    end tell
  end tell

apple_script_get_screen_dimensions: |
  tell application "Finder"
    set screenBounds to bounds of window of desktop
    set screenWidth to (item 3 of screenBounds) - (item 1 of screenBounds)
    set screenHeight to (item 4 of screenBounds) - (item 2 of screenBounds)
    return screenWidth & "," & screenHeight
  end tell
```

## Testing Required

**Manual testing is required** as automated tests have pre-existing vscode mock infrastructure issues.

### Test Cases

1. **Basic Markdown**
   - Headings (h1-h6)
   - Paragraphs
   - Bold and italic text
   - Inline code

2. **Lists**
   - Unordered lists
   - Ordered lists
   - Nested lists

3. **Code Blocks**
   - Fenced code blocks with language
   - Syntax highlighting verification

4. **Complex Elements**
   - Blockquotes
   - Horizontal rules
   - Mixed content

5. **Mode Switching**
   - Raw markdown (syntax highlighted source)
   - Rendered markdown (HTML output)

6. **Preview Tabs**
   - Screenshot prompt appears
   - Screenshot captures correctly
   - Print dialog opens

## Known Limitations

1. **Manual Mode Toggle**: Currently `useRenderedMd` must be set programmatically. A menu item toggle should be added in the future.

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

### AppleScript Safety

⚠️ **CRITICAL**: The `app_name` variable in AppleScript templates comes directly from System Events and is **NOT sanitized**. It's safe because it's returned by the OS itself, not user input.

## Future Enhancements

- [ ] Add menu item to toggle `useRenderedMd` on/off
- [ ] Extract background colors from theme for code/blockquotes
- [ ] Add table support
- [ ] Add image embedding support
- [ ] Windows/Linux screenshot implementations
