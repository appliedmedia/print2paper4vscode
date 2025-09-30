# ScrollPOC Integration Implementation Plan

## Architecture Overview

**Generic Scrollable Viewer Pattern**: UI.ts owns a generic scrollable content viewer that accepts any PageRender implementation. PDF.ts implements the PageRender interface to provide PDF-specific page generation.

### Interface Contract

```typescript
interface PageRender {
  pageRender(pageNumber: number, options: RenderOptions): Promise<PageData>;
  getTotalPages(): Promise<number>;
  getPageMetadata(): Promise<PageMetadata>;
}

interface PageData {
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
}

interface RenderOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  theme: string;
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
}

interface PageMetadata {
  totalPages: number;
  pageWidth: number;
  pageHeight: number;
  estimatedMemoryMB: number;
}
```

## Phase 1: Define PageRender Interface & PDF Implementation

### 1.1 Create PageRender Interface

- [x] Create `src/types/PageRender_t.ts` with interface definitions
- [x] Define `PageRender`, `PageData`, `RenderOptions`, `PageMetadata` interfaces
- [x] Add error handling interfaces for page generation failures
- [x] Document interface contract requirements and expected behavior

### 1.2 Update PDF.ts to Implement PageRender

- [x] Add `implements PageRender` to PDF class declaration
- [x] Implement `pageRender(pageNumber: number, options: RenderOptions): Promise<PageData>`
  - [x] Extract page-specific tokens from full token array
  - [x] Generate single-page PDF using existing jsPDF logic
  - [x] Convert to data URL and return with dimensions
  - [x] Handle page number validation and bounds checking
- [x] Implement `getTotalPages(): Promise<number>`
  - [x] Calculate based on content length and page size constraints
  - [x] Cache result for performance
- [x] Implement `getPageMetadata(): Promise<PageMetadata>`
  - [x] Calculate total pages, dimensions, memory estimates
  - [x] Include performance hints for UI component
- [x] Add error handling for invalid page numbers and generation failures
- [x] Add diagnostic logging for page generation performance

### 1.3 Refactor PDF.ts for Page-Based Generation

- [x] Extract page calculation logic from `generatePdfFromTokens()`
- [x] Create `calculatePageBreaks(tokens: ThemedToken[][]): number[]` method
- [x] Create `extractTokensForPage(tokens: ThemedToken[][], pageNumber: number): ThemedToken[][]` method
- [x] Create `generateSinglePagePdf(tokens: ThemedToken[][], options: RenderOptions): jsPDF` method
- [x] Update existing `generatePdfFromTokens()` to use new page-based methods
- [x] Ensure backward compatibility with single-page generation

### 1.4 Add PageRender Configuration

- [x] Add page render options to global state management
- [x] Create `setPageRenderOptions(options: Partial<RenderOptions>)` method
- [x] Add validation for render options
- [x] Add defaults for missing render options
- [x] Integrate with existing theme/font/page size preferences

## Phase 2: Generic Scrollable Viewer in UI.ts

### 2.1 Create Generic Scroll Templates (UI.yaml)

- [x] Extract scrollpoc.html CSS → `scroll_css` template
- [x] Extract scrollpoc.html JavaScript → `scroll_js` template
- [x] Extract scrollpoc.html HTML structure → `scroll_html` template
- [x] Add template placeholders for:
  - `{{TOTAL_PAGES}}` - from page render metadata
  - `{{MAX_CANVASES}}` - configurable canvas pool size
  - `{{PAGE_RENDER_SERVICE}}` - page render service reference
  - `{{TOOLBAR}}` - existing toolbar system
  - `{{CONFIG}}` - scrollable viewer configuration

### 2.2 Port ScrollPOC Core Logic to Generic Templates

#### Configuration Management

- [x] `CONFIG` object → Template-driven configuration with placeholders
- [x] `MAX_CANVASES` → Configurable based on content size and memory limits
- [x] `TOTAL_PAGES` → From page render metadata
- [x] `SCALE`, `PAGE_GAP` → User preferences from global state
- [x] `RENDER_OPTIONS` → Page render configuration

#### Database State Management

- [x] `db` object → Local webview state management
- [x] `getCanvasId()`, `getPageId()` → ID generation utilities
- [x] Canvas-to-page assignment tracking with page render data
- [x] Placeholder DOM element management
- [x] Page render request queue management
- [x] Error state tracking for failed page renders

#### Canvas Pool Management

- [x] `getAllCanvasIds()` → Canvas enumeration
- [x] `getAllAvailableCanvasIds()` → Available canvas detection
- [x] `assignCanvasToPage()` → Canvas assignment logic with page render integration
- [x] `unassignCanvas()` → Canvas cleanup and DOM removal
- [x] `requestPageRender(pageNumber)` → Request page from PageRender service
- [x] `handlePageRenderResponse(pageData)` → Process rendered page data

