export class Diagnostics {
  static separator = ' > ';
  private static _debugOn = false; // Root level debug state

  private name: string;
  private parent: Diagnostics | null;
  private startTime: number | null;
  private _debugOn: boolean;
  private debugOverride: boolean | null;

  constructor(name: string, debugOverride?: boolean | null, parent?: Diagnostics | null) {
    this.name = name;
    this.parent = parent || null;
    this.startTime = null;

    // Determine debug state through inheritance chain
    if (debugOverride !== undefined && debugOverride !== null) {
      this.debugOverride = debugOverride;
      this._debugOn = debugOverride;
    } else if (parent && parent.debugOverride !== null) {
      this.debugOverride = parent.debugOverride;
      this._debugOn = parent.debugOverride;
    } else {
      this.debugOverride = null;
      this._debugOn = Diagnostics._debugOn;
    }
  }

  /**
   * Create a sub-context Diagnostics instance for a method
   * @param methodName - The name of the method being entered
   * @param debugOverride - Optional debug override (undefined/null inherit parent's debug status)
   * @returns New Diagnostics instance for the method
   */
  sub(methodName: string, debugOverride?: boolean | null): Diagnostics {
    const subName = this.name + Diagnostics.separator + methodName;
    const methodDx = new Diagnostics(subName, debugOverride, this);

    if (methodDx._debugOn) {
      methodDx.startTime = Date.now();
      methodDx.out(`🚀 Entering method: ${methodName}`);
    }

    return methodDx;
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
        const methodName = this.getMethodName() || 'unknown';
        const errorMsg = `${methodName}: ${key} missing!`;
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
  out(message: any): this {
    if (this._debugOn) {
      console.log(this.formatMessage(message));
    }
    return this;
  }

  /**
   * Mark method completion and output timing information
   * @param message - Optional completion message
   * @returns this for method chaining
   */
  done(message?: any): this {
    if (this._debugOn && this.startTime !== null) {
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

    // Reset method context
    this.startTime = null;

    return this;
  }

  /**
   * Output a message regardless of debug settings
   * @param message - The message to output
   * @returns this for method chaining
   */
  print(message: any): this {
    console.log(this.formatMessage(message));
    return this;
  }

  /**
   * Format a message with timestamp, class name, and method name
   * @param message - The message to format
   * @returns Formatted message string
   */
  private formatMessage(message: any): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${this.name} > ${message}`;
  }

  /**
   * Get or set debug mode for this instance
   * @param enabled - Optional: set debug mode if provided
   * @returns Current debug state for this instance, or this for method chaining when setting
   */
  debugOn(enabled?: boolean): boolean | this {
    if (enabled !== undefined) {
      this.debugOverride = enabled;
      this._debugOn = enabled;
      return this;
    }
    return this._debugOn;
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
   * Get the method name from the current context
   * @returns The method name or null if not in a method
   */
  getMethodName(): string | null {
    // Extract method name from the name (everything after the last separator)
    const parts = this.name.split(Diagnostics.separator);
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  /**
   * Get the class name for this instance
   * @returns The class name
   */
  getClassName(): string {
    // Return the first part of the name (before any separators)
    return this.name.split(Diagnostics.separator)[0];
  }
}
