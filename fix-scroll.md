# Fix Scroll: Canvas Buffer Architecture Plan

## Researched

### 1. AGENTS.md

**Summary**: Developer guide for Print2Paper4VSCode extension. Contains architecture principles, technical dependencies, and development guidelines.

**Relevant Information**:

- Architecture uses three PDF libraries: Shiki (tokenization), jsPDF (PDF generation), PDF.js (webview rendering)
- Key principle: "Webview is Display Only - Webview shows PDF pages, doesn't create them"
- Page cache optimization: First 7 pages cached during `calculatePageBreaks()` for webview performance
- Critical warning: "Don't create separate cache-optimized generation methods"
- Unified line-by-line rendering approach for consistency

### 2. README.md

**Summary**: User documentation explaining the extension's workflow and technical implementation.

**Relevant Information**:

- Three-library PDF pipeline: Source Code → Shiki → jsPDF → PDF.js → User
- PDF.js runs in webview context for user preview
- Flow: Shiki tokenization → jsPDF PDF generation → PDF.js canvas rendering
- PDF.js handles zoom, scrolling, and interactive PDF display
- Webview UI system with toolbar menus and message handling

### 3. tests/scrollpoc.html

**Summary**: Proof-of-concept HTML file demonstrating virtual scrolling with canvas pooling.

**Relevant Information**:

- **CONFIG**: MAX_CANVASES=7, LOAD_DISTANCE=3, UNLOAD_DISTANCE=4, SCALE=1.5
- **Database structure**: Simple `db` object with direct property access
  - Canvas properties: `db[canvasId] = { page, status, domElementRef, renderTask }`
  - Page properties: `db[pageId] = { cb, placeholder, wrapper, label }`
- **Canvas IDs**: `cb0, cb1, cb2...` (Canvas buffers)
- **Page IDs**: `pg1, pg2, pg3...` (Pages)
- **Element IDs**: `Ce1, Ce2, Ce3...` (Canvas elements), `Pd1, Pd2, Pd3...` (Placeholders)
- **Single PDF.js document**: ONE `pdfDoc` reused for all pages
- **Core functions**:
  - `getCanvasForPage(pageId)` - Returns canvas element for page
  - `assignCanvasToPage(canvasId, pageId)` - Bidirectional linking
  - `unassignCanvas(canvasId)` - Clear both directions
  - `getAvailableCanvas()` - Returns first available/cancelled canvas
- **Scroll handling**: Direction-aware (up/down), priority loading (center → next → previous → visible → other)
- **HUD logging**: Compact emoji-based status (c0❓p1 = requesting, c0❌p1 = clearing)

### 4. PDF_GENERATION_FLOW.md

**Summary**: Analysis of PDF generation flow and unified rendering architecture.

**Relevant Information**:

- Unified approach: `generatePdf()` creates complete multi-page PDF during tokenization
- `renderContent()` extracts pages from precomposed PDF
- Page extraction from complete PDF is simpler than separate rendering
- Single rendering path eliminates complexity and bugs
- Current implementation: line-by-line rendering during tokenization

### 5. GitHub PR #26 (appliedmedia/print2paper4vscode)

**Summary**: Pull request for "Refactor: Line-by-line rendering improvements and PDF generation fixes"

**Links**:

- GitHub PR: <https://github.com/appliedmedia/print2paper4vscode/pull/26>
- Local PR data: PR26.json (saved by user)

**Relevant CodeRabbit Recommendations**:

#### Critical Issue #1: PDF Document Loading

**Problem**: "Stop loading the entire PDF per page. One doc, many pages. You're caching a full PDF.js document per page. That's wasteful and slow."

**CodeRabbit's Fix** (from review comment):

```javascript
// WRONG (current production):
pdfDocs: new Map(), // pageNumber -> PDF.js document for each page

if (!db.pdfDocs.has(pageNumber)) {
  const loadingTask = pdfjsLib.getDocument({ url: dataUrl, ... });
  const pdfDoc = await loadingTask.promise;
  db.pdfDocs.set(pageNumber, pdfDoc);
}

// RIGHT (POC approach):
pdfDoc: null, // Single PDF.js document reused for all pages

if (!db.pdfDoc) {
  const loadingTask = pdfjsLib.getDocument({ url: dataUrl, ... });
  db.pdfDoc = await loadingTask.promise;
}
const page = await db.pdfDoc.getPage(pageNumber);
```

#### Critical Issue #2: Canvas Pool Management

**POC uses**: Simple direct property access with canvas buffer terminology
**Production uses**: Complex Map-based system with confusing "cache" terminology

**CodeRabbit's recommendation**: Return to POC's simpler database structure

#### Critical Issue #3: Logging Consolidation

**POC uses**: Compact HUD multi-modal logging with emoji status indicators
**Production uses**: Verbose individual log statements

**CodeRabbit's recommendation**: Use HUD state display with emoji shortcuts like `c0❓p1`, `c0❌p1`

### 6. Current Production Files

#### src/UIScrollView.ts

**Key Differences from POC**:

- Uses `Map<number, PageData>` for pageCache
- Uses `Set<number>` for renderQueue and pendingPages
- No direct canvas buffer management (delegates to YAML JS)
- Missing: canvas ID generation, bidirectional page↔canvas linking
- Missing: HUD-based compact logging

#### src/UIScrollView.yaml (scroll_js section)

**Key Differences from POC**:

- **WRONG**: Loads separate PDF.js document per page (lines 679-692)
- Canvas management spread across multiple functions
- Uses Map/Set instead of simple db object
- HUD exists but only shows final states, not transitions
- Canvas IDs use `cb0...cb6` format consistently
- Missing: emoji status indicators (❓, ❌, etc.)
- Missing: `getCanvasForPage()`, `assignCanvasToPage()` helper functions

