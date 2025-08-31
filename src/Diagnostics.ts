// Type definition for messages that can be sent to out/print
type MessageRef = string | object;

export class Diagnostics {
  static separator = ' > ';
  private static _debugOn = false; // Root level debug state

  private name: string;
  private name_lineage: string;
  private parent: Diagnostics | null;
  private startTime: number | null;
  private _debugOn: boolean;
  private debugOverride: boolean | null;

  constructor(name: string, debugOn?: boolean, parent?: Diagnostics | null) {
    this.name = name;
    this.parent = parent || null;
    this.startTime = null;
    this._debugOn = Diagnostics._debugOn;
    this.debugOverride = null;

    // Build name lineage by crawling up parent tree
    this.name_lineage = this.buildNameLineage();

    this.debugOn(debugOn); // handles undefined

    this.startTime = Date.now();
    this.out(`🚀 Entering method: ${this.name}`);
  }

  /**
   * Create a sub-context Diagnostics instance for a method
   * @param name - The name of the method being entered
   * @param debugOn - Optional debug override (undefined inherit parent's debug status)
   * @returns New Diagnostics instance for the method
   */
  sub(name: string, debugOn?: boolean): Diagnostics {
    const subName = this.name + Diagnostics.separator + name;
    const dx = new Diagnostics(subName, debugOn, this);
    return dx;
  }

  /**
   * Validate that required arguments are present in the args object
   * @param args - The arguments object to validate
   * @param requiredKeys - Array of required argument key names
   * @returns true if all required arguments are present, false otherwise
   */
  require(args: Record<string, unknown>, requiredKeys: string[]): boolean {
    this.out(`Validating ${requiredKeys.length} required arguments`);

    for (const key of requiredKeys) {
      if (!(key in args) || args[key] === undefined) {
        const name = this.name.split(Diagnostics.separator).pop() || 'unknown';
        const errorMsg = `${name}: ${key} missing!`;
        this.out(`❌ ${errorMsg}`);
        return false;
      }
    }

    this.out(`✅ All ${requiredKeys.length} required arguments present`);
    return true;
  }

  /**
   * Output a debug message
   * @param message - The message to output
   * @returns this for method chaining
   */
  out(message: MessageRef): this {
    if (this._debugOn) {
      console.log(this.messageHeader(message));
    }
    return this;
  }

  /**
   * Mark method completion and output timing information
   * @param message - Optional completion message
   * @returns this for method chaining
   */
  done(message?: MessageRef): this {
    if (this.debugOn() && this.startTime !== null) {
      const duration = Date.now() - this.startTime;
      let timeDisplay: string;

      if (duration >= 60000) {
        // 60 seconds or more
        timeDisplay = (duration / 60000).toFixed(2) + ' minutes';
      } else {
        timeDisplay = (duration / 1000).toFixed(2) + ' seconds';
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
    console.log(this.messageHeader(message));
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
    const displayName = [this.name_lineage, this.name].join(Diagnostics.separator);
    return `[${timestamp}] ${displayName} > ${message}`;
  }

  /**
   * Get or set debug mode for this instance
   * @param enabled - Optional: set debug mode if provided
   * @returns Current debug state for this instance
   */
  debugOn(enabled?: boolean): boolean {
    let debugOn: boolean = this._debugOn;
    if (enabled !== undefined) {
      this.debugOverride = enabled;
      this._debugOn = enabled;
      debugOn = enabled;
    } else if (debugOn === undefined) {
      debugOn = this.buildDebugOnLineage();
    }
    return debugOn;
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
      const currentValue = (current as Diagnostics)[fieldName];
      values.unshift(currentValue);
      current = current.parent;
    }

    return values;
  }

  /**
   * Build the name lineage by crawling up the parent tree
   * @returns The lineage string (e.g., "App > PaperPrinter")
   */
  private buildNameLineage(): string {
    const lineage = this.crawlUp<string>('name');
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
