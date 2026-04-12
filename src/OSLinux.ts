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
    try {
      await this.execFileAsync('lp', [path]);
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        throw new Error(
          'CUPS printing system not found. Install with: sudo apt install cups (Debian/Ubuntu) or sudo dnf install cups (Fedora)'
        );
      }
      throw error;
    }
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    const viewers = [
      { cmd: 'evince', args: [path] },
      { cmd: 'okular', args: [path] },
      { cmd: 'atril', args: [path] },
      { cmd: 'xreader', args: [path] },
    ];
    for (const viewer of viewers) {
      try {
        await this.execFileAsync('which', [viewer.cmd]);
        await this.execFileAsync(viewer.cmd, viewer.args);
        return;
      } catch (error) {
        this.dx.out(`Viewer launch failed (${viewer.cmd}): ${String(error)}`);
        continue;
      }
    }
    await this.fileOpenInDefaultApp(path);
  }

  getDir_Documents(): string {
    // On Linux, try xdg-user-dir first
    try {
      const documentsPath = this.execSync('xdg-user-dir DOCUMENTS').trim();
      if (documentsPath && documentsPath !== this.getDir_Home()) {
        return documentsPath;
      }
    } catch (error) {
      // xdg-user-dir not available or failed, fall back to ~/Documents
      this.dx.out(`xdg-user-dir failed: ${String(error)}, falling back to ~/Documents`);
    }
    // Fallback to standard location
    return this.pathJoin(this.getDir_Home(), 'Documents');
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSLinux.ts
