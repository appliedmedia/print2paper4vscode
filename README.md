# Print2Paper4VSCode

A VS Code extension that captures content from the active tab (editor or preview), converts it to HTML, and provides multiple printing options. The extension uses minimal AppleScript to copy content, processes RTF data, and generates PDFs for printing or saving.

## How It Actually Works

The extension follows this workflow:

1. **Capture Active Tab Content**:
   - Uses minimal AppleScript to select-all (or current selection) and copy
   - Works with any active tab - text editors, Markdown previews, web previews, etc.

2. **Process Clipboard Data**:
   - Imports clipboard content into TypeScript/JavaScript
   - Converts RTF (Rich Text Format) data to HTML
   - Preserves formatting and structure

3. **Create PrintPrep Tab**:
   - Opens new tab titled "PrintPrep: {original tab name}"
   - Renders the converted HTML content with proper formatting
   - Shows exactly what will be printed

4. **Generate PDF & Print**:
   - Saves PrintPrep tab content to temporary PDF
   - Provides three output options:
     - **Print with Preview**: Opens PDF in Preview app with print dialog
     - **Print Directly**: Sends PDF directly to printer via Finder
     - **Save as PDF**: Saves PDF to Downloads folder

## Features

- **Universal Tab Support**: Works with any active tab - text editors, previews, web content
- **Minimal AppleScript**: Uses only essential AppleScript for clipboard operations
- **RTF to HTML Conversion**: Preserves formatting when converting clipboard content
- **PrintPrep Preview**: See exactly what will be printed before committing
- **Multiple Print Options**: Preview dialog, direct printing, or PDF saving
- **Context Menu Integration**: Right-click to access print options
- **Keyboard Shortcuts**: Quick access via keyboard commands

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
- **macOS**: Currently optimized for macOS with AppleScript integration
- **VS Code**: Version 1.60.0 or higher

## Using the Extension

- **Print Selection**: Select text, then use `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- **Print Current Tab**: Use `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux)
- **Context Menu**: Right-click in the editor and select "Print Selection" or "Print Current Tab"

## Technical Implementation

- **Content Capture**: Direct VS Code API access to editor content and selections
- **Syntax Highlighting**: Shiki-based highlighting with VS Code theme support
- **PDF Generation**: Uses jsPDF with vector-based rendering engine
- **Print Integration**: Cross-platform OS integration for printing operations
- **Webview UI**: Interactive preview using VS Code's webview API with PDF.js

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

- jsPDF vector PDF generation works
- AppleScript integration for macOS printing works
- Basic tab creation and management works

### Known Issues

- **Missing RTF Processing**: RTF to HTML conversion not yet implemented
- **Template System**: Current template approach may be unnecessary
- **Platform Support**: jsPDF works on all platforms with Node.js
- **Build Process**: Extension may not be properly compiled/built

## Development

- **Source**: TypeScript files in `src/` directory
- **Build Output**: Compiled JavaScript in `out/` directory
- **Package Config**: `package.json`
- **Test Script**: `test-pdf.js` (working Node.js implementation)

## Testing

The extension includes a working test script (`test-pdf.js`) that demonstrates the PDF generation and printing functionality outside of VS Code. This can be used to verify that the core functionality works before testing the extension.

## Future Improvements

- Cross-platform support (Windows/Linux)
- Enhanced RTF to HTML conversion
- Print settings (page size, margins, orientation)
- Batch printing support
- Alternative PDF generation methods

## Debugging Notes

- Check Node.js installation for jsPDF PDF generation
- Verify AppleScript permissions for printing operations
- Test RTF to HTML conversion functionality
- Test PDF generation with `test-pdf.js` first
