import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

/**
 * OSWin - Windows-specific operating system operations
 *
 * Provides Windows-specific implementations for file operations and printing.
 * Uses Windows shell commands (start, explorer.exe) and rundll32 for printing.
 *
 * @input app - Application instance for accessing shared services
 * @output File operations, print commands via rundll32, Explorer integration
 *
 * @example
 * const os = new OSWin(app);
 * await os.fileOpenInDefaultApp('C:\\path\\to\\file.pdf');
 * await os.filePrint('C:\\path\\to\\file.pdf');
 * await os.fileReveal('C:\\path\\to\\file.pdf');
 */
export class OSWin extends OS {
  protected dx: Diagnostics;

  constructor(app: App) {
    super(app);
    this.dx = app.dx.sub({ name: 'OSWin' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': 'Ctrl',
    };
  }
  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execAsync(`start "" "${path}"`);
  }

  async fileReveal(path: string): Promise<void> {
    await this.execAsync(`explorer.exe /select,"${path}"`);
  }

  async filePrint(path: string): Promise<void> {
    await this.execAsync(
      `rundll32.exe %systemroot%\\system32\\shimgvw.dll,ImageView_PrintTo /pt "${path}"`
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
