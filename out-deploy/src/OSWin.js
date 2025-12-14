"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSWin = void 0;
const OS_1 = require("./OS");
/**
 * OSWin - Windows-specific operating system operations
 *
 * Provides Windows-specific implementations for file operations and printing.
 * Uses Windows shell commands (start, explorer.exe) and rundll32 for printing.
 *
 * @input reg - Registry instance for accessing shared services
 * @output File operations, print commands via rundll32, Explorer integration
 *
 * @example
 * const os = new OSWin({ reg });
 * await os.fileOpenInDefaultApp('C:\\path\\to\\file.pdf');
 * await os.filePrint('C:\\path\\to\\file.pdf');
 * await os.fileReveal('C:\\path\\to\\file.pdf');
 */
class OSWin extends OS_1.OS {
    constructor(args) {
        super(args);
        // Override dx with OSWin-specific context
        this.dx = this.fn.dx.sub({ name: 'OSWin' });
    }
    getOSKeys() {
        return {
            'os-ctrl-cmd': 'Ctrl',
        };
    }
    async fileOpenInDefaultApp(path) {
        await this.execAsync(`start "" "${path}"`);
    }
    async fileReveal(path) {
        await this.execAsync(`explorer.exe /select,"${path}"`);
    }
    async filePrint(path) {
        await this.execAsync(`rundll32.exe %systemroot%\\system32\\shimgvw.dll,ImageView_PrintTo /pt "${path}"`);
    }
    async fileOpenPrintDialog(path) {
        // Best effort: open the PDF and rely on user; Windows programmatic print dialogs vary
        await this.fileOpenInDefaultApp(path);
    }
    done() {
        this.dx.done();
    }
}
exports.OSWin = OSWin;
// end, OSWin.ts
//# sourceMappingURL=OSWin.js.map