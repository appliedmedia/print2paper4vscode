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

  getPuppeteerLaunchOptions(): any {
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    };
  }

  getPuppeteerPdfOptions(): any {
    return {
      format: 'A4',
      printBackground: false,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };
  }

  done(): void {
    this.dx.done();
  }
}