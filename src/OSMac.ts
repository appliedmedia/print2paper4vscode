import { OS } from './OS';
 

export class OSMac extends OS {
	async fileOpen(path: string): Promise<void> {
		await this.execAsync(`open "${path}"`);
	}

	async fileReveal(path: string): Promise<void> {
		await this.execAsync(`open -R "${path}"`);
	}

	async filePrint(path: string): Promise<void> {
		const osa = `osascript -e 'tell application "Finder" to print POSIX file "${path}"'`;
		await this.execAsync(osa);
	}

	getDownloadsDirectory(): string {
		// Use AppleScript to resolve the user's Downloads folder reliably
		// Fallback to HOME/Downloads
		try {
			const script = `osascript -e 'tell application "Finder" to POSIX path of (path to downloads folder)'`;
			const result = this.execSync(script) as unknown as string;
			const p = result.trim();
			if (p) return p;
		} catch (err) {
			this.debugOut('OSMac.getDownloadsDirectory() failed', 'warn', 'OSMac', err); // ignore and fallback
		}
		const home = process.env.HOME || '';
		return this.pathJoin(home, 'Downloads');
	}

	async fileOpenPrintDialog(pdfPath: string): Promise<void> {
		const osa = `osascript -e 'tell application "Preview" to open POSIX file "${pdfPath}"' -e 'tell application "Preview" to activate' -e 'tell application "System Events" to keystroke "p" using command down'`;
		await this.execAsync(osa);
	}
}


