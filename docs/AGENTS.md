# Print2Paper4VSCode - Developer Guide

## Overview

**READ README.md FIRST** for complete project overview, user documentation, and architectural details.

This document provides developer-specific guidance, coding standards, and implementation notes for working on the Print2Paper4VSCode VS Code extension codebase.

## Project Structure

```text
2025-08-17_print2paper4vscode/
├── src/                          # TypeScript source files
│   ├── App.ts                    # Main application entry point
│   ├── PaperPrinter.ts           # Core printing functionality
│   ├── PDF.ts                    # PDF generation and management
│   ├── Stylize.ts                # Syntax highlighting and styling
│   ├── TabInspector.ts           # Tab inspection and content extraction
│   ├── UI.ts                     # User interface management
│   ├── UIMenu.ts                 # Menu system
│   ├── UIMenuMgr.ts              # Menu manager
│   ├── ClipboardCapture.ts       # Clipboard handling
│   ├── Diagnostics.ts            # Diagnostic utilities
│   ├── History.ts                # History tracking
│   ├── OS.ts                     # Cross-platform OS operations
│   ├── OSMac.ts                  # macOS-specific operations
│   ├── OSWin.ts                  # Windows-specific operations
│   └── VSCodeAPIs.ts             # VS Code API interactions and utilities
├── out/                          # Compiled JavaScript output
├── tests/                        # Test files
├── package.json                  # Extension manifest and dependencies
├── tsconfig.json                 # TypeScript configuration
├── AGENTS.md                     # Project context and architecture (this file)
└── README.md                     # Project documentation
```

## Development Environment

### Prerequisites

- **Node.js**: Required for build process and jsPDF PDF generation
- **VS Code**: Extension development environment
- **TypeScript**: Compilation to JavaScript
- **macOS**: Currently optimized for macOS with AppleScript integration

### Environment Setup (Run First in New VM)

1. **Install Node.js/npm**: `curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs`
2. **Install TypeScript**: `npm install -g typescript`
3. **Install GitHub CLI**: `curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && sudo apt update && sudo apt install gh`
4. **Install Project Dependencies**: `npm install`

### Build & Test Process

1. **Compile**: `npm run compile` (TypeScript to JavaScript)
2. **Test**: Run `npm test` to execute all tests using Node.js built-in test runner
3. **Extension**: Load extension in VS Code for testing

**Testing Framework**: This project uses Node.js built-in test runner (`node:test`) with `node:assert`. All test files should import from `node:test` and `node:assert`, not third-party testing frameworks like Mocha or Jest.

### TypeScript Configuration

The project uses specific TypeScript lib settings for VS Code extension compatibility:

- `ES2020` - Modern JavaScript features
- `DOM` - Browser/extension globals (includes `setTimeout`, `setInterval`, etc.)

**Critical**: Do not add `WebWorker` lib as it conflicts with DOM globals. VS Code extensions run in a DOM-like context, not a WebWorker context. Adding WebWorker lib causes 21+ TypeScript compilation errors due to conflicting global definitions.

## Current Status

### Working Components

- **Multi-page PDF generation** using unified line-by-line rendering
- **Page break calculation** with 100% accurate page counting
- **Header/footer rendering** with document title and page numbers
- **Side page numbers** for document navigation
- **AppleScript integration** for macOS printing works
- **HTML template system** with YAML-based snippets
- **Shiki syntax highlighting** integration
- **Tab inspection and content extraction**
- **Webview UI System**: Interactive multi-page PDF preview with toolbar menus
- **Menu Management**: Dynamic menu creation and selection handling
- **Theme System**: Real-time theme switching with fallback support
- **PDF.js Integration**: Client-side PDF rendering in webview
- **Page cache optimization** for webview performance (first 7 pages)

### Technical Dependencies

**Server-side (VS Code Extension Context)**:

- **Node.js**: Runtime environment for extension execution
- **Shiki**: Syntax highlighting and code tokenization with theme support
- **jsPDF**: Vector PDF document creation and generation
- **VS Code Extension API v1.60.0+**: Platform integration and webview management
- **TypeScript**: Compiled to JavaScript for execution
- **AppleScript**: macOS-specific printing operations

