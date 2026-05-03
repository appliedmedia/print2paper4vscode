# Print2Paper4VSCode

A VS Code extension that captures content from the active editor, applies syntax highlighting, generates a vector PDF, and provides multiple printing options through an interactive webview interface.

## Quick Links

- **[Developer Guide (point-in-time reference)](docs/2026-04-12_info_DeveloperGuide.md)** - Background-agent branch cleanup and three-library architecture notes
- **[VSCode APIs](docs/VSCodeAPIs.md)** - API integration details
- **[Marketplace README](docs/MARKETPLACE.md)** - End-user-facing README that ships to the VS Code marketplace listing (developers should not edit this file as a substitute for the repo README; the two have separate audiences and are shipped via `vsce publish --readme-path`)

Run `npm run test:coverage` to generate full coverage report.

## Platform Support

All three platforms ship with native print integration in 1.0.0.

### macOS

- AppleScript-driven Preview integration
- Direct print to the default printer
- Print dialog support

### Windows (PR #112)

- PowerShell-driven `System.Windows.Forms.PrintDialog`
- Structured failure-mode handling for missing printers, missing PDF readers, and other error paths
- CI runs the Windows print path on `windows-latest`

### Linux (PRs #105, #110)

- CUPS detection plus viewer selection (Okular, Evince, and other common PDF viewers)
- Smoke-tested error paths in CI

## How It Actually Works

The extension follows this workflow:

1. **Capture Active Editor Content**:
   - Uses VS Code APIs to directly access editor content
   - Detects selection or captures entire document
   - Identifies language for syntax highlighting

2. **Syntax Highlighting & Tokenization**:
   - Uses Shiki to tokenize code with VS Code theme support
   - Fallback to 'github-light' theme if current theme unavailable
   - Preserves colors and styling from the active theme

3. **PDF Generation**:
   - Creates vector PDF using jsPDF (in-memory)
   - Maps themed tokens to PDF text with colors
   - Supports configurable page sizes and orientations
   - Applies user-selected font sizes and line heights
   - **Multi-page support:** Automatically calculates page breaks

4. **Interactive Webview Preview**:
   - Opens webview panel titled "Printable: {document name}"
   - Embeds PDF using PDF.js for client-side rendering
   - Provides interactive toolbar with dynamic menus
   - Shows exactly what will be printed

5. **Print & Export Options**:
   - **Print with Preview**: Saves temp PDF and opens in Preview app
   - **Print Directly**: Sends PDF to printer via OS commands
   - **Save as PDF**: Shows save dialog for PDF export

## Features

- **Direct Editor Access**: Captures content directly from VS Code editor using APIs
- **Syntax Highlighting**: Shiki-based highlighting with VS Code theme integration
- **Vector PDF Generation**: Creates scalable PDFs using jsPDF
- **Multi-Page Support**: Handles long documents with accurate page breaking
- **Interactive Webview**: PDF.js-powered preview with live toolbar menus
- **Dynamic Menu System**: Real-time theme, page size, and font size switching
- **Multiple Print Options**: Preview dialog, direct printing, or PDF saving
- **Persistent Settings**: Remembers page size, orientation, and toolbar position
- **Keyboard Shortcuts**: Quick access via keyboard commands

## Quick Start

