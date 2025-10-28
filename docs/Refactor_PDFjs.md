# PDF.js Streaming Implementation Plan

## Overview

Implement unified PDF.js integration architecture that delivers complete PDF documents to PDF.js for rendering. PDF.js handles internal streaming and page rendering automatically. Each stage must be fully tested and documented before proceeding to the next.

**Critical Error Handling Principle**: This is a highly constrained VS Code extension. If any core variable or piece of data doesn't have a reasonable representation, we choose to display an error to the user rather than coerce or fallback. This makes debugging much, much easier and prevents silent failures that would be nearly impossible to track down in the extension environment.

**Architectural Constraint**: This implementation simplifies the PDF generation architecture by eliminating the previous handle/state separation between tokenization and PDF rendering. We now have a single unified path:

1. **Tokenization** (Shiki) → produces styled tokens
2. **PDF Generation** (jsPDF) → produces a single complete PDF document from those tokens using line-by-line rendering
3. **PDF Conversion** → PDF document converted to ArrayBuffer for reuse
4. **PDF Usage** - That single PDF ArrayBuffer is used for:
   - **Webview display**: Convert ArrayBuffer to base64 data URL, embed in HTML, PDF.js loads from data URL
   - **Print operations**: Same ArrayBuffer saved as temp file, sent to OS printer
   - **Save as PDF**: Same ArrayBuffer saved to user's chosen location via VS Code save dialog

**Key Simplification**: There is no longer a separation between "PDF for webview" and "PDF for printing/saving". One complete PDF is generated and serves all purposes. For webview display, VS Code's messaging limitations require converting the PDF ArrayBuffer to a base64 data URL that gets embedded in the HTML. PDF.js then loads from this data URL and handles all page rendering internally. For printing and saving, the same original ArrayBuffer is used directly.

**Technical Constraint**: VS Code's `postMessage` API cannot pass ArrayBuffer or binary data between extension and webview. Therefore, the PDF ArrayBuffer must be converted to a base64 data URL and embedded in the HTML string that initializes the webview. This is a one-time conversion - the PDF is still generated once and reused.

**Error Handling Philosophy**: Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This approach makes debugging much easier and ensures data integrity throughout the system.

**Stage Completion Requirements**: Each stage must include:

- All existing tests pass
- New tests added for new functionality
- Thorough JSDoc comments added to class headers
- All linter errors fixed (MD, HTML, JS, CSS, TS, YAML)
- Successful compilation with no TypeScript errors
- Complete documentation of changes

---

## Stage 0: Required Reading

**Goal**: Familiarize yourself with the codebase architecture, conventions, and key files before starting implementation work.

### Essential Documentation

Read these files to understand the project:

1. **[AGENTS.md](AGENTS.md)** - Complete developer guide with:
   - Three-library PDF architecture (Shiki, jsPDF, PDF.js)
   - Unified line-by-line rendering principles
   - Memory management and state handling
   - Webview UI system architecture
   - Debugging and development guidelines

2. **[README.md](../README.md)** - Project overview with:
   - Execution flow architecture
   - Component interaction diagrams
   - Technical implementation details
   - Testing framework information

3. **[INSTALL.md](INSTALL.md)** - Development setup and installation

### Core Source Files

**Entry Point:**

- `src/-entrypoint.ts` - Extension activation and App initialization

**Main Orchestrator:**

- `src/App.ts` - Coordinates all components and handles init/done lifecycle

**Core PDF Generation:**

- `src/PDF.ts` - PDF generation using jsPDF with line-by-line rendering
- `src/PDF.yaml` - PDF HTML template snippets
- `src/Stylize.ts` - Syntax highlighting with Shiki integration
- `src/Stylize.yaml` - Stylize template snippets

**User Interface:**

- `src/UI.ts` - Webview panel management
- `src/UI.yaml` - UI HTML template snippets
- `src/UIWebView.ts` - Webview-specific functionality
- `src/UIScrollView.ts` - Current PDF display implementation
- `src/UIScrollView.yaml` - ScrollView HTML template
- `src/UIMenu.ts` - Generic menu system implementation
- `src/UIMenu.yaml` - Menu HTML template snippets
- `src/UIMenuMgr.ts` - Menu management and orchestration

