# Print2Paper4VSCode - Project Context & Architecture

## Markdown Formatting Standards

**IMPORTANT:** All Markdown files in this project SHALL use asterisks (`*`) for list bullets, NOT dashes (`-`).
The linter is configured accordingly.

## Project Overview

**READ README.md FIRST** for complete project overview and user-facing documentation.

This document provides technical architecture details, implementation notes, and development context for the Print2Paper4VSCode VS Code extension. The extension enables printing of code selections, entire tabs, and preview content directly from the editor using Chrome headless PDF generation with multiple printing options.

## Project Structure

```text
2025-08-17_print2paper4vscode/
├── src/                          # TypeScript source files
│   ├── App.ts                    # Main application entry point
│   ├── entrypoint.ts             # Extension entry point and command registration
│   ├── PaperPrinter.ts           # Core printing functionality
│   ├── PDFManager.ts             # PDF generation and management
│   └── VSCodeAPIs.ts             # VS Code API interactions and utilities
├── out/                          # Compiled JavaScript output
│   ├── App.js                    # Compiled main application
│   ├── entrypoint.js             # Compiled extension entry point
│   ├── PaperPrinter.js           # Compiled printing functionality
│   ├── PDFManager.js             # Compiled PDF management
│   └── VSCodeAPIs.js             # Compiled VS Code API utilities

├── sample-code.json              # Sample code for testing
├── syntax-highlighting-poc.html  # Proof of concept for syntax highlighting
├── syntax-highlighting-poc.js    # JavaScript for syntax highlighting POC
├── package.json                  # Extension manifest and dependencies
├── tsconfig.json                 # TypeScript configuration
├── AGENTS.md                     # Project context and architecture (this file)
├── RESEARCH_SUMMARY.md           # Research findings and implementation strategy
├── vscode_apis.md                # VS Code API research and documentation
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
- Coordinates with PDFManager for complete print jobs

#### PDFManager (`src/PDFManager.ts`)

- Creates PDFs using Chrome headless (`--print-to-pdf`)
- Handles PDF generation, file management, and cleanup
- Provides multiple output options:
  - `printWithPreview`: Opens in Preview app with print dialog
  - `printDirectly`: Sends directly to printer via Finder
  - `saveToDownloads`: Saves PDF to Downloads folder

#### VSCodeAPIs (`src/VSCodeAPIs.ts`)

- Centralizes all VS Code API interactions and utilities
- Provides helper functions for working with documents, selections, and themes
- Abstracts VS Code-specific functionality for other components

#### Extension Entry Point (`src/entrypoint.ts`)

- Extension activation and command registration
- Initializes the application and sets up VS Code integration
- Handles extension lifecycle events

### 2. Commands

- `p2p4vsc.print2paper`: Prints selected text with line numbers or entire current tab if nothing selected
- Command available via context menu and keyboard shortcuts (Alt-P)

### 3. Key Features

- **Syntax Highlighting**: Basic regex-based highlighting for common programming constructs
- **Multiple Print Options**: Preview dialog, direct printing, PDF saving
- **RTF to HTML Conversion**: Converts clipboard RTF data to HTML for printing
- **Cross-Platform**: Currently optimized for macOS with Chrome headless

## Current Issues & Status

### Working Components

- `test-pdf.js` successfully creates PDFs and prints them
- Chrome headless PDF generation works
- AppleScript integration for macOS printing works
- Basic HTML template system works

### Technical Dependencies

- Chrome/Chromium browser for headless PDF generation
- macOS-specific AppleScript for printing operations
- VS Code Extension API v1.60.0+
- TypeScript compilation to JavaScript

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

- Regex-based highlighting for keywords, strings, comments, numbers, functions
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

## Development Tasks

### Execution Flow Analysis

**TASK**: Walk through the execution flow of the code and reason through it to make sure logically it should work.

**Steps**:

1. Trace command registration and activation flow
2. Follow clipboard capture and RTF processing pipeline
3. Verify PrintPrep tab creation and content rendering
4. Check PDF generation and printing workflow
5. Identify any logical gaps or missing implementations
6. Verify error handling and fallback mechanisms

**Purpose**: Ensure the code architecture matches the intended workflow before implementation.

### To-Do List of Next Attempt

We now have a huge overhaul to do.

Nothing else has worked. So we have to go back to a tab-specific implementation. Here's the to-do list:

1. Add the Shiki (vscode-textmate) library to the npm imports, and any of its dependencies
2. Create the appropriate classes that will inspect the active tab:
   2.1. If it's an EDITOR tab that is NOT MARKDOWN, then we grab it's selection or if no selection it's entire text and create a preview tab (can we do this offscreen?) and re-apply the theme textmate styling based on the filetype, theme, and text.
   2.2. If it's an EDITOR that is MARKDOWN, we should assume they want to print the MARKDOWN AS RAW BUT WITH HIGHLIGHTS and do similar selection/no-selection, but I don't know if Shiki can handle MD?
   2.3. If it's a PREVIEW tab, we want to again honor the selection or grab it all if none, that may have to happen with triggered scripting commands, at least on mac, that would be MINIMAL APPLESCRIPT TO COPY TO CLIPBOARD AND TRANSFER THE CLIPBOARD BACK TO TS/JS.
3. Once we have the styled text as an offscreen preview tab then we give the user a choice to "Print with Preview", "Print" (no dialog), "Save as PDF" or "Done". With each of the Print options, we issue minimal AppleScript. This code may still exist in the project and does not need to be re-created?
   3.1. One suggestion is if we really do have a Preview tab that might have stylized rendering or colors that we can't re-print, we just hand the entire file (maybe it's a temp file?) off to the OS with a "Open this with it's native app with print dialog"?

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
- To prompt the user, cycle through prompting them with: {"What now?". "Sup?", "Now what?", "What?", "Now?", "Now whut?", "Next?"}.
- Very, very rarely, cycle through mentioning: {"I am the Batman", "Oh Captain, My Captain"}.

#### To indicate you're here, respond with: "I am the Batman."