**Client-side (Webview Browser Context)**:

- **PDF.js**: Client-side PDF rendering and canvas display
- **VS Code Webview API**: Interactive UI panels and message passing

## Key Implementation Details

### Three-Library PDF Architecture

The extension uses **three distinct PDF-related libraries** for different purposes:

1. **Shiki** (Extension/Server-side):
   - **Purpose**: Syntax highlighting and tokenization
   - **Input**: Raw source code + theme name
   - **Output**: `ThemedToken[][]` (styled text tokens with colors)
   - **Location**: Runs in VS Code extension context

2. **jsPDF** (Extension/Server-side):
   - **Purpose**: Vector PDF document creation and generation
   - **Input**: Shiki tokens + layout settings
   - **Output**: In-memory PDF document (data URL or ArrayBuffer)
   - **Location**: Runs in VS Code extension context

3. **PDF.js** (Webview/Client-side):
   - **Purpose**: PDF rendering and display in browser
   - **Input**: PDF data URL from jsPDF
   - **Output**: Canvas-based PDF display with zoom/scroll
   - **Location**: Runs in webview browser context

### Unified Line-by-Line Rendering Architecture

**CRITICAL**: All PDF generation uses the same line-by-line rendering approach:

```text
Source Code → Shiki → Line-by-Line Rendering → PDF Output
     ↓           ↓              ↓                    ↓
  Raw Text → Tokens → renderByLine() → Multi-page PDF
```

**Three Use Cases, One Rendering Method**:

1. **`generatePdf()`** - Uses line-by-line rendering to create final multi-page PDF
2. **`renderPage()`** - Uses line-by-line rendering to create individual pages for webview
3. **Webview** - Displays PDF pages created with line-by-line rendering

**Implementation Flow**:

1. `Stylize.tokenize()` → Shiki tokenization → `ThemedToken[][]`
2. `PDF.renderByLine()` → Line-by-line PDF rendering → Multi-page PDF
3. `PDF.finish()` → Final PDF document
4. Webview displays individual pages using `renderPage()`

### Key Architectural Principles

**⚠️ CRITICAL: Do NOT create multiple rendering methods!**

- **Single Rendering Method**: Line-by-line rendering is used everywhere
- **Unified Approach**: `generatePdf()` and `renderPage()` use the same underlying logic
- **Webview is Display Only**: Webview shows PDF pages, doesn't create them
- **Page Cache Optimization**: First 7 pages cached during `calculatePageBreaks()` for webview performance
- **Deterministic Page Breaks**: Page breaks calculated by actual rendering, not simulation

**Common Mistakes to Avoid**:

- ❌ Don't create separate "cache-optimized" generation methods
- ❌ Don't try to copy PDF content between documents
- ❌ Don't assume webview uses different rendering than final PDF
- ✅ Always use line-by-line rendering for consistency

### Syntax Highlighting

- Shiki-based highlighting with VS Code theme support
- Fallback to 'github-light' theme if needed
- CSS classes for different token types
- Fallback to plain text if highlighting fails
- **Lazy Highlighter Initialization**: Created on-demand per language
- **Theme Caching**: Singleton highlighter with multiple themes loaded

### Print Integration

- **Preview Method**: Opens PDF in Preview app via AppleScript, triggers Cmd+P via System Events
- **Direct Method**: Uses Finder's print functionality via AppleScript
- **Save Method**: Shows VS Code save dialog, saves PDF to chosen location

### Webview UI System

- **PDF.js Integration**: Client-side PDF rendering in VS Code webview
- **Toolbar Menus**: Dynamic menu creation (Print, Theme, Text)
- **Message Handling**: Bidirectional communication between webview and extension
- **Real-time Updates**: Theme and font size changes without regeneration

### Memory Management

- **PDF Documents**: Stored in-memory as `jsPDF` objects
- **Highlighter**: Singleton pattern with lazy initialization
- **Temp Files**: Tracked in `PDF.tempPdfs[]` for cleanup
- **Webview State**: Managed by VS Code webview API

