import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSWin extends OS {
  protected dx: Diagnostics;

  constructor(app?: App) {
    super(app);
    this.dx = app ? app.dx.create('OSWin') : new Diagnostics('OSWin');
  }
	async fileOpenInDefaultApp(path: string): Promise<void> {
		await this.execAsync(`start "" "${path}"`);
	}

	async fileReveal(path: string): Promise<void> {
		await this.execAsync(`explorer.exe /select,"${path}"`);
	}

	async filePrint(path: string): Promise<void> {
		await this.execAsync(`rundll32.exe %systemroot%\\system32\\shimgvw.dll,ImageView_PrintTo /pt "${path}"`);
	}


	async fileOpenPrintDialog(pdfPath: string): Promise<void> {
		// Best effort: open the PDF and rely on user; Windows programmatic print dialogs vary
		await this.fileOpenInDefaultApp(pdfPath);
	}

	async copyToClipboard(): Promise<void> {
		// Windows clipboard copy - would need Windows-specific implementation
		throw new Error('copyToClipboard not implemented for Windows');
	}

	async selectAllCopyDeselect(): Promise<void> {
		// Windows select all, copy, deselect - would need Windows-specific implementation
		throw new Error('selectAllCopyDeselect not implemented for Windows');
	}

	async getClipboardContent(): Promise<string | null> {
		// Windows clipboard content - would need Windows-specific implementation
		throw new Error('getClipboardContent not implemented for Windows');
	}

	done(): void {
		this.dx.done();
	}
}