**Printing & Workflow:**

- `src/PaperPrinter.ts` - Core printing workflow and PDF coordination
- `src/PaperPrinter.yaml` - PaperPrinter template snippets
- `src/TabInspector.ts` - Tab inspection and content extraction

**Platform & Utilities:**

- `src/VSCodeAPIs.ts` - All VS Code API interactions (single import point)
- `src/OS.ts` - Cross-platform OS operations
- `src/OSMac.ts` - macOS-specific operations
- `src/OSMac.yaml` - macOS template snippets
- `src/OSLinux.ts` - Linux platform support
- `src/OSWin.ts` - Windows platform support
- `src/Diagnostics.ts` - Hierarchical logging system
- `src/Persist.ts` - Global state management
- `src/Yaml.ts` - YAML template loading utilities

**Type Definitions:**

- `src/types/PDF_t.ts` - PDF-related types
- `src/types/PageRender_t.ts` - Page rendering types
- `src/types/PaperPrinter_t.ts` - PaperPrinter types
- `src/types/theme_t.ts` - Theme-related types
- `src/types/UI_t.ts` - UI component types
- `src/types/jspdf.d.ts` - jsPDF type definitions

**External Libraries:**

- `src/lib/pdf.min.js` - PDF.js library for client-side PDF rendering
- `src/lib/pdf.worker.min.js` - PDF.js worker for async operations

### Key Architectural Principles

Before making changes, understand these critical principles:

1. **Single PDF Path**: One PDF is generated from tokenization and used for all purposes (webview display, printing, saving). No separate "for webview" and "for printing" paths.

2. **Line-by-Line Rendering**: PDF generation uses line-by-line rendering via `PDF.renderByLine()` - DO NOT create alternative rendering methods or handle-based approaches.

3. **PDF Object Reuse**: The same jsPDF document object that's generated from tokenization is:
   - Converted to ArrayBuffer for webview streaming
   - Converted to temp file for printing operations
   - Converted to user-specified file for save operations

4. **No Handle/State Separation**: Remove the previous handle-based architecture that separated tokenization from PDF generation. Tokenization directly feeds into PDF generation with no intermediate state management.

5. **VS Code API Isolation**: All VS Code API imports must be in `VSCodeAPIs.ts` only - no other files should import directly from 'vscode'

6. **HTML Template System**: All HTML snippets are stored in YAML files with `{{var}}` replacements - UI methods are generic and don't reference specific menu items

7. **Project Conventions**:
   - Types: suffix with `_t`
   - Constants: prefix with `k`
   - Logging: use `this.dx.out` (not `console.log` or `dx.print`)
   - Path parameters: use generic `path: string` name
   - Never use `any` type - use predefined typedefs

8. **Testing**: Tests use Node.js built-in test runner (`node:test`) with `node:assert` - not third-party frameworks

9. **Error Handling Philosophy**: Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This approach makes debugging much easier and ensures data integrity throughout the system.

### Success Criteria for Stage 0

- ✅ All documentation files read and understood
- ✅ Core source files reviewed for architecture
- ✅ YAML template system understood
- ✅ Type definitions familiar
- ✅ Architectural principles understood
- ✅ Ready to proceed to Stage 1

---

## Stage 1: Foundation Setup

**Goal**: Create basic infrastructure and prove chunking works

**Critical**: This stage implements the simplified single-PDF architecture. We generate one PDF from tokenization using line-by-line rendering, then deliver that same PDF in chunks to the webview. The PDF generation logic remains unchanged - this is purely about how we deliver the completed PDF to the webview in chunks.

### 1.1 Create UIPDFScrollView Skeleton

- 🔲 Create `src/UIPDFScrollView.ts` with basic class structure
- 🔲 Create `src/UIPDFScrollView.yaml` with minimal HTML template
- 🔲 Add constructor that accepts `pdfDataUrl`, `pageTotal`, `pageSizePx`
- 🔲 Add `generateContent()` method that returns basic HTML

**Test**:

