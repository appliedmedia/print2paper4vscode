# src/types

TypeScript type definitions and the extension ID source of truth.

## Extension ID source of truth

* `_entrypoint_extId_t.ts` — defines `kExtId`, command suffix constants, and external URLs. This is the single source of truth for the extension namespace. `scripts/generate-package-json.mjs` reads it to populate `{{extId}}` and related placeholders in `config/template.package.json`. Change the extension ID here, not in `package.json`.

## Type definition files

* `PDF_t.ts` — PDF generation data structures.
* `PaperPrinter_t.ts` — paper printer configuration types.
* `PageRender_t.ts` — page layout and rendering types.
* `Registry_t.ts` — dependency injection registry types.
* `UIMenu_t.ts` — toolbar menu system types.
* `UI_t.ts` — webview UI component types.
* `OS_t.ts` — platform abstraction types.
* `theme_t.ts` — Shiki theme and syntax highlighting types.

## VS Code API reference

* `vscode.d.ts` — local copy of the VS Code Extension API type definitions for offline reference and grep. The actual types used at compile time come from `@types/vscode` in `node_modules`. Update with:

```bash
curl -o src/types/vscode.d.ts "https://raw.githubusercontent.com/microsoft/vscode/main/src/vscode-dts/vscode.d.ts"
```
