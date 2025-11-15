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
   * Force a value to number, ensuring finite result
   * Converts string to number, returns 0 if not parseable, undefined, NaN, or Infinity
   * @param value - Value to convert to number (number, string, or undefined)
   * @returns Finite numeric value, or 0 if value is undefined, NaN, Infinity, or unparseable
   */
  forceNumber(value: number | string | undefined): number {
    // For numeric inputs, check if finite
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    // For non-numeric inputs, parse and validate
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Check if content has content when stringified
   * Note: Numbers (including 0) and booleans (including false) always have content after stringification.
   * Only undefined, null, and empty strings are considered empty.
   * @param content - Content to check (string, number, boolean, or undefined)
   * @returns true if content has content when stringified (length > 0)
   */
  hasContent(content: string | number | boolean | undefined = ''): boolean {
    return String(content ?? '').length > 0;
  }

  /**
   * Generic template replacement function
   * Replaces all {{key}} placeholders in source text with values from dictionary
   * Supports nested placeholders by performing multiple passes until no changes occur
   * @param source - The source text containing {{key}} placeholders
   * @param dictionary - Key-value pairs for replacement
   * @returns The source text with all placeholders replaced (including nested ones)
   */
  templateDictReplace(source: string, dictionary: Record<string, string>): string {
    let result = source;
    const maxIterations = 4;
    let iteration = 0;
    let changed = true;

    // Repeat replacement passes until no changes occur or max iterations reached
    while (changed && iteration < maxIterations) {
      const previousResult = result;
      iteration++;

      // Replace each {{key}} with its value (all occurrences)
      for (const key of Object.keys(dictionary)) {
        const placeholder = `{{${key}}}`;
        const value = dictionary[key];
        result = result.replaceAll(placeholder, value);
      }

      // Check if anything changed in this pass
      changed = result !== previousResult;
    }

    return result;
  }
}

// end, App.ts
