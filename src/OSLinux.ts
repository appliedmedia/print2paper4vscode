import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSLinux extends OS {
  protected dx: Diagnostics;

  constructor(app: App) {
    super(app);
    this.dx = app.dx.create('OSLinux');
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

  async copyToClipboard(): Promise<void> {
    // Linux clipboard copy - would need Linux-specific implementation
    throw new Error('copyToClipboard not implemented for Linux');
  }

  async selectAllCopyDeselect(): Promise<void> {
    // Linux select all, copy, deselect - would need Linux-specific implementation
    throw new Error('selectAllCopyDeselect not implemented for Linux');
  }

  async getClipboardContent(): Promise<string | null> {
    // Linux clipboard content - would need Linux-specific implementation
    throw new Error('getClipboardContent not implemented for Linux');
  }

  done(): void {
    this.dx.done();
  }
}