- 🔲 All existing tests pass
- 🔲 UIPDFScrollView can be instantiated
- 🔲 `generateContent()` returns valid HTML
- 🔲 HTML includes PDF.js library loading
- 🔲 Add new tests for UIPDFScrollView functionality

**Documentation**:

- 🔲 Add thorough JSDoc comments to class headers
- 🔲 Document class interface
- 🔲 Document constructor parameters
- 🔲 Document expected HTML output

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 1.2 Implement Basic PDF.js Integration

- 🔲 Add PDF.js document loading in `generateContent()`
- 🔲 Pass complete PDF ArrayBuffer to PDF.js
- 🔲 Add basic error handling (remember: Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.)
- 🔲 Add console logging for debugging

**Test**:

- 🔲 All existing tests pass
- 🔲 PDF.js loads successfully
- 🔲 PDF document loads from ArrayBuffer
- 🔲 Basic error handling works
- 🔲 Console logs show expected flow
- 🔲 Add new tests for PDF.js integration

**Documentation**:

- 🔲 Add thorough JSDoc comments to class headers
- 🔲 Document PDF.js integration approach
- 🔲 Document error handling strategy
- 🔲 Document debugging approach

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

---

## Stage 2: PDF.js Integration

**Goal**: Deliver complete PDF to PDF.js and let it handle rendering

### 2.1 PDF.js Integration

- 🔲 Pass complete PDF ArrayBuffer to PDF.js
- 🔲 Use `pdfjsLib.getDocument({ data: pdfArrayBuffer })`
- 🔲 Add PDF.js event handling (load, progress, error)
- 🔲 Add progress tracking for document loading
- 🔲 Handle PDF.js initialization
- 🔲 Validate ArrayBuffer exists and is valid (Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.)

**Test**:

- 🔲 PDF.js loads complete PDF document from ArrayBuffer
- 🔲 Document loads successfully
- 🔲 PDF renders correctly
- 🔲 Progress events fire appropriately
- 🔲 Error handling works for PDF.js errors

**Documentation**:

- 🔲 Document PDF.js integration approach
- 🔲 Document ArrayBuffer delivery method
- 🔲 Document event handling
- 🔲 Document error scenarios

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 2.2 Canvas Rendering

- 🔲 Add canvas element to HTML template
- 🔲 Implement page rendering to canvas
- 🔲 Add viewport management
- 🔲 Add zoom and scroll handling
- 🔲 Add page navigation

**Test**:

- 🔲 Pages render correctly on canvas
- 🔲 Zoom functionality works
- 🔲 Scroll functionality works
- 🔲 Page navigation works
- 🔲 Rendering performance is acceptable

**Documentation**:

- 🔲 Document canvas rendering approach
- 🔲 Document viewport management
- 🔲 Document zoom/scroll implementation
- 🔲 Document performance considerations

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 2.3 Error Handling and User Feedback

**Goal**: Catch out-of-memory errors and report them to users instead of trying to predict or prevent them

**Error Handling Philosophy**: Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.

#### 2.3.1 Out-of-Memory Error Detection

**Owner**: TBD
**Config**: None (use browser error detection)

- 🔲 Wrap PDF.js operations in try-catch blocks
- 🔲 Detect "out of memory" errors from PDF.js
- 🔲 Detect "out of memory" errors from browser
- 🔲 Detect "out of memory" errors from extension
- 🔲 Log all memory-related errors with context

**Test Plan**:

- 🔲 Simulate memory pressure by loading very large PDFs
- 🔲 Verify error detection works across different browsers
- 🔲 Verify error detection works in extension context
- 🔲 **Pass**: All memory errors are caught and logged
- 🔲 **Fail**: Memory errors crash the application silently

#### 2.3.2 User Error Reporting

**Owner**: TBD
**Config**: None (use VS Code UI APIs)

**Error Handling Philosophy**: Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.

- 🔲 Show user-friendly error message when OOM occurs
- 🔲 Include suggestion to try smaller document or restart VS Code
- 🔲 Add "Retry" button for transient errors
- 🔲 Add "Report Issue" button for persistent errors
- 🔲 Log error details for debugging

**Test Plan**:

