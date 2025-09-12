import type { App } from './App';
import { Diagnostics } from './Diagnostics';

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
   * Captures content from the active tab using OS-specific clipboard operations
   */
  async captureFromActiveTab(): Promise<string | null> {
    const dx = this.dx.sub('captureFromActiveTab');

    try {
      // First try to copy current selection
      await this.app.os.copyToClipboard();

      // Wait for clipboard to update
      await new Promise<void>(resolve => setTimeout(resolve, 200));

      // Check clipboard content
      let content = await this.app.os.getClipboardContent();

      // If clipboard is empty, try select-all then copy
      // But don't overwrite if user actually selected something
      if (!content || content.trim() === '') {
        await this.app.os.selectAllCopyDeselect();
        await new Promise<void>(resolve => setTimeout(resolve, 200));
        content = await this.app.os.getClipboardContent();
      }

      return content;
    } catch (error) {
      if (this.app) dx.out(`Error capturing from active tab: ${error}`);
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
        // No active text editor (preview tab, etc.) - fall back to OS clipboard operations
        return await this.captureFromActiveTab();
      }

      // Check if there's a real selection via VSCodeAPIs
      if (this.app.vscodeapis.hasActiveSelection()) {
        await this.app.os.copyToClipboard();
        await new Promise<void>(resolve => setTimeout(resolve, 200));
        return await this.app.os.getClipboardContent();
      }

      // No selection, do select-all then copy
      await this.app.os.selectAllCopyDeselect();
      await new Promise<void>(resolve => setTimeout(resolve, 200));
      return await this.app.os.getClipboardContent();
    } catch (error) {
      if (this.app) this.dx.out(`Error in captureWithEditorCheck: ${String(error)}`);
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

    // Load YAML template
    const yaml = this.app.os.readExtensionYaml<{ clipboard_plain_text_html: string }>(
      'src/ClipboardCapture.yaml'
    );

    return this.app.templateDictReplace(yaml.clipboard_plain_text_html, {
      PARAGRAPHS: paragraphs,
      CSS_PATH: 'src/css/clipboard.css',
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

  /**
   * Alias for captureAndConvert for backward compatibility
   */
  async capture(): Promise<string | null> {
    return this.captureAndConvert();
  }
}
