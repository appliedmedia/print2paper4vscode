import { exec } from 'child_process';
import { promisify } from 'util';

import type { App } from './App';
import { Diagnostics } from './Diagnostics';

const execAsync = promisify(exec);

export class ClipboardCapture {
  private app: App;
  private dx: Diagnostics;
  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('ClipboardCapture');
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  /**
   * Captures content from the active tab using minimal AppleScript
   */
  async captureFromActiveTab(): Promise<string | null> {
    const dx = this.dx.sub('captureFromActiveTab');
    
    try {
      // First try to copy current selection
      await this.copyToClipboard();

      // Wait for clipboard to update
      await new Promise<void>(resolve => setTimeout(resolve, 200));

      // Check clipboard content
      let content = await this.getClipboardContent();

      // If clipboard is empty, try select-all then copy
      // But don't overwrite if user actually selected something
      if (!content || content.trim() === '') {
        await this.selectAllCopyDeselect();
        await new Promise<void>(resolve => setTimeout(resolve, 200));
        content = await this.getClipboardContent();
      }

      return content;
    } catch (error) {
      if (this.app)
        dx.out(`Error capturing from active tab: ${error}`);
      return null;
    } finally {
      dx.done();
    }
  }

  /**
   * Captures content with VS Code editor selection check
   */
  async captureWithEditorCheck(): Promise<string | null> {
    try {
      // Get active editor from VS Code via VSCodeAPIs
      const editor = this.app.vscodeapis.getActiveTextEditor();
      if (!editor) {
        // No active text editor (preview tab, etc.) - fall back to AppleScript
        return await this.captureFromActiveTab();
      }

      // Check if there's a real selection via VSCodeAPIs
      if (this.app.vscodeapis.hasActiveSelection()) {
        await this.copyToClipboard();
        await new Promise<void>(resolve => setTimeout(resolve, 200));
        return await this.getClipboardContent();
      }

      // No selection, do select-all then copy
      await this.selectAllCopyDeselect();
      await new Promise<void>(resolve => setTimeout(resolve, 200));
      return await this.getClipboardContent();
    } catch (error) {
      if (this.app)
        this.dx.print(`Error in captureWithEditorCheck: ${String(error)}`);
      return null;
    }
  }

  /**
   * Copies current selection to clipboard
   */
  private async copyToClipboard(): Promise<void> {
    const appleScript = `
            tell application "System Events"
                keystroke "c" using command down
                delay 0.1
            end tell
        `;
    await execAsync(`osascript -e '${appleScript}'`);
  }

  /**
   * Selects all, copies to clipboard, then deselects
   */
  private async selectAllCopyDeselect(): Promise<void> {
    const appleScript = `
            tell application "System Events"
                keystroke "a" using command down
                delay 0.1
                keystroke "c" using command down
                delay 0.1
                keystroke "a" using {command down, shift down}

            end tell
        `;
    await execAsync(`osascript -e '${appleScript}'`);
  }

  /**
   * Gets content from clipboard (plain text only)
   */
  private async getClipboardContent(): Promise<string | null> {
    try {
      // Get plain text from clipboard
      const { stdout } = await execAsync('pbpaste');
      return stdout || null;
    } catch {
      return null;
    }
  }

  /**
   * Converts plain text content to HTML
   */
  async convertToHTML(content: string): Promise<string> {
    // Convert plain text to HTML
    const htmlContent = this.convertPlainTextToHTML(content);
    return htmlContent;
  }

  /**
   * Converts plain text to HTML
   */
  private convertPlainTextToHTML(text: string): string {
    // Split by newlines and wrap in paragraphs
    const lines = text.split('\n');
    const paragraphs = lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('\n');

    // OS has to be valid or we cannot operate correctly. Please fail if OS.create doesn't return a valid pointer.
    const yaml = this.app.os.readExtensionYaml<{ clipboard_plain_text_html: string }>(
      'src/ClipboardCapture.yaml'
    );

    return this.app.templateDictReplace(yaml.clipboard_plain_text_html, {
      PARAGRAPHS: paragraphs,
    });
  }

  /**
   * Main method to capture and convert content
   */
  async captureAndConvert(): Promise<string | null> {
    // Capture content from active tab using VS Code editor check
    const rtfContent = await this.captureWithEditorCheck();
    if (!rtfContent) {
      return null;
    }

    // Convert content to HTML
    const htmlContent = await this.convertToHTML(rtfContent);

    return htmlContent;
  }
}
