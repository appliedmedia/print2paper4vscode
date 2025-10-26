# Full Render with PDF.js Plan

## Overview

This document outlines a step-by-step plan to simplify the current complex page buffer system by passing the entire PDF document to PDF.js and letting it handle all rendering internally. This approach eliminates the need for individual page rendering, caching, and canvas pooling.

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

### New Architecture
- **PDF Generation**: jsPDF creates complete multi-page PDF (unchanged)
- **Single PDF Pass**: Pass entire PDF data URL to webview once
- **PDF.js Native Rendering**: Let PDF.js handle all page rendering and virtual scrolling
- **Simplified State**: Minimal state management, PDF.js handles the rest

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

#### Step 2: Update PDF.ts to Support Full Document Mode
- **File**: `src/PDF.ts`
- **Changes**:
  - Add `pdfDataUrl()` method that returns complete PDF as data URL
  - Remove existing `renderContent()` method (no longer needed)
  - Simplify to full-document mode only

#### Step 3: Remove PageRender Interface Dependency
- **File**: `src/types/PageRender_t.ts`
- **Changes**:
  - Remove `PageRender` interface entirely
  - Use direct class variables instead of interface methods
  - Simplify to direct property access

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

#### Step 6: Update UIWebView to Use New System
- **File**: `src/UIWebView.ts`
- **Changes**:
  - Replace `UIScrollView` with `UIPDFScrollView`
  - Pass PDF data directly instead of PageRender interface
  - Simplify `createPanel()` method
  - Remove complex page render request handling

### Phase 3: Integration and Testing

#### Step 7: Update PaperPrinter to Use New System
- **File**: `src/PaperPrinter.ts`
- **Changes**:
  - Update `openWebView()` to pass PDF data directly to UIPDFScrollView
  - Remove PageRender interface usage
  - Simplify PDF generation workflow

#### Step 8: Simplify PDF Class
- **File**: `src/PDF.ts`
- **Changes**:
  - Add `pdfDataUrl` property that returns complete PDF as data URL
  - Add `pageTotal` property for total pages
  - Add `pageSizePx` property for page dimensions in CSS pixels (converted from PDF points)
  - Remove PageRender interface implementation
  - Keep existing `coords.pdfPtsToCssPx()` conversion for UI display

#### Step 9: Update Message Handling
- **File**: `src/UIWebView.ts`
- **Changes**:
  - Remove complex page render request handling
  - Add simple PDF update message handling
  - Simplify message routing

### Phase 4: Optimization and Cleanup

#### Step 10: Implement Memory Management
- **File**: `src/UIPDFScrollView.ts`
- **Changes**:
  - Add memory monitoring for PDF data URL size
  - Implement chunked loading for large PDFs
  - Add fallback to page-by-page rendering for very large documents
  - Add user warnings for memory-intensive operations

#### Step 11: Performance Testing
- **Test Cases**:
  - Large documents (50+ pages)
  - Very large documents (200+ pages)
  - Memory usage monitoring
  - Theme switching performance
  - Font size changes
  - Scroll performance

#### Step 12: Remove Old System
- **Files to Remove/Simplify**:
  - `src/UIScrollView.ts` (replace with UIPDFScrollView)
  - `src/UIScrollView.yaml` (replace with UIPDFScrollView.yaml)
  - `src/types/PageRender_t.ts` (remove PageRender interface)
  - Complex canvas pooling logic
  - Page caching system
  - Individual page render requests
  - `renderContent()` method from PDF.ts

#### Step 13: Update Documentation
- **Files**:
  - `AGENTS.md` - Update architecture documentation
  - `README.md` - Update user documentation
  - Remove references to page buffer system

## Implementation Details

