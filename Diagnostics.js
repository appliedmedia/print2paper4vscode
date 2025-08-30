class Diagnostics {
    constructor(className, debugOverride = false) {
        this.className = className;
        this.debugOverride = debugOverride;
        this.currentMethod = null;
        this.methodStartTime = null;
    }

    /**
     * Enter a method - sets the current method context
     * @param {string} methodName - The name of the method being entered
     * @param {boolean} debugOverride - Optional debug override for this method
     */
    in(methodName, debugOverride = false) {
        this.currentMethod = methodName;
        this.currentMethodDebug = debugOverride !== undefined ? debugOverride : this.debugOverride;
        this.methodStartTime = performance.now();
        
        if (this.currentMethodDebug) {
            console.log(this.formatMessage(`Entering method: ${methodName}`));
        }
    }

    /**
     * Output a debug message
     * @param {any} message - The message to output
     */
    out(message) {
        if (this.currentMethodDebug) {
            console.log(this.formatMessage(message));
        }
    }

    /**
     * Mark method completion and output timing information
     * @param {any} message - Optional completion message
     */
    done(message = null) {
        if (this.currentMethodDebug && this.methodStartTime !== null) {
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
        const methodContext = this.currentMethod ? ` > ${this.currentMethod}` : '';
        return `[${timestamp}] ${this.className}${methodContext} > ${message}`;
    }

    /**
     * Set debug mode for the entire class instance
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebug(enabled) {
        this.debugOverride = enabled;
    }

    /**
     * Get current debug state
     * @returns {boolean} - Current debug state
     */
    isDebugEnabled() {
        return this.debugOverride;
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