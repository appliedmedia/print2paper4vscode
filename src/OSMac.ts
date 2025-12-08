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
  private currentAppName: string | null = null;

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
  ): Promise<string> {
    const yaml = this.fileRead<Record<string, string>>({ path: 'src/OSMac.yaml' });
    if (!yaml?.[templateKey]) {
      this.dx.error(`Failed to load AppleScript template for ${templateKey}`);
      throw new Error(`Failed to load AppleScript template for ${templateKey}`);
    }

    const appleScript = this.fn.utils.templateDictReplace(yaml[templateKey], variables);
    if (!appleScript) {
      this.dx.error(`Failed to process AppleScript template for ${templateKey}`);
      throw new Error(`Failed to process AppleScript template for ${templateKey}`);
    }

    const osa = `osascript -e '${appleScript}'`;
    const result = await this.execAsync(osa);
    return result.stdout;
  }

  /**
   * Get the name of the currently frontmost application (Cursor, Code, etc.)
   * Cache it for subsequent operations
   */
  async getCurrentAppName(): Promise<string> {
    if (this.currentAppName) {
      return this.currentAppName;
    }
    
    const result = await this.executeAppleScript('apple_script_get_current_app');
    this.currentAppName = result.trim();
    return this.currentAppName;
  }

  /**
   * Get current editor window bounds via AppleScript
   * Works with Cursor, VS Code, or any VS Code-based editor
   */
  async getEditorWindowBounds(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    try {
      const appName = await this.getCurrentAppName();
      const result = await this.executeAppleScript('apple_script_get_editor_bounds', { app_name: appName });
      // Parse "x,y,width,height" from AppleScript output
      const parts = result.trim().split(',').map(s => parseInt(s.trim()));
      if (parts.length === 4) {
        return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get screen dimensions via AppleScript
   */
  async getScreenDimensions(): Promise<{ width: number; height: number }> {
    const result = await this.executeAppleScript('apple_script_get_screen_dimensions');
    const parts = result.trim().split(',').map(s => parseInt(s.trim()));
    if (parts.length === 2) {
      return { width: parts[0], height: parts[1] };
    }
    // Fallback to reasonable defaults
    return { width: 1920, height: 1080 };
  }

  /**
   * Take screenshot of window or full screen
   * Uses macOS screencapture command
   */
  async screenshotWindow(bounds?: { x: number; y: number; width: number; height: number }): Promise<string> {
    const tempPath = this.pathJoin(this.fn.vscodeapis.getDir_Temp(), `screenshot_${Date.now()}.png`);
    
    if (bounds) {
      // Targeted screenshot with window bounds
      await this.execAsync(`screencapture -R${bounds.x},${bounds.y},${bounds.width},${bounds.height} "${tempPath}"`);
    } else {
      // Full screen screenshot
      await this.execAsync(`screencapture "${tempPath}"`);
    }
    
    return tempPath;
  }
  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execAsync(`open "${path}"`);
  }

  async fileReveal(path: string): Promise<void> {
    await this.execAsync(`open -R "${path}"`);
  }

  async filePrint(path: string): Promise<void> {
    const _result = await this.executeAppleScript('apple_script_print_via_finder', { file_path: path });
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    const _result = await this.executeAppleScript('apple_script_open_preview_print_dialog', { file_path: path });
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSMac.ts