- 🔲 Trigger OOM error in controlled environment
- 🔲 Verify user sees helpful error message
- 🔲 Verify retry functionality works
- 🔲 **Pass**: User gets clear feedback and recovery options
- 🔲 **Fail**: User sees technical error or no feedback

#### 2.3.3 Graceful Degradation

**Owner**: TBD
**Config**: None (use error-driven fallbacks)

- 🔲 Clear all cached chunks when OOM occurs
- 🔲 Reset PDF.js document state
- 🔲 Allow user to try again with clean state
- 🔲 Prevent cascading memory errors

**Test Plan**:

- 🔲 Trigger OOM, verify cleanup occurs
- 🔲 Verify user can retry after cleanup
- 🔲 Verify no memory leaks after cleanup
- 🔲 **Pass**: System recovers cleanly from OOM
- 🔲 **Fail**: System remains in broken state after OOM

**Documentation**:

- 🔲 Document error handling approach
- 🔲 Document user-facing error messages
- 🔲 Document recovery procedures
- 🔲 Document debugging information

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

---

## Stage 3: Integration Testing

**Goal**: Test complete system with real documents

### 3.1 Small Document Testing

- 🔲 Test with 1-5 page documents
- 🔲 Test with different content types (code, text, mixed)
- 🔲 Test with different themes
- 🔲 Test with different font sizes
- 🔲 Test theme switching
- 🔲 Test font size changes

**Test**:

- 🔲 All document types render correctly
- 🔲 Theme switching works without errors
- 🔲 Font size changes work correctly
- 🔲 Performance is acceptable
- 🔲 Memory usage is reasonable
- 🔲 No memory leaks detected

**Documentation**:

- 🔲 Document supported document types
- 🔲 Document theme switching behavior
- 🔲 Document font size behavior
- 🔲 Document performance characteristics
- 🔲 Document known limitations

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 3.2 Medium Document Testing

- 🔲 Test with 10-50 page documents
- 🔲 Test scroll performance
- 🔲 Test page loading performance
- 🔲 Test memory usage patterns
- 🔲 Test chunk request patterns
- 🔲 Test error recovery

**Test**:

- 🔲 Scroll performance is smooth
- 🔲 Page loading is fast enough
- 🔲 Memory usage is stable
- 🔲 Chunk requests are efficient
- 🔲 Error recovery works
- 🔲 No performance degradation over time

**Documentation**:

- 🔲 Document performance characteristics
- 🔲 Document memory usage patterns
- 🔲 Document chunk request patterns
- 🔲 Document error recovery
- 🔲 Document performance guidelines

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 3.3 Large Document Testing

- 🔲 Test with 100+ page documents
- 🔲 Test memory limits
- 🔲 Test PDF delivery efficiency
- 🔲 Test rendering performance
- 🔲 Test error handling
- 🔲 Test fallback scenarios

**Test**:

- 🔲 Large documents load successfully
- 🔲 Memory usage stays within limits
- 🔲 PDF delivery is efficient
- 🔲 Rendering performance is acceptable
- 🔲 Error handling works correctly
- 🔲 Fallback scenarios work

**Documentation**:

- 🔲 Document large document handling
- 🔲 Document memory limits
- 🔲 Document PDF delivery efficiency
- 🔲 Document performance characteristics
- 🔲 Document fallback scenarios

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

---

## Stage 4: System Integration

**Goal**: Replace old system with new PDF delivery system

**Critical Dependency Order**: Step 4.2 (UIWebView) must be validated before proceeding to Step 4.3 (PaperPrinter integration) to avoid cascading failures. UIWebView provides the webview infrastructure that PaperPrinter depends on.

**Simplification Note**: Under the new single-PDF architecture, we're not changing how PDFs are generated. The PDF generation logic in `PDF.ts` remains unchanged - it still uses line-by-line rendering to produce a single PDF object. What we're changing is:

- How that PDF is delivered to the webview (ArrayBuffer instead of data URL)
- How the same PDF is reused for printing and saving (no separate generation paths)

### 4.1 Update PaperPrinter

- 🔲 Update `openWebView()` to use `UIPDFScrollView`
- 🔲 Remove old `UIScrollView` usage
- 🔲 Update webview opening to pass PDF ArrayBuffer instead of data URL
- 🔲 Ensure same PDF object is used for both webview and print/save operations
- 🔲 Add error handling (Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.)