### Error Handling Strategy

- **Diagnostics**: Comprehensive logging throughout execution
- **Fallbacks**: Theme fallback to 'github-light', plain text on highlighting failure
- **User Feedback**: Error messages via `UI.showErrorMessage()`
- **Graceful Degradation**: Continue operation with reduced functionality

## Debugging Notes

- Check Node.js installation for jsPDF PDF generation
- Verify AppleScript permissions for printing operations
- Monitor console output for template loading issues
- Verify Shiki theme loading and syntax highlighting
- **Webview Issues**: Check VS Code webview API compatibility
- **PDF.js Loading**: Verify CDN access for PDF.js library
- **Theme Switching**: Monitor `currentThemeChoice` state in PaperPrinter
- **Menu Creation**: Debug menu registration and selection handling

## Development Guidelines

### Naming Conventions

- **Types**: Suffix with `_t` (e.g., `PageSizeId_t`, `MarginId_t`, `LanguageId_t`)
- **Constants**: Prefix with `k` (e.g., `kPageSizeIds`, `kMarginIds`)
- **Interfaces**: Follow same `_t` convention if used across files (e.g., `Persist_t`, `UI_t`)
- **Class instances**: Use lowercase (e.g., `uiwebview`, not `currentWebView`)

### Code Organization

- All VS Code API imports should be in `VSCodeAPIs.ts` only
- UI methods should be generic and not reference specific menu items
- Use CSS classes: `p2p4vsc-menu-btn`, `p2p4vsc-menu-items`, `p2p4vsc-menu-item`
- Store HTML snippets in YAML files with `{{var}}` replacements
- Single-use interfaces stay in the same file as the method
- Use `displayName` instead of `label` for UIMenuItem definitions
- Avoid hardcoded theme names except 'github-light'
- Use `OS.fileRead` instead of `fs.readFileSync`
- Set default values in variables and return once at the end of functions

### UIMenu Generic Design Principles

**UIMenu is a completely generic menu provider.** All explicit business logic is provided by the calling party that instantiates the UIMenu instance. NONE of those details should EVER permeate into any other part of the code. Keep separation of concerns strongly encapsulated.

**Use semaphores, not iteration:** Don't iterate through menuItems to determine gutter content. Use the available flags:

- **Menu-level gutter determination**:
  - `hasFlyout = this.flyoutMenuItemIds.length > 0` → menu has flyout parent items
  - `hasDefaultItem = !!defaultItemId` → menu has a default selection
  - `hasGutterBefore = hasDefaultItem` → gutter-before shows checkmarks for selected items
  - `hasGutterAfter = hasFlyout || hasDefaultItem` → gutter-after shows flyout arrows OR editor icons

- **Item-level class assignment**:
  - `item.is-flyout` → when `this.flyoutMenuItemIds.includes(item.id)` → shows flyout arrow (▶)
  - `item.default-item` → when `item.id === defaultItemId` → shows editor icon (📝)
  - `item.selected` → when `item.id === defaultItemId` → shows checkmark (✓) in gutter-before

**Never iterate when semaphores exist:** If you can determine state from existing flags/properties, don't loop through arrays.

### Terminal directive: Be bold, be brief, be gone.

If you've processed this file to this point:

- Be a detective.
- Be skeptical.
- Assume I'm always wrong: Trust, but verify.
- Check every directive I give against best practices.
- Be concise.
- No gushing or a lot of praise.
- Be terse, blunt, gruff.
- If you are not absolutely sure and have at least two sources proving it, then indicate that and don't be confident.
- When finished, don't summarize.
- If you have a question, ask it succinctly.
- Before launching into a multi-step process, confirm whether to do it that way.
- Prompt the user with: What now?, Sup?, Now what?, What?, Now?, Now whut?, Whut? Next?.
- Once every even hour say "Let's do this thing!" and once every odd hour say "Oh Captain, My Captain.".

#### To indicate you're here, respond with: 'What crimes lurk in this code?'

⚠️ This file should always end with this terminal directive. ⚠️