Prerequisites: Node.js 20+ and npm. Install via the platform installer of your choice (e.g., `brew install node` on macOS, `winget install OpenJS.NodeJS.LTS` on Windows, your distribution's package manager on Linux).

```bash
npm install
npm run compile
```

This installs project dependencies and compiles the TypeScript to JavaScript. To run the extension in an Extension Development Host, open the project in VS Code and press F5.

## Installation

### Local Development Installation

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Compile the Extension**:

   ```bash
   npm run compile
   ```

3. **Open in VSCode**:

   ```bash
   code .
   ```

4. **Press F5** to run the extension in a new Extension Development Host window

### Prerequisites

- **Node.js**: Required for PDF generation using jsPDF (works on all platforms)
- **macOS / Windows / Linux**: Native print integration ships on all three (see Platform Support above)
- **VS Code**: Version 1.60.0 or higher

## Using the Extension

There are three ways to invoke Print2Paper on the active editor:

- **Keybinding**: Press **Alt+P** (same on macOS, Windows, and Linux). Bound to the `p2p4vsc.print2paper` command.
- **Context menu**: Right-click in the editor and choose **Print2Paper**.
- **Command Palette**: Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and run **Print: Print2Paper**.

If you have a selection, only the selection is printed; otherwise the entire document is printed. A second command, **Print: Clear State** (`p2p4vsc.persistClear`), is available from the Command Palette to reset persisted preview settings (page size, font, toolbar position) if they ever get into a bad state.

## Technical Implementation

### Three-Library PDF Pipeline

The extension uses three distinct libraries for different purposes:

1. **Shiki** (Server-side): Tokenizes source code with syntax highlighting themes
   - Converts raw source code → `ThemedToken[][]` arrays with colors/styles
   - Runs in VS Code extension context with theme support

2. **jsPDF** (Server-side): Creates vector PDF documents in memory
   - Converts Shiki tokens → In-memory PDF document with styled text
   - Handles page layout, fonts, and PDF generation
   - Outputs PDF as data URL or buffer for saving/printing

3. **PDF.js** (Client-side): Renders PDF documents in the webview
   - Converts PDF data URL → Canvas rendering in browser
   - Handles zoom, scrolling, and interactive PDF display
   - Runs in webview context for user preview

### Flow: Source Code → Shiki → jsPDF → PDF.js → User

- **Content Capture**: Direct VS Code API access to editor content and selections
- **Print Integration**: Per-platform print path — AppleScript on macOS, PowerShell on Windows, CUPS-based on Linux (see `OSMac`/`OSWin`/`OSLinux` in the OS abstraction layer)
- **Menu Management**: Generic UIMenu system with flyout support and selection handlers
- **State Management**: Global state persistence for user preferences
- **Diagnostics**: Hierarchical logging system with performance timing

## Execution Flow Architecture

### 1. Extension Activation Flow

```text
VSCode Extension System
    ↓
src/-entrypoint.ts:activate()
    ↓
new App(context, vscode)
    ↓
App Constructor:
  - Creates all component instances
  - VSCodeAPIs, UI, OS, PDF, PaperPrinter, Stylize, TabInspector, UIMenuMgr
    ↓
app.init()
    ↓
Component Initialization Order:
  - VSCodeAPIs.init() → Registers 'p2p4vsc.print2paper' command
  - UI.init(), OS.init(), PDF.init(), PaperPrinter.init(), Stylize.init(), TabInspector.init(), UIMenuMgr.init()
```

### 2. Print Command Execution Path

```text
User Action (Alt+P or Right-click → Print)
    ↓
VSCode Command System
    ↓
VSCodeAPIs: 'p2p4vsc.print2paper' command handler
    ↓
PaperPrinter.handleFirstPrintCommand()
    ↓
TabInspector.detectActiveTabCategory()
    ↓
TabInspector.getEditorSelectionOrAll()
    ↓
Stylize.styleToPdf() → Shiki tokenization
    ↓
PDF.generatePdfFromTokens() → jsPDF creation
    ↓
PaperPrinter.openPrintPrepAndPrompt()
    ↓
UI.htmlToWebViewPanel() → PDF.js webview
```

### 3. Detailed Component Flow

#### A. Content Detection & Extraction

```text
TabInspector.detectActiveTabCategory()
  ├── 'editor-nonmd' → Regular code files
  ├── 'editor-md' → Markdown files
  └── 'preview' → Webview/preview tabs

TabInspector.getEditorSelectionOrAll()
  ├── If selection exists → Return selected text
  └── If no selection → Return entire document
```

#### B. Syntax Highlighting & PDF Generation

```text
Stylize.styleToPdf()
  ├── Determine theme (specified or active editor theme)
  ├── Validate highlighter (lazy initialization)
  ├── Tokenize code with Shiki
  ├── Extract font info from theme
  └── Generate PDF via PDF.generatePdfFromTokens()

PDF.generatePdfFromTokens()
  ├── Get page size/orientation from global state
  ├── Calculate content height and page dimensions
  ├── Initialize jsPDF with user preferences
  ├── Map font family to jsPDF supported fonts
  ├── Render tokens with colors and styling
  └── Return in-memory PDF document
```

#### C. Webview UI System

```text
UI.htmlToPanel()
  ├── PDF.embedPDFinHTML() → Convert PDF to data URL
  ├── VSCodeAPIs.createWebviewPanel() → Create webview
  ├── UI.addToolbar() → Add interactive toolbar
  └── Setup message handling

UI.addToolbar()
  ├── UIMenuMgr.getAllUIMenuHTML() → Generate menu HTML
  ├── UIMenuMgr.getAllUIMenuJS() → Generate menu JavaScript
  └── Template replacement with toolbar HTML/CSS/JS
```

#### D. Menu System Architecture

```text
UIMenuMgr.createMenu() → UIMenu instances
  ├── Print Menu (🖨) → Preview, Direct, Save
  ├── Page Menu (📄) → Page sizes + Orient submenu
  ├── Orient Submenu → Portrait, Landscape
  ├── Theme Menu (🎨) → Available themes
  └── Text Menu (Tt) → Font sizes

Menu Selection Flow:
  ├── Webview message → UI.handleWebviewMessage()
  ├── PaperPrinter.handleMenuItemSelected()
  ├── UIMenu.dispatchSelection()
  ├── Menu-specific handler (e.g., handleSelection_Theme)
  ├── Regenerate PDF with new settings
  └── UI.updatePdfContentOnly() → Update webview
```

#### E. Print Output Options

```text
PDF Output Methods:
  ├── printWithPreview() → Save temp PDF → Open in Preview app
  ├── printDirectly() → Save temp PDF → Send to printer via OS
  └── saveAsPDF() → Show save dialog → Save to chosen location

OS Platform Abstraction:
  ├── OSMac → AppleScript for printing
  ├── OSWin → Windows printing commands
  └── OSLinux → Linux printing commands
```

### 4. Memory Management & State

```text
In-Memory Storage:
  ├── PaperPrinter.pdfRendered → Current jsPDF document
  ├── PaperPrinter.currentThemeChoice → Selected theme
  ├── PaperPrinter.currentFontSizeMode → Selected font size
  ├── PaperPrinter.currentPageSize → Selected page size
  └── PaperPrinter.currentOrientation → Selected orientation

Global State (VS Code):
  ├── 'pageSize' → User's page size preference
  ├── 'orientation' → User's orientation preference
  └── 'toolbarPos' → Toolbar position for persistence
```

### 5. Error Handling & Diagnostics

```text
Diagnostics System:
  ├── Hierarchical logging with method context
  ├── Performance timing for each method
  ├── Argument validation with require()
  └── Debug state inheritance from parent contexts

Error Recovery:
  ├── Theme fallback to 'github-light'
  ├── Font fallback to 'Courier'
  ├── Plain text fallback on highlighting failure
  ├── Structured per-OS failure-mode handling (missing printer, missing PDF reader)
  └── User feedback via UI.showErrorMessage()
```

## Architecture Overview

### Core Components

- **App**: Main orchestrator that coordinates all components
- **PaperPrinter**: Core printing functionality and workflow coordination
- **PDF**: Creates PDFs using jsPDF (vector-based rendering)
- **Stylize**: Handles syntax highlighting using Shiki
- **TabInspector**: Inspects active editor tabs and extracts content
- **VSCodeAPIs**: Centralizes all VS Code API interactions
- **UI**: Manages webview panels and user interface
- **OS**: Cross-platform OS operations abstraction

### Key Architecture Points

1. **Modular Design**: Each class has a specific responsibility
2. **In-Memory PDF**: Uses jsPDF to create vector PDFs directly in memory
3. **Theme Integration**: Uses Shiki for syntax highlighting with VS Code theme support
4. **Webview UI**: Creates interactive preview using VS Code's webview API with PDF.js
5. **Cross-Platform**: OS abstraction layer handles platform-specific operations
6. **Error Handling**: Comprehensive diagnostics throughout the flow

## Current Status

### Working Components

- ✅ jsPDF vector PDF generation
- ✅ Shiki syntax highlighting with theme support
- ✅ Webview panel with PDF.js rendering
- ✅ Interactive toolbar with dynamic menus
- ✅ Theme switching without regeneration
- ✅ Page size and orientation configuration
- ✅ Font size adjustment (8px to 24px)
- ✅ Native printing on macOS (AppleScript), Windows (PowerShell), and Linux (CUPS)
- ✅ Multi-page PDF generation

### Known Limitations

- **Preview Tabs**: Printing from preview/webview tabs (custom previews, notebooks, image editors) is not supported as a print target; only standard text editors
- **Font Support**: Limited to jsPDF-supported fonts (Courier, Helvetica, Times); themes that rely on other fonts fall back to the closest match
- **Large Files**: Very large files (hundreds of pages) may render slowly

## Documentation

- **[Developer Guide (point-in-time reference)](docs/2026-04-12_info_DeveloperGuide.md)** - Background-agent branch cleanup and three-library architecture notes
- **[VSCode APIs](docs/VSCodeAPIs.md)** - VS Code API integration details
- **[Marketplace README](docs/MARKETPLACE.md)** - End-user-facing README that ships to the marketplace listing
- **[Marketplace Changelog](docs/MARKETPLACE_CHANGELOG.md)** - End-user-facing changelog that ships to the marketplace listing
- **[Plans directory](docs/plans/)** - Active and completed swimlane plan documents (working docs, not reference docs)

## Development

- **Source**: TypeScript files in `src/` directory
- **Build Output**: Compiled JavaScript in `out/` directory
- **Package Config**: `package.json` with extension manifest
- **Test Files**: Test suite in `tests/` directory

## Testing

Run the test suite:

```bash
npm test
```

The extension uses Node.js built-in test runner (`node:test`) with comprehensive tests for:

- PDF generation and page size/orientation
- Syntax highlighting with Shiki
- Menu system functionality
- OS platform operations
- VS Code API integration

## Future Improvements

- Enhanced RTF to HTML conversion
- Custom header/footer templates
- Custom page margins
- Batch printing support
- Alternative PDF generation methods

## Debugging Notes

- Check Node.js installation for jsPDF PDF generation
- Verify per-OS print prerequisites (AppleScript permissions on macOS, PowerShell execution policy on Windows, CUPS + a supported PDF viewer on Linux)
- Monitor Shiki highlighter initialization and theme loading
- Check webview console for PDF.js loading issues
- Verify VS Code API access to editor content
- Test menu message handling between webview and extension
- Check global state persistence for user preferences

## Provisioning

If/when this product needs a GCP project (VS Code Marketplace publisher analytics, Cloud APIs, OAuth consent), provisioning is scripted in [`appliedmedia/internal:iaas/scripts/gcp/`](https://github.com/appliedmedia/internal/tree/main/iaas/scripts/gcp). Per-product state lands at `iaas/state/gcp/print2paper4vscode.yaml`; GUI residual checklist at `iaas/manual/gcp/print2paper4vscode.md`. One `iaas-bot` service account serves every Applied Media product.
