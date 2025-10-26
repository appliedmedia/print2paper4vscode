# Full Render with PDF.js Plan

## Overview

This document outlines a step-by-step plan to simplify the current complex page buffer system by passing the entire PDF document to PDF.js and letting it handle all rendering internally. This approach eliminates the need for individual page rendering, caching, and canvas pooling.

**Architectural Constraint**: This plan maintains the single rendering method principle from AGENTS.md. We continue to use line-by-line rendering everywhere for PDF generation. The chunking strategy only changes PDF delivery to the webview, not the underlying rendering method. The extension still generates the complete PDF using `renderByLine()` before sending it in chunks to PDF.js.

## Current System Analysis

### Current Architecture
- **PDF Generation**: jsPDF creates complete multi-page PDF in memory
- **Page Extraction**: `PDF.renderContent()` returns entire PDF as data URL for each page request
- **Webview Rendering**: Complex canvas pooling system with 6 canvas buffers
- **Page Management**: Virtual scrolling with individual page requests and caching
- **State Management**: Complex database tracking canvas assignments and page states

### Current Pain Points
1. **Over-engineering**: 6 canvas buffers for virtual scrolling when PDF.js can handle this
2. **Redundant Rendering**: Each page request returns the same full PDF data URL
3. **Complex State**: Canvas assignment, page caching, render queues
4. **Performance Overhead**: Multiple PDF.js document loads and page extractions
5. **Memory Usage**: Caching individual page data when we have the full PDF

## Proposed Simplified Architecture

### New Architecture - Single Line-by-Line Rendering System
- **PDF Generation**: jsPDF creates complete multi-page PDF (unchanged)
- **Line-by-Line Rendering**: Maintain existing `renderByLine()` as single rendering method
- **Custom Chunk Provider**: Extension serves PDF chunks via message handling
- **PDF.js Streaming**: PDF.js handles all rendering with our custom transport
- **No Fallbacks**: One rendering system for all document sizes
- **Consolidated Rendering**: Remove `renderContent()` and PageRender interface

## Migration Checklist

### PageRender Interface Dependencies
- [ ] **UIScrollView.ts**: `renderContent()` calls (line 189)
- [ ] **UIWebView.ts**: PageRender interface usage (lines 180-185)
- [ ] **PaperPrinter.ts**: PageRender interface usage (lines 180-185)
- [ ] **PDF.ts**: `renderContent()` method implementation (line 459)

### Migration Order (Critical)
1. **First**: Create new UIPDFScrollView with PDF.js streaming
2. **Second**: Update UIWebView to use UIPDFScrollView
3. **Third**: Update PaperPrinter to use UIPDFScrollView
4. **Fourth**: Remove PageRender interface and `renderContent()` method
5. **Fifth**: Remove old UIScrollView completely

### Breaking Change Prevention
- **DO NOT** remove `renderContent()` until all callers are updated
- **DO NOT** remove PageRender interface until all users are migrated
- **DO NOT** remove UIScrollView until UIPDFScrollView is fully working
- **DO** maintain working system throughout migration

## Refactor Steps (In Order)

### Phase 1: Foundation Changes

#### Step 1: Create New PDF.js Full Document Handler
- **File**: `src/UIPDFScrollView.ts` (new file)
- **Purpose**: Simplified webview that accepts full PDF and lets PDF.js handle everything
- **Key Features**:
  - Accept single PDF data URL
  - Use PDF.js native viewer capabilities
  - Minimal state management
  - Simple scroll handling

#### Step 2: Consolidate PDF.ts Rendering Methods
- **File**: `src/PDF.ts`
- **Changes**:
  - Keep existing `renderByLine()` as single rendering method
  - Add `pdfDataUrl` property that returns complete PDF as data URL
  - Add `pageTotal` property for total pages
  - Add `pageSizePx` property for page dimensions in CSS pixels
  - **DO NOT REMOVE** `renderContent()` yet - wait for migration checklist

#### Step 3: Create Migration Checklist
- **File**: `src/types/PageRender_t.ts`
- **Changes**:
  - **DO NOT REMOVE** PageRender interface yet
  - Create migration checklist for all PageRender usages
  - Track all callers of `renderContent()` method
  - Document replacement steps before removal

