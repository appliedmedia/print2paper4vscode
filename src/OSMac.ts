import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSMac extends OS {
  protected dx: Diagnostics;

  constructor(app?: App) {
    super(app);
    this.dx = app ? app.dx.create('OSMac') : new Diagnostics('OSMac');
  }
	async fileOpenInDefaultApp(path: string): Promise<void> {
		await this.execAsync(`open "${path}"`);
	}

	async fileReveal(path: string): Promise<void> {
		await this.execAsync(`open -R "${path}"`);
	}

	async filePrint(path: string): Promise<void> {
		const osa = `osascript -e 'tell application "Finder" to print POSIX file "${path}"'`;
		await this.execAsync(osa);
	}


	async fileOpenPrintDialog(pdfPath: string): Promise<void> {
		const osa = `osascript -e 'tell application "Preview" to open POSIX file "${pdfPath}"' -e 'tell application "Preview" to activate' -e 'tell application "System Events" to keystroke "p" using command down'`;
		await this.execAsync(osa);
	}

	done(): void {
		this.dx.done();
	}
}