### New UIPDFScrollView.ts Structure
```typescript
export class UIPDFScrollView {
  public pdfDataUrl: string;
  public pageTotal: number;
  public pageSizePx: { widthPx: number; heightPx: number }; // CSS pixels for webview
  
  constructor(pdfDataUrl: string, pageTotal: number, pageSizePx: { widthPx: number; heightPx: number }) {
    this.pdfDataUrl = pdfDataUrl;
    this.pageTotal = pageTotal;
    this.pageSizePx = pageSizePx; // Already converted from PDF points to CSS pixels
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

### Memory Management Implementation

#### Memory Detection
```typescript
export class UIPDFScrollView {
  private static readonly MEMORY_LIMITS = {
    PDF_SIZE_MB: 50,        // 50MB PDF data URL limit
    PAGE_COUNT_LIMIT: 100,  // 100 pages limit for full rendering
    MEMORY_WARNING_MB: 25   // Warn at 25MB
  };

  private checkMemoryLimits(pdfDataUrl: string, pageCount: number): MemoryStatus {
    const pdfSizeMB = this.estimateDataUrlSize(pdfDataUrl);
    
    if (pdfSizeMB > this.MEMORY_LIMITS.PDF_SIZE_MB || pageCount > this.MEMORY_LIMITS.PAGE_COUNT_LIMIT) {
      return { status: 'exceeded', sizeMB: pdfSizeMB, pageCount };
    }
    
    if (pdfSizeMB > this.MEMORY_LIMITS.MEMORY_WARNING_MB) {
      return { status: 'warning', sizeMB: pdfSizeMB, pageCount };
    }
    
    return { status: 'ok', sizeMB: pdfSizeMB, pageCount };
  }

  private estimateDataUrlSize(dataUrl: string): number {
    // Estimate size: dataUrl length * 0.75 (base64 encoding overhead)
    return (dataUrl.length * 0.75) / (1024 * 1024);
  }
}
```

#### Fallback Strategy
```typescript
async generateContent(): Promise<string> {
  const memoryStatus = this.checkMemoryLimits(this.pdfDataUrl, this.pageTotal);
  
  switch (memoryStatus.status) {
    case 'exceeded':
      // Fall back to page-by-page rendering for very large documents
      return this.generateChunkedContent();
    case 'warning':
      // Show warning but proceed with full PDF
      this.showMemoryWarning(memoryStatus);
      return this.generateFullContent();
    case 'ok':
    default:
      return this.generateFullContent();
  }
}
```

#### Chunked Loading Implementation
```typescript
private async generateChunkedContent(): Promise<string> {
  // PDF.js handles chunking automatically for data URLs
  // No temp files needed - all in-memory streaming
  // Use PDF.js rangeChunkSize for memory control
  const loadingTask = pdfjsLib.getDocument({
    data: this.pdfDataUrl,
    rangeChunkSize: 32768,  // 32KB chunks for memory control
    disableAutoFetch: false,
    disableStream: false
  });
  
  // PDF.js will automatically:
  // - Load PDF in chunks
  // - Render pages on-demand
  // - Free memory for unused pages
  // - Handle progressive loading
}
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

## Memory Management Strategy

### Memory Detection
- **PDF Size Monitoring**: Track PDF data URL size before passing to webview
- **Browser Memory Limits**: Monitor webview memory usage
- **Page Count Thresholds**: Set limits based on page count and content density

### Memory Mitigation Options
1. **PDF.js Chunked Loading**: Use `rangeChunkSize` to control memory usage (32KB chunks)
2. **Progressive Rendering**: PDF.js automatically renders pages on-demand as user scrolls
3. **Memory Cleanup**: PDF.js automatically frees memory for pages that scroll out of view
4. **Fallback Mode**: Switch to current page-by-page rendering for extremely large documents
5. **User Warnings**: Alert users about memory usage for large documents
6. **No Temp Files**: PDF.js handles everything in-memory with streaming - no disk storage needed

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

## Rollback Plan

If the new system doesn't work well:
1. Keep both systems available via configuration
2. Default to old system until new system is proven
3. Gradual migration with A/B testing
4. Easy switch back via menu option

## Success Criteria

- [ ] 50% reduction in webview JavaScript code
- [ ] Equal or better performance than current system
- [ ] Simplified maintenance and debugging
- [ ] All current features still work
- [ ] Better user experience (faster, smoother)

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
5. Gradually replace old system once new system is proven