import { VSCodeAPIs } from './VSCodeAPIs';
import { UI } from './UI';
import { PDF } from './PDF';
import { PaperPrinter } from './PaperPrinter';
import { Stylize } from './Stylize';
import { TabInspector } from './TabInspector';
import { OS } from './OS';
import { UIMenuMgr } from './UIMenuMgr';
import { Diagnostics } from './Diagnostics';
import type { ExtensionContext } from 'vscode';

type components_t = {
  vscodeapis: VSCodeAPIs;
  ui: UI;
  os: OS;
  pdf: PDF;
  paperprinter: PaperPrinter;
  stylize: Stylize;
  tabinspector: TabInspector;
  uimenumgr: UIMenuMgr;
};

/**
 * App - Main application container and component manager
 *
 * Central orchestrator for the Print2Paper4VSCode extension. Creates and manages
 * all major components, handles initialization/cleanup lifecycle, and provides
 * shared utilities like template replacement.
 *
 * @input context - VS Code extension context
 * @input vscode - VS Code API module
 * @output Initialized component ecosystem, lifecycle management, template utilities
 *
 * @example
 * const app = new App(context, vscode);
 * app.init();
 * const replaced = app.templateDictReplace('Hello {{name}}', {name: 'World'});
 */
export class App {
  vscodeapis: VSCodeAPIs;
  ui: UI;
  pdf: PDF;
  paperprinter: PaperPrinter;
  stylize: Stylize;
  tabinspector: TabInspector;
  os: OS;
  uimenumgr: UIMenuMgr;
  dx: Diagnostics;

  private readonly componentOrder: (keyof components_t)[] = [
    'vscodeapis',
    'ui',
    'os',
    'pdf',
    'paperprinter',
    'stylize',
    'tabinspector',
    'uimenumgr',
  ];

  constructor(context: ExtensionContext, vscode: typeof import('vscode')) {
    // Create Diagnostics instance first
    this.dx = new Diagnostics('App', undefined /* debugOn */, null /* parent */, this);

    // Create components - VSCodeAPIs first, then UI, then UIMenuMgr (needed by PaperPrinter), then others
    this.vscodeapis = new VSCodeAPIs(this, vscode, context);
    this.ui = new UI(this);
    this.uimenumgr = new UIMenuMgr(this); // Must be created before PaperPrinter (which creates menus in constructor)
    this.os = OS.create(this);
    this.pdf = new PDF(this);
    this.paperprinter = new PaperPrinter(this);
    this.stylize = new Stylize(this);
    this.tabinspector = new TabInspector(this);
  }

  init(): void {
    // Initialize all components in dependency order
    for (const component of this.componentOrder) {
      (this as components_t)[component].init();
    }
  }

  done(): void {
    // Cleanup all components in reverse order
    for (const component of [...this.componentOrder].reverse()) {
      (this as components_t)[component].done();
    }

    this.dx.done();
  }

  /**
   * Force a value to number
   * Converts string to number, returns 0 if not parseable
   * @param value - Value to convert to number
   * @returns Numeric value or 0 if conversion fails
   */
  forceNumber(value: number | string): number {
    return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  }

  /**
   * Check if content is non-empty
   * @param content - Content to check (string, number, boolean, or undefined)
   * @returns true if content has length > 0 when converted to string
   */
  notEmpty(content: string | number | boolean | undefined = ''): boolean {
    return String(content ?? '').length > 0;
  }

  /**
   * Add bookends to a string with optional padding
   * @param source - The original string to bookend
   * @param bookend - The string to add at beginning and end (e.g., '⚠️')
   * @param pad - Number of spaces to add between bookend and content (default: 1)
   * @returns The bookended string, or original if bookend is empty/falsy
   * @example
   * bookend('Hello', '⚠️', 1) → '⚠️ Hello ⚠️'
   * bookend('Hello', '⚠️', 0) → '⚠️Hello⚠️'
   * bookend('Hello', '', 1) → 'Hello'
   */
  bookend(source: string, bookend: string, pad: number = 1): string {
    let bookended = source;

    if (bookend) {
      const padding = ' '.repeat(pad);
      bookended = `${bookend}${padding}${source}${padding}${bookend}`;
    }
    return bookended;
  }

  /**
   * Generic template replacement function
   * Replaces all {{key}} placeholders in source text with values from dictionary
   * @param source - The source text containing {{key}} placeholders
   * @param dictionary - Key-value pairs for replacement
   * @returns The source text with all placeholders replaced
   */
  templateDictReplace(source: string, dictionary: Record<string, string>): string {
    let result = source;

    // Sort keys by length (shortest first) to avoid partial replacements
    const sortedKeys = Object.keys(dictionary).sort((a, b) => a.length - b.length);

    // Replace each {{key}} with its value (all occurrences)
    for (const key of sortedKeys) {
      const placeholder = `{{${key}}}`;
      const value = dictionary[key];
      result = result.replaceAll(placeholder, value);
    }

    return result;
  }
}

// end, App.ts