---

## Analysis: Current Code vs POC

### What POC Does Right

1. **Single PDF.js Document**
   - ONE `pdfDoc` loaded once, reused for all pages
   - Massive memory savings (1 doc vs N docs)
   - Faster page rendering (no repeated PDF parsing)

2. **Simple Database Structure**

   ```javascript
   // POC approach - clean and direct
   db[canvasId].page = pageId;
   db[pageId].Cn = canvasId;
   db[canvasId].domElementRef = canvas;
   ```

3. **Bidirectional Canvas↔Page Linking**
   - Canvas knows which page it holds: `db[canvasId].page`
   - Page knows which canvas holds it: `db[pageId].Cn`
   - Easy to query either direction

4. **Clear Terminology**
   - **Canvas buffers** (cb): Physical canvas elements (limited to 7)
   - **Pages** (pg): Logical document pages (unlimited)
   - Canvas IDs: `cb0...cb6` (not `canvas-0`)
   - Page IDs: `pg1...pgN`

5. **Compact HUD Logging**
   - Shows transitions: `c0❓p1` (requesting), `c0❌p1` (clearing)
   - Shows final state: `c0:p1` (assigned)
   - All canvas states in one line: `c0:p1 c1:p2 c2:p0 c3:p5...`

6. **Helper Functions**
   - `getCanvasForPage(pageId)` - Find canvas for page
   - `assignCanvasToPage(canvasId, pageId)` - Bidirectional link
   - `unassignCanvas(canvasId)` - Clear both directions
   - `getAvailableCanvas()` - Get next free canvas

### What Production Does Wrong

1. **Multiple PDF.js Documents** ❌

   ```javascript
   // Production loads SEPARATE PDF.js doc per page!
   pdfDocs: (new Map(), // pageNumber -> PDF.js document
     db.pdfDocs.set(pageNumber, pdfDoc)); // WASTEFUL!
   ```

2. **Overly Complex State Management** ❌
   - Mix of Map/Set/Array instead of unified db object
   - `assignedCanvases` Map instead of bidirectional db properties
   - `availableCanvases` Set instead of simple db queries
   - Hard to trace canvas↔page relationships

3. **Missing Helper Functions** ❌
   - No `getCanvasForPage()` - have to scan Map
   - No `assignCanvasToPage()` - logic scattered
   - No `unassignCanvas()` - incomplete cleanup

4. **Confusing Terminology** ❌
   - "Cache" instead of "buffer" (cache implies optional, buffer implies pooled resource)
   - Consistent `cb0...cb6` format (matches page `pg1...pgN` style)
   - `domElementRef` sometimes used, sometimes not

5. **Verbose Logging** ❌
   - Individual `dx()` calls instead of HUD updates
   - No emoji status indicators
   - Can't see all canvas states at once

---

## Proposed Fixes

### Fix 1: Single PDF.js Document (CRITICAL)

**Current Problem**: Production loads separate PDF.js document per page, wasting memory and slowing rendering.

**Fix**: Use POC's single document approach.

**File**: `src/UIScrollView.yaml` lines 679-692, 818-821, 848-853

**Changes**:

```javascript
// BEFORE (WRONG):
pdfDocs: new Map(), // pageNumber -> PDF.js document for each page

if (!db.pdfDocs.has(pageNumber)) {
  const loadingTask = pdfjsLib.getDocument({ url: dataUrl, ... });
  const pdfDoc = await loadingTask.promise;
  db.pdfDocs.set(pageNumber, pdfDoc);
}
const pdfDoc = db.pdfDocs.get(pageNumber);
const page = await pdfDoc.getPage(pageNumber);

// AFTER (RIGHT):
pdfDoc: null, // Single PDF.js document reused for all pages

if (!db.pdfDoc) {
  const loadingTask = pdfjsLib.getDocument({ url: dataUrl, ... });
  db.pdfDoc = await loadingTask.promise;
}
const page = await db.pdfDoc.getPage(pageNumber);
```

**Impact**:

- Memory usage drops from O(N) to O(1) for PDF documents
- Faster page rendering (no repeated PDF parsing)
- Matches POC architecture

---

### Fix 2: Unified Database Structure

**Current Problem**: Production uses mix of Map/Set/Array, making state management complex.

**Fix**: Consolidate to POC's simple db object with direct property access.

**File**: `src/UIScrollView.yaml` lines 194-216

**Changes**:

```javascript
// BEFORE (CURRENT PRODUCTION):
const db = {
  // Canvas management
  assignedCanvases: new Map(), // pageNumber -> canvasId
  availableCanvases: new Set(),

  // Page management
  renderedPages: new Map(), // pageNumber -> PageData
  pendingPages: new Set(), // pageNumbers being rendered
  failedPages: new Set(), // pageNumbers that failed to render
  pdfDoc: null, // Single PDF.js document reused for all pages

  // Scroll state
  lastScrollTop: -999, // Set to -999 to ensure initial scroll triggers assignment
  scrollDirection: 'down',
  isScrolling: false,

  // Performance tracking
  renderStartTime: 0,
  renderCount: 0,
  perfUpdateCounter: 0,
};

// AFTER (SIMPLE - POC approach):
const db = {
  // Canvas buffers: db.cb0 = { pg: 'pg5', status: 'render', domElementRef, renderTask }
  // Pages: db.pg5 = { cb: 'cb0', placeholder, wrapper, label }
  pdfDoc: null, // Single PDF.js document
  lastScrollTop: -999,
  scrollDirection: 'down',
  perfUpdateCounter: 0,
};

// Canvas buffers created as: db.cb0, db.cb1, ..., db.cb6 (7 total)
// Pages created as: db.pg1, db.pg2, ..., db.pgN
```

**Impact**:

- Simpler state queries: `db.pg5.cb` instead of `db.assignedCanvases.get(5)`
- Bidirectional linking built-in
- Easier debugging (inspect db object directly)

---

### Fix 3: Canvas Buffer Terminology

**Current Problem**: Production uses "cache" (implies optional) instead of "buffer" (implies pooled resource).

**Fix**: Update terminology to match POC and user's preference.

**Files**:

- `src/UIScrollView.ts` (class-level documentation)
- `src/UIScrollView.yaml` (comments and IDs)

**Changes**:

- "canvas cache" → "canvas buffer"
- "cached pages" → "buffered pages"
- Canvas IDs: `cb0...cb6` (in db struct and DOM)
- Page IDs: `pg1, pg2, ...` (in db struct and DOM)
- Element IDs: DOM everything as cb0…cb6 and pg1...pgN

**Impact**:

- Clearer mental model (fixed-size buffer pool)
- Consistent with POC
- User-requested terminology

---

### Fix 4: Helper Functions

**Current Problem**: Canvas↔page relationship logic scattered across multiple functions.

**Fix**: Add POC's helper functions for clean abstraction.

**File**: `src/UIScrollView.yaml` (add after db initialization)

**Add Functions**:

```javascript
// Get canvas element for page
function getCanvasForPage(pgId) {
  const cbId = db[pgId] && db[pgId].cb;
  return cbId ? db[cbId].domElementRef : null;
}

// Assign canvas to page (bidirectional)
function assignCanvasToPage(cbId, pgId) {
  // Clear old assignments from BOTH directions
  const oldPgId = db[cbId] && db[cbId].pg;
  if (oldPgId && db[oldPgId]) {
    db[oldPgId].cb = null;
  }

  const oldCbId = db[pgId] && db[pgId].cb;
  if (oldCbId && db[oldCbId]) {
    db[oldCbId].pg = null;
    db[oldCbId].status = '';
  }

  // Set new assignment
  db[cbId].pg = pgId;
  db[cbId].status = 'render';

  if (!db[pgId]) db[pgId] = {};
  db[pgId].cb = cbId;
}

// Unassign canvas (clear both directions)
function unassignCanvas(cbId) {
  const oldPgId = db[cbId] && db[cbId].pg;
  if (oldPgId && db[oldPgId]) {
    db[oldPgId].cb = null;

    // Show "Loading page X..." when canvas removed
    const placeholder = db[oldPgId].placeholder;
    if (placeholder) {
      const loadingText = placeholder.querySelector('.loading-text');
      if (loadingText) loadingText.style.display = 'block';
    }
  }

  // Remove canvas from DOM
  const canvas = db[cbId].domElementRef;
  if (canvas && canvas.parentElement) {
    canvas.parentElement.removeChild(canvas);
  }

  db[cbId].pg = null;
  db[cbId].status = '';
}

// Get available canvas
function getAvailableCanvas() {
  // First try available canvases
  const availableIds = getAllAvailableCanvasIds();
  if (availableIds.length > 0) {
    return db[availableIds[0]].domElementRef;
  }

  // Then try cancelled canvases
  const cancelledIds = getAllCancelledCanvasIds();
  if (cancelledIds.length > 0) {
    return db[cancelledIds[0]].domElementRef;
  }

  return null;
}

// Helper: Get all canvas IDs
function getAllCanvasIds() {
  return Object.keys(db).filter(k => k.startsWith('cb'));
}

// Helper: Get available canvas IDs
function getAllAvailableCanvasIds() {
  return getAllCanvasIds().filter(cbId => !db[cbId].pg && !db[cbId].status);
}

// Helper: Get cancelled canvas IDs
function getAllCancelledCanvasIds() {
  return getAllCanvasIds().filter(cbId => db[cbId].status === 'cancel');
}

// Helper: Get all page IDs
function getAllPageIds() {
  return Object.keys(db).filter(k => k.startsWith('pg'));
}

// ID generation helpers - centralized for easy maintenance
function pageId(pageNumber) {
  return `pg${pageNumber}`;
}

function canvasId(canvasNumber) {
  return `cb${canvasNumber}`;
}
```

**Impact**:

- Centralized canvas↔page logic
- Easier to maintain and debug
- Matches POC architecture

---

### Fix 5: Compact HUD Logging

**Current Problem**: Verbose individual `dx()` calls make it hard to see system state.

**Fix**: Use POC's compact emoji-based HUD logging.

**File**: `src/UIScrollView.yaml` (update HUD functions)

**Changes**:

#### Add Emoji Status Updates

```javascript
// Canvas buffer status constants
const kCBStatus = {
  requesting: { key: 'requesting', char: '❓' },
  clearing: { key: 'clearing', char: '❌' },
  assigned: { key: 'assigned', char: ':' },
  available: { key: 'available', char: ':' }
};

// When requesting page render:
function updateHudStatus(cbId, status, pageNumber) {
  const cbIndex = canvasIndex(cbId);
  const hudElement = document.getElementById('canvas-assignments');
  if (!hudElement) return;

  const assignments = hudElement.textContent.split(' ');
  const statusInfo = kCBStatus[status];
  
  if (statusInfo) {
    // Always use a valid page number - 0 for available, actual page number for others
    const pageDisplay = status === 'available' ? 0 : (pageNumber || 0);
    assignments[cbIndex] = `c${cbIndex}${statusInfo.char}p${pageDisplay}`;
  }

  hudElement.textContent = assignments.join(' ');
  dx(`HUD: ${assignments.join(' ')}`);
}
```

#### Integrate into existing functions

- Call `updateHudStatus(cbId, 'requesting', pageNumber)` in `assignCanvasToPage()`
- Call `updateHudStatus(cbId, 'clearing', pageNumber)` in `unassignCanvas()`
- Call `updateHudStatus(cbId, 'assigned', pageNumber)` after render completes
- Call `updateHudStatus(cbId, 'available', 0)` when canvas freed

**Impact**:

- All canvas states visible at once
- Transition states visible (❓ = requesting, ❌ = clearing)
- Less verbose logging
- Easier debugging

---

### Fix 6: Canvas ID Consistency

**Current Problem**: Production uses inconsistent ID formats; POC uses `cb0...cb6` consistently.

**Fix**: Use `cb0...cb6` in both db struct and DOM.

**File**: `src/UIScrollView.yaml`

**Changes**:

```javascript
// Canvas creation:
for (let i = 0; i < CONFIG.canvasBuffersSize; i++) {
  const canvas = document.createElement('canvas');
  canvas.id = `cb${i}`; // Consistent DOM ID format
  canvas.className = 'page-canvas';
  canvasPool.appendChild(canvas);

  // Store in db with cb prefix
  db[`cb${i}`] = {
    pg: null,
    status: '',
    domElementRef: canvas,
    renderTask: null,
  };
}
```

**Impact**:

- DOM uses consistent cb0...cb6 format
- DB structure matches POC (`cb0`)
- Clear distinction between DOM IDs and logical IDs

---

## Implementation Recipe

### Prerequisites

1. Read this document thoroughly
2. Review POC file: `tests/scrollpoc.html` (lines 160-531)
3. Review production file: `src/UIScrollView.yaml` (lines 168-937)
4. Understand three-library PDF architecture from AGENTS.md

### Step 1: Single PDF.js Document (CRITICAL - Do First)

**Why First**: This is the most critical bug. Every page render currently loads a separate PDF.js document, wasting memory and slowing performance.

**File**: `src/UIScrollView.yaml`

**Task 1.1**: Update db initialization (lines 194-216)

```javascript
// Remove:
pdfDocs: new Map(), // DELETE THIS LINE

// Change this line:
pdfDoc: null, // Single PDF.js document reused for all pages
```

**Task 1.2**: Update renderPageToCanvas function (lines 653-719)

```javascript
// Find section around line 679:
// Load PDF document if not already loaded for this page
if (!db.pdfDocs.has(pageNumber)) {
  // DELETE these lines
  const loadingTask = pdfjsLib.getDocument({
    url: dataUrl,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
  });
  const pdfDoc = await loadingTask.promise;
  db.pdfDocs.set(pageNumber, pdfDoc);
}

const pdfDoc = db.pdfDocs.get(pageNumber); // DELETE THIS LINE

// REPLACE with POC approach:
// Load PDF document once
if (!db.pdfDoc) {
  const loadingTask = pdfjsLib.getDocument({
    url: dataUrl,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
  });
  db.pdfDoc = await loadingTask.promise;
}

const pdfDoc = db.pdfDoc; // Use single document
```

**Task 1.3**: Update clearAllRenderedPages function (lines 838-852)

```javascript
// Find around line 848:
db.pdfDocs.clear(); // DELETE THIS LINE

// REPLACE with:
db.pdfDoc = null;
```

**Task 1.4**: Update handleExtensionMessage function (lines 782-836)

```javascript
// Find around line 817:
db.pdfDocs.clear(); // DELETE THIS LINE (inside clearAllPages case)

// REPLACE with:
db.pdfDoc = null;
```

**Test**:

1. Load extension in VS Code dev host
2. Open a document and print preview
3. Monitor memory usage in performance HUD
4. Scroll through multiple pages
5. **Verify**: Memory should NOT increase linearly with pages viewed
6. **Verify**: Page rendering should be faster (no PDF parsing overhead)

---

### Step 2: Rename Canvas "Cache" to "Buffer"

**Why Second**: This is a quick terminology fix that makes the next steps clearer.

**Files**:

- `src/UIScrollView.ts`
- `src/UIScrollView.yaml`

**Task 2.1**: Update UIScrollView.ts class documentation (lines 20-39)

```typescript
// Find line 21:
/**
 * UIScrollView - Virtual scrolling document viewer with canvas pooling
 *
 * Renders multi-page documents using virtual scrolling and canvas pooling for
 * performance. Manages page cache, render queue, and scroll-synchronized canvas
 * updates. Generates HTML/CSS/JS for webview display from YAML templates.

// REPLACE "page cache" with "page buffers":
/**
 * UIScrollView - Virtual scrolling document viewer with canvas pooling
 *
 * Renders multi-page documents using virtual scrolling and canvas pooling for
 * performance. Manages canvas buffers, render queue, and scroll-synchronized
 * canvas updates. Generates HTML/CSS/JS for webview display from YAML templates.
```

**Task 2.2**: Update CONFIG constant (line 48)

```typescript
// Find line 48:
MAX_CANVAS_POOL_SIZE: 7, // Number of canvas elements for virtual scrolling

// REPLACE with:
CANVAS_BUFFERS_SIZE: 7, // Number of canvas buffer elements for virtual scrolling
```

**Task 2.3**: Update pageCache to pageBuffers (line 56)

```typescript
// Find line 56:
private pageCache: Map<number, PageData> = new Map();

// REPLACE with:
private pageBuffers: Map<number, PageData> = new Map();

// Update all references:
// Line 121: this.pageCache.clear(); → this.pageBuffers.clear();
// Line 140: this.pageCache.clear(); → this.pageBuffers.clear();
// Line 171: if (this.pageCache.has(pageNumber)) → if (this.pageBuffers.has(pageNumber))
// Line 173: return this.pageCache.get(pageNumber)!; → return this.pageBuffers.get(pageNumber)!;
// Line 183: return this.pageCache.get(pageNumber)!; → return this.pageBuffers.get(pageNumber)!;
// Line 202: this.pageCache.set(pageNumber, pageData); → this.pageBuffers.set(pageNumber, pageData);
// Line 225: this.pageCache.clear(); → this.pageBuffers.clear();
```

**Task 2.4**: Update YAML comments (UIScrollView.yaml)

```javascript
// Find line 108:
/* Canvas pool management */

// REPLACE with:
/* Canvas buffer management */

// Find line 146:
<!-- Canvas pool for performance -->

// REPLACE with:
<!-- Canvas buffer pool for performance -->

// Find line 750:
// Calculate actual memory usage:
// - Measure PDF page sizes after rendering
// - Include canvas memory overhead

// REPLACE with:
// Calculate actual memory usage:
// - Measure PDF page sizes after rendering
// - Include canvas memory overhead

// Find line 751:
const cachedPages = Math.min(renderedPages, CONFIG.canvasBuffersSize);

// REPLACE with:
const bufferedPageCount = Math.min(renderedPages, CONFIG.canvasBuffersSize);

// Find line 754:
const cachedMemoryMB = cachedPages * 2; // 2MB per cached page

// REPLACE with:
// Calculate actual memory usage using helper function
let totalMemoryMB = 0;
for (let i = 0; i < bufferedPageCount; i++) {
  const pgId = pageId(i + 1);
  totalMemoryMB += calculatePageMemoryUsage(pgId);
}
const bufferedMemoryMB = Math.round(totalMemoryMB * 100) / 100; // Round to 2 decimal places
```

**Test**:

1. Compile TypeScript: `npm run compile`
2. Check for compilation errors
3. Verify terminology is consistent

---

### Step 3: Add Helper Functions

**Why Third**: These functions will be used by the database restructuring in Step 4.

**File**: `src/UIScrollView.yaml`

**Task 3.1**: Add helper functions after db initialization (insert after line 216)

```javascript
// Database state management (POC approach - simple object)
const db = {
  // Canvas buffers: db.cb0 = { pg: 'pg5', status: 'render', domElementRef, renderTask }
  // Pages: db.pg5 = { cb: 'cb0', placeholder, wrapper, label }
  pdfDoc: null, // Single PDF.js document
  lastScrollTop: -999,
  scrollDirection: 'down',
  perfUpdateCounter: 0,
};

// DOM elements
const viewer = document.getElementById('scrollable-viewer');
// ... rest of DOM elements

// INSERT NEW HELPER FUNCTIONS HERE (before dx function):

// Get canvas element for page
function getCanvasForPage(pgId) {
  const cbId = db[pgId] && db[pgId].cb;
  return cbId ? db[cbId].domElementRef : null;
}

// Assign canvas to page (bidirectional)
function assignCanvasToPage(cbId, pgId) {
  // Clear old assignments from BOTH directions
  const oldPgId = db[cbId] && db[cbId].pg;
  if (oldPgId && db[oldPgId]) {
    db[oldPgId].cb = null;
  }

  const oldCbId = db[pgId] && db[pgId].cb;
  if (oldCbId && db[oldCbId]) {
    db[oldCbId].pg = null;
    db[oldCbId].status = '';
  }

  // Set new assignment
  db[cbId].pg = pgId;
  db[cbId].status = 'render';

  if (!db[pgId]) db[pgId] = {};
  db[pgId].cb = cbId;
}

// Unassign canvas (clear both directions)
function unassignCanvas(cbId) {
  const oldPgId = db[cbId] && db[cbId].pg;
  if (oldPgId && db[oldPgId]) {
    db[oldPgId].cb = null;

    // Show "Loading page X..." when canvas removed
    const placeholder = db[oldPgId].placeholder;
    if (placeholder) {
      const loadingText = placeholder.querySelector('.loading-text');
      if (loadingText) loadingText.style.display = 'block';
    }
  }

  // Remove canvas from DOM
  const canvas = db[cbId].domElementRef;
  if (canvas && canvas.parentElement) {
    canvas.parentElement.removeChild(canvas);
  }

  db[cbId].pg = null;
  db[cbId].status = '';
}

// Get available canvas
function getAvailableCanvas() {
  // First try available canvases
  const availableIds = getAllAvailableCanvasIds();
  if (availableIds.length > 0) {
    return db[availableIds[0]].domElementRef;
  }

  // Then try cancelled canvases
  const cancelledIds = getAllCancelledCanvasIds();
  if (cancelledIds.length > 0) {
    return db[cancelledIds[0]].domElementRef;
  }

  return null;
}

// Helper: Get all canvas IDs
function getAllCanvasIds() {
  return Object.keys(db).filter(k => k.startsWith('cb'));
}

// Helper: Get available canvas IDs
function getAllAvailableCanvasIds() {
  return getAllCanvasIds().filter(cbId => !db[cbId].pg && !db[cbId].status);
}

// Helper: Get cancelled canvas IDs
function getAllCancelledCanvasIds() {
  return getAllCanvasIds().filter(cbId => db[cbId].status === 'cancel');
}

// Helper: Get all page IDs
function getAllPageIds() {
  return Object.keys(db).filter(k => k.startsWith('pg'));
}

// ID generation helpers - centralized for easy maintenance
function pageId(pageNumber) {
  return `pg${pageNumber}`;
}

function canvasId(canvasNumber) {
  return `cb${canvasNumber}`;
}

// Parse canvas index from canvas ID (robust version using data-index)
function canvasIndex(cbId) {
  const canvas = db[cbId] && db[cbId].domElementRef;
  if (canvas && canvas.dataset.index) {
    return parseInt(canvas.dataset.index);
  }
  // Fallback to ID parsing if data-index not available
  return parseInt(cbId.replace('cb', ''));
}

// Parse page number from page ID (robust version using data-index)
function pageNumber(pgId) {
  const pageData = db[pgId];
  if (pageData && pageData.placeholder && pageData.placeholder.dataset.index) {
    return parseInt(pageData.placeholder.dataset.index);
  }
  // Fallback to ID parsing if data-index not available
  return parseInt(pgId.replace('pg', ''));
}

// Helper: Calculate memory usage for a rendered page
function calculatePageMemoryUsage(pgId) {
  const cbId = db[pgId] && db[pgId].cb;
  if (!cbId || !db[cbId].domElementRef) return 0;

  const canvas = db[cbId].domElementRef;
  const canvasMemory = (canvas.width * canvas.height * 4) / (1024 * 1024); // RGBA bytes to MB

  // Add PDF data memory (if available)
  let pdfMemory = 0;
  if (db.pdfDoc) {
    // Estimate PDF page data size (this is approximate)
    // PDF.js loads page data on-demand, so we can't measure exact size
    // But we can estimate based on canvas dimensions
    pdfMemory = (canvas.width * canvas.height * 0.1) / (1024 * 1024); // Rough estimate
  }

  return canvasMemory + pdfMemory;
}

// Send diagnostic message to extension
function dx(message) {
  // ... existing dx function
}
```


**Test**:

1. Compile: `npm run compile`
2. Load extension
3. Test helper functions in browser console:
   - `getAllCanvasIds()` should return `['cb0', 'cb1', ...]` (once Step 4 is done)
   - `getAvailableCanvasBuffer()` should return a canvas element

---

### Step 4: Unified Database Structure

**Why Fourth**: With helper functions in place, we can now restructure the database.

**File**: `src/UIScrollView.yaml`

**Task 4.1**: Update db initialization (lines 194-216)

```javascript
// BEFORE:
const db = {
  canvasPool: [],
  assignedCanvases: new Map(),
  availableCanvases: new Set(),
  renderedPages: new Map(),
  pendingPages: new Set(),
  failedPages: new Set(),
  pdfDoc: null,
  lastScrollTop: -999,
  scrollDirection: 'down',
  isScrolling: false,
  renderStartTime: 0,
  renderCount: 0,
  perfUpdateCounter: 0,
};

// AFTER (POC approach - simple object):
const db = {
  // Canvas buffers: db.cb0 = { pg: 'pg5', status: 'render', domElementRef, renderTask }
  // Pages: db.pg5 = { cb: 'cb0', placeholder, wrapper, label }
  // Canvas buffers (cb0...cb6) and pages (pg1...pgN) will be added dynamically
  pdfDoc: null, // Single PDF.js document
  lastScrollTop: -999,
  scrollDirection: 'down',
  perfUpdateCounter: 0,
};
```

**Task 4.2**: Update createDOMElements_Canvas function (lines 256-267)

```javascript
// BEFORE:
function createCanvasPool() {
  for (let i = 0; i < CONFIG.maxCanvases; i++) {
    const canvas = document.createElement('canvas');
    canvas.id = `cb${i}`;
    canvas.className = 'page-canvas';
    canvasPool.appendChild(canvas);
    db.canvasPool.push(canvas);
    db.availableCanvases.add(canvas.id);
  }
}

// AFTER:
function createDOMElements_Canvas() {
  for (let i = 0; i < CONFIG.canvasBuffersSize; i++) {
    const canvas = document.createElement('canvas');
    canvas.id = canvasId(i); // Use helper function
    canvas.className = 'page-canvas';
    canvas.dataset.index = i; // Store canvas index for robust access
    canvasContainer.appendChild(canvas);

    // Store in db with cb prefix
    db[canvasId(i)] = {
      pg: null,
      status: '',
      domElementRef: canvas,
      renderTask: null,
    };
  }
  dx(`Created canvas buffer pool with ${CONFIG.canvasBuffersSize} buffers`);
}
```

**Task 4.3**: Update configurePlaceholders function (lines 269-319)

```javascript
// Find where placeholders are created (around line 291):
const placeholder = document.createElement('div');
placeholder.id = `page-${i}`;
placeholder.className = 'page-placeholder loading';
placeholder.dataset.index = i; // Store page index for robust access
placeholder.style.width = '{{PAGE_WIDTH_PX}}px';
placeholder.style.height = '{{PAGE_HEIGHT_PX}}px';
placeholder.innerHTML = `
  <div class="page-label">Page ${i}</div>
`;
content.appendChild(placeholder);

// ADD after content.appendChild(placeholder):
// Store in db with pg prefix
const pgId = pageId(i);
if (!db[pgId]) db[pgId] = {};
db[pgId].placeholder = placeholder;
db[pgId].cb = null; // No canvas assigned yet
dx(`Created placeholder for ${pgId}`);
```

**Task 4.4**: Update ALL references to old db properties

**Search and replace patterns** (use find/replace in editor):