**Test**:

- 🔲 PaperPrinter works with new system
- 🔲 PDF generation works correctly (unchanged)
- 🔲 Same PDF used for webview display and print/save
- 🔲 ArrayBuffer conversion works correctly
- 🔲 Error handling works
- 🔲 Performance is acceptable

**Documentation**:

- 🔲 Document PaperPrinter changes
- 🔲 Document that PDF generation is unchanged
- 🔲 Document ArrayBuffer delivery
- 🔲 Document single-PDF reuse pattern
- 🔲 Document error handling

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 4.2 Update UIWebView

- 🔲 Replace `UIScrollView` with `UIPDFScrollView`
- 🔲 Update message handling
- 🔲 Remove old page render logic
- 🔲 Update PDF delivery to pass ArrayBuffer
- 🔲 Update error handling

**Test**:

- 🔲 UIWebView works with new system
- 🔲 Message handling works correctly
- 🔲 Old logic is removed
- 🔲 New PDF delivery works (ArrayBuffer)
- 🔲 Error handling works

**Documentation**:

- 🔲 Document UIWebView changes
- 🔲 Document message handling changes
- 🔲 Document removed functionality
- 🔲 Document new ArrayBuffer delivery
- 🔲 Document error handling

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 4.3 Verify PDF Object Reuse

**Note**: Verify that the single PDF object generated from tokenization is properly reused for all purposes (webview, printing, saving). No chunking or separate rendering is needed.

- 🔲 Verify same jsPDF object is used for webview ArrayBuffer conversion
- 🔲 Verify same jsPDF object is used for temp file creation (printing)
- 🔲 Verify same jsPDF object is used for save-to-file (save as PDF)
- 🔲 Add logging to confirm no duplicate PDF generation occurs
- 🔲 Verify no intermediate state between tokenization and PDF generation

**Error Handling**: Validate that the PDF object exists and has valid data. Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.

**Test**:

- 🔲 Single PDF generation called once per user action
- 🔲 Webview receives ArrayBuffer from same PDF object
- 🔲 Print operations use same PDF object
- 🔲 Save operations use same PDF object
- 🔲 Invalid or missing PDF objects trigger clear error messages
- 🔲 No changes to existing PDF generation tests (they should all still pass)

**Documentation**:

- 🔲 Document single-PDF reuse pattern
- 🔲 Document ArrayBuffer conversion process
- 🔲 Document that PDF.ts generation logic is unchanged
- 🔲 Document integration with webview, printing, and saving

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

---

## Stage 5: Cleanup and Optimization

**Goal**: Remove old system and optimize new system

### 5.1 Remove Old System Components

**Removal Rationale**: With the single-PDF architecture, we no longer need:

- Separate page rendering for webview (old UIScrollView that rendered individual pages)
- The PageRender interface (designed for on-demand page rendering separate from PDF generation)
- Separate message handlers for page-based rendering

**Error Handling During Cleanup**: When removing old code, validate that no dependencies remain. Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.

- 🔲 Delete `src/UIScrollView.ts` (replaced by `UIPDFScrollView.ts`)
- 🔲 Delete `src/UIScrollView.yaml` (replaced by `UIPDFScrollView.yaml`)
- 🔲 Delete `src/types/PageRender_t.ts` (no longer needed - no separate page rendering interface)
- 🔲 Remove `renderContent()` method from `PDF.ts` (was used for individual page rendering)
- 🔲 Remove old message handlers for page requests
- 🔲 Remove old imports and dependencies
- 🔲 Clean up any handle/state management code that separated tokenization from PDF generation

**Test**:

- 🔲 Old files are removed
- 🔲 No references to old system remain
- 🔲 New single-PDF system works without old dependencies
- 🔲 No compilation errors
- 🔲 No runtime errors
- 🔲 All existing PDF generation tests still pass (confirming no regressions)

**Documentation**:

- 🔲 Document removed files and rationale
- 🔲 Document removed functionality (individual page rendering)
- 🔲 Document migration from old to new architecture
- 🔲 Document benefits of single-PDF approach
- 🔲 Update AGENTS.md if it still references old architecture

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 5.2 Performance Optimization

