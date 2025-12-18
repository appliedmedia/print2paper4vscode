import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { Registry } from './Registry';

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
export class OSLinux extends OS {
  constructor(args: { reg: Registry }) {
    super(args);
    // Override dx with OSLinux-specific context
    this.dx = this.fn.dx.sub({ name: 'OSLinux' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': 'Ctrl',
    };
  }

  protected escapePath(path: string): string {
    // Not needed - Linux uses execFile with argv arrays (no shell parsing)
    return path;
  }

  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execFileAsync('xdg-open', [path]);
  }

  async fileReveal(path: string): Promise<void> {
    const dir = this.pathDirname(path);
    await this.execFileAsync('xdg-open', [dir]);
  }

  async filePrint(path: string): Promise<void> {
    await this.execFileAsync('lp', [path]);
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
