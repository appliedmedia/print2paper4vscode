// Type definition for messages that can be sent to out/print
type MessageRef = string | object;

import { UI } from './UI';
import { OS } from './OS';

/**
 * Diagnostics - Hierarchical debug logging and validation system
 *
 * Provides scoped diagnostic output with parent-child relationships, timing,
 * argument validation, and conditional debug output. Supports nested diagnostic
 * contexts with automatic cleanup and performance tracking.
 *
 * @input name - Diagnostic scope name
 * @input parent - Optional parent diagnostics context
 * @output Debug messages, timing info, argument validation, lifecycle tracking
 *
 * @example
 * const dx = new Diagnostics('MyClass');
 * const sub = dx.sub('myMethod');
 * sub.require({path, content}, ['path', 'content']);
 * sub.out('Processing file');
 * sub.done();
 */
export class Diagnostics {
  static separator = ' > ';

  private static _debugOn = false; // Root level debug state
  private static _lastMessageContent = ''; // Store last message content for truncation
  private static _lastMessagePrefix = ''; // Store last prefix for robust truncation

  private _name: string = '';
  private name_lineage: string = '';
  private _displayName: string = '';
  private app: any = null; // Store app reference on root instance only

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

  constructor(name: string, debugOn?: boolean, parent?: Diagnostics | null, app?: any) {
    this._name = name;
    this.parent = parent || null;
    this.startTime = OS.performance.now();
    this.app = app;

    // Build name lineage by crawling up parent tree
    this.name_lineage = this.buildNameLineage();

    // Set debug state before calling out()
    this.debugOn(debugOn);

    this.out(`🚀 Start`);
  }

  /**
   * New sub-context Diagnostics instance for a method
   * @param name - The name of the method being entered
   * @param debugOn - Optional debug override (undefined inherit parent's debug status)
   * @returns New Diagnostics instance for the method
   */
  sub(name: string, debugOn?: boolean): Diagnostics {
    const dx = new Diagnostics(name, debugOn, this, this.app);
    return dx;
  }

  /**
   * Create a new independent Diagnostics instance (not a sub-context)
   * @param name - The name of the new Diagnostics instance
   * @param debugOn - Optional debug override (undefined uses global debug state)
   * @returns New independent Diagnostics instance
   */
  create(name: string, debugOn?: boolean): Diagnostics {
    const dx = new Diagnostics(name, debugOn, null, this.app);
    return dx;
  }


  /**
   * Get the last partial message from the root app's dx state
   */
  private get lastPartialMessage(): string {
    return this.app?.dx?._lastPartialMessage || '';
  }

  /**
   * Set the last partial message in the root app's dx state
   */
  private set lastPartialMessage(value: string) {
    if (this.app?.dx) {
      this.app.dx._lastPartialMessage = value;
    }
  }

  /**
   * Get the last was truncated flag from the root app's dx state
   */
  private get lastWasTruncated(): boolean {
    return this.app?.dx?._lastWasTruncated || false;
  }

  /**
   * Set the last was truncated flag in the root app's dx state
   */
  private set lastWasTruncated(value: boolean) {
    if (this.app?.dx) {
      this.app.dx._lastWasTruncated = value;
    }
  }

  /**
   * Get the message counter from the root app's dx state
   */
  private get messageCounter(): number {
    return this.app?.dx?._messageCounter || 0;
  }

  /**
   * Set the message counter in the root app's dx state
   */
  private set messageCounter(value: number) {
    if (this.app?.dx) {
      this.app.dx._messageCounter = value;
    }
  }

  /**
   * Get the duplicate count from the root app's dx state
   */
  private get duplicateCount(): number {
    return this.app?.dx?._duplicateCount || 0;
  }

  /**
   * Set the duplicate count in the root app's dx state
   */
  private set duplicateCount(value: number) {
    if (this.app?.dx) {
      this.app.dx._duplicateCount = value;
    }
  }