#### Virtual Scrolling Core

- [x] `handleScroll()` → Scroll event handler with debouncing
- [x] `getScrollPosition()` → Viewport calculations
- [x] `getVisiblePageRange()` → Page visibility detection
- [x] Scroll direction tracking (`lastScrollTop`, `scrollDirection`)
- [x] Prefetch logic for upcoming pages based on scroll direction

#### Render Management

- [x] `renderPageToCanvas(pageData)` → Generic page rendering (not PDF-specific)
- [x] `assignCanvasesToPages()` → Batch canvas assignment with page render requests
- [x] `moveCanvasToPlaceholder()` → DOM manipulation
- [x] Render task cancellation and cleanup
- [x] Page render error handling and retry logic

#### Placeholder System

- [x] `createPlaceholders()` → DOM structure creation
- [x] Page label management with page numbers
- [x] Loading text display/hide logic
- [x] Page break visual elements
- [x] Error state display for failed page renders

### 2.3 Performance & Memory Management

- [ ] `logWithState()` → Diagnostic logging integration
- [ ] Canvas memory calculation and limits
- [ ] Emergency canvas freeing logic
- [ ] Render task prioritization based on scroll direction
- [ ] Page render request throttling and batching
- [ ] Memory usage monitoring and warnings

### 2.4 Message Handling for Page Rendering

- [ ] Add `requestPageRender` message type for page generation requests
- [ ] Add `pageRenderResponse` message type for rendered page data
- [ ] Add `pageRenderError` message type for render failures
- [ ] Add `scrollDiagnostic` message type for performance logging
- [ ] Handle page render service registration and updates

## Phase 3: UI.ts Scrollable Viewer Implementation

### 3.1 Create Scrollable Viewer Class

- [ ] Create `ScrollableViewer` class in UI.ts
- [ ] Add constructor that accepts PageRender implementation
- [ ] Add `createScrollableViewer(pageRender: PageRender, options: ScrollOptions)` method
- [ ] Add `updatePageRender(newPageRender: PageRender)` method for service updates
- [ ] Add `destroyScrollableViewer()` method for cleanup

### 3.2 Implement PageRender Integration

- [ ] Add `registerPageRender(pageRender: PageRender)` method
- [ ] Add `requestPageRender(pageNumber: number)` method
- [ ] Add `handlePageRenderResponse(pageData: PageData)` method
- [ ] Add `handlePageRenderError(error: Error, pageNumber: number)` method
- [ ] Add page render caching and invalidation logic

### 3.3 Update WebView Management

- [ ] Modify `htmlToWebViewPanel()` to support scrollable viewer mode
- [ ] Add `createScrollableWebViewPanel()` method
- [ ] Update `updatePdfContentOnly()` to work with scrollable viewer
- [ ] Ensure toolbar integration works with scrollable viewer
- [ ] Add scrollable viewer state management

### 3.4 Template Integration

- [ ] Add `loadScrollableTemplates()` method
- [ ] Add template replacement for scrollable viewer
- [ ] Add page render service injection into templates
- [ ] Add configuration injection into templates
- [ ] Ensure PDF.js library integration remains compatible

## Phase 4: PaperPrinter.ts Integration Updates

### 4.1 Add Scrollable Viewer Support

- [ ] Add `useScrollableViewer` preference to global state
- [ ] Add `maxCanvasPoolSize` preference to global state
- [ ] Add `scrollPerformanceMode` preference to global state
- [ ] Add automatic detection for when to use scrollable viewer
- [ ] Add manual toggle for scrollable vs single-page mode

### 4.2 Update Print Workflow

- [ ] Modify `applyRenderModes()` to support scrollable viewer
- [ ] Update `openPrintPrepAndPrompt()` to choose viewer type
- [ ] Add page count information to menu system
- [ ] Ensure theme/font/page size changes work with scrollable viewer
- [ ] Add scrollable viewer performance diagnostics

### 4.3 Menu System Updates

- [ ] Add scrollable viewer toggle to print options menu
- [ ] Add page count display in toolbar
- [ ] Add canvas pool size indicator
- [ ] Add scroll performance mode selector
- [ ] Add memory usage indicator for large documents

## Phase 5: Configuration & Settings Management

### 5.1 Global Settings

- [ ] Add scrollable viewer settings to global state:
  - `scrollableViewerEnabled: boolean` (default: true)
  - `maxCanvasPoolSize: number` (default: 7)
  - `scrollPerformanceMode: 'balanced' | 'memory' | 'speed'` (default: 'balanced')
  - `autoScrollableViewerThreshold: number` (default: 1000 lines)
  - `pageRenderCacheSize: number` (default: 10)
  - `scrollDebounceMs: number` (default: 16)