- 🔲 Optimize PDF generation performance
- 🔲 Optimize ArrayBuffer conversion
- 🔲 Optimize memory management
- 🔲 Optimize PDF.js rendering performance
- 🔲 Add performance monitoring

**Test**:

- 🔲 Performance is optimal
- 🔲 Memory usage is efficient
- 🔲 Rendering is smooth
- 🔲 PDF delivery is efficient
- 🔲 Monitoring works correctly

**Documentation**:

- 🔲 Document performance optimizations
- 🔲 Document memory management
- 🔲 Document rendering optimizations
- 🔲 Document PDF delivery optimizations
- 🔲 Document monitoring approach

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

### 5.3 Final Testing

- 🔲 End-to-end testing with all document types
- 🔲 Performance testing with large documents
- 🔲 Memory testing with extended usage
- 🔲 Error testing with edge cases
- 🔲 User acceptance testing

**Test**:

- 🔲 All functionality works correctly
- 🔲 Performance meets requirements
- 🔲 Memory usage is acceptable
- 🔲 Error handling works
- 🔲 User experience is good

**Documentation**:

- 🔲 Document final system architecture
- 🔲 Document performance characteristics
- 🔲 Document memory usage
- 🔲 Document error handling
- 🔲 Document user experience

**Linting & Compilation**:

- 🔲 Fix all linter errors (MD, HTML, JS, CSS, TS, YAML)
- 🔲 Run `npm run compile` successfully
- 🔲 Verify no TypeScript compilation errors
- 🔲 Verify no ESLint errors

---

## Success Criteria

### Technical Success

- 🔲 All tests pass
- 🔲 Performance meets requirements
- 🔲 Memory usage is acceptable
- 🔲 Error handling works correctly (Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.)
- 🔲 Code is well-documented

### User Success

- 🔲 PDFs render correctly
- 🔲 Performance is smooth
- 🔲 Memory usage is reasonable
- 🔲 Error messages are helpful
- 🔲 User experience is intuitive

### Maintenance Success

- 🔲 Code is maintainable
- 🔲 Documentation is complete
- 🔲 Testing is comprehensive
- 🔲 Performance is monitored
- 🔲 Error handling is robust

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
- **Silent Failures**: Always validate data and display errors instead of falling back (Because this is a highly constrained VSCode Plug-in, if any core variable or piece doesn't have a reasonable representation of the data it embodies, we choose to display an error to the user over trying to coerce or fallback. This makes debugging much easier.)

---

## Timeline Estimate

- **Stage 0**: 0.5 days (reading and understanding)
- **Stage 1**: 2-3 days
- **Stage 2**: 2-3 days
- **Stage 3**: 2-3 days
- **Stage 4**: 2-3 days
- **Stage 5**: 2-3 days
- **Total**: 11-17 days

---

## Future Considerations

### Streaming Tokenization for Very Large Documents

**Current Approach**: Complete PDF is generated in memory from tokenization and then delivered to PDF.js.

**Future Enhancement**: If memory issues occur with very large documents (100+ pages), we could implement true streaming:

1. **Stream Tokenization to PDF to Disk**: Instead of keeping the entire PDF in memory, stream the tokenization process directly to a temporary PDF file on disk
2. **Stream from Disk to PDF.js**: PDF.js can stream from a file path, allowing it to load and render pages incrementally without loading the entire PDF into memory

**Why Not Now**: This adds significant complexity (file I/O, error recovery, cleanup) for an edge case (printing 100+ page source files). The current approach handles typical use cases efficiently, and the browser's PDF.js implementation is well-optimized for document rendering. We should implement this only if actual memory issues are observed with large documents.

**Implementation Note**: PDF.js already supports streaming from file sources via its `getDocument()` API. The main work would be in modifying the PDF generation pipeline to write incrementally to disk instead of building the PDF in memory.

---

## Next Steps

1. **Start with Stage 1.1**: Create UIPDFScrollView skeleton
2. **Complete all tests** before moving to next stage
3. **Document everything** as you go
4. **Get feedback** at each stage completion
5. **Adjust plan** based on learnings
