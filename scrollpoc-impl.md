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
  pageTotal: number;
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

- [x] `logWithState()` → Diagnostic logging integration
- [x] Canvas memory calculation and limits
- [x] Emergency canvas freeing logic
- [x] Render task prioritization based on scroll direction
- [x] Page render request throttling and batching
- [x] Memory usage monitoring and warnings

### 2.4 Message Handling for Page Rendering

- [x] Add `requestPageRender` message type for page generation requests
- [x] Add `pageRenderResponse` message type for rendered page data
- [x] Add `pageRenderError` message type for render failures
- [x] Add `scrollDiagnostic` message type for performance logging
- [x] Handle page render service registration and updates

## Phase 3: UI.ts Scrollable Viewer Implementation

### 3.1 Create Scrollable Viewer Class

- [x] Create `UIScrollView` class in separate file (refactored from UI.ts)
- [x] Add constructor that accepts PageRender implementation
- [x] Add `create()` method for webview panel creation
- [x] Add `updatePageRender(newPageRender: PageRender)` method for service updates
- [x] Add `destroy()` method for cleanup

### 3.2 Implement PageRender Integration

- [x] Add `requestPageRender(pageNumber: number)` method
- [x] Add `handlePageRenderResponse(pageData: PageData)` method
- [x] Add `handlePageRenderError(error: Error, pageNumber: number)` method
- [x] Add page render caching and invalidation logic

### 3.3 Update WebView Management

- [x] Create `UIWebView` class to orchestrate scrollable viewer
- [x] Add `init()` method for webview panel creation with all dependencies
- [x] Update `updateOptions()` to work with scrollable viewer
- [x] Ensure toolbar integration works with scrollable viewer
- [x] Add scrollable viewer state management

### 3.4 Template Integration

- [x] Add `loadScrollViewTemplates()` method
- [x] Add template replacement for scrollable viewer
- [x] Add page render service injection into templates
- [x] Add configuration injection into templates
- [x] Ensure PDF.js library integration remains compatible

## Phase 4: PaperPrinter.ts Integration Updates

### 4.1 Add Scrollable Viewer Support

- [x] Add `scrollableViewerEnabled` preference to global state
- [x] Add `maxCanvasPoolSize` preference to global state
- [x] Add `scrollPerformanceMode` preference to global state
- [x] Add automatic detection for when to use scrollable viewer
- [x] Add manual toggle for scrollable vs single-page mode

### 4.2 Update Print Workflow

- [x] Modify `openPrintPrepAndPrompt()` to always use scrollable viewer
- [x] Update `openWebView()` to create UIWebView with all dependencies
- [x] Add page count information to menu system
- [x] Ensure theme/font/page size changes work with scrollable viewer
- [x] Add scrollable viewer performance diagnostics

### 4.3 Menu System Updates

- [x] Add scrollable viewer toggle to print options menu
- [x] Add page count display in toolbar
- [x] Add canvas pool size indicator
- [x] Add scroll performance mode selector
- [x] Add memory usage indicator for large documents

## Phase 5: Configuration & Settings Management

### 5.1 Global Settings

- [x] Add scrollable viewer settings to global state:
  - `scrollableViewerEnabled: boolean` (default: true)
  - `maxCanvasPoolSize: number` (default: 7)
  - `scrollPerformanceMode: 'balanced' | 'memory' | 'speed'` (default: 'balanced')
  - `autoScrollableViewerThreshold: number` (default: 1000 lines)
  - `pageRenderCacheSize: number` (default: 10)
  - `scrollDebounceMs: number` (default: 16)

### 5.2 User Preferences

- [x] Add scrollable viewer settings to VS Code settings
- [x] Add UI for configuring scrollable viewer options
- [x] Add reset to defaults functionality
- [x] Add import/export of scrollable viewer settings

### 5.3 Performance Configuration

- [x] Add memory limit warnings
- [x] Add automatic canvas pool size adjustment
- [x] Add scroll performance optimization
- [x] Add page render request batching configuration

## Phase 6: Error Handling & Diagnostics

### 6.1 PageRender Error Handling

- [x] Add comprehensive error handling for page generation failures
- [x] Add retry logic for transient page render errors
- [x] Add fallback to single-page mode on critical failures
- [x] Add user notification for page render errors
- [x] Add diagnostic logging for page render performance

### 6.2 Scrollable Viewer Error Handling

- [x] Add error handling for canvas allocation failures
- [x] Add error handling for DOM manipulation failures
- [x] Add error handling for scroll event processing
- [x] Add graceful degradation for memory pressure
- [x] Add recovery mechanisms for corrupted state

### 6.3 Diagnostic System

- [x] Add scrollable viewer performance metrics
- [x] Add page render timing diagnostics
- [x] Add memory usage tracking
- [x] Add scroll performance analysis
- [x] Add user-accessible diagnostic information

## Phase 7: Testing & Optimization

### 7.1 Unit Testing

- [x] Test PageRender interface implementation
- [x] Test scrollable viewer canvas management
- [x] Test page render request/response cycle
- [x] Test error handling and recovery
- [x] Test configuration management

### 7.2 Integration Testing

- [x] Test PDF.ts PageRender implementation
- [x] Test UIScrollView integration
- [x] Test PaperPrinter.ts workflow integration
- [x] Test message passing between components
- [x] Test toolbar integration with scrollable viewer

### 7.3 Performance Testing

- [x] Test with various file sizes (100 lines, 1000 lines, 5000+ lines)
- [x] Memory usage validation and optimization
- [x] Scroll performance benchmarking
- [x] Canvas pool size optimization
- [x] Page render caching effectiveness

### 7.4 Cross-Platform Testing

- [x] Verify PDF.js compatibility across different webview environments
- [x] Test canvas rendering performance on different hardware
- [x] Validate memory limits and emergency cleanup
- [x] Test scrollable viewer on different operating systems

### 7.5 User Experience Testing

- [x] Theme switching with scrollable viewer
- [x] Font size changes with large documents
- [x] Page size/orientation changes
- [x] Print functionality with scrollable viewer
- [x] Performance with very large documents (10k+ lines)

## Phase 8: Backward Compatibility & Migration

### 8.1 Single-Page Mode Preservation

- [x] Ensure existing single-page workflows continue working
- [x] Add feature flag for scrollable viewer
- [x] Add automatic detection for multi-page content
- [x] Add graceful fallback to single-page for small content
- [x] Maintain existing API compatibility

### 8.2 Migration Strategy

- [x] Add migration path for existing configurations
- [x] Add user notification for new scrollable viewer feature
- [x] Add opt-in/opt-out mechanisms
- [x] Add performance comparison tools
- [x] Add user preference migration

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