  /**
   * Reset static state for testing purposes
   */
  static reset(): void {
    Diagnostics._lastMessageContent = '';
    Diagnostics._lastMessagePrefix = '';
    // Note: Instance-based state is reset through app.dx when needed
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
      if (formattedMessage) {
        UI.out(formattedMessage);
      }
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
      const duration = OS.performance.now() - this.startTime;
      const timeUnits = [
        { ms: 86400000, suffix: 'd' },
        { ms: 3600000, suffix: 'h' },
        { ms: 60000, suffix: 'm' },
        { ms: 1000, suffix: 's' },
        { ms: 1, suffix: 'ms' },
      ];

      let i = 0;
      for (; i < timeUnits.length - 1 && duration < timeUnits[i].ms; i++);
      const unit = timeUnits[i];
      const timeDisplay = (duration / unit.ms).toFixed(2) + unit.suffix;

      const completionMsg = message ? ` - ${message}` : '';
      this.out(`🏁 Done in ${timeDisplay}${completionMsg}`);
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
    if (formattedMessage) {
      UI.out(formattedMessage);
    }
    return this;
  }

  /**
   * Increment and return formatted message counter
   */
  private messageHeader_incCounter(): string {
    this.messageCounter = (this.messageCounter + 1) % 10000;
    return String(this.messageCounter).padStart(4, '0');
  }

  /**
   * Return duplicate count indicator if needed (formatted to match previous message)
   * @param timestamp - Optional timestamp for non-truncated format
   */
  private messageHeader_addForDupe(timestamp: string = ''): string {
    let message = '';
    if (this.duplicateCount) {
      const counter = this.messageHeader_incCounter();
      const dupMsg = `↑ x${this.duplicateCount + 1}`;

      // Match format of duplicated message (truncated or full)
      if (this.lastWasTruncated) {
        // Truncated format: just counter and dup indicator
        message = `${counter} | ${dupMsg}\n`;
      } else {
        // Full format: counter | timestamp | prefix | dup indicator
        const prefix = Diagnostics._lastMessagePrefix;
        message = timestamp
          ? `${counter} | ${timestamp}${prefix}${dupMsg}\n`
          : `${counter} | ${prefix}${dupMsg}\n`;
      }

      this.duplicateCount = 0; // Reset duplicate count
    }
    return message;
  }

  /**
   * Format a message with timestamp, class name, and method name
   * Handles both truncation (same prefix) and deduplication (exact duplicate)
   * @param message - The message to format
   * @returns Formatted message string, or empty string if duplicate (caller should skip output)
   */
  private messageHeader(message: MessageRef): string {
    let result = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const ampm = hours >= 12 ? 'p' : 'a';
    const displayHours = hours % 12 || 12;

    const timestamp = `${year}-${month}-${day} ${displayHours}:${minutes}:${seconds}.${milliseconds}${ampm}`;

    // Show full context: lineage > current name > message
    const formattedMessage =
      typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    const sep = Diagnostics.separator;
    const prefix = `${this.name}${sep}`;
    const messageContent = `${prefix}${formattedMessage}`;

    let partialMessage = formattedMessage;

    let wasTruncated = false;

    // Truncate only when prefixes match exactly
    if (Diagnostics._lastMessageContent && Diagnostics._lastMessagePrefix === prefix) {
      wasTruncated = true;
      partialMessage = messageContent.slice(prefix.length).trim();

      // Check for duplicate (same prefix AND same partial message)
      if (partialMessage === this.lastPartialMessage) {
        this.duplicateCount++;
      } else {
        // Different partial message - output dup count matching previous message format
        result += this.messageHeader_addForDupe(`${timestamp} | `);
        const counter = this.messageHeader_incCounter();
        result += `${counter} | ${partialMessage}`;
      }
    } else {
      // Different prefix - output dup count matching previous message format
      result += this.messageHeader_addForDupe(`${timestamp} | `);
      const counter = this.messageHeader_incCounter();
      result += `${counter} | ${timestamp} | ${messageContent}`;
    }

    // Store state for next message (only if not duplicate)
    if (!this.duplicateCount) {
      Diagnostics._lastMessageContent = messageContent;
      Diagnostics._lastMessagePrefix = prefix;
      this.lastPartialMessage = partialMessage;
      this.lastWasTruncated = wasTruncated;
    }

    return result;
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
        currentValue = (current as unknown as { _name: T })._name;
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

// end, Diagnostics.ts
