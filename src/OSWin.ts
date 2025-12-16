import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { Registry } from './Registry';

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
export class OSWin extends OS {
  constructor(args: { reg: Registry }) {
    super(args);
    // Override dx with OSWin-specific context
    this.dx = this.fn.dx.sub({ name: 'OSWin' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': 'Ctrl',
    };
  }
  async fileOpenInDefaultApp(path: string): Promise<void> {
    // Security: Escape double quotes and backslashes in path to prevent shell injection
    const escapedPath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    await this.execAsync(`start "" "${escapedPath}"`);
  }

  async fileReveal(path: string): Promise<void> {
    // Security: Escape double quotes and backslashes in path to prevent shell injection
    const escapedPath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    await this.execAsync(`explorer.exe /select,"${escapedPath}"`);
  }

  async filePrint(path: string): Promise<void> {
    // Security: Escape double quotes and backslashes in path to prevent shell injection
    const escapedPath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    await this.execAsync(
      `rundll32.exe %systemroot%\\system32\\shimgvw.dll,ImageView_PrintTo /pt "${escapedPath}"`
    );
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    // Best effort: open the PDF and rely on user; Windows programmatic print dialogs vary
    await this.fileOpenInDefaultApp(path);
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSWin.ts
