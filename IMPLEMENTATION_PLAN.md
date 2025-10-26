# PDF.js Streaming Implementation Plan

## Overview

Implement unified PDF.js streaming architecture with custom chunk provider. Each stage must be fully tested and documented before proceeding to the next.

**Architectural Constraint**: This implementation maintains the single rendering method principle from AGENTS.md. We continue to use line-by-line rendering everywhere for PDF generation. The chunking strategy only changes PDF delivery to the webview, not the underlying rendering method. The extension still generates the complete PDF using `renderByLine()` before sending it in chunks to PDF.js.

---

## Stage 1: Foundation Setup

**Goal**: Create basic infrastructure and prove chunking works

**Critical**: This stage maintains the single line-by-line rendering method from AGENTS.md. We render the complete PDF first using `renderByLine()`, then deliver it in chunks. No changes to the core rendering logic.

### 1.1 Create UIPDFScrollView Skeleton

- [ ] Create `src/UIPDFScrollView.ts` with basic class structure
- [ ] Create `src/UIPDFScrollView.yaml` with minimal HTML template
- [ ] Add constructor that accepts `pdfDataUrl`, `pageTotal`, `pageSizePx`
- [ ] Add `generateContent()` method that returns basic HTML

**Test**:

- [ ] UIPDFScrollView can be instantiated
- [ ] `generateContent()` returns valid HTML
- [ ] HTML includes PDF.js library loading

**Documentation**:

- [ ] Document class interface
- [ ] Document constructor parameters
- [ ] Document expected HTML output

### 1.2 Implement Basic PDF.js Integration

- [ ] Add PDF.js document loading in `generateContent()`
- [ ] Use simple data URL approach (no chunking yet)
- [ ] Add basic error handling
- [ ] Add console logging for debugging

**Test**:

- [ ] PDF.js loads successfully
- [ ] PDF document loads from data URL
- [ ] Basic error handling works
- [ ] Console logs show expected flow

**Documentation**:

- [ ] Document PDF.js integration approach
- [ ] Document error handling strategy
- [ ] Document debugging approach

### 1.3 Create Custom PDFDataRangeTransport Skeleton

- [ ] Create `CustomPDFDataRangeTransport` class on both sides
- [ ] Add `requestPdfChunk()` and `receivePdfChunk()` methods
- [ ] Add message handling infrastructure
- [ ] Add basic logging

**Test**:

- [ ] Both classes can be instantiated
- [ ] Methods exist and can be called
- [ ] Message handling infrastructure works
- [ ] Logging shows expected output

**Documentation**:

- [ ] Document class interfaces
- [ ] Document message flow
- [ ] Document logging strategy

---

## Stage 2: Chunking Implementation

**Goal**: Implement working chunk-based PDF serving

### 2.1 Extension-Side Chunk Provider

- [ ] Implement `requestPdfChunk()` in extension
- [ ] Add PDF ArrayBuffer storage
- [ ] Add chunk extraction logic using `ArrayBuffer.slice()`
- [ ] Add message sending to webview
- [ ] Add error handling for invalid ranges

**Test**:

- [ ] Can extract chunks from PDF ArrayBuffer
- [ ] Chunks are correct size and content
- [ ] Messages are sent to webview
- [ ] Error handling works for invalid ranges
- [ ] Logging shows chunk extraction details

**Documentation**:

- [ ] Document chunk extraction algorithm
- [ ] Document error handling cases
- [ ] Document message format
- [ ] Document performance characteristics

### 2.2 Webview-Side Chunk Consumer

- [ ] Implement `requestPdfChunk()` in webview
- [ ] Add chunk caching with Map
- [ ] Add pending request tracking
- [ ] Add message sending to extension
- [ ] Add `receivePdfChunk()` to handle incoming chunks

**Test**:

- [ ] Can request chunks from extension
- [ ] Chunks are cached correctly
- [ ] Pending requests are tracked properly
- [ ] Incoming chunks are handled correctly
- [ ] Duplicate requests are handled efficiently

**Documentation**:

- [ ] Document caching strategy
- [ ] Document request tracking
- [ ] Document message handling
- [ ] Document performance optimizations

### 2.3 Message Handling Integration

- [ ] Add message handlers in `UIWebView.ts`
- [ ] Connect `requestPdfChunk` messages to extension logic
- [ ] Connect `receivePdfChunk` messages to webview logic
- [ ] Add message validation and error handling
- [ ] Add comprehensive logging

**Test**:

- [ ] Messages flow correctly between extension and webview
- [ ] Invalid messages are handled gracefully
- [ ] Error cases are logged appropriately
- [ ] Message flow is traceable in logs
- [ ] Performance is acceptable for small documents

**Documentation**:

- [ ] Document message protocol
- [ ] Document error handling
- [ ] Document debugging approach
- [ ] Document performance expectations

---

## Stage 3: PDF.js Integration

**Goal**: Integrate custom chunk provider with PDF.js streaming

### 3.1 PDF.js Streaming Integration

- [ ] Integrate `CustomPDFDataRangeTransport` with PDF.js
- [ ] Use `pdfjsLib.getDocument({ range: transport })`
- [ ] Configure appropriate `rangeChunkSize`
- [ ] Add PDF.js event handling
- [ ] Add progress tracking

**Test**:

- [ ] PDF.js loads document using custom transport
- [ ] Chunks are requested as expected
- [ ] PDF renders correctly
- [ ] Progress events fire appropriately
- [ ] Error handling works for PDF.js errors

**Documentation**:

- [ ] Document PDF.js integration approach
- [ ] Document chunk size configuration
- [ ] Document event handling
- [ ] Document error scenarios

### 3.2 Canvas Rendering

- [ ] Add canvas element to HTML template
- [ ] Implement page rendering to canvas
- [ ] Add viewport management
- [ ] Add zoom and scroll handling
- [ ] Add page navigation

**Test**:

- [ ] Pages render correctly on canvas
- [ ] Zoom functionality works
- [ ] Scroll functionality works
- [ ] Page navigation works
- [ ] Rendering performance is acceptable

**Documentation**:

- [ ] Document canvas rendering approach
- [ ] Document viewport management
- [ ] Document zoom/scroll implementation
- [ ] Document performance considerations

### 3.3 Error Handling and User Feedback

**Goal**: Catch out-of-memory errors and report them to users instead of trying to predict or prevent them

#### 3.3.1 Out-of-Memory Error Detection

**Owner**: TBD
**Config**: None (use browser error detection)

- [ ] Wrap PDF.js operations in try-catch blocks
- [ ] Detect "out of memory" errors from PDF.js
- [ ] Detect "out of memory" errors from browser
- [ ] Detect "out of memory" errors from extension
- [ ] Log all memory-related errors with context

**Test Plan**:

- [ ] Simulate memory pressure by loading very large PDFs
- [ ] Verify error detection works across different browsers
- [ ] Verify error detection works in extension context
- [ ] **Pass**: All memory errors are caught and logged
- [ ] **Fail**: Memory errors crash the application silently

#### 3.3.2 User Error Reporting

**Owner**: TBD
**Config**: None (use VS Code UI APIs)

- [ ] Show user-friendly error message when OOM occurs
- [ ] Include suggestion to try smaller document or restart VS Code
- [ ] Add "Retry" button for transient errors
- [ ] Add "Report Issue" button for persistent errors
- [ ] Log error details for debugging

**Test Plan**:

- [ ] Trigger OOM error in controlled environment
- [ ] Verify user sees helpful error message
- [ ] Verify retry functionality works
- [ ] **Pass**: User gets clear feedback and recovery options
- [ ] **Fail**: User sees technical error or no feedback

#### 3.3.3 Graceful Degradation

**Owner**: TBD
**Config**: None (use error-driven fallbacks)

- [ ] Clear all cached chunks when OOM occurs
- [ ] Reset PDF.js document state
- [ ] Allow user to try again with clean state
- [ ] Prevent cascading memory errors

**Test Plan**:

