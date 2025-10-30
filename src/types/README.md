# Types Directory

This directory contains TypeScript type definitions for our project.

## Files

### Custom Type Definitions

- **`jspdf.d.ts`** - Type definitions for jsPDF library
- **`PageRender_t.ts`** - Page rendering types
- **`PaperPrinter_t.ts`** - Paper printer configuration types
- **`PDF_t.ts`** - PDF data structure types
- **`theme_t.ts`** - Theme and syntax highlighting types
- **`UI_t.ts`** - UI component types

### Reference Type Definitions

- **`vscode.d.ts`** - VS Code Extension API type definitions (for reference)
  - Source: https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts
  - Version: VS Code 1.103 API
  - Purpose: Local reference copy for API research and documentation
  - Note: The actual types used by our code come from `@types/vscode` npm package

## Why Do We Have vscode.d.ts?

While our code uses the `@types/vscode` package from npm (installed in `node_modules`), we maintain a local copy of `vscode.d.ts` for:

1. **Documentation Reference** - Easy access to API definitions when researching features
2. **API Research** - Grep/search through VS Code API without needing internet access
3. **Version History** - Track what APIs are available in specific VS Code versions
4. **Offline Development** - No need to visit online docs for API signatures

The local copy is for **reference only** and does not affect compilation. TypeScript will use the npm package from `node_modules/@types/vscode/`.

## Updating vscode.d.ts

To update the reference copy to the latest version:

```bash
curl -o src/types/vscode.d.ts "https://raw.githubusercontent.com/microsoft/vscode/main/src/vscode-dts/vscode.d.ts"
```

Or update the npm package:

```bash
npm update @types/vscode
```
