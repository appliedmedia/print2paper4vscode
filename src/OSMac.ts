import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { App } from './App';

export class OSMac extends OS {
  protected dx: Diagnostics;

  constructor(app: App) {
    super(app);
    this.dx = app.dx.create('OSMac');
  }

  // Centralized AppleScript execution helper
  private async executeAppleScript(
    templateKey: string,
    variables: Record<string, string> = {}
  ): Promise<void> {
    const yaml = this.app?.os.fileRead<Record<string, string>>('src/OSMac.yaml');
    if (!yaml?.[templateKey]) {
      throw new Error(`Failed to load AppleScript template for ${templateKey}`);
    }

    const appleScript = this.app?.templateDictReplace(yaml[templateKey], variables);
    if (!appleScript) {
      throw new Error(`Failed to process AppleScript template for ${templateKey}`);
    }

    const osa = `osascript -e '${appleScript}'`;
    await this.execAsync(osa);
  }
  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execAsync(`open "${path}"`);
  }

  async fileReveal(path: string): Promise<void> {
    await this.execAsync(`open -R "${path}"`);
  }

  async filePrint(path: string): Promise<void> {
    await this.executeAppleScript('apple_script_print_via_finder', { FILE_PATH: path });
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    await this.executeAppleScript('apple_script_open_preview_print_dialog', { FILE_PATH: path });
  }

  async copyToClipboard(): Promise<void> {
    await this.executeAppleScript('apple_script_copy');
  }

  async selectAllCopyDeselect(): Promise<void> {
    await this.executeAppleScript('apple_script_select_all_copy_deselect');
  }

  async getClipboardContent(): Promise<string | null> {
    try {
      // Get plain text from clipboard using pbpaste (macOS)
      const { stdout } = await this.execAsync('pbpaste');
      return stdout || null;
    } catch {
      return null;
    }
  }

  done(): void {
    this.dx.done();
  }
}
