export class Diagnostics {
    static separator = " > ";
    static globalDebugOn = false; // Root level debug state
    
    private className: string;
    private parent: Diagnostics | null;
    private debugOverride: boolean;
    private currentMethod: string | null;
    private methodStartTime: number | null;
    
    constructor(className: string, debugOverride?: boolean | null, parent?: Diagnostics | null) {
        this.className = className;
        this.parent = parent || null;
        
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
     * @param methodName - The name of the method being entered
     * @param debugOverride - Optional debug override (undefined/null inherit parent's debug status)
     * @returns New Diagnostics instance for the method
     */
    sub(methodName: string, debugOverride?: boolean | null): Diagnostics {
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
     * @param message - The message to output
     * @returns this for method chaining
     */
    out(message: any): this {
        if (this.debugOverride) {
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
        if (this.debugOverride && this.methodStartTime !== null) {
            const duration = performance.now() - this.methodStartTime;
            let timeDisplay: string;
            
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
        // Only add method context if it's not already part of the className
        const methodContext = this.currentMethod && !this.className.includes(this.currentMethod) ? ` > ${this.currentMethod}` : '';
        return `[${timestamp}] ${this.className}${methodContext} > ${message}`;
    }

    /**
     * Get or set debug mode for this instance
     * @param enabled - Optional: set debug mode if provided
     * @returns Current debug state for this instance, or this for method chaining when setting
     */
    debugOn(enabled?: boolean): boolean | this {
        if (enabled !== undefined) {
            this.debugOverride = enabled;
            return this;
        }
        return this.debugOverride;
    }

    /**
     * Get or set the root level debug state
     * @param enabled - Optional: set global debug mode if provided
     * @returns Current global debug state
     */
    static debugOn(enabled?: boolean): boolean {
        if (enabled !== undefined) {
            Diagnostics.globalDebugOn = enabled;
        }
        return Diagnostics.globalDebugOn;
    }

    /**
     * Get current method context
     * @returns Current method name or null if not in a method
     */
    getCurrentMethod(): string | null {
        return this.currentMethod;
    }

    /**
     * Get the class name for this instance
     * @returns The class name
     */
    getClassName(): string {
        return this.className;
    }
}