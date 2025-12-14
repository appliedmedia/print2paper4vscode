"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diagnostics = void 0;
const UI_1 = require("./UI");
const OS_1 = require("./OS");
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
 * const sub = dx.sub({ name: 'myMethod' });
 * sub.require({path, content}, ['path', 'content']);
 * sub.out('Processing file');
 * sub.done();
 */
class Diagnostics {
    static id = 'dx';
    static _shared = {
        separator: ' > ',
        debugOn: false,
        lastMessageContent: '',
        lastMessagePrefix: '',
        lastPartialMessage: '',
        lastWasTruncated: false,
        messageCounter: 0,
        duplicateCount: 0,
    };
    get shared() {
        return Diagnostics._shared;
    }
    // Helper utilities namespace
    util = {
        kBookendIcon: {
            warning: '⚠️',
        },
        bookend: (source, bookend, pad = 1) => {
            let result = source;
            if (bookend) {
                const padding = ' '.repeat(Math.max(0, Math.floor(pad)));
                result = `${bookend}${padding}${source}${padding}${bookend}`;
            }
            return result;
        },
    };
    /**
     * Reset static state for testing purposes
     */
    static reset() {
        Diagnostics._shared.lastMessageContent = '';
        Diagnostics._shared.lastMessagePrefix = '';
        Diagnostics._shared.lastPartialMessage = '';
        Diagnostics._shared.lastWasTruncated = false;
        Diagnostics._shared.messageCounter = 0;
        Diagnostics._shared.duplicateCount = 0;
    }
    _name = '';
    name_lineage = '';
    _displayName = '';
    app = null; // Store app reference on root instance only
    get name() {
        return (this._displayName ||= this.name_lineage
            ? `${this.name_lineage}${this.shared.separator}${this._name}`
            : this._name);
    }
    set name(value) {
        this._name = value;
        this._displayName = ''; // Invalidate cache
    }
    parent = null;
    startTime = null;
    _debugOn;
    constructor(args) {
        // Note: Cannot use dx.require here as Diagnostics is not yet initialized
        if (!args.name) {
            throw new Error('Diagnostics constructor requires name parameter');
        }
        const { name, debugOn, parent, app } = args;
        this._name = name;
        this.parent = parent || null;
        this.startTime = OS_1.OS.performance.now();
        this.app = app;
        // Build name lineage by crawling up parent tree
        this.name_lineage = this.buildNameLineage();
        // Set debug state before calling out()
        if (debugOn !== undefined) {
            this._debugOn = debugOn;
        }
        this.out(`🚀 Start`);
    }
    /**
     * Create a sub-context Diagnostics instance
     * Used for both component-level (in constructors) and method-level (in methods) contexts
     * @param args.name - The name of the component or method
     * @param args.debugOn - Optional debug override (undefined inherits parent's debug status)
     * @returns New Diagnostics instance with this as parent
     */
    sub(args) {
        // Note: Cannot use this.require() here as it would require creating a sub-diagnostics
        // which would cause infinite recursion. Simple validation instead.
        if (!args.name) {
            throw new Error('Diagnostics.sub() missing required parameter: name');
        }
        const { name, debugOn } = args;
        const result = new Diagnostics({ name, debugOn, parent: this, app: this.app });
        return result;
    }
    /**
     * Validate that required arguments are present in the args object
     * @param args - The arguments object to validate
     * @param requiredKeys - Array of required argument key names
     * @returns true if all required arguments are present, false otherwise
     */
    require(args, requiredKeys) {
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
    out(message) {
        if (message && this.debugOn()) {
            const formattedMessage = this.messageHeader(message);
            UI_1.UI.out(formattedMessage);
        }
        return this;
    }
    /**
     * Mark method completion and output timing information
     * @param message - Optional completion message
     * @returns this for method chaining
     */
    done(message) {
        if (this.debugOn() && this.startTime !== null) {
            const duration = OS_1.OS.performance.now() - this.startTime;
            const timeUnits = [
                { ms: 86400000, suffix: 'd' },
                { ms: 3600000, suffix: 'h' },
                { ms: 60000, suffix: 'm' },
                { ms: 1000, suffix: 's' },
                { ms: 1, suffix: 'ms' },
            ];
            let i = 0;
            for (; i < timeUnits.length - 1 && duration < timeUnits[i].ms; i++)
                ;
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
    print(message) {
        if (message) {
            const formattedMessage = this.messageHeader(message);
            UI_1.UI.out(formattedMessage);
        }
        return this;
    }
    /**
     * Output an error message and display to user
     * Forces print regardless of debug settings and shows error dialog
     * @param message - The error message to output and display
     * @returns this for method chaining
     */
    error(message) {
        // Format and print error message (messageHeader handles string vs JSON)
        if (message) {
            message = `❌ ERROR: ${message}`;
            const formattedMessage = this.messageHeader(message);
            UI_1.UI.out(formattedMessage);
            // Show error dialog to user (only if UI is already instantiated to avoid circular deps)
            if (this.app?.reg?.hasInstance?.('ui')) {
                this.app.ui.showErrorMessage(formattedMessage);
            }
        }
        return this;
    }
    /**
     * Increment and return formatted message counter
     */
    messageHeader_incCounter() {
        this.shared.messageCounter = (this.shared.messageCounter + 1) % 10000;
        return String(this.shared.messageCounter).padStart(4, '0');
    }
    /**
     * Return duplicate count indicator if needed (formatted to match previous message)
     * @param timestamp - Optional timestamp for non-truncated format
     */
    messageHeader_addForDupe(timestamp = '') {
        const warning_max = 10;
        let message = '';
        if (this.shared.duplicateCount) {
            const counter = this.messageHeader_incCounter();
            // Build duplicate message
            let dupMsg = `↑ x${this.shared.duplicateCount + 1}`;
            // Add warning bookends if duplicate count exceeds threshold
            if (this.shared.duplicateCount > warning_max) {
                dupMsg = this.util.bookend(dupMsg, this.util.kBookendIcon.warning);
            }
            // Match format of duplicated message (truncated or full)
            if (this.shared.lastWasTruncated) {
                // Truncated format: just counter and dup indicator
                message = `${counter} | ${dupMsg}\n`;
            }
            else {
                // Full format: counter | timestamp | prefix | dup indicator
                const prefix = this.shared.lastMessagePrefix;
                message = timestamp
                    ? `${counter} | ${timestamp}${prefix}${dupMsg}\n`
                    : `${counter} | ${prefix}${dupMsg}\n`;
            }
            this.shared.duplicateCount = 0; // Reset duplicate count
        }
        return message;
    }
    /**
     * Format a message with timestamp, class name, and method name
     * Handles both truncation (same prefix) and deduplication (exact duplicate)
     * @param message - The message to format
     * @returns Formatted message string, or empty string if duplicate (caller should skip output)
     */
    messageHeader(message) {
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
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
        const sep = this.shared.separator;
        const prefix = `${this.name}${sep}`;
        const messageContent = `${prefix}${formattedMessage}`;
        let partialMessage = formattedMessage;
        let wasTruncated = false;
        // Truncate only when prefixes match exactly
        if (this.shared.lastMessageContent && this.shared.lastMessagePrefix === prefix) {
            wasTruncated = true;
            partialMessage = messageContent.slice(prefix.length).trim();
            // Check for duplicate (same prefix AND same partial message)
            if (partialMessage === this.shared.lastPartialMessage) {
                this.shared.duplicateCount++;
            }
            else {
                // Different partial message - output dup count matching previous message format
                result += this.messageHeader_addForDupe(`${timestamp} | `);
                const counter = this.messageHeader_incCounter();
                result += `${counter} | ${partialMessage}`;
            }
        }
        else {
            // Different prefix - output dup count matching previous message format
            result += this.messageHeader_addForDupe(`${timestamp} | `);
            const counter = this.messageHeader_incCounter();
            result += `${counter} | ${timestamp} | ${messageContent}`;
        }
        // Store state for next message (only if not duplicate)
        if (!this.shared.duplicateCount) {
            this.shared.lastMessageContent = messageContent;
            this.shared.lastMessagePrefix = prefix;
            this.shared.lastPartialMessage = partialMessage;
            this.shared.lastWasTruncated = wasTruncated;
        }
        return result;
    }
    /**
     * Get or set debug mode for this instance
     * @param enabled - Optional: set debug mode if provided
     * @returns Current debug state for this instance
     */
    debugOn(enabled) {
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
    static debugOn(enabled) {
        if (enabled !== undefined) {
            Diagnostics._shared.debugOn = enabled;
        }
        return Diagnostics._shared.debugOn;
    }
    /**
     * Generic method to crawl up the parent tree and collect field values
     * @param fieldName - The field name to collect from each parent
     * @returns Array of field values in order from root to current
     */
    crawlUp(fieldName) {
        const values = [];
        let current = this.parent;
        while (current !== null) {
            // Access the private field through appropriate methods
            let currentValue;
            if (fieldName === '_name') {
                currentValue = current._name;
            }
            else if (fieldName === '_debugOn') {
                // IMPORTANT: Access _debugOn directly to avoid infinite recursion
                // Do NOT call current.debugOn() as it would recursively call buildDebugOnLineage()
                currentValue = current._debugOn;
            }
            else {
                const diag = current;
                currentValue = diag[fieldName];
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
    buildNameLineage() {
        const lineage = this.crawlUp('_name');
        return lineage.join(this.shared.separator);
    }
    /**
     * Build the debug state lineage by crawling up the parent tree
     * @returns The first valid debug state found, or static debug state if none found
     */
    buildDebugOnLineage() {
        const debugStates = this.crawlUp('_debugOn');
        return debugStates.length > 0 ? debugStates[debugStates.length - 1] : this.shared.debugOn;
    }
}
exports.Diagnostics = Diagnostics;
// end, Diagnostics.ts
//# sourceMappingURL=Diagnostics.js.map