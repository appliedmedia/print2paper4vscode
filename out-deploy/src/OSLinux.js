"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSLinux = void 0;
const OS_1 = require("./OS");
/**
 * OSLinux - Linux-specific operating system operations
 *
 * Provides Linux-specific implementations for file operations and printing.
 * Uses xdg-open for file operations and lp command for printing.
 *
 * @input reg - Registry instance for accessing shared services
 * @output File operations, print commands via lp, directory reveal
 *
 * @example
 * const os = new OSLinux({ reg });
 * await os.fileOpenInDefaultApp('/path/to/file.pdf');
 * await os.filePrint('/path/to/file.pdf');
 * await os.fileReveal('/path/to/file.pdf');
 */
class OSLinux extends OS_1.OS {
    constructor(args) {
        super(args);
        // Override dx with OSLinux-specific context
        this.dx = this.fn.dx.sub({ name: 'OSLinux' });
    }
    getOSKeys() {
        return {
            'os-ctrl-cmd': 'Ctrl',
        };
    }
    async fileOpenInDefaultApp(path) {
        await this.execAsync(`xdg-open "${path}"`);
    }
    async fileReveal(path) {
        await this.execAsync(`xdg-open "$(dirname "${path}")"`);
    }
    async filePrint(path) {
        await this.execAsync(`lp "${path}"`);
    }
    async fileOpenPrintDialog(path) {
        // Open PDF in default application (user can print from there)
        await this.fileOpenInDefaultApp(path);
    }
    done() {
        this.dx.done();
    }
}
exports.OSLinux = OSLinux;
// end, OSLinux.ts
//# sourceMappingURL=OSLinux.js.map