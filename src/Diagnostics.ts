// Type definition for messages that can be sent to out/print
type MessageRef = string | object;

import { UI } from './UI';

export class Diagnostics {
  static separator = ' > ';

  private static _debugOn = false; // Root level debug state

  private _name: string = '';
  private name_lineage: string = '';
  private _displayName: string = '';

  get name(): string {
    return (this._displayName ||= this.name_lineage
      ? `${this.name_lineage}${Diagnostics.separator}${this._name}`
      : this._name);
  }

  set name(value: string) {
    this._name = value;
    this._displayName = ''; // Invalidate cache
  }

  private parent: Diagnostics | null = null;
  private startTime: number | null = null;
  private _debugOn: boolean | undefined;

  constructor(name: string, debugOn?: boolean, parent?: Diagnostics | null) {
    this._name = name;
    this.parent = parent || null;
    this.startTime = performance.now();

    // Build name lineage by crawling up parent tree
    this.name_lineage = this.buildNameLineage();

    // Set debug state before calling out()
    this.debugOn(debugOn);

    this.out(`🚀 Entering method: ${this.name}`);
  }

  /**
   * New sub-context Diagnostics instance for a method
   * @param name - The name of the method being entered
   * @param debugOn - Optional debug override (undefined inherit parent's debug status)
   * @returns New Diagnostics instance for the method
   */
  sub(name: string, debugOn?: boolean): Diagnostics {
    const dx = new Diagnostics(name, debugOn, this);
    return dx;
  }

  /**
   * Create a new independent Diagnostics instance (not a sub-context)
   * @param name - The name of the new Diagnostics instance
   * @param debugOn - Optional debug override (undefined uses global debug state)
   * @returns New independent Diagnostics instance
   */
  create(name: string, debugOn?: boolean): Diagnostics {
    const dx = new Diagnostics(name, debugOn, null);
    return dx;
  }

  /**
   * Validate that required arguments are present in the args object
   * @param args - The arguments object to validate
   * @param requiredKeys - Array of required argument key names
   * @returns true if all required arguments are present, false otherwise
   */
  require(args: Record<string, unknown>, requiredKeys: string[]): boolean {
    let missingKeys = [];
    for (const key of requiredKeys) {
      if (!(key in args) || args[key] === undefined) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      const missingKeysString = `"${missingKeys.join('", "')}"`;
      this.print(`❌ missing: ${missingKeysString}`);
    }

    return missingKeys.length === 0;
  }

  /**
   * Output a debug message
   * @param message - The message to output
   * @returns this for method chaining
   */
  out(message: MessageRef): this {
    if (this._debugOn) {
      const formattedMessage = this.messageHeader(message);
      UI.out(formattedMessage);
    }
    return this;
  }

  /**
   * Mark method completion and output timing information
   * @param message - Optional completion message
   * @returns this for method chaining
   */
  done(message?: MessageRef): this {
    if (this._debugOn && this.startTime !== null) {
      const duration = performance.now() - this.startTime;
      let timeDisplay: string;

      if (duration >= 86400000) {
        // 24 hours or more
        timeDisplay = (duration / 86400000).toFixed(2) + 'd';
      } else if (duration >= 3600000) {
        // 1 hour or more
        timeDisplay = (duration / 3600000).toFixed(2) + 'h';
      } else if (duration >= 60000) {
        // 1 minute or more
        timeDisplay = (duration / 60000).toFixed(2) + 'm';
      } else if (duration >= 1000) {
        // 1 second or more
        timeDisplay = (duration / 1000).toFixed(2) + 's';
      } else {
        // Less than 1 second - show milliseconds with 2 decimal places
        timeDisplay = duration.toFixed(2) + 'ms';
      }

      const completionMsg = message ? ` - ${message}` : '';
      this.out(`🏁 Method completed in ${timeDisplay}${completionMsg}`);
    }

    return this;
  }

  /**
   * Output a message regardless of debug settings
   * @param message - The message to output
   * @returns this for method chaining
   */
  print(message: MessageRef): this {
    const formattedMessage = this.messageHeader(message);
    UI.out(formattedMessage);
    return this;
  }

  /**
   * Format a message with timestamp, class name, and method name
   * @param message - The message to format
   * @returns Formatted message string
   */
  private messageHeader(message: MessageRef): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;

    const timestamp = `${year}-${month}-${day} ${displayHours}:${minutes}:${seconds}.${milliseconds}${ampm}`;

    // Show full context: lineage > current name > message
    const formattedMessage =
      typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    return `[${timestamp}] ${this.name} > ${formattedMessage}`;
  }

  /**
   * Get or set debug mode for this instance
   * @param enabled - Optional: set debug mode if provided
   * @returns Current debug state for this instance
   */
  debugOn(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      this._debugOn = enabled;
      return enabled;
    }

    // If we have an explicit value, use it
    if (this._debugOn !== undefined) {
      return this._debugOn;
    }

    // Otherwise, inherit from parent or use global default
    return this.buildDebugOnLineage();
  }

  /**
   * Get or set the root level debug state
   * @param enabled - Optional: set global debug mode if provided
   * @returns Current global debug state
   */
  static debugOn(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      Diagnostics._debugOn = enabled;
    }
    return Diagnostics._debugOn;
  }

  /**
   * Generic method to crawl up the parent tree and collect field values
   * @param fieldName - The field name to collect from each parent
   * @returns Array of field values in order from root to current
   */
  private crawlUp<T>(fieldName: string): T[] {
    const values: T[] = [];
    let current: Diagnostics | null = this.parent;

    while (current !== null) {
      // Access the private field through appropriate methods
      let currentValue: T;
      if (fieldName === '_name') {
        currentValue = current.name as T;
      } else if (fieldName === '_debugOn') {
        currentValue = current.debugOn() as T;
      } else {
        const diag = current as unknown as Record<string, unknown>;
        currentValue = diag[fieldName] as T;
      }

      const currentValueAsString = currentValue?.toString() || '';
      const currentValueStringLength = currentValueAsString.length;
      if (currentValueStringLength) {
        values.unshift(currentValue);
      }
      current = current.parent;
    }

    return values;
  }

  /**
   * Build the name lineage by crawling up the parent tree
   * @returns The lineage string (e.g., "App > PaperPrinter")
   */
  private buildNameLineage(): string {
    const lineage = this.crawlUp<string>('_name');
    return lineage.join(Diagnostics.separator);
  }

  /**
   * Build the debug state lineage by crawling up the parent tree
   * @returns The first valid debug state found, or static debug state if none found
   */
  private buildDebugOnLineage(): boolean {
    const debugStates = this.crawlUp<boolean>('_debugOn');
    return debugStates.length > 0 ? debugStates[debugStates.length - 1] : Diagnostics.debugOn();
  }
}
