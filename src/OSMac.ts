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
		const yaml = this.app?.os.readExtensionYaml<{ apple_script_print_via_finder: string }>(
			'src/OSMac.yaml'
		);
		const appleScript = yaml?.apple_script_print_via_finder || `tell application "Finder" to print POSIX file "{{FILE_PATH}}"`;
		const osa = `osascript -e '${this.app?.templateDictReplace(appleScript, { FILE_PATH: path }) || appleScript.replace('{{FILE_PATH}}', path)}'`;
		await this.execAsync(osa);
	}


	async fileOpenPrintDialog(pdfPath: string): Promise<void> {
		const yaml = this.app?.os.readExtensionYaml<{ apple_script_open_preview_print_dialog: string }>(
			'src/OSMac.yaml'
		);
		const appleScript = yaml?.apple_script_open_preview_print_dialog || `tell application "Preview" to open POSIX file "{{FILE_PATH}}"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down`;
		const osa = `osascript -e '${this.app?.templateDictReplace(appleScript, { FILE_PATH: pdfPath }) || appleScript.replace('{{FILE_PATH}}', pdfPath)}'`;
		await this.execAsync(osa);
	}

	done(): void {
		this.dx.done();
	}
}


