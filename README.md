# Print2Paper4VSCode

[![CI](https://github.com/appliedmedia/print2paper4vscode/workflows/CI/badge.svg)](https://github.com/appliedmedia/print2paper4vscode/actions)
[![Coverage](https://github.com/appliedmedia/print2paper4vscode/blob/main/.github/badges/coverage.svg)](https://github.com/appliedmedia/print2paper4vscode/actions)
[![License](https://github.com/appliedmedia/print2paper4vscode/blob/main/.github/badges/license.svg)](https://github.com/appliedmedia/print2paper4vscode/blob/main/LICENSE)
<!-- 
Badge to add after marketplace publish:
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/acoven.print2paper4vscode)](https://marketplace.visualstudio.com/items?itemName=acoven.print2paper4vscode)
-->

A VS Code extension that captures content from the active editor, applies syntax highlighting, generates a vector PDF, and provides multiple printing options through an interactive webview interface.

## Quick Links

- **[Developer Guide](docs/AGENTS.md)** - Complete developer documentation
- **[VSCode APIs](docs/VSCodeAPIs.md)** - API integration details

Run `npm run test:coverage` to generate full coverage report.

## Platform Support

### macOS (Full Support)

- ✅ Native AppleScript integration
- ✅ Preview app integration
- ✅ Direct printing support
- ✅ Print dialog support

### Windows & Linux (Planned)

- ⏳ Core functionality works (PDF generation, syntax highlighting)
- ⏳ Platform-specific printing commands in development
- ⏳ Contributions welcome

**Current recommendation:** macOS for full printing workflow, all platforms for PDF export.

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

```bash
# Install Node.js/npm (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install TypeScript globally
npm install -g typescript

# Install GitHub CLI (if not already installed)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Install project dependencies and compile
npm install
npm run compile
```

This will install all prerequisites and compile the TypeScript code to JavaScript.

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
- **Print Integration**: AppleScript-based printing (opens Preview with Cmd+P or uses Finder print)
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
- ✅ AppleScript integration for macOS printing
- ✅ Multi-page PDF generation

### Known Limitations

- **Preview Tabs**: Printing from preview/webview tabs not yet supported
- **Platform Support**: Print commands currently optimized for macOS only
- **Font Support**: Limited to jsPDF-supported fonts (Courier, Helvetica, Times)

## Documentation

- **[Developer Guide](docs/AGENTS.md)** - Complete developer documentation and architecture
- **[Developer Installation](docs/INSTALL.md)** - Developer setup and installation instructions
- **[VSCode APIs](docs/VSCodeAPIs.md)** - VS Code API integration details
- **[CI/CD Plan](docs/plans/2025-12-11_plan_inProgress_CICD.md)** - CI/CD automation and testing plan

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

- Cross-platform support (Windows/Linux)
- Enhanced RTF to HTML conversion
- Print settings (page size, margins, orientation)
- Batch printing support
- Alternative PDF generation methods

## Debugging Notes

- Check Node.js installation for jsPDF PDF generation
- Verify AppleScript permissions for macOS printing operations
- Monitor Shiki highlighter initialization and theme loading
- Check webview console for PDF.js loading issues
- Verify VS Code API access to editor content
- Test menu message handling between webview and extension
- Check global state persistence for user preferences
