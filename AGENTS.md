# Print2Paper4VSCode - Project Context & Architecture

## Markdown Formatting Standards

_No specific bullet point formatting requirements._

## Project Overview

**READ README.md FIRST** for complete project overview and user-facing documentation.

This document provides technical architecture details, implementation notes, and development context for the Print2Paper4VSCode VS Code extension. The extension enables printing of code selections, entire tabs, and preview content directly from the editor using Chrome headless PDF generation with multiple printing options.

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

## Core Architecture

### 1. Extension Classes

#### App (`src/App.ts`)

- Main application orchestrator that coordinates all components
- Manages the overall printing workflow and user interactions
- Handles command registration and extension lifecycle

#### PaperPrinter (`src/PaperPrinter.ts`)

- Core printing functionality and workflow coordination
- Manages print selection and current tab operations
- Coordinates with PDF for complete print jobs

#### PDF (`src/PDF.ts`)

- Creates PDFs using Chrome headless (`--print-to-pdf`)
- Handles PDF generation, file management, and cleanup
- Provides multiple output options:
  - `printWithPreview`: Opens in Preview app with print dialog
  - `printDirectly`: Sends directly to printer via Finder
  - `saveToDownloads`: Saves PDF to Downloads folder

#### Stylize (`src/Stylize.ts`)

- Handles syntax highlighting using Shiki
- Manages theme application and code styling
- Converts styled content to HTML for printing

#### TabInspector (`src/TabInspector.ts`)

- Inspects active editor tabs and preview tabs
- Extracts selected text or entire content
- Determines file types and appropriate handling

#### VSCodeAPIs (`src/VSCodeAPIs.ts`)

- Centralizes all VS Code API interactions and utilities
- Provides helper functions for working with documents, selections, and themes
- Abstracts VS Code-specific functionality for other components

### 2. Commands

- `p2p4vsc.print2paper`: Prints selected text with line numbers or entire current tab if nothing selected
- Command available via context menu and keyboard shortcuts (Alt-P)

### 3. Key Features

- **Syntax Highlighting**: Shiki-based highlighting with VS Code themes
- **Multiple Print Options**: Preview dialog, direct printing, PDF saving
- **Tab Inspection**: Handles editor tabs, markdown, and preview tabs
- **Cross-Platform**: Currently optimized for macOS with Chrome headless

## Current Status

### Working Components

- Chrome headless PDF generation works
- AppleScript integration for macOS printing works
- HTML template system with YAML-based snippets
- Shiki syntax highlighting integration
- Tab inspection and content extraction

### Technical Dependencies

- Chrome/Chromium browser for headless PDF generation
- macOS-specific AppleScript for printing operations
- VS Code Extension API v1.60.0+
- TypeScript compilation to JavaScript
- Shiki for syntax highlighting

### TypeScript Configuration

The project uses specific TypeScript lib settings for VS Code extension compatibility:

- `ES2020` - Modern JavaScript features
- `DOM` - Browser/extension globals (includes `setTimeout`, `setInterval`, etc.)

**Critical**: Do not add `WebWorker` lib as it conflicts with DOM globals. VS Code extensions run in a DOM-like context, not a WebWorker context. Adding WebWorker lib causes 21+ TypeScript compilation errors due to conflicting global definitions.

## Development Environment

- **OS**: macOS (darwin 24.6.0)
- **Shell**: zsh
- **Node.js**: Required for build process
- **VS Code**: Extension development environment

## Build & Test Process

1. **Compile**: `npm run compile` (TypeScript to JavaScript)
2. **Test**: Run `npm test` to execute all tests using Node.js built-in test runner
3. **Extension**: Load extension in VS Code for testing

**Testing Framework**: This project uses Node.js built-in test runner (`node:test`) with `node:assert`. All test files should import from `node:test` and `node:assert`, not third-party testing frameworks like Mocha or Jest.

## Key Implementation Details

### PDF Generation

```typescript
// Chrome headless command
`/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --headless --disable-gpu --print-to-pdf="${tempPDFPath}" --print-to-pdf-no-header file://${tempHTMLPath}`;
```

### Syntax Highlighting

- Shiki-based highlighting with VS Code theme support
- Fallback to 'github-light' theme if needed
- CSS classes for different token types
- Fallback to plain text if highlighting fails

### Print Integration

- **Preview Method**: Opens PDF in Preview app, triggers Cmd+P
- **Direct Method**: Uses Finder's print functionality
- **Save Method**: Moves PDF to Downloads folder

## Future Improvements

1. **Cross-Platform**: Support for Windows and Linux
2. **Enhanced Highlighting**: Integration with VS Code's token system
3. **Custom Templates**: User-configurable print templates
4. **Print Settings**: Page size, margins, orientation options
5. **Batch Printing**: Multiple file printing support

## Debugging Notes

- Check Chrome installation path for PDF generation
- Verify AppleScript permissions for printing operations
- Monitor console output for template loading issues
- Verify Shiki theme loading and syntax highlighting

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
