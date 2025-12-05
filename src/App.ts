import { VSCodeAPIs } from './VSCodeAPIs';
import { UI } from './UI';
import { PDF } from './PDF';
import { PaperPrinter } from './PaperPrinter';
import { Stylize } from './Stylize';
import { TabInspector } from './TabInspector';
import { OS } from './OS';
import { UIMenuMgr } from './UIMenuMgr';
import { UIWebView } from './UIWebView';
import { Coords } from './Coords';
import type { Diagnostics } from './Diagnostics';
import { Registry, type ComponentClass } from './Registry';
import { Persist } from './Persist';
import { Yaml } from './Yaml';
import type { FnImport_t } from './types/Registry_t';
import type { ExtensionContext } from 'vscode';
import { kExtId } from './_entrypoint_extId_t';

// Type aliases for forceNumber/forceNumbers input and output
export type ForceNumber_scalar_t = number | string | undefined;
export type ForceNumber_dict_t = Record<string, ForceNumber_scalar_t>;
export type ForceNumbers_t = Record<string, number>;

/**
 * App - Main application container and component manager
 *
 * Central orchestrator for the Print2Paper4VSCode extension. Registry manages
 * lazy component creation. App provides shared utilities like template replacement.
 *
 * Components are created lazily by Registry when first accessed via use().
 * VSCodeAPIs is special - created by App with vscode/context, then registered.
 *
 * @input context - VS Code extension context
 * @input vscode - VS Code API module
 * @output Initialized component ecosystem, lifecycle management, template utilities
 *
 * @example
 * const app = new App({ context, vscode });
 * app.init();
 * // Components created lazily when accessed
 * const fn = app.reg.use('pdf.generatePdf');
 * await fn.pdf.generatePdf();
 */
export class App {
  // Namespace - References kExtId (single source of truth)
  public static readonly kNs = kExtId;
  public static readonly kNs_ = App.kNs + '_';
  
  // Instance properties for easy access
  public readonly ns = App.kNs;
  public readonly ns_ = App.kNs_;
  
  // Core infrastructure
  public readonly reg: Registry;
  private fn: FnImport_t;
  public readonly dx: Diagnostics;

  // Lazy accessors for components (for backwards compatibility during migration)
  get vscodeapis(): VSCodeAPIs { return this.reg.getInstance<VSCodeAPIs>('vscodeapis')!; }
  get ui(): UI { return this.reg.getInstance<UI>('ui')!; }
  get pdf(): PDF { return this.reg.getInstance<PDF>('pdf')!; }
  get paperprinter(): PaperPrinter { return this.reg.getInstance<PaperPrinter>('paperprinter')!; }
  get stylize(): Stylize { return this.reg.getInstance<Stylize>('stylize')!; }
  get tabinspector(): TabInspector { return this.reg.getInstance<TabInspector>('tabinspector')!; }
  get os(): OS { return this.reg.getInstance<OS>('os')!; }
  get uimenumgr(): UIMenuMgr { return this.reg.getInstance<UIMenuMgr>('uimenumgr')!; }
  get coords(): Coords { return this.reg.getInstance<Coords>('coords')!; }
  get uiwebview(): UIWebView { return this.reg.getInstance<UIWebView>('uiwebview')!; }

  constructor(args: { context: ExtensionContext; vscode: typeof import('vscode') }) {
    const { context, vscode } = args;

    // Create Registry with all component classes
    // Registry bootstraps Diagnostics first, then creates components lazily
    // Special init params passed via 'init' dict for components needing extra args
    this.reg = new Registry({
      app: this,
      components: [
        VSCodeAPIs as unknown as ComponentClass,
        UI,
        PDF,
        PaperPrinter,
        Stylize,
        TabInspector,
        UIMenuMgr,
        UIWebView, // Singleton webview manager
        OS as unknown as ComponentClass, // OS has static create() factory
        Persist as unknown as ComponentClass, // Persist has static create() factory
        Yaml as unknown as ComponentClass, // Yaml has static create() factory
        Coords, // Singleton coordinate system
      ],
      always: ['dx.sub'],
      init: {
        // Root Diagnostics name
        dx: { name: 'App' },
        // VSCodeAPIs needs vscode and context at construction
        vscodeapis: { vscode, context },
      },
    });

    // Get our fn and dx - dx instance was created by Registry with name 'App'
    this.fn = this.reg.use();
    this.dx = this.reg.getInstance<Diagnostics>('dx')!;

    // Force VSCodeAPIs creation now - commands must register at activation
    this.reg.getInstance('vscodeapis');
  }


  /**
   * Cleanup all components
   */
  done(): void {
    this.reg.done();
    // dx is managed by Registry, will be cleaned up there
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

    // Auto-inject namespace values into dictionary (callers can override if needed)
    const enrichedDictionary: Record<string, string> = {
      ns: this.ns,      // Default namespace value
      ns_: this.ns_,    // Default namespace prefix
      ...dictionary,    // Caller values can override defaults
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
