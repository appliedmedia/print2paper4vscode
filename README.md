# Print2Paper4VSCode

Print or save any code or Markdown file as a syntax-highlighted PDF with one keystroke. A live preview panel opens beside your editor with a toolbar for page size, orientation, margins, theme, font size, and zoom, and every change re-renders instantly.

![Print2Paper4VSCode preview panel showing the zoom dropdown with 50%-300%, Fit Width, and Fit Page options](<assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png>)

## Why you can trust it

A printing extension necessarily reads every document you print. That is a lot of access to hand a plugin, and this whole category asks for a lot of trust. Our answer is verifiability instead of promises: the entire source is public, the extension never makes an outbound request, and you can confirm both yourself.

🇺🇸 Made in the USA · 🌍 Global friendly · 100% Code Transparency

**Zero network access**: the extension never makes an outbound request. There is no telemetry, no analytics, no tracking, and nothing is fetched from a CDN at runtime. Every asset ships inside the extension and loads from local disk: the PDF.js renderer, the eight embedded DejaVu font faces, and the Shiki themes.

The authored code, roughly thirty TypeScript files plus the yaml templates in `src/`, contains zero network calls. The one authored `fetch()` lives in `src/UIWebView.yaml` and loads the bundled PDF.js worker from local disk.

Everything under `src/lib/` is Mozilla's PDF.js. Like any PDF renderer it contains network-capable code paths, but this extension only ever gives it PDF bytes generated in memory and a worker script loaded from local disk, so those paths never reach the network. If you want to go deeper, diff `src/lib/` against the matching upstream PDF.js release.

Temporary PDFs are written to your operating system's temp directory, tracked, and deleted when the extension shuts down. Your preferences live in VS Code's on-machine global state and are uploaded nowhere.

**Global friendly**: full Unicode rendering comes from eight embedded DejaVu faces, and syntax highlighting covers the 300+ language grammars bundled with Shiki, so your code looks right whatever alphabet or box-drawing characters it contains.

**Read it in an afternoon**: the extension's own code is small enough to audit in one sitting. Grep it yourself:

```bash
grep -rn "fetch(" src --include='*.ts'
grep -rn "https\?://" src --include='*.ts'
```

The first returns nothing: no authored TypeScript calls `fetch()` at all. The second returns four lines: the three About-menu link constants (homepage, support, and dev, in `src/types/_entrypoint_extId_t.ts`) and one `@see` comment pointing at VS Code's own documentation. No remote endpoint is baked into the authored code.

Widen either grep to all of `src/` and every additional match lands in the vendored PDF.js, two developer README notes, or the local-worker `fetch()` described above.

## Features

* One-keystroke print or PDF export of any text editor, invoked five different ways.
* Syntax highlighting via Shiki: a curated set of light themes chosen for print legibility, plus any light themes from your VS Code install; defaults to your active VS Code theme and falls back to `github-light`.
* Vector PDF output via jsPDF: crisp at any zoom, never rasterized.
* Full Unicode: eight embedded DejaVu faces render box-drawing characters, extended Latin, and symbols correctly; emoji are converted to ASCII stand-ins because PDFs cannot carry color emoji glyphs.
* Markdown in two modes: syntax-highlighted source, or a fully rendered HTML preview produced by VS Code's own Markdown renderer.
* Selection-aware: prints your selection if you have one, otherwise the whole document.
* Multi-page output with automatic page breaks.
* Optional headers and footers with four content choices: document title, page number, page total, or "Page X of Y", placed left, center, or right.
* Every setting persists across sessions: page size, orientation, margins, font size, theme, Markdown mode, zoom, toolbar position, and last save directory.
* Works on macOS, Windows, and Linux.

## Using it

Install from the VS Code Marketplace: search for "Print2Paper", or run `ext install appliedmedia.print2paper4vscode`.

Invoke it on the active editor in any of five ways:

* Press **Opt/Alt+P** (bound to `alt+p`, the same on every platform).
* Click the **printer icon** in the editor title toolbar.
* Right-click the editor tab and choose **Print2Paper**.
* Right-click in the editor and choose **Print2Paper**.
* Open the Command Palette (**Cmd+Shift+P** or **Ctrl+Shift+P**) and run **Print: Print2Paper**.

If you have a selection, only the selection prints; otherwise the whole document prints.

A preview panel opens beside your editor. Its toolbar carries one menu per group of settings:

* **Print**: save the PDF to disk, send it straight to your default printer, or open the system print dialog.
* **Page**: page size (Letter, Legal, Tabloid, A3, A4, A5), orientation, margins (None, Minimal, Normal, Wide), and optional header/footer content.
* **Theme**: about a dozen light Shiki themes curated for print legibility, plus light themes from your VS Code install; defaults to your active VS Code theme.
* **Text**: font size from 8 px to 48 px.
* **Zoom**: 50% to 300%, Fit Width, or Fit Page.
* **Markdown mode**: appears only for `.md` files; toggles between raw highlighted source and rendered HTML.
* **About**: version, project links, and your current keyboard shortcut.

A second command, **Print: Clear State** (`p2p4vsc.persistClear`), resets the persisted preview settings if they ever get into a bad state.

## Quick Start

Prerequisites: Node.js 20 or newer and VS Code `^1.90.0`.

```bash
git clone https://github.com/appliedmedia/print2paper4vscode
cd print2paper4vscode
npm install
npm run compile
```

Then open the project in VS Code and press **F5** to launch the Extension Development Host.

Tests: `npm test` runs the `node:test` unit suite, `npm run test:gherkin` runs the Cucumber/Gherkin suites, `npm run test:all` runs both, and `npm run test:coverage` produces the c8 coverage report.

Lint: `npm run lint` for ESLint, `npm run lint:md` for markdownlint, or `npm run lint:all` for both plus the YAML linter.

Build and package: `npm run build` bundles the extension with esbuild. To package a local VSIX, run `npx @vscode/vsce package --readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md`; without those flags, vsce would ship this developer README to the Marketplace instead of the user-facing one.

CI runs on GitHub Actions across `ubuntu-latest` and `windows-latest` with Node 20.

## Architecture

Print2Paper uses registry-based lazy dependency injection: `App` constructs a `Registry` that instantiates components on demand. The print pipeline flows in one direction. `TabInspector` captures the editor content (your selection or the whole document), `Stylize` tokenizes it with Shiki, `PDF` renders vector output with jsPDF and the embedded DejaVu fonts, `UIWebView` previews it with the bundled PDF.js, and the OS layer handles print, save, and reveal.

Key components:

* **App**: constructs the registry and wires everything together.
* **PaperPrinter**: coordinates the print workflow and the toolbar menus.
* **TabInspector**: reads the active editor's content and selection.
* **Stylize**: tokenizes source with Shiki themes.
* **PDF**: builds the vector PDF with jsPDF and embedded fonts.
* **UIWebView** and **UIMenuMgr**: render the preview panel and its interactive menus.
* **VSCodeAPIs**: the single seam onto the VS Code API.
* **OS** (**OSMac**, **OSWin**, **OSLinux**): platform-specific print, save, and reveal.

## Platform support

* **macOS**: AppleScript opens the PDF in Preview's print dialog; direct print goes through `lpr`; reveal opens Finder.
* **Windows**: PowerShell drives `System.Windows.Forms.PrintDialog` for the dialog and `Start-Process -Verb Print` for direct printing, with clear messages for missing printers, missing PDF readers, or execution-policy problems.
* **Linux**: the dialog launches the first available viewer (evince, okular, atril, or xreader, falling back to `xdg-open`); direct print goes through the CUPS `lp` command, with a helpful message if CUPS is absent.

## Known limitations

* Emoji print as ASCII stand-ins (for example, ✅ becomes `[x]`), because PDFs cannot embed color emoji glyphs.
* Very large files, in the hundreds of pages, render slowly.
* Only text editors are printable; custom previews, notebooks, and image tabs are not print targets.

## Documentation

* [Marketplace README](<docs/MARKETPLACE.md>): the end-user listing that ships to the Marketplace.
* [Marketplace changelog](<docs/MARKETPLACE_CHANGELOG.md>): the end-user changelog that ships to the Marketplace.
* [VS Code API notes](<docs/VSCodeAPIs.md>): how the extension integrates with the editor.
* [Changelog](<CHANGELOG.md>): developer-facing release history.
* [Plans](<docs/plans/>): active and completed working documents.

## Contributing

Contributions are welcome under the license terms below. See [CONTRIBUTING.md](<CONTRIBUTING.md>) for setup and the pull-request process, and report bugs at [p2p4vsc.support](<https://p2p4vsc.support>).

## License

Print2Paper4VSCode is released under the [Code Transparency v1](<LICENSE>) license. The source is public so you can view, study, and audit it, and pull requests are welcome. It is source-available, not open source: you may not create derivative works, redistribute it, or use it commercially without a separate license. Bundled third-party components are attributed in [THIRD-PARTY-NOTICES.md](<THIRD-PARTY-NOTICES.md>).

## About Applied Media

Applied Media (USA) builds all of its software with this same full-source-transparency approach. If you like how this one is put together, watch or star the [repository](<https://github.com/appliedmedia/print2paper4vscode>) or the [appliedmedia organization](<https://github.com/appliedmedia>) to see what comes next.
