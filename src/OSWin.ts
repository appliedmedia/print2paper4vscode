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

	done(): void {
		this.dx.done();
	}
}


