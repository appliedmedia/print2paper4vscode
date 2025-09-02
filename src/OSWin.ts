import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSWin extends OS {
  private dx: Diagnostics;

  constructor(app?: App) {
    super(app);
    this.dx = new Diagnostics('OSWin');
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

	getDownloadsDirectory(): string {
		// Query Known Folder ID for Downloads via PowerShell
		try {
			const ps = 'powershell -NoProfile -Command "$shell = New-Object -ComObject Shell.Application; $folder = 0x000c; $shell.NameSpace($folder).Self.Path"';
			const result = this.execSync(ps) as unknown as string;
			const p = result.trim();
			if (p) return p;
		} catch (err) {
			this.dx.out(`OSWin.getDownloadsDirectory() failed: ${err}`); // ignore and fallback
		}
		const home = process.env.USERPROFILE || '';
		return this.pathJoin(home, 'Downloads');
	}

	async fileOpenPrintDialog(pdfPath: string): Promise<void> {
		// Best effort: open the PDF and rely on user; Windows programmatic print dialogs vary
		await this.fileOpenInDefaultApp(pdfPath);
	}

	done(): void {
		this.dx.done();
	}
}