### 5.2 User Preferences

- [ ] Add scrollable viewer settings to VS Code settings
- [ ] Add UI for configuring scrollable viewer options
- [ ] Add reset to defaults functionality
- [ ] Add import/export of scrollable viewer settings

### 5.3 Performance Configuration

- [ ] Add memory limit warnings
- [ ] Add automatic canvas pool size adjustment
- [ ] Add scroll performance optimization
- [ ] Add page render request batching configuration

## Phase 6: Error Handling & Diagnostics

### 6.1 PageRender Error Handling

- [ ] Add comprehensive error handling for page generation failures
- [ ] Add retry logic for transient page render errors
- [ ] Add fallback to single-page mode on critical failures
- [ ] Add user notification for page render errors
- [ ] Add diagnostic logging for page render performance

### 6.2 Scrollable Viewer Error Handling

- [ ] Add error handling for canvas allocation failures
- [ ] Add error handling for DOM manipulation failures
- [ ] Add error handling for scroll event processing
- [ ] Add graceful degradation for memory pressure
- [ ] Add recovery mechanisms for corrupted state

### 6.3 Diagnostic System

- [ ] Add scrollable viewer performance metrics
- [ ] Add page render timing diagnostics
- [ ] Add memory usage tracking
- [ ] Add scroll performance analysis
- [ ] Add user-accessible diagnostic information

## Phase 7: Testing & Optimization

### 7.1 Unit Testing

- [ ] Test PageRender interface implementation
- [ ] Test scrollable viewer canvas management
- [ ] Test page render request/response cycle
- [ ] Test error handling and recovery
- [ ] Test configuration management

### 7.2 Integration Testing

- [ ] Test PDF.ts PageRender implementation
- [ ] Test UI.ts scrollable viewer integration
- [ ] Test PaperPrinter.ts workflow integration
- [ ] Test message passing between components
- [ ] Test toolbar integration with scrollable viewer

### 7.3 Performance Testing

- [ ] Test with various file sizes (100 lines, 1000 lines, 5000+ lines)
- [ ] Memory usage validation and optimization
- [ ] Scroll performance benchmarking
- [ ] Canvas pool size optimization
- [ ] Page render caching effectiveness

### 7.4 Cross-Platform Testing

- [ ] Verify PDF.js compatibility across different webview environments
- [ ] Test canvas rendering performance on different hardware
- [ ] Validate memory limits and emergency cleanup
- [ ] Test scrollable viewer on different operating systems

### 7.5 User Experience Testing

- [ ] Theme switching with scrollable viewer
- [ ] Font size changes with large documents
- [ ] Page size/orientation changes
- [ ] Print functionality with scrollable viewer
- [ ] Performance with very large documents (10k+ lines)

## Phase 8: Backward Compatibility & Migration

### 8.1 Single-Page Mode Preservation

- [ ] Ensure existing single-page workflows continue working
- [ ] Add feature flag for scrollable viewer
- [ ] Add automatic detection for multi-page content
- [ ] Add graceful fallback to single-page for small content
- [ ] Maintain existing API compatibility

### 8.2 Migration Strategy

- [ ] Add migration path for existing configurations
- [ ] Add user notification for new scrollable viewer feature
- [ ] Add opt-in/opt-out mechanisms
- [ ] Add performance comparison tools
- [ ] Add user preference migration

## Key Implementation Notes

### Generic Scrollable Viewer Pattern

**UI.ts Responsibilities:**

- Generic scrollable content viewer
- Canvas pool management and DOM manipulation
- Scroll handling and viewport calculations
- Page render service integration
- Message handling and state management

**PDF.ts Responsibilities:**

- PageRender interface implementation
- Page-specific PDF generation
- Token-to-PDF conversion for individual pages
- PDF metadata calculation and caching
- Error handling for page generation

**Communication Flow:**

1. UI.ts creates scrollable webview with `scroll_*` templates
2. Webview requests pages via `vscode.postMessage({ type: 'requestPageRender', pageNumber })`
3. UI.ts receives message, calls `pageRender.pageRender(pageNumber, options)`
4. PDF.ts generates single-page PDF, returns PageData
5. UI.ts sends PageData back to webview for canvas rendering

### Template Organization

- **UI.yaml**: Contains `scroll_html`, `scroll_css`, `scroll_js` templates
- **Generic naming**: Templates work with any PageRender implementation
- **Interface-driven**: PDF.ts implements PageRender contract
- **Extensible**: Other content types can implement PageRender interface

### Performance Considerations

- **Lazy loading**: Pages generated on-demand as user scrolls
- **Memory efficient**: Only active pages in memory
- **Canvas pooling**: Reuse canvas elements for performance
- **Request batching**: Batch page render requests for efficiency
- **Caching**: Cache rendered pages for quick access