### Phase 2: Webview Implementation

#### Step 4: Create Full Document YAML Templates
- **File**: `src/UIPDFScrollView.yaml` (new file)
- **Purpose**: Simplified HTML/CSS/JS templates for full PDF display
- **Key Features**:
  - Single PDF.js document load
  - Native PDF.js page navigation
  - Minimal custom JavaScript
  - Clean, simple UI

#### Step 5: Implement Full Document Scroll View
- **File**: `src/UIPDFScrollView.ts`
- **Key Properties**:
  - `pdfDataUrl: string` - Direct PDF data URL
  - `pageTotal: number` - Total pages from PDF.js
  - `pageSizePx: {widthPx: number, heightPx: number}` - Page dimensions in CSS pixels (for webview)
- **Key Methods**:
  - `generateContent()`: Create HTML with full PDF
  - `updatePdf()`: Replace PDF document
  - No canvas pooling, no page caching, no complex state

#### Step 6: Update UIWebView to Use New System (After UIPDFScrollView is Ready)
- **File**: `src/UIWebView.ts`
- **Changes**:
  - Replace `UIScrollView` with `UIPDFScrollView`
  - Pass PDF data directly instead of PageRender interface
  - Simplify `createPanel()` method
  - Remove complex page render request handling
  - **CRITICAL**: Only do this after UIPDFScrollView is fully working

### Phase 3: Integration and Testing

#### Step 7: Update PaperPrinter to Use New System (After UIWebView is Updated)
- **File**: `src/PaperPrinter.ts`
- **Changes**:
  - Update `openWebView()` to pass PDF data directly to UIPDFScrollView
  - Remove PageRender interface usage
  - Simplify PDF generation workflow
  - **CRITICAL**: Only do this after UIWebView is updated and working

#### Step 8: Implement PDF Chunk Provider
- **File**: `src/PDF.ts`
- **Changes**:
  - Add `pdfDataUrl` property that returns complete PDF as data URL
  - Add `pageTotal` property for total pages
  - Add `pageSizePx` property for page dimensions in CSS pixels (converted from PDF points)
  - Implement custom `PDFDataRangeTransport` for chunk serving
  - Add message handlers for chunk requests from webview
  - Remove PageRender interface implementation

#### Step 9: Implement Chunk Request Handling
- **File**: `src/UIWebView.ts`
- **Changes**:
  - Add message handler for `requestPdfChunk` from webview
  - Implement `requestPdfChunk()` method that extracts byte ranges from PDF
  - Add message handler for `receivePdfChunk` to webview  
  - Implement `receivePdfChunk()` method for interface consistency
  - Remove complex page render request handling
  - Simplify message routing

### Phase 4: Optimization and Cleanup

#### Step 10: Implement Custom PDFDataRangeTransport
- **File**: `src/UIPDFScrollView.ts`
- **Changes**:
  - Implement custom `PDFDataRangeTransport` that uses message-based chunking
  - Handle chunk requests via webview messages
  - Integrate with PDF.js streaming API
  - Add error handling for out-of-memory conditions

#### Step 11: Performance Testing
- **Test Cases**:
  - Small documents (1-10 pages) - verify streaming works
  - Large documents (50+ pages) - verify chunking efficiency
  - Very large documents (200+ pages) - verify error handling
  - Theme switching performance - verify chunk regeneration
  - Font size changes - verify chunk regeneration
  - Scroll performance - verify on-demand loading

#### Step 12: Remove Old System (After All Migration is Complete)
- **Files to Remove/Simplify**:
  - `src/UIScrollView.ts` (replace with UIPDFScrollView)
  - `src/UIScrollView.yaml` (replace with UIPDFScrollView.yaml)
  - `src/types/PageRender_t.ts` (remove PageRender interface)
  - Complex canvas pooling logic
  - Page caching system
  - Individual page render requests
  - `renderContent()` method from PDF.ts
- **CRITICAL**: Only do this after all migration steps are complete and tested

#### Step 13: Update Documentation
- **Files**:
  - `AGENTS.md` - Update architecture documentation
  - `README.md` - Update user documentation
  - Remove references to page buffer system

## Implementation Details

