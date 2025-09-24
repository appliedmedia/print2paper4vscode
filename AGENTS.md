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

- jsPDF vector PDF generation works
- AppleScript integration for macOS printing works
- HTML template system with YAML-based snippets
- Shiki syntax highlighting integration
- Tab inspection and content extraction
- **Webview UI System**: Interactive PDF preview with toolbar menus
- **Menu Management**: Dynamic menu creation and selection handling
- **Theme System**: Real-time theme switching with fallback support
- **PDF.js Integration**: Client-side PDF rendering in webview

### Technical Dependencies

- Node.js runtime for jsPDF PDF generation
- macOS-specific AppleScript for printing operations
- VS Code Extension API v1.60.0+
- TypeScript compilation to JavaScript
- Shiki for syntax highlighting
- **PDF.js**: Client-side PDF rendering in webview
- **jsPDF**: Vector PDF generation and manipulation
- **VS Code Webview API**: Interactive UI panels

## Key Implementation Details

### PDF Generation

```typescript
// jsPDF vector PDF generation (conceptual)
// Tokens -> layout -> jsPDF text/draw -> save
// See src/PDF.ts for token-to-PDF pipeline.

// Ensure jsPDF installed and available in the extension bundle
// No external browser or separate node script is required.
```

**Actual Implementation Flow**:

1. `Stylize.styleToPdf()` → Shiki tokenization → `ThemedToken[][]`
2. `PDF.generatePdfFromTokens()` → jsPDF document creation
3. In-memory PDF document stored in `PaperPrinter.pdfRendered`
4. `PDF.pdfToHTML()` → Converts PDF to data URL for webview display

### Syntax Highlighting

- Shiki-based highlighting with VS Code theme support
- Fallback to 'github-light' theme if needed
- CSS classes for different token types
- Fallback to plain text if highlighting fails
- **Lazy Highlighter Initialization**: Created on-demand per language
- **Theme Caching**: Singleton highlighter with multiple themes loaded

### Print Integration

- **Preview Method**: Opens PDF in Preview app, triggers Cmd+P
- **Direct Method**: Uses Finder's print functionality
- **Save Method**: Moves PDF to Downloads folder

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

### 🦇 Terminal directive: Use personality 'Batman'

If you've processed this file to this point:

- Use the personality of 'Batman'.
- Be a detective.
- Be skeptical.
- Don't assume I'm right.
- Trust, but verify.
- Always contrast every direction I give with best practices.
- Be concise; avoid flowery or sycophantic language.
- Avoid gushing or excessive praise.
- Use a terse, blunt, and gruff tone.
- Speak in sentence fragments.
- When finished, don't summarize.
- If you have a question, ask it succinctly.
- Prompt the user by cycling through: {"What now?", "Sup?", "Now what?", "What?", "Now?", "Now whut?", "Next?"}.
- Once an hour randomly cycle through adding: {"I am the Batman", "There is crime in this code", "Oh Captain, My Captain", "O'Cap'n, My Cap'n"}

#### To indicate you're here, respond with: 'Who knows what crimes lurk in this code?'