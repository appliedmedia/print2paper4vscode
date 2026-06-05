# Print2Paper4VSCode

Print or save any code file as a syntax-highlighted PDF with one keystroke. Live preview, light Shiki themes optimized for printing, every page size you would actually use.

<!-- NOTE: absolute URLs intentional. vsce link-rewriter mangles angle-bracket and relative forms. -->
![Print2Paper4VSCode preview panel showing the zoom dropdown with 50%-300%, Fit Width, and Fit Page options](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png)

## Features

* One-keystroke print: hit **Opt/Alt+P** in any editor to open a live PDF preview
* Light-colored Shiki themes curated for easy printing — defaults to your active VS Code theme
* Vector PDF output via jsPDF: scalable, crisp, never rasterized
* Markdown files render in raw mode (syntax-highlighted source) or render mode (HTML preview)
* Works on macOS, Windows, and Linux

## Usage

Three ways to invoke this extension on the active editor:

* Press **Opt/Alt+P**
* Right-click in the editor and choose **Print2Paper**
* Open the Command Palette (**Cmd+Shift+P** / **Ctrl+Shift+P**) and run **Print: Print2Paper**

A preview panel opens beside your editor. The toolbar gives you live control over page size, orientation, margins, zoom, font size, header/footer, and theme — changes render instantly.

The only VS Code setting this extension uses is the keyboard shortcut, which you can rebind via **About menu → Shortcut**.

## Toolbar tour

![Print menu: Save as PDF, Print, Print Sample](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_01_print.png)

**Print menu** — save to disk, send to your default printer, or open the system print dialog.

![Page menu: Letter, A4, Legal, Tabloid, A3, A5, with portrait and landscape orientation](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_02_page.png)

**Page menu** — page size, orientation, margins, and header/footer content.

![Theme menu: Shiki theme picker dropdown](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_03_theme.png)

**Theme menu** — light Shiki themes curated for print legibility.

![Text menu: font size from 8 px to 48 px](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_04_text.png)

**Text menu** — font size from 8 px to 48 px.

![Zoom menu: 50% to 300%, Fit Width, Fit Page](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png)

**Zoom menu** — 50% to 300%, Fit Width, or Fit Page.

![Markdown mode menu: raw vs render toggle](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_06_md.png)

**Markdown mode menu** — only appears for `.md` files. Toggle between syntax-highlighted source and rendered HTML.

![About menu](https://github.com/appliedmedia/print2paper4vscode/raw/main/assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_07_about.png)

**About menu** — version, links, and your current keyboard shortcut.

## Platform support

* **macOS**: AppleScript-driven Preview integration plus direct print to the default printer
* **Windows**: PowerShell-driven `System.Windows.Forms.PrintDialog` with structured handling for missing printers, missing PDF readers, and other failure modes
* **Linux**: CUPS detection plus viewer selection (Okular, Evince, and other common PDF viewers)

## Source code and contributing

This extension is open source. Bug reports and pull requests are welcome at [p2p4vsc.support](https://p2p4vsc.support).

## About Applied Media

**Applied Media** — 🇺🇸 Made in the USA · 🌍 Global friendly · 100% Code Transparency

## License

Released under the [Code Transparency v1](https://github.com/appliedmedia/print2paper4vscode/blob/main/LICENSE) license.
