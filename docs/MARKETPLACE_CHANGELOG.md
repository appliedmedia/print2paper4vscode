# Changelog

All notable changes to Print2Paper4VSCode are documented in this file.

<!-- NOTE: bare-URL form intentional. vsce link-rewriter mangles angle-bracket URL forms. -->

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-06-05

### Changed

* Removed Known Limitations section from marketplace listing

## [1.0.1] - 2026-06-03

### Changed

* Updated marketplace listing: keybinding shown as **Opt/Alt+P**, theme description clarified to light Shiki themes curated for printing

## [1.0.0] - 2026-05-08

Initial public release.

### Added

* One-keystroke print: hit **Opt/Alt+P** in any editor to open a live PDF preview
* 100+ Shiki themes, including every VS Code theme you already use
* Vector PDF output via jsPDF: scalable, crisp, never rasterized
* Live re-render: change theme, page size, font, or orientation from the preview toolbar and watch the PDF update
* Markdown files render in raw mode (syntax-highlighted source) or render mode (HTML preview)
* Save as PDF, print directly, or open the system print dialog from inside the preview
* Page sizes: Letter, A4, Legal, Tabloid, Ledger, A3, Executive
* Portrait and landscape orientations
* Font sizes from 8 to 24 px
* Persistent toolbar position and last-used menu choices across VS Code sessions
* Companion command **Print: Clear State** for resetting persisted preview settings

### Platform support

* **macOS**: AppleScript-driven Preview integration plus direct print to the default printer
* **Windows**: PowerShell-driven `System.Windows.Forms.PrintDialog` with structured handling for missing printers, missing PDF readers, and other failure modes
* **Linux**: CUPS detection plus viewer selection (Okular, Evince, and other common PDF viewers); smoke-tested error paths in CI

### Notes

* Themes that rely on fonts other than Courier, Helvetica, or Times fall back to the closest jsPDF-supported family
* Webview-style files (custom previews, notebooks, image editors) are not supported as print targets

For full developer-facing release notes, see the [GitHub release](https://github.com/appliedmedia/print2paper4vscode/releases).