- [ ] Trigger OOM, verify cleanup occurs
- [ ] Verify user can retry after cleanup
- [ ] Verify no memory leaks after cleanup
- [ ] **Pass**: System recovers cleanly from OOM
- [ ] **Fail**: System remains in broken state after OOM

**Documentation**:

- [ ] Document error handling approach
- [ ] Document user-facing error messages
- [ ] Document recovery procedures
- [ ] Document debugging information

---

## Stage 4: Integration Testing

**Goal**: Test complete system with real documents

### 4.1 Small Document Testing

- [ ] Test with 1-5 page documents
- [ ] Test with different content types (code, text, mixed)
- [ ] Test with different themes
- [ ] Test with different font sizes
- [ ] Test theme switching
- [ ] Test font size changes

**Test**:

- [ ] All document types render correctly
- [ ] Theme switching works without errors
- [ ] Font size changes work correctly
- [ ] Performance is acceptable
- [ ] Memory usage is reasonable
- [ ] No memory leaks detected

**Documentation**:

- [ ] Document supported document types
- [ ] Document theme switching behavior
- [ ] Document font size behavior
- [ ] Document performance characteristics
- [ ] Document known limitations

### 4.2 Medium Document Testing

- [ ] Test with 10-50 page documents
- [ ] Test scroll performance
- [ ] Test page loading performance
- [ ] Test memory usage patterns
- [ ] Test chunk request patterns
- [ ] Test error recovery

**Test**:

- [ ] Scroll performance is smooth
- [ ] Page loading is fast enough
- [ ] Memory usage is stable
- [ ] Chunk requests are efficient
- [ ] Error recovery works
- [ ] No performance degradation over time

**Documentation**:

- [ ] Document performance characteristics
- [ ] Document memory usage patterns
- [ ] Document chunk request patterns
- [ ] Document error recovery
- [ ] Document performance guidelines

### 4.3 Large Document Testing

- [ ] Test with 100+ page documents
- [ ] Test memory limits
- [ ] Test chunking efficiency
- [ ] Test rendering performance
- [ ] Test error handling
- [ ] Test fallback scenarios

**Test**:

- [ ] Large documents load successfully
- [ ] Memory usage stays within limits
- [ ] Chunking is efficient
- [ ] Rendering performance is acceptable
- [ ] Error handling works correctly
- [ ] Fallback scenarios work

**Documentation**:

- [ ] Document large document handling
- [ ] Document memory limits
- [ ] Document chunking efficiency
- [ ] Document performance characteristics
- [ ] Document fallback scenarios

---

## Stage 5: System Integration

**Goal**: Replace old system with new streaming system

### 5.1 Update PaperPrinter

- [ ] Update `openWebView()` to use `UIPDFScrollView`
- [ ] Remove old `UIScrollView` usage
- [ ] Update PDF generation to work with chunking
- [ ] Add chunk provider initialization
- [ ] Add error handling

**Test**:

- [ ] PaperPrinter works with new system
- [ ] PDF generation works correctly
- [ ] Chunk provider is initialized correctly
- [ ] Error handling works
- [ ] Performance is acceptable

**Documentation**:

- [ ] Document PaperPrinter changes
- [ ] Document PDF generation changes
- [ ] Document chunk provider initialization
- [ ] Document error handling
- [ ] Document performance impact

### 5.2 Update UIWebView

- [ ] Replace `UIScrollView` with `UIPDFScrollView`
- [ ] Update message handling
- [ ] Remove old page render logic
- [ ] Add new chunk handling
- [ ] Update error handling

**Test**:

- [ ] UIWebView works with new system
- [ ] Message handling works correctly
- [ ] Old logic is removed
- [ ] New chunk handling works
- [ ] Error handling works

**Documentation**:

- [ ] Document UIWebView changes
- [ ] Document message handling changes
- [ ] Document removed functionality
- [ ] Document new functionality
- [ ] Document error handling

### 5.3 Update PDF.ts

- [ ] Add chunk provider implementation
- [ ] Add message handling
- [ ] Remove old `renderContent()` method
- [ ] Add new streaming methods
- [ ] Update error handling

**Test**:

- [ ] PDF.ts works with new system
- [ ] Chunk provider works correctly
- [ ] Message handling works
- [ ] Old methods are removed
- [ ] New methods work correctly

**Documentation**:

- [ ] Document PDF.ts changes
- [ ] Document chunk provider implementation
- [ ] Document message handling
- [ ] Document removed methods
- [ ] Document new methods

---

## Stage 6: Cleanup and Optimization

**Goal**: Remove old system and optimize new system

### 6.1 Remove Old System

- [ ] Delete `src/UIScrollView.ts`
- [ ] Delete `src/UIScrollView.yaml`
- [ ] Remove `src/types/PageRender_t.ts`
- [ ] Remove old message handlers
- [ ] Remove old imports

**Test**:

- [ ] Old files are removed
- [ ] No references to old system remain
- [ ] New system works without old dependencies
- [ ] No compilation errors
- [ ] No runtime errors

**Documentation**:

- [ ] Document removed files
- [ ] Document removed functionality
- [ ] Document migration notes
- [ ] Document breaking changes
- [ ] Document new system benefits

### 6.2 Performance Optimization

- [ ] Optimize chunk size
- [ ] Optimize caching strategy
- [ ] Optimize memory management
- [ ] Optimize rendering performance
- [ ] Add performance monitoring

**Test**:

- [ ] Performance is optimal
- [ ] Memory usage is efficient
- [ ] Rendering is smooth
- [ ] Chunking is efficient
- [ ] Monitoring works correctly

**Documentation**:

- [ ] Document performance optimizations
- [ ] Document memory management
- [ ] Document rendering optimizations
- [ ] Document chunking optimizations
- [ ] Document monitoring approach

### 6.3 Final Testing

- [ ] End-to-end testing with all document types
- [ ] Performance testing with large documents
- [ ] Memory testing with extended usage
- [ ] Error testing with edge cases
- [ ] User acceptance testing

**Test**:

- [ ] All functionality works correctly
- [ ] Performance meets requirements
- [ ] Memory usage is acceptable
- [ ] Error handling works
- [ ] User experience is good

**Documentation**:

- [ ] Document final system architecture
- [ ] Document performance characteristics
- [ ] Document memory usage
- [ ] Document error handling
- [ ] Document user experience

---

## Success Criteria

### Technical Success

- [ ] All tests pass
- [ ] Performance meets requirements
- [ ] Memory usage is acceptable
- [ ] Error handling works correctly
- [ ] Code is well-documented

### User Success

- [ ] PDFs render correctly
- [ ] Performance is smooth
- [ ] Memory usage is reasonable
- [ ] Error messages are helpful
- [ ] User experience is intuitive

### Maintenance Success

- [ ] Code is maintainable
- [ ] Documentation is complete
- [ ] Testing is comprehensive
- [ ] Performance is monitored
- [ ] Error handling is robust

---

## Risk Mitigation

### Technical Risks

- **PDF.js Integration Issues**: Test thoroughly with different document types
- **Memory Management Problems**: Monitor memory usage continuously
- **Performance Issues**: Profile and optimize at each stage
- **Error Handling Gaps**: Test error scenarios extensively

### Process Risks

- **Scope Creep**: Stick to stage goals, defer enhancements
- **Testing Gaps**: Require tests before stage completion
- **Documentation Gaps**: Require documentation before stage completion
- **Integration Issues**: Test integration at each stage

---

## Timeline Estimate

- **Stage 1**: 2-3 days
- **Stage 2**: 3-4 days
- **Stage 3**: 3-4 days
- **Stage 4**: 2-3 days
- **Stage 5**: 2-3 days
- **Stage 6**: 2-3 days
- **Total**: 14-20 days

---

## Next Steps

1. **Start with Stage 1.1**: Create UIPDFScrollView skeleton
2. **Complete all tests** before moving to next stage
3. **Document everything** as you go
4. **Get feedback** at each stage completion
5. **Adjust plan** based on learnings
