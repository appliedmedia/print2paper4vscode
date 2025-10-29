# Proposed Refactoring V2: Separate Setup from Display

## Better Pattern: Setup Once, Display Many Times

### Part 1: One-Time Setup (only on first display)

```typescript
private verifyWebview(): void {
  if (!this.uiwebview) {
    this.uiwebview = new UIWebView(this.app);
    this.uiwebview.init();
  }
}
```

### Part 2: Display/Refresh Logic (same code for both)

```typescript
private async displayPdfInWebview(tabName: string): Promise<void> {
  const dx = this.dx.sub('displayPdfInWebview');

  try {
    // Generate PDF if needed
    await this.generatePdf();

    if (!this.pdfDoc) {
      throw new Error('PDF document not generated');
    }

    // Get PDF data
    const pageTotal = this.pdfDoc.pageTotal;
    const pageSizePx = await this.app.pdf.getPageSizePx();

    const pdfData = {
      arrayBuffer: this.pdfDoc.asArrayBuffer(),
      pageTotal,
      pageSizePx,
      title: `Print: ${tabName}`,
    };

    // Display in webview (works for both initial and refresh)
    await this.uiwebview!.displayPdfPanel(pdfData);

    dx.out(`Displayed PDF in webview: ${pageTotal} pages`);
  } finally {
    dx.done();
  }
}
```

### Part 3: Clear caches before regeneration

```typescript
private clearPdfCaches(): void {
  this.app.pdf.invalidateAllCaches();
}
```

### Then refactor the two methods:

**Initial Display:**

```typescript
private async openWebView(tabName: string): Promise<void> {
  const dx = this.dx.sub('openWebView');

  try {
    this.verifyWebview();  // One-time setup
    await this.displayPdfInWebview(tabName);  // Display PDF
    dx.out(`Opened webview for ${tabName}`);
  } catch (error) {
    dx.error(`Failed to open webview: ${String(error)}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

**Refresh/Update:**

```typescript
private async regenerateAndUpdateWebview(): Promise<void> {
  const dx = this.dx.sub('regenerateAndUpdateWebview');

  try {
    this.clearPdfCaches();  // Clear old data
    const tabName = this.docInfo.printTitle || 'Document';
    await this.displayPdfInWebview(tabName);  // Display PDF (same as initial!)
    dx.out('Webview regenerated and updated successfully');
  } catch (error) {
    dx.error(`Error regenerating PDF: ${error}`);
    throw error;
  } finally {
    dx.done();
  }
}
```

## Key Insight

- **`displayPdfInWebview()`** does the heavy lifting
- It's called BOTH initially and on refresh
- Initial adds one-time setup before calling it
- Refresh adds cache clearing before calling it
- But the actual PDF display logic is **100% shared**

## What This Fixes

1. ✅ Both use createPDFPanel() (new system)
2. ✅ No more PageRender/updatePageRender (old system removed)
3. ✅ No more clearAllPages messages (PDF.js handles it)
4. ✅ Single display logic = consistent behavior
5. ✅ Clear separation: setup vs. display vs. clear

## Benefits Over V1

- Clearer intent: "ensure initialized" vs. "display PDF" vs. "clear caches"
- Single responsibility: each helper does ONE thing
- More DRY: displayPdfInWebview is the ONLY place that loads PDF into webview

Does this approach make more sense?
