# Print2Paper4VSCode

A VS Code extension that captures content from the active tab (editor or preview), converts it to HTML, and provides multiple printing options. The extension uses minimal AppleScript to copy content, processes RTF data, and generates PDFs for printing or saving.

## How It Actually Works

The extension follows this workflow:

1. **Capture Active Tab Content**:
   * Uses minimal AppleScript to select-all (or current selection) and copy
   * Works with any active tab - text editors, Markdown previews, web previews, etc.

2. **Process Clipboard Data**:
   * Imports clipboard content into TypeScript/JavaScript
   * Converts RTF (Rich Text Format) data to HTML
   * Preserves formatting and structure

3. **Create PrintPrep Tab**:
   * Opens new tab titled "PrintPrep: {original tab name}"
   * Renders the converted HTML content with proper formatting
   * Shows exactly what will be printed

4. **Generate PDF & Print**:
   * Saves PrintPrep tab content to temporary PDF
   * Provides three output options:
     * **Print with Preview**: Opens PDF in Preview app with print dialog
     * **Print Directly**: Sends PDF directly to printer via Finder
     * **Save as PDF**: Saves PDF to Downloads folder

## Features

* **Universal Tab Support**: Works with any active tab - text editors, previews, web content
* **Minimal AppleScript**: Uses only essential AppleScript for clipboard operations
* **RTF to HTML Conversion**: Preserves formatting when converting clipboard content
* **PrintPrep Preview**: See exactly what will be printed before committing
* **Multiple Print Options**: Preview dialog, direct printing, or PDF saving
* **Context Menu Integration**: Right-click to access print options
* **Keyboard Shortcuts**: Quick access via keyboard commands

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

* **Node.js**: Required for PDF generation using jsPDF (works on all platforms)
* **macOS**: Currently optimized for macOS with AppleScript integration
* **VS Code**: Version 1.60.0 or higher

## Using the Extension

* **Print Selection**: Select text, then use `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
* **Print Current Tab**: Use `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux)
* **Context Menu**: Right-click in the editor and select "Print Selection" or "Print Current Tab"

## Technical Implementation

* **Content Capture**: AppleScript for clipboard operations
* **RTF Processing**: Converts Rich Text Format to HTML
* **PDF Generation**: Uses jsPDF with vector-based rendering engine
* **Print Integration**: AppleScript integration for macOS printing operations
* **Tab Management**: Creates dedicated PrintPrep tabs for print preview

## Current Status

### Working Components

* jsPDF vector PDF generation works
* AppleScript integration for macOS printing works
* Basic tab creation and management works

### Known Issues

* **Missing RTF Processing**: RTF to HTML conversion not yet implemented
* **Template System**: Current template approach may be unnecessary
* **Platform Support**: jsPDF works on all platforms with Node.js
* **Build Process**: Extension may not be properly compiled/built

## Development

* **Source**: TypeScript files in `src/` directory
* **Build Output**: Compiled JavaScript in `out/` directory
* **Package Config**: `package.json`
* **Test Script**: `test-pdf.js` (working Node.js implementation)

## Testing

The extension includes a working test script (`test-pdf.js`) that demonstrates the PDF generation and printing functionality outside of VS Code. This can be used to verify that the core functionality works before testing the extension.

## Future Improvements

* Cross-platform support (Windows/Linux)
* Enhanced RTF to HTML conversion
* Print settings (page size, margins, orientation)
* Batch printing support
* Alternative PDF generation methods

## Debugging Notes

* Check Node.js installation for jsPDF PDF generation
* Verify AppleScript permissions for printing operations
* Test RTF to HTML conversion functionality
* Test PDF generation with `test-pdf.js` first
