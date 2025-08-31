class Diagnostics {
    static separator = " > ";
    static globalDebugOn = false; // Root level debug state
    
    constructor(className, debugOverride = undefined, parent = null) {
        this.className = className;
        this.parent = parent;
        
        // Determine debug state through inheritance chain
        if (debugOverride !== undefined && debugOverride !== null) {
            this.debugOverride = debugOverride;
        } else if (parent && parent.debugOverride !== undefined) {
            this.debugOverride = parent.debugOverride;
        } else {
            this.debugOverride = Diagnostics.globalDebugOn;
        }
        
        this.currentMethod = null;
        this.methodStartTime = null;
    }

    /**
     * Create a sub-context Diagnostics instance for a method
     * @param {string} methodName - The name of the method being entered
     * @param {boolean|null|undefined} debugOverride - Optional debug override (undefined/null inherit parent's debug status)
     * @returns {Diagnostics} - New Diagnostics instance for the method
     */
    sub(methodName, debugOverride = undefined) {
        const methodClassName = this.className + Diagnostics.separator + methodName;
        const methodDx = new Diagnostics(methodClassName, debugOverride, this);
        
        if (methodDx.debugOverride) {
            methodDx.currentMethod = methodName;
            methodDx.methodStartTime = performance.now();
            console.log(methodDx.formatMessage(`Entering method: ${methodName}`));
        }
        
        return methodDx;
    }

    /**
     * Output a debug message
     * @param {any} message - The message to output
     */
    out(message) {
        if (this.debugOverride) {
            console.log(this.formatMessage(message));
        }
    }

    /**
     * Mark method completion and output timing information
     * @param {any} message - Optional completion message
     */
    done(message = null) {
        if (this.debugOverride && this.methodStartTime !== null) {
            const duration = performance.now() - this.methodStartTime;
            let timeDisplay;
            
            if (duration >= 60000) { // 60 seconds or more
                timeDisplay = (duration / 60000).toFixed(2) + ' minutes';
            } else {
                timeDisplay = (duration / 1000).toFixed(2) + ' seconds';
            }
            
            const completionMsg = message ? ` - ${message}` : '';
            console.log(this.formatMessage(`Method completed in ${timeDisplay}${completionMsg}`));
        }
        
        // Reset method context
        this.currentMethod = null;
        this.methodStartTime = null;
    }

    /**
     * Output a message regardless of debug settings
     * @param {any} message - The message to output
     */
    print(message) {
        console.log(this.formatMessage(message));
    }

    /**
     * Format a message with timestamp, class name, and method name
     * @param {any} message - The message to format
     * @returns {string} - Formatted message string
     */
    formatMessage(message) {
        const timestamp = new Date().toISOString();
        // Only add method context if it's not already part of the className
        const methodContext = this.currentMethod && !this.className.includes(this.currentMethod) ? ` > ${this.currentMethod}` : '';
        return `[${timestamp}] ${this.className}${methodContext} > ${message}`;
    }

    /**
     * Get or set debug mode for this instance
     * @param {boolean} enabled - Optional: set debug mode if provided
     * @returns {boolean} - Current debug state for this instance
     */
    debugOn(enabled) {
        if (enabled !== undefined) {
            this.debugOverride = enabled;
        }
        return this.debugOverride;
    }

    /**
     * Get or set the root level debug state
     * @param {boolean} enabled - Optional: set global debug mode if provided
     * @returns {boolean} - Current global debug state
     */
    static debugOn(enabled) {
        if (enabled !== undefined) {
            Diagnostics.globalDebugOn = enabled;
        }
        return Diagnostics.globalDebugOn;
    }



    /**
     * Get current method context
     * @returns {string|null} - Current method name or null if not in a method
     */
    getCurrentMethod() {
        return this.currentMethod;
    }
}

// Export for Node.js/ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Diagnostics;
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.Diagnostics = Diagnostics;
}