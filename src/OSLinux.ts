import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

/**
 * OSLinux - Linux-specific operating system operations
 *
 * Provides Linux-specific implementations for file operations and printing.
 * Uses xdg-open for file operations and lp command for printing.
 *
 * @input app - Application instance for accessing shared services
 * @output File operations, print commands via lp, directory reveal
 *
 * @example
 * const os = new OSLinux(app);
 * await os.fileOpenInDefaultApp('/path/to/file.pdf');
 * await os.filePrint('/path/to/file.pdf');
 * await os.fileReveal('/path/to/file.pdf');
 */
export class OSLinux extends OS {
  constructor(args: { app: App; dx: Diagnostics }) {
    super(args);
    // dx already set by parent constructor, just rename for OSLinux context
    this.dx = args.dx.sub({ name: 'OSLinux' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': 'Ctrl',
    };
  }

  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execAsync(`xdg-open "${path}"`);
  }

  async fileReveal(path: string): Promise<void> {
    await this.execAsync(`xdg-open "$(dirname "${path}")"`);
  }

  async filePrint(path: string): Promise<void> {
    await this.execAsync(`lp "${path}"`);
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    // Open PDF in default application (user can print from there)
    await this.fileOpenInDefaultApp(path);
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSLinux.ts
