# src

TypeScript source for the Print2Paper4VSCode extension.

## Entry point

* `-entrypoint.ts` — VS Code `activate` / `deactivate` lifecycle. Instantiates `App` and registers the extension with the VS Code runtime.

## Core components

* `App.ts` — top-level orchestrator. Constructs and wires all components via the Registry.
* `PaperPrinter.ts` — print workflow coordinator. Handles command dispatch, menu selections, PDF regeneration, and print output routing.
* `Stylize.ts` — syntax highlighting via Shiki. Tokenizes source code and maps tokens to colors for PDF rendering.
* `PDF.ts` — PDF generation via jsPDF. Converts Shiki token arrays into an in-memory vector PDF.
* `UI.ts` — webview panel management. Builds the HTML shell, embeds PDF.js, and wires the toolbar.
* `UIMenu.ts` / `UIMenuMgr.ts` — dynamic toolbar menu system. Declarative menu definitions with flyout support and live selection handlers.
* `TabInspector.ts` — active editor introspection. Detects file type and extracts content or selection.
* `VSCodeAPIs.ts` — single point of contact for all VS Code API calls.
* `Registry.ts` — dependency injection container. All components register here; no hidden singletons.
* `Persist.ts` — VS Code global and workspace state persistence.
* `Diagnostics.ts` — hierarchical logging with performance timing.
* `Coords.ts` — page layout and coordinate calculations.
* `OS.ts` / `OSMac.ts` / `OSWin.ts` / `OSLinux.ts` — platform abstraction layer for print and file operations.
* `Utils.ts` — shared utility functions.
* `Yaml.ts` — YAML config loader used by component `.yaml` sidecar files.
* `UIWebView.ts` — webview content security and resource URI helpers.

## Subdirectories

* `lib/` — vendored third-party libraries (PDF.js). See `lib/README.md`.
* `types/` — TypeScript type definitions and the extension ID source of truth. See `types/README.md`.
