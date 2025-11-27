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
import { kExtensionId } from './_entrypoint_extId_t';

// Type aliases for forceNumber/forceNumbers input and output
export type ForceNumber_scalar_t = number | string | undefined;
export type ForceNumber_dict_t = Record<string, ForceNumber_scalar_t>;
export type ForceNumbers_t = Record<string, number>;

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
  // Namespace - Single source of truth from ExtensionId_t
  public static readonly kNs = kExtensionId;
  public static readonly kNs_ = App.kNs + '_';
  
  // Instance properties for easy access
  public readonly ns = App.kNs;
  public readonly ns_ = App.kNs_;
  
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
   * Force a single value to number, ensuring finite result
   * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with 0.
   * @param value - Value to convert to number
   * @returns Finite numeric value (always returns a valid number)
   */
  forceNumber(value: ForceNumber_scalar_t): number {
    return this.forceNumbers({ value }).value;
  }

  /**
   * Force a dictionary of values to numbers, ensuring all finite results
   * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with useForZero.
   * If requiredKeys specified, missing keys are added and set to useForZero.
   * @param dict - Dictionary of values to convert
   * @param useForZero - Replacement for invalid or zero values (defaults to 0)
   * @param requiredKeys - Optional array of keys that must be present (will be added if missing)
   * @returns Dictionary with all values coerced to finite numbers (always returns a valid dict)
   */
  forceNumbers(
    dict: ForceNumber_dict_t,
    useForZero = 0,
    requiredKeys?: readonly string[]
  ): ForceNumbers_t {
    // Internal helper: Force a single value to number
    const force1Number = (value: ForceNumber_scalar_t): number => {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      // isFinite returns false for NaN, Infinity, -Infinity, undefined converted to NaN
      // 0 is finite, so we need separate check
      return !Number.isFinite(parsed) || parsed === 0 ? useForZero : parsed;
    };

    const dictResult: ForceNumbers_t = {};

    // If requiredKeys specified, ensure they all exist (add with useForZero if missing)
    if (requiredKeys) {
      for (const key of requiredKeys) {
        if (!(key in dict)) {
          dict[key] = useForZero;
        }
      }
    }

    // Coerce all values to numbers using internal helper
    for (const [key, value] of Object.entries(dict)) {
      dictResult[key] = force1Number(value);
    }

    // Defensive: If dict is empty and no required keys, return dict with key "0" set to useForZero
    // This ensures the function always returns at least one entry for external callers.
    // Current internal callers never reach this (forceNumber always provides "value" key,
    // UIMenuMgr always provides requiredKeys), but external API consumers might call with {}.
    if (Object.keys(dictResult).length === 0) {
      dictResult['0'] = useForZero;
    }

    return dictResult;
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
   * Automatically includes namespace values (ns, ns_) in every replacement dictionary
   * @param source - The source text containing {{key}} placeholders
   * @param dictionary - Key-value pairs for replacement
   * @returns The source text with all placeholders replaced (including nested ones)
   */
  templateDictReplace(source: string, dictionary: Record<string, string>): string {
    let result = source;
    const maxIterations = 4;
    let iteration = 0;
    let changed = true;

    // Auto-inject namespace values into dictionary
    const enrichedDictionary: Record<string, string> = {
      ns: this.ns,
      ns_: this.ns_,
      ...dictionary,
    };

    // Repeat replacement passes until no changes occur or max iterations reached
    while (changed && iteration < maxIterations) {
      const previousResult = result;
      iteration++;

      // Replace each {{key}} with its value (all occurrences)
      for (const key of Object.keys(enrichedDictionary)) {
        const placeholder = `{{${key}}}`;
        const value = enrichedDictionary[key];
        result = result.replaceAll(placeholder, value);
      }

      // Check if anything changed in this pass
      changed = result !== previousResult;
    }

    return result;
  }
}

// end, App.ts