1. `db.assignedCanvases.get(` → `db[`pg${`].cb` (manual fix needed)
2. `db.assignedCanvases.set(pageNumber, canvasId)` → Use `assignCanvasToPage()`
3. `db.assignedCanvases.delete(pageNumber)` → Use `unassignCanvas()`
4. `db.assignedCanvases.has(pageNumber)` → `db[`pg${pageNumber}`] && db[`pg${pageNumber}`].cb`
5. `db.availableCanvases` → Replace with `getAllAvailableCanvasIds()`
6. `db.renderedPages` → Remove (use direct db queries)
7. `db.pendingPages` → Remove (use direct db queries)

**Manual fix locations**:

- Line 424: `db.assignedCanvases.has(pageNum)`
- Line 441: `for (const [pageNumber, canvasId] of db.assignedCanvases)`
- Line 483: `if (db.assignedCanvases.has(pageNumber))`
- Line 507: `db.assignedCanvases.set(pageNumber, canvasId)`
- Line 532: `const canvasId = db.assignedCanvases.get(pageNumber)`
- Line 558: `db.assignedCanvases.delete(pageNumber)`
- Line 618: `const canvasId = db.assignedCanvases.get(pageNumber)`
- Line 730: `const pageCount = db.assignedCanvases.size`
- Line 766: `const assignedEntry = Array.from(db.assignedCanvases.entries())`

**Example manual fix** (line 424):

```javascript
// BEFORE:
const hasCanvas = db.assignedCanvases.has(pageNum);

// AFTER:
const pgId = `pg${pageNum}`;
const hasCanvas = db[pgId] && db[pgId].cb;
```

**Test**:

1. Compile: `npm run compile`
2. Fix any TypeScript errors
3. Load extension in dev host
4. Test scrolling behavior
5. **Verify**: HUD should show canvas↔page assignments correctly
6. **Verify**: Canvas buffers should assign/unassign properly

---

### Step 5: Canvas ID Consistency

**Why Fifth**: With database restructured, we can now ensure consistent IDs.

**File**: `src/UIScrollView.yaml`

**Status**: ✅ **COMPLETED** - All canvas ID consistency updates were completed in previous steps.

**What was done**:

1. **Canvas Creation**: Updated to use `cb0...cb6` format consistently
2. **Database Structure**: Uses `cb0...cb6` for canvas buffers and `pg1...pgN` for pages  
3. **Helper Functions**: Updated to work with new ID format
4. **DOM References**: Simplified to use `canvas.id` directly (no more `dataset.cbId`)

**Current State**:

- Canvas creation: `canvas.id = 'cb${i}'` 
- Database keys: `db.cb0`, `db.cb1`, etc.
- Page keys: `db.pg1`, `db.pg2`, etc.
- Helper functions: `getCanvasForPage()`, `assignCanvasToPage()`, `unassignCanvas()`
- HUD display: `c0:p1, c1:p2, ...` format

**Verification**:

1. Compile: `npm run compile`
2. Load extension
3. **Verify**: Canvas IDs in HUD show as `c0:p1, c1:p2, ...`
4. **Verify**: Database structure uses `cb0...cb6` and `pg1...pgN`
5. **Verify**: No references to old `canvas-0` or `canvas-${i}` patterns

---

### Step 6: Compact HUD Logging

**Why Last**: With all infrastructure in place, we can now add better logging.

**File**: `src/UIScrollView.yaml`

**Task 6.1**: Add updateHudStatus function (insert after helper functions, before dx function)

```javascript
// Canvas buffer status constants
const kCBStatus = {
  requesting: { key: 'requesting', char: '❓' },
  clearing: { key: 'clearing', char: '❌' },
  assigned: { key: 'assigned', char: ':' },
  available: { key: 'available', char: ':' }
};

// Update HUD with emoji status
function updateHudStatus(cbId, status, pageNumber) {
  const cbIndex = canvasIndex(cbId);
  const hudElement = document.getElementById('canvas-assignments');
  if (!hudElement) return;

  const assignments = hudElement.textContent.split(' ');
  const statusInfo = kCBStatus[status];
  
  if (statusInfo) {
    // Always use a valid page number - 0 for available, actual page number for others
    const pageDisplay = status === 'available' ? 0 : (pageNumber || 0);
    assignments[cbIndex] = `c${cbIndex}${statusInfo.char}p${pageDisplay}`;
  }

  hudElement.textContent = assignments.join(' ');
  dx(`HUD: ${assignments.join(' ')}`);
}
```

**Task 6.2**: Integrate into assignCanvasToPage helper

```javascript
// Find in assignCanvasToPage function:
function assignCanvasToPage(cbId, pgId) {
  // ... existing bidirectional linking code

  // Set new assignment
  db[cbId].pg = pgId;
  db[cbId].status = 'render';

  if (!db[pgId]) db[pgId] = {};
  db[pgId].cb = cbId;

  // ADD HERE:
  updateHudStatus(cbId, 'requesting', pageNumber);
}
```

**Task 6.3**: Integrate into unassignCanvas helper

```javascript
// Find in unassignCanvas function:
function unassignCanvas(cbId) {
  const oldPgId = db[cbId] && db[cbId].pg;

  // ADD HERE (before clearing):
  if (oldPgId) {
    updateHudStatus(cbId, 'clearing', oldPageNumber);
  }

  // ... existing unassign logic

  db[cbId].pg = null;
  db[cbId].status = '';

  // ADD HERE (after clearing):
  updateHudStatus(cbId, 'available', 0);
}
```

**Task 6.4**: Integrate into renderPageToCanvas function

```javascript
// Find in renderPageToCanvas function (around line 709):
await page.render({
  canvasContext: ctx,
  viewport: viewport,
}).promise;

// ADD AFTER render completes:
const cbId = canvas.id;
const pgId = pageId(pageNumber);
updateHudStatus(cbId, 'assigned', pageNumber);
```

**Task 6.5**: Update existing HUD calls

**Search for**: `hudElement.textContent = assignments.join(' ');`
**Replace with**: Call to `updateHudStatus()` where appropriate

**Locations**:

- Line 502: In assignCanvasToPage (already done in Task 6.2)
- Line 542: In unassignCanvas (already done in Task 6.3)
- Line 778: In updateCanvasAssignments (keep as-is for periodic full update)

**Test**:

1. Compile: `npm run compile`
2. Load extension
3. Open print preview
4. Watch HUD display as you scroll:
   - See `c0❓p1` (requesting page 1 for canvas 0)
   - See `c0:p1` (page 1 assigned to canvas 0)
   - See `c0❌p1` (clearing page 1 from canvas 0)
   - See `c0:p0` (canvas 0 available)
5. **Verify**: All transitions visible in HUD
6. **Verify**: Logging is more compact

---

## Testing Strategy

### Unit Tests

1. **Test Helper Functions**:
   - `getCanvasForPage()` returns correct canvas
   - `assignCanvasToPage()` creates bidirectional links
   - `unassignCanvas()` clears both directions
   - `getAvailableCanvas()` finds next free canvas

2. **Test Database Structure**:
   - Canvas buffer properties: `pg`, `status`, `domElementRef`, `renderTask`
   - Page properties: `cb`, `placeholder`
   - Bidirectional consistency: `db[cbId].pg === pgId` ⟺ `db[pgId].cb === cbId`

### Integration Tests

1. **Single PDF.js Document**:
   - Load document
   - Render page 1
   - Verify `db.pdfDoc` is set
   - Render page 2
   - Verify `db.pdfDoc` is REUSED (not re-created)
   - Check memory usage

2. **Canvas Buffer Management**:
   - Start with 7 canvases
   - Scroll through 20 pages
   - Verify max 7 canvases active at any time
   - Verify canvases reassigned to new pages

3. **HUD Logging**:
   - Scroll down
   - Verify HUD shows `c0❓p8` (requesting)
   - Verify HUD updates to `c0:p8` (assigned)
   - Scroll up
   - Verify HUD shows `c0❌p8` (clearing)
   - Verify HUD updates to `c0:p2` (reassigned)

### Performance Tests

1. **Memory Usage**:
   - Open 100-page document
   - Scroll through all pages
   - Verify memory stays bounded (measured dynamically for 7 buffers + PDF)
   - NO linear growth with pages viewed

2. **Render Speed**:
   - Time first page render (includes PDF loading)
   - Time subsequent page renders (should be faster)
   - Verify no repeated PDF parsing

3. **Scroll Responsiveness**:
   - Fast scroll through document
   - Verify no stuttering
   - Verify canvas buffers reassign smoothly

---

## Success Criteria

### Must Have

1. ✅ **Single PDF.js document** reused for all pages (not one per page)
2. ✅ **Unified database structure** with bidirectional canvas↔page linking
3. ✅ **Canvas buffer terminology** (not "cache")
4. ✅ **Helper functions** for clean abstraction
5. ✅ **Compact HUD logging** with emoji status indicators
6. ✅ **Canvas ID consistency** (cb0...cb6 in both db and DOM)

### Performance Goals

1. **Memory bounded**: O(1) PDF documents (not O(N))
2. **Fast rendering**: No repeated PDF parsing per page
3. **Smooth scrolling**: 60fps with requestAnimationFrame throttling

### Code Quality

1. **Matches POC architecture**: Simple, direct, understandable
2. **Easy to debug**: HUD shows all canvas states at once
3. **Well-documented**: Comments explain bidirectional linking

---

## Rollback Plan

If any step fails:

1. **Step 1 fails**: Revert to `pdfDocs: new Map()` approach
   - But this is the critical bug - must be fixed
   - Debug: Check PDF.js console errors

2. **Step 2 fails**: Keep "cache" terminology
   - Low risk - just naming

3. **Step 3 fails**: Remove helper functions, use inline logic
   - Risk: Code will be harder to maintain

4. **Step 4 fails**: Revert to Map/Set approach
   - Risk: Lose bidirectional linking benefits
   - Keep legacy `_renderedPages` and `_pendingPages` as fallback

5. **Step 5 completed**: Canvas ID consistency already implemented
   - Low risk - just naming consistency

6. **Step 6 fails**: Keep verbose logging
   - Low risk - just logging improvement

**Emergency Rollback**:

- Restore `src/UIScrollView.yaml` from git: `git checkout HEAD -- src/UIScrollView.yaml`
- Restore `src/UIScrollView.ts` from git: `git checkout HEAD -- src/UIScrollView.ts`

---

## Post-Implementation

### Cleanup Tasks

1. Remove legacy tracking:
   - Delete `db._renderedPages` after all references updated
   - Delete `db._pendingPages` after all references updated

2. Update documentation:
   - Update AGENTS.md with new database structure
   - Update README.md with canvas buffer terminology

3. Add tests:
   - Unit tests for helper functions
   - Integration tests for canvas buffer management
   - Performance tests for memory usage

### Future Enhancements

1. **Dynamic buffer size**: Adjust buffer count based on viewport size
2. **Render prioritization**: Prioritize visible pages over buffer pages
3. **Prefetch strategies**: Smart page prefetching based on scroll velocity
4. **Memory pressure handling**: Reduce buffer count if memory constrained

---

## References

- **POC File**: `tests/scrollpoc.html` (lines 160-531)
- **Production File**: `src/UIScrollView.yaml` (lines 168-937)
- **Architecture Doc**: `AGENTS.md`
- **PR Discussion**: GitHub PR #26 - CodeRabbit's recommendations
- **PDF.js Docs**: <https://mozilla.github.io/pdf.js/>
- **jsPDF Docs**: <https://github.com/parallax/jsPDF>

---

## Glossary

- **Canvas Buffer (cb)**: Physical canvas element (limited pool, e.g., 7 total)
- **Page (pg)**: Logical document page (unlimited, e.g., 100 pages)
- **Bidirectional Linking**: Canvas knows its page, page knows its canvas
- **HUD**: Heads-up display showing canvas buffer assignments
- **POC**: Proof-of-concept implementation (scrollpoc.html)
- **Production**: Current extension implementation (UIScrollView.yaml)
- **PDF.js**: Client-side PDF rendering library (webview)
- **jsPDF**: Server-side PDF generation library (extension)
- **Shiki**: Server-side syntax highlighting library (extension)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-20  
**Author**: AI Assistant (based on user research requirements)  
**Status**: Ready for Implementation
