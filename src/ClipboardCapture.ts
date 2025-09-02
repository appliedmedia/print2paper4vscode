import { exec } from 'child_process';
import { promisify } from 'util';
import * as rtf2html from '@iarna/rtf-to-html';

import * as vscode from 'vscode';
import type { App } from './App';
import { Diagnostics } from './Diagnostics';

const execAsync = promisify(exec);

export class ClipboardCapture {
  private app: App;
  private dx: Diagnostics;
  constructor(app: App) {
    this.app = app;
    this.dx = new Diagnostics('ClipboardCapture');
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  /**
   * Captures content from the active tab using minimal AppleScript
   */
  async captureFromActiveTab(): Promise<string | null> {
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
        this.dx.out('Error capturing from active tab': ${error});
      return null;
    }
  }

  /**
   * Captures content with VS Code editor selection check
   */
  async captureWithEditorCheck(): Promise<string | null> {
    try {
      // Get active editor from VS Code
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        // No active text editor (preview tab, etc.) - fall back to AppleScript
        return await this.captureFromActiveTab();
      }

      const selection = editor.selection;

      // If there's a real selection, just copy it
      if (!selection.isEmpty) {
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
        this.dx.out('Error in captureWithEditorCheck': ${error});
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
   * Gets content from clipboard
   */
  private async getClipboardContent(): Promise<string | null> {
    try {
      // Try to get RTF format using AppleScript
      try {
        const appleScript = `
                    tell application "System Events"
                        set the clipboard to (the clipboard as «class RTF »)
                    end tell
                    return (the clipboard as «class RTF »)
                `;
        const { stdout: rtfContent } = await execAsync(`osascript -e '${appleScript}'`);
        if (rtfContent && rtfContent.trim().startsWith('{\\rtf1')) {
          // Logging delegated to UI at caller
          return rtfContent;
        }
      } catch {
        // Swallow; will fallback to plain text
      }

      // Fall back to plain text
      const { stdout } = await execAsync('pbpaste');
      return stdout || null;
    } catch {
      return null;
    }
  }

  /**
   * Converts content to HTML (handles both RTF and plain text)
   */
  async convertToHTML(content: string): Promise<string> {
    // Check if content is RTF format
    if (content.trim().startsWith('{\\rtf1') || content.includes('\\rtf1')) {
      // Use @iarna/rtf-to-html library
      return new Promise((resolve, reject) => {
        rtf2html.fromString(content, (err: Error | null, result: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } else {
      // Convert plain text to HTML
      const htmlContent = this.convertPlainTextToHTML(content);
      return htmlContent;
    }
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
