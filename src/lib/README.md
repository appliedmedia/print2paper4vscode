# src/lib

Vendored third-party libraries bundled directly into the extension.

## Files

* `pdf.min.js` — PDF.js viewer library. Renders PDF data URLs in the webview panel.
* `pdf.worker.min.js` — PDF.js web worker. Handles PDF parsing off the main thread.

These files are the client-side half of the three-library PDF pipeline: Shiki (tokenize) → jsPDF (generate) → PDF.js (render). They run inside the VS Code webview context, not the extension host.

Update by downloading the matching release from [mozilla/pdf.js](<https://github.com/mozilla/pdf.js/releases>).
