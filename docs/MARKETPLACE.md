# Print2Paper4VSCode

Print or save any code file as a syntax-highlighted PDF with one keystroke. Live preview, 100+ themes, every page size you would actually use.

<!-- TODO(screenshot): replace with a 1600x1000 capture of the preview panel beside a code editor -->
<!-- NOTE: absolute URLs intentional. vsce link-rewriter mangles angle-bracket and relative forms. -->
![Print2Paper preview panel beside a code editor](https://github.com/appliedmedia/print2paper4vscode/raw/main/images/screenshot-preview.png)

## Features

* One-keystroke print: hit **Alt+P** in any editor to open a live PDF preview
* 100+ Shiki themes, including every VS Code theme you already use
* Vector PDF output via jsPDF: scalable, crisp, never rasterized
* Live re-render: change theme, page size, font, or orientation from the preview toolbar and watch the PDF update
* Markdown files render in raw mode (syntax-highlighted source) or render mode (HTML preview)
* Save as PDF, print directly, or open the system print dialog from inside the preview
* Works on macOS, Windows, and Linux

## Usage

There are three ways to invoke Print2Paper on the active editor:

* Press **Alt+P**
* Right-click in the editor and choose **Print2Paper**
* Open the Command Palette (**Cmd+Shift+P** on macOS, **Ctrl+Shift+P** on Windows or Linux) and run **Print: Print2Paper**

A preview panel opens beside your editor with a styled PDF of the file (or your current selection, if you have one). The toolbar across the top of the preview gives you live control:

* **Print menu**: open the system print dialog, send the PDF straight to your printer, or save it as a `.pdf` file
* **Page menu**: page size and orientation
* **Theme menu**: any of the 100+ bundled syntax themes; defaults to your active VS Code theme
* **Text menu**: font size from 8 px to 24 px
* **Markdown mode menu**: only appears for `.md` files; toggles between syntax-highlighted source and rendered HTML

There is a second command, **Print: Clear State**, available from the Command Palette. Use it if persisted preview settings (page size, font, toolbar position) ever get into a bad state and you want a clean slate.

## Configuration

Print2Paper has no traditional VS Code settings. Everything you would want to change lives on the live preview toolbar so you can see the result immediately.

* Page sizes
  * Letter (default in US locale)
  * A4 (default in non-US locales)
  * Legal
  * Tabloid
  * Ledger
  * A3
  * Executive
* Orientations
  * Portrait
  * Landscape
* Font sizes
  * 8, 9, 10, 11, 12, 14, 16, 18, 20, 24 px
* Themes
  * Every Shiki theme that ships with VS Code, plus the full Shiki theme catalog (over 100)
  * Defaults to the active editor theme; falls back to `github-light` if the active theme is unsupported
* Markdown mode (markdown files only)
  * Raw: syntax-highlighted markdown source
  * Render: HTML-rendered preview with code blocks still syntax-highlighted

Toolbar position and your last-used menu choices persist across VS Code sessions.

## Platform support

* **macOS**: AppleScript-driven Preview integration plus direct print to the default printer
* **Windows**: PowerShell-driven `System.Windows.Forms.PrintDialog` with structured handling for missing printers, missing PDF readers, and other failure modes
* **Linux**: CUPS detection plus viewer selection (Okular, Evince, and other common PDF viewers); smoke-tested error paths in CI

## Known limitations

* Print2Paper uses jsPDF, which ships with three font families: Courier, Helvetica, and Times. Themes that rely on other fonts fall back to the closest match
* Very large files (hundreds of pages) may render slowly. Splitting into smaller files is the recommended workaround
* Webview-style files (custom previews, notebooks, image editors) are not supported as print targets; only standard text editors

## Source code and contributing

Print2Paper4VSCode is open source. Bug reports and pull requests are welcome at [github.com/appliedmedia/print2paper4vscode](https://github.com/appliedmedia/print2paper4vscode).

## License

Released under the [Apache License 2.0](https://github.com/appliedmedia/print2paper4vscode/blob/main/LICENSE).