### New UIPDFScrollView.ts Structure
```typescript
export class UIPDFScrollView {
  private app: App;
  public pdfDataUrl: string;
  public pageTotal: number;
  public pageSizePx: { widthPx: number; heightPx: number }; // CSS pixels for webview
  private customTransport: CustomPDFDataRangeTransport | null = null;
  
  constructor(app: App, pdfDataUrl: string, pageTotal: number, pageSizePx: { widthPx: number; heightPx: number }) {
    this.app = app;
    this.pdfDataUrl = pdfDataUrl;
    this.pageTotal = pageTotal;
    this.pageSizePx = pageSizePx; // Already converted from PDF points to CSS pixels
  }
  
  init(): void {
    // Initialize custom transport
    this.customTransport = new CustomPDFDataRangeTransport(this.app);
    this.customTransport.init();
  }
  
  done(): void {
    // Clean up custom transport
    if (this.customTransport) {
      this.customTransport.done();
      this.customTransport = null;
    }
  }
  
  async generateContent(): Promise<string> {
    // Simple HTML with PDF.js viewer
  }
  
  async updatePdf(newPdfDataUrl: string): Promise<void> {
    // Update PDF and refresh viewer
  }
  
  // Minimal state management
}
```

### Unified Streaming Implementation
```typescript
export class UIPDFScrollView {
  private app: App;
  public pdfDataUrl: string;
  public pageTotal: number;
  public pageSizePx: { widthPx: number; heightPx: number };
  private customTransport: CustomPDFDataRangeTransport | null = null;
  
  constructor(app: App, pdfDataUrl: string, pageTotal: number, pageSizePx: { widthPx: number; heightPx: number }) {
    this.app = app;
    this.pdfDataUrl = pdfDataUrl;
    this.pageTotal = pageTotal;
    this.pageSizePx = pageSizePx;
  }
  
  init(): void {
    // Initialize custom transport
    this.customTransport = new CustomPDFDataRangeTransport(this.app);
    this.customTransport.init();
  }
  
  done(): void {
    // Clean up custom transport
    if (this.customTransport) {
      this.customTransport.done();
      this.customTransport = null;
    }
  }
  
  async generateContent(): Promise<string> {
    // Always use PDF.js streaming with custom chunk provider
    // No memory checks, no fallbacks, no dual systems
    // Catch out-of-memory errors and report to user
    return this.generateStreamingContent();
  }
}
```


