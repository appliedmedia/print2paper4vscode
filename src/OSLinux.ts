import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSLinux extends OS {
  protected dx: Diagnostics;

  constructor(app?: App) {
    super(app);
    this.dx = app ? app.dx.create('OSLinux') : new Diagnostics('OSLinux');
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

  getDownloadsDirectory(): string {
    const home = process.env.HOME || '';
    return this.pathJoin(home, 'Downloads');
  }

  async fileOpenPrintDialog(pdfPath: string): Promise<void> {
    // Open PDF in default application (user can print from there)
    await this.fileOpenInDefaultApp(pdfPath);
  }


  done(): void {
    this.dx.done();
  }
}