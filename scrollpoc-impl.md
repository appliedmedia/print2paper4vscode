# ScrollPOC Integration Implementation Plan

## Phase 1: Multi-Page PDF Generation (Server-side)

### 1.1 Extend PDF.ts Class
- [ ] Add `maxLinesPerPage` parameter to `generatePdfFromTokens()`
- [ ] Replace single-page logic with multi-page generation loop
- [ ] Add page break detection between token lines
- [ ] Calculate total pages needed based on content length
- [ ] Return PDF metadata alongside PDF document:
  ```typescript
  interface PdfMetadata {
    totalPages: number;
    pageWidth: number;
    pageHeight: number;
    estimatedMemoryMB: number;
  }
  ```

### 1.2 Update PaperPrinter.ts Integration
- [ ] Modify `applyRenderModes()` to handle multi-page PDFs
- [ ] Update `openPrintPrepAndPrompt()` to pass metadata to webview
- [ ] Ensure existing single-page workflows remain functional

### 1.3 Update Stylize.ts Interface
- [ ] Add optional page configuration to `styleToPdf()` options
- [ ] Ensure Shiki tokenization works with large multi-page content

## Phase 2: ScrollPdfViewer Webview Component

### 2.1 Create ScrollPdfViewer Template (src/ScrollPdfViewer.yaml)
- [ ] Extract scrollpoc.html CSS → `scroll_pdf_css` template
- [ ] Extract scrollpoc.html JavaScript → `scroll_pdf_js` template  
- [ ] Extract scrollpoc.html HTML structure → `scroll_pdf_html` template
- [ ] Add template placeholders for:
  - `{{TOTAL_PAGES}}` - from PDF metadata
  - `{{MAX_CANVASES}}` - configurable canvas pool size
  - `{{PDF_DATA_URL}}` - PDF data from jsPDF
  - `{{TOOLBAR}}` - existing toolbar system

### 2.2 Port ScrollPOC Core Logic
Map scrollpoc.html components to webview JavaScript:

#### Configuration Management
- [ ] `CONFIG` object → Template-driven configuration
- [ ] `MAX_CANVASES` → Configurable based on content size
- [ ] `TOTAL_PDF_PAGES` → From PDF metadata
- [ ] `SCALE`, `PAGE_GAP` → User preferences

#### Database State Management  
- [ ] `db` object → Local webview state management
- [ ] `getCanvasId()`, `getPageId()` → ID generation utilities
- [ ] Canvas-to-page assignment tracking
- [ ] Placeholder DOM element management

#### Canvas Pool Management
- [ ] `getAllCanvasIds()` → Canvas enumeration
- [ ] `getAllAvailableCanvasIds()` → Available canvas detection
- [ ] `assignCanvasToPage()` → Canvas assignment logic
- [ ] `unassignCanvas()` → Canvas cleanup and DOM removal

#### Virtual Scrolling Core
- [ ] `handleScroll()` → Scroll event handler with debouncing
- [ ] `getScrollPosition()` → Viewport calculations
- [ ] `getVisiblePageRange()` → Page visibility detection
- [ ] Scroll direction tracking (`lastScrollTop`, `scrollDirection`)

#### Render Management
- [ ] `renderPageToCanvas()` → PDF.js page rendering
- [ ] `assignCanvasesToPages()` → Batch canvas assignment
- [ ] `moveCanvasToPlaceholder()` → DOM manipulation
- [ ] Render task cancellation and cleanup

#### Placeholder System
- [ ] `createPlaceholders()` → DOM structure creation
- [ ] Page label management
- [ ] Loading text display/hide logic
- [ ] Page break visual elements

### 2.3 Performance & Memory Management
- [ ] `logWithState()` → Diagnostic logging integration
- [ ] Canvas memory calculation and limits
- [ ] Emergency canvas freeing logic
- [ ] Render task prioritization based on scroll direction

## Phase 3: Update PDF.ts for ScrollPdfViewer

### 3.1 New Template Method
- [ ] Add `embedScrollablePDFinHTML()` method alongside existing `embedPDFinHTML()`
- [ ] Load ScrollPdfViewer templates instead of single-page PDF templates
- [ ] Pass PDF metadata to template system
- [ ] Preserve existing single-page functionality for compatibility

### 3.2 Template Integration
- [ ] Update template replacement to include:
  - PDF metadata (total pages, dimensions)  
  - Canvas pool configuration
  - Scroll performance settings
- [ ] Ensure PDF.js library integration remains compatible

## Phase 4: UI.ts Message Handling Updates

### 4.1 Extend Message System
- [ ] Add `scrollDiagnostic` message type for performance logging
- [ ] Add `pdfMetadata` to `updatePdf` messages
- [ ] Handle multi-page PDF content updates

### 4.2 Update WebView Management  
- [ ] Modify `updatePdfContentOnly()` to work with scrollable viewer
- [ ] Ensure toolbar integration works with new viewer
- [ ] Maintain backward compatibility with single-page PDFs

## Phase 5: Integration & Testing

### 5.1 PaperPrinter.ts Integration
- [ ] Add user preference for single-page vs multi-page mode
- [ ] Update menu system to show page count information
- [ ] Ensure theme/font/page size changes work with scrollable viewer

### 5.2 Configuration Management
- [ ] Add global settings for:
  - Maximum canvas pool size (default: 7)
  - Scroll performance settings
  - Memory limits and warnings
  - Auto-switch to multi-page for large content

### 5.3 Backward Compatibility
- [ ] Ensure existing single-page workflows continue working
- [ ] Add feature flag or automatic detection for multi-page content
- [ ] Graceful fallback to single-page for small content

## Phase 6: Testing & Optimization

### 6.1 Performance Testing
- [ ] Test with various file sizes (100 lines, 1000 lines, 5000+ lines)
- [ ] Memory usage validation
- [ ] Scroll performance benchmarking
- [ ] Canvas pool size optimization

### 6.2 Cross-Platform Testing  
- [ ] Verify PDF.js compatibility across different webview environments
- [ ] Test canvas rendering performance on different hardware
- [ ] Validate memory limits and emergency cleanup

### 6.3 Integration Testing
- [ ] Theme switching with multi-page content
- [ ] Font size changes with large documents
- [ ] Page size/orientation changes
- [ ] Print functionality with multi-page PDFs

## Key Implementation Notes

### ScrollPOC → Main Codebase Mapping

**scrollpoc.html Functions → WebView JavaScript:**
- `generateAndRenderPages()` → Split between PDF.ts (generation) and webview (rendering)
- `handleScroll()` → Core scroll handler in ScrollPdfViewer template
- `assignCanvasesToPages()` → Canvas management in webview
- `renderPageToCanvas()` → PDF.js integration in webview
- `createPlaceholders()` → DOM structure creation in webview
- `getVisiblePageRange()` → Viewport calculations in webview

**scrollpoc.html State → WebView State:**
- `db` object → Local webview state management
- `pdfDoc` → Passed from extension as PDF data URL
- `totalPages` → From PDF metadata
- `containerElement` → DOM reference in webview
- `CONFIG` → Template-driven configuration

**Extension Integration Points:**
- `PDF.generatePdfFromTokens()` → Multi-page generation
- `PDF.embedScrollablePDFinHTML()` → ScrollPdfViewer template rendering
- `UI.updatePdfContentOnly()` → Multi-page content updates
- `PaperPrinter.applyRenderModes()` → Multi-page regeneration
