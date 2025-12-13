# Changelog

All notable changes to the "Print2Paper4VSCode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-12

### Added

#### Core Features

- Initial release of Print2Paper4VSCode extension
- Syntax highlighting for 100+ programming languages via Shiki integration
- Vector PDF generation using jsPDF (scalable, high-quality output)
- Interactive webview preview with PDF.js rendering
- Multiple print options: Preview dialog, direct print, save as PDF
- Keyboard shortcut: Alt+P for quick printing

#### Document Support

- Full support for all VS Code supported languages
- Markdown dual-mode rendering:
  - Raw mode: Syntax-highlighted markdown source
  - Render mode: HTML-rendered markdown preview
- Code blocks with syntax highlighting in rendered markdown
- Automatic language detection from file extension

#### User Interface

- Interactive toolbar in webview with dynamic menus:
  - Print menu: Preview, Direct, Save options
  - Page menu: Size and orientation selection
  - Theme menu: 100+ syntax highlighting themes
  - Text menu: Font size adjustment (8px to 24px)
  - Markdown mode menu: Raw/Render toggle (.md files only)
- Real-time PDF regeneration when settings change
- Persistent settings across sessions
- Draggable toolbar for user preference

#### Configuration Options

- Page sizes: Letter, A4, Legal, Tabloid, Ledger, A3, Executive
- Page orientations: Portrait and Landscape
- Font sizes: 8, 9, 10, 11, 12, 14, 16, 18, 20, 24 pixels
- Theme selection: All VS Code compatible themes plus 100+ Shiki themes
- Header/footer customization with document title and page numbers

#### Platform Support

- macOS: Full AppleScript integration for native printing
- Windows: Windows printing commands (future)
- Linux: Linux printing commands (future)

### Technical

#### Architecture

- Registry pattern for dependency injection
- Named parameters refactoring for API clarity
- Template system with single source of truth for namespace management
- Comprehensive diagnostics system with hierarchical logging
- Lazy component instantiation for performance

#### Code Quality

- TypeScript with strict mode enabled
- Comprehensive test suite: 357 tests across 90 suites
- Node.js built-in test runner (node:test)
- ESLint for code quality
- Markdownlint for documentation quality
- Prettier for code formatting

#### Dependencies

- Shiki v3.11.0 for syntax highlighting
- jsPDF v3.0.3 for PDF generation
- PDF.js for client-side PDF rendering
- node-html-parser v7.0.1 for markdown HTML processing
- VS Code Extension API v1.60.0+

### Documentation

- Comprehensive README with architecture overview
- Developer guide (AGENTS.md) with coding standards
- VSCode APIs documentation
- Inline code documentation throughout
- Test examples and patterns

### Known Limitations

- macOS-specific print commands (Windows/Linux support planned)
- Single page printing for very large files (multi-page support complete but may need testing)
- Limited to jsPDF-supported fonts (Courier, Helvetica, Times)

---

## Future Roadmap

### Planned Features

- [ ] Cross-platform printing support (Windows, Linux)
- [ ] Custom header/footer templates
- [ ] Print selection only mode
- [ ] Batch printing multiple files
- [ ] Custom CSS for markdown rendering
- [ ] Export to additional formats (HTML, RTF)
- [ ] Print preview zoom controls
- [ ] Custom page margins
- [ ] Watermark support

### Technical Improvements

- [ ] Code coverage reporting with c8
- [ ] GitHub Actions CI/CD pipeline
- [ ] Performance optimization for large files
- [ ] Memory usage optimization
- [ ] VS Code test environment for integration tests

---

[Unreleased]: https://github.com/appliedmedia/print2paper4vscode/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/appliedmedia/print2paper4vscode/releases/tag/v1.0.0
