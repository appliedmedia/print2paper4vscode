import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { Registry } from './Registry';

/**
 * OSMac - macOS-specific operating system operations
 *
 * Provides macOS-specific implementations for file operations and printing.
 * Uses AppleScript for complex operations (print dialogs via Preview/Finder)
 * and native macOS commands for file operations (open, open -R).
 *
 * @input reg - Registry instance for accessing shared services
 * @output File operations, AppleScript-based print dialogs, Finder integration
 *
 * @example
 * const os = new OSMac({ reg });
 * await os.fileOpenInDefaultApp('/path/to/file.pdf');
 * await os.fileOpenPrintDialog('/path/to/file.pdf');
 * await os.filePrint('/path/to/file.pdf');
 */
export class OSMac extends OS {
  constructor(args: { reg: Registry }) {
    super(args);
    // Override dx with OSMac-specific context
    this.dx = this.fn.dx.sub({ name: 'OSMac' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': '⌘',
    };
  }

  // Centralized AppleScript execution helper
  private async executeAppleScript(
    templateKey: string,
    variables: Record<string, string> = {}
  ): Promise<void> {
    const yaml = this.fileRead<Record<string, string>>({ path: 'src/OSMac.yaml' });
    if (!yaml?.[templateKey]) {
      throw new Error(`Failed to load AppleScript template for ${templateKey}`);
    }

    const appleScript = this.fn.utils.templateDictReplace(yaml[templateKey], variables);
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
    await this.executeAppleScript('apple_script_print_via_finder', { file_path: path });
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    await this.executeAppleScript('apple_script_open_preview_print_dialog', { file_path: path });
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSMac.ts
