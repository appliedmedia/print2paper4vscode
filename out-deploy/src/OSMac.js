"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSMac = void 0;
const OS_1 = require("./OS");
/**
 * OSMac - macOS-specific operating system operations
 *
 * Provides macOS-specific implementations for file operations and printing.
 * Uses AppleScript for complex operations (print dialogs via Preview/Finder)
 * and native macOS commands for file operations (open, open -R).
 *
 * @input reg - Registry instance for accessing shared services
 * @output File operations, AppleScript-based print dialogs, Finder integration
 *
 * @example
 * const os = new OSMac({ reg });
 * await os.fileOpenInDefaultApp('/path/to/file.pdf');
 * await os.fileOpenPrintDialog('/path/to/file.pdf');
 * await os.filePrint('/path/to/file.pdf');
 */
class OSMac extends OS_1.OS {
    currentAppName = null;
    constructor(args) {
        super(args);
        // Override dx with OSMac-specific context
        this.dx = this.fn.dx.sub({ name: 'OSMac' });
    }
    getOSKeys() {
        return {
            'os-ctrl-cmd': '⌘',
        };
    }
    // Centralized AppleScript execution helper
    async executeAppleScript(templateKey, variables = {}) {
        const yaml = this.fileRead({ path: 'src/OSMac.yaml' });
        if (!yaml?.[templateKey]) {
            this.dx.error(`Failed to load AppleScript template for ${templateKey}`);
            throw new Error(`Failed to load AppleScript template for ${templateKey}`);
        }
        const appleScript = this.fn.utils.templateDictReplace(yaml[templateKey], variables);
        if (!appleScript) {
            this.dx.error(`Failed to process AppleScript template for ${templateKey}`);
            throw new Error(`Failed to process AppleScript template for ${templateKey}`);
        }
        const osa = `osascript -e '${appleScript}'`;
        const result = await this.execAsync(osa);
        return result.stdout;
    }
    async fileOpenInDefaultApp(path) {
        await this.execAsync(`open "${path}"`);
    }
    async fileReveal(path) {
        await this.execAsync(`open -R "${path}"`);
    }
    async filePrint(path) {
        const _result = await this.executeAppleScript('apple_script_print_via_finder', { file_path: path });
    }
    async fileOpenPrintDialog(path) {
        const _result = await this.executeAppleScript('apple_script_open_preview_print_dialog', { file_path: path });
    }
    done() {
        this.dx.done();
    }
}
exports.OSMac = OSMac;
// end, OSMac.ts
//# sourceMappingURL=OSMac.js.map