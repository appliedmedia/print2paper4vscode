# Changelog

All notable changes to the "Print2Paper4VSCode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.7] - 2026-06-13

### Changed

- Centralized runtime asset paths via `kPath` constant in OS_t.ts; `{{path_lib}}` and `{{path_yaml}}` auto-injected into all templates so path changes have a single source of truth

## [1.0.6] - 2026-06-13

### Fixed

- PDF preview now renders correctly: pdf.worker.min.js URI was still pointing to `src/lib/` in the YAML files after the dist/ migration
- Added prepublish smoke test that greps source for all runtime-loaded paths and fails build if any are missing from dist/

## [1.0.5] - 2026-06-13

### Fixed

- All runtime-loaded YAML config files now ship in the packaged extension (same root cause as 1.0.4 PDF.js fix; complete audit applied)

## [1.0.4] - 2026-06-13

### Fixed

- PDF preview panel now loads correctly when installed from the marketplace (vendored PDF.js library was excluded from the packaged `.vsix` by the `src/**` ignore rule; fix copies libs to `dist/lib/` during build)

## [1.0.0] - 2026-05-08

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
- Windows: PowerShell-driven `System.Windows.Forms.PrintDialog` with structured handling for missing printers, missing PDF readers, and other failure modes (PR #112)
- Linux: CUPS detection plus viewer selection (Okular, Evince, and other common PDF viewers) with smoke-tested error paths in CI (PRs #105 and #110)

### Technical

#### Architecture

- Registry pattern for dependency injection
- Named parameters refactoring for API clarity
- Template system with single source of truth for namespace management
- Comprehensive diagnostics system with hierarchical logging
- Lazy component instantiation for performance

#### Code Quality

- TypeScript with strict mode enabled
- Comprehensive Gherkin + unit test suite, ~95% statement coverage
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

- Very large files (hundreds of pages) may render slowly
- Limited to jsPDF-supported fonts (Courier, Helvetica, Times); themes that rely on other fonts fall back to the closest match
- Webview-style files (custom previews, notebooks, image editors) are not supported as print targets

---

## Future Roadmap

### Planned Features

- [ ] Custom header/footer templates
- [ ] Print selection only mode
- [ ] Batch printing multiple files
- [ ] Custom CSS for markdown rendering
- [ ] Export to additional formats (HTML, RTF)
- [ ] Custom page margins
- [ ] Watermark support

### Technical Improvements

- [ ] Performance optimization for very large files
- [ ] Memory usage optimization
- [ ] VS Code test environment for integration tests

---

[Unreleased]: https://github.com/appliedmedia/print2paper4vscode/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/appliedmedia/print2paper4vscode/releases/tag/v1.0.0