#### Custom PDFDataRangeTransport Implementation
```typescript
// Extension side - PDF.ts
class CustomPDFDataRangeTransport {
  private app: App;
  private pdfArrayBuffer: ArrayBuffer;
  private webviewPanelId: string;
  private pendingRequests: Map<string, { resolve: (chunk: ArrayBuffer) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }> = new Map();
  private static readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds
  
  constructor(app: App, pdfArrayBuffer: ArrayBuffer, webviewPanelId: string) {
    this.app = app;
    this.pdfArrayBuffer = pdfArrayBuffer;
    this.webviewPanelId = webviewPanelId;
  }
  
  init(): void {
    // Register message handler for chunk requests
    this.app.ui.registerMessageHandler('requestPdfChunk', this.handleChunkRequest.bind(this));
  }
  
  done(): void {
    // Clean up all pending requests
    for (const [key, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Transport disposed'));
    }
    this.pendingRequests.clear();
    
    // Unregister message handler
    this.app.ui.unregisterMessageHandler('requestPdfChunk', this.handleChunkRequest.bind(this));
  }
  
  private async handleChunkRequest(msg: PostMessage): Promise<void> {
    const { begin, end, requestId } = msg;
    
    try {
      // Validate range
      if (typeof begin !== 'number' || typeof end !== 'number' || begin < 0 || end <= begin || end > this.pdfArrayBuffer.byteLength) {
        await this.sendChunkResponse(requestId, begin, end, null, `Invalid range: ${begin}-${end}, buffer length: ${this.pdfArrayBuffer.byteLength}`);
        return;
      }
      
      // Extract chunk from PDF ArrayBuffer
      const chunk = this.pdfArrayBuffer.slice(begin, end);
      
      // Send success response
      await this.sendChunkResponse(requestId, begin, end, chunk, null);
      
    } catch (error) {
      // Send error response
      await this.sendChunkResponse(requestId, begin, end, null, `Chunk extraction failed: ${error.message}`);
    }
  }
  
  private async sendChunkResponse(requestId: string, begin: number, end: number, chunk: ArrayBuffer | null, error: string | null): Promise<void> {
    this.app.vscodeapis.postMessage(this.webviewPanelId, {
      type: 'receivePdfChunk',
      requestId: requestId,
      begin: begin,
      end: end,
      chunk: chunk,
      error: error,
      success: error === null
    });
  }
  
  requestPdfChunk(begin: number, end: number): Promise<ArrayBuffer> {
    // This method exists for interface consistency but is not used on extension side
    return Promise.reject(new Error('requestPdfChunk not implemented on extension side'));
  }
  
  receivePdfChunk(begin: number, end: number, chunk: ArrayBuffer): void {
    // Extension doesn't receive chunks, only sends them
    // This method exists for interface consistency
  }
}

// Webview side - UIPDFScrollView.ts
class CustomPDFDataRangeTransport {
  private app: App;
  private chunks: Map<string, ArrayBuffer> = new Map();
  private pendingRequests: Map<string, { resolve: (chunk: ArrayBuffer) => void; reject: (error: Error) => void; timeout: number }> = new Map();
  private requestIdCounter: number = 0;
  private static readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds
  
  constructor(app: App) {
    this.app = app;
  }
  
  init(): void {
    // Register message handler for chunk responses
    this.app.ui.registerMessageHandler('receivePdfChunk', this.handleChunkResponse.bind(this));
  }
  
  done(): void {
    // Clean up all pending requests
    for (const [key, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Transport disposed'));
    }
    this.pendingRequests.clear();
    this.chunks.clear();
    
    // Unregister message handler
    this.app.ui.unregisterMessageHandler('receivePdfChunk', this.handleChunkResponse.bind(this));
  }
  
  requestPdfChunk(begin: number, end: number): Promise<ArrayBuffer> {
    const key = `${begin}-${end}`;
    
    if (this.chunks.has(key)) {
      // Chunk already loaded
      return Promise.resolve(this.chunks.get(key)!);
    }
    
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return Promise.reject(new Error(`Request already pending for range ${begin}-${end}`));
    }
    
    // Generate unique request ID
    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;
    
    // Request chunk from extension
    this.app.vscodeapis.postMessage({
      type: 'requestPdfChunk',
      begin: begin,
      end: end,
      requestId: requestId
    });
    
    // Return promise that resolves when chunk arrives
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(key);
        reject(new Error(`Request timeout for range ${begin}-${end}`));
      }, CustomPDFDataRangeTransport.REQUEST_TIMEOUT_MS);
      
      this.pendingRequests.set(key, { resolve, reject, timeout });
    });
  }
  
  private handleChunkResponse(msg: PostMessage): void {
    const { requestId, begin, end, chunk, error, success } = msg;
    const key = `${begin}-${end}`;
    
    const request = this.pendingRequests.get(key);
    if (!request) {
      // Request not found (may have timed out)
      return;
    }
    
    // Clear timeout
    clearTimeout(request.timeout);
    this.pendingRequests.delete(key);
    
    if (success && chunk) {
      // Cache the chunk
      this.chunks.set(key, chunk);
      request.resolve(chunk);
    } else {
      // Handle error
      request.reject(new Error(error || 'Unknown error'));
    }
  }
  
  receivePdfChunk(begin: number, end: number, chunk: ArrayBuffer): void {
    // This method is not used on webview side - responses come via message handler
    // This method exists for interface consistency
  }
}

// Usage in webview
const customTransport = new CustomPDFDataRangeTransport(this.app);
customTransport.init();

const loadingTask = pdfjsLib.getDocument({
  range: customTransport,
  rangeChunkSize: 32768  // 32KB chunks
});

// Clean up when done
customTransport.done();
```

### New YAML Template Structure
```yaml
scroll_html: |
  <!DOCTYPE html>
  <html>
  <head>
    <script>{{pdfjsLibrary}}</script>
  </head>
  <body>
    <div id="pdf-viewer">
      <canvas id="pdf-canvas"></canvas>
    </div>
    <script>{{scrollJs}}</script>
  </body>
  </html>

scroll_js: |
  // Simple PDF.js implementation
  // Load full PDF once
  // Handle page navigation natively
  // Minimal custom logic
```

### Benefits of New Approach
1. **Simplified Code**: ~70% reduction in webview JavaScript code
2. **Better Performance**: PDF.js handles optimization internally
3. **Reduced Memory**: Single PDF document instead of cached pages
4. **Easier Maintenance**: Less complex state management
5. **Native Features**: PDF.js provides zoom, search, etc. for free

## Unified Streaming Architecture

### Single Rendering Mode - No Fallbacks
- **PDF.js Streaming**: Always use PDF.js with custom chunk provider
- **Extension Chunk Server**: Extension serves PDF chunks via message handling
- **No Size Limits**: Works for any size document - small or massive
- **No Fallback Modes**: One consistent approach for all documents
- **No Memory-Based Fallbacks**: Catch OOM errors and report to user
- **No Dual Systems**: Remove old UIScrollView completely

### How It Works
1. **PDF Generation**: Extension generates complete PDF in memory using line-by-line rendering (jsPDF + `renderByLine()`)
2. **Complete PDF Ready**: Full PDF document is created before any chunking begins
3. **Chunk Provider**: Extension implements custom PDFDataRangeTransport to serve byte ranges
4. **Message-Based Chunks**: Webview requests specific byte ranges via messages
5. **PDF.js Streaming**: PDF.js handles all display rendering with our chunk provider
6. **Memory Efficient**: Only loads chunks as needed, frees unused chunks

**Key Point**: We render everything first using the single line-by-line method, then deliver it in chunks. No fallbacks, no dual rendering methods.

### Risks and Mitigation
1. **PDF.js Learning Curve**: Team needs to understand PDF.js API
   - *Mitigation*: Start with simple implementation, iterate
2. **Customization Limits**: Less control over rendering
   - *Mitigation*: PDF.js is highly customizable
3. **Browser Compatibility**: PDF.js has specific requirements
   - *Mitigation*: PDF.js is well-tested across browsers

## Testing Strategy

### Phase 1 Testing
- [ ] New UIPDFScrollView loads and displays PDF
- [ ] Page navigation works correctly
- [ ] Theme switching updates PDF
- [ ] Font size changes work

### Phase 2 Testing
- [ ] Large document performance (100+ pages)
- [ ] Memory usage comparison
- [ ] Scroll performance
- [ ] Print functionality

### Phase 3 Testing
- [ ] Side-by-side comparison with old system
- [ ] User experience testing
- [ ] Edge case handling

## No Rollback Plan - Unified Streaming Only

**One rendering system to rule them all.** 

- **No fallbacks** - PDF.js streaming handles all document sizes
- **No dual systems** - Single UIPDFScrollView for everything  
- **No memory checks** - Catch OOM errors and report to user
- **No chunked content generation** - Only unified streaming approach
- **No rollback options** - Commit to single system completely

PDF.js streaming with custom chunk provider handles all document sizes and use cases through one unified approach.

## Success Criteria

- [ ] 70% reduction in webview JavaScript code (single system vs dual system)
- [ ] Better performance than current system (PDF.js optimization)
- [ ] Simplified maintenance and debugging (one rendering path)
- [ ] All current features still work (PDF.js native features)
- [ ] Better user experience (faster, smoother, more features)
- [ ] **Zero fallback complexity** (single system for all document sizes)
- [ ] **Zero memory management complexity** (catch OOM errors and report to user)
- [ ] **Zero dual rendering modes** (one unified streaming approach)
- [ ] **Zero memory checks** (catch OOM errors and report to user)
- [ ] **Single rendering method maintained** (line-by-line rendering everywhere per AGENTS.md)
- [ ] **Render-first-then-chunk approach** (complete PDF generated before chunking begins)

## Timeline Estimate

- **Phase 1**: 2-3 days (foundation)
- **Phase 2**: 3-4 days (webview implementation)
- **Phase 3**: 2-3 days (integration)
- **Phase 4**: 2-3 days (optimization)
- **Total**: 9-13 days

## Next Steps

1. Start with Step 1: Create `UIPDFScrollView.ts` skeleton
2. Implement basic PDF.js integration
3. Test with simple PDF documents
4. Iterate and improve based on results
5. Replace old system completely - no gradual migration needed