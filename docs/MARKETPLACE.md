# Print2Paper4VSCode

Print or save any code file as a syntax-highlighted PDF with one keystroke. Live preview, 100+ themes, every page size you would actually use.

<!-- NOTE: absolute URLs intentional. vsce link-rewriter mangles angle-bracket and relative forms. -->
![Print2Paper preview panel showing the zoom dropdown with 50%-300%, Fit Width, and Fit Page options](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png)

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

## Toolbar tour

Each menu in the preview toolbar gives you live, in-place control over the rendered PDF.

![Print menu: Save as PDF, Print, Print Sample](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_01_print.png)

**Print menu** — save the rendered PDF to disk, send it directly to your default printer, or open the system print dialog for full driver control.

![Page menu: Letter, A4, Legal, Tabloid, Ledger, A3, Executive, with portrait and landscape orientation](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_02_page.png)

**Page menu** — pick a page size (Letter, A4, Legal, Tabloid, Ledger, A3, Executive) and orientation (portrait or landscape).

![Theme menu: Shiki theme picker dropdown](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_03_theme.png)

**Theme menu** — choose any of the 100+ bundled Shiki themes. Defaults to your active VS Code theme.

![Text menu: font size from 8 px to 24 px](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_04_text.png)

**Text menu** — set the font size, anywhere from 8 px to 24 px.

![Zoom menu: 50% to 300%, Fit Width, Fit Page](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png)

**Zoom menu** — zoom the preview from 50% to 300%, or auto-fit the PDF to the panel width or full page.

![Markdown mode menu: raw vs render toggle](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_06_md.png)

**Markdown mode menu** — only appears for `.md` files. Toggle between syntax-highlighted markdown source and a fully rendered HTML preview.

![About menu](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_07_about.png)

**About menu** — version info, links to the marketplace listing, and the keyboard shortcut for the Print2Paper command.

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
