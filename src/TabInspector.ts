import type { App } from './App';
import { Diagnostics } from './Diagnostics';

export type TabCategory = 'editor-nonmd' | 'editor-md' | 'preview';

/**
 * TabInspector - VS Code tab inspection and content extraction
 *
 * Inspects active VS Code tabs to determine content type (editor vs preview),
 * extracts text content, detects language IDs, and captures preview HTML.
 * Handles both text editor tabs and webview preview tabs.
 *
 * @input app - Application instance for accessing VS Code APIs
 * @output Tab metadata, source code content, language detection, preview HTML
 *
 * @example
 * const inspector = new TabInspector(app);
 * const category = inspector.detectActiveTabCategory();
 * const content = inspector.getEditorSelectionOrAll();
 */
export class TabInspector {
  static readonly id = 'tabinspector';
  private app: App;
  private dx: Diagnostics;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.sub({ name: 'TabInspector' });
  }

  init(): void {}

  done(): void {
    this.dx.done();
  }

  detectActiveTabCategory(): TabCategory {
    const editor = this.app.vscodeapis.getActiveTextEditor();
    if (editor) {
      const lang = editor.document.languageId;
      if (lang === 'markdown') return 'editor-md';
      return 'editor-nonmd';
    }
    // No text editor; likely a webview/preview
    return 'preview';
  }

  getEditorSelectionOrAll(): { text: string; languageId: string; name: string } | null {
    const editor = this.app.vscodeapis.getActiveTextEditor();
    if (!editor) return null;
    const text = this.app.vscodeapis.getSelectionOrDocumentText(editor);
    const languageId = editor.document.languageId || 'plaintext';
    const name = this.app.vscodeapis.getDescriptiveName(editor.document);
    return { text, languageId, name };
  }

  async inspectTab(): Promise<{
    code: string;
    language: string;
    fileName: string;
    filePath: string;
  }> {
    try {
      const editor = this.app.vscodeapis.getActiveTextEditor();
      if (!editor) {
        return { code: '', language: 'plaintext', fileName: '', filePath: '' };
      }

      const code = this.app.vscodeapis.getSelectionOrDocumentText(editor);
      const language = editor.document.languageId || 'plaintext';
      const fileName = this.app.vscodeapis.getDescriptiveName(editor.document);
      const filePath = editor.document.uri.fsPath;

      return { code, language, fileName, filePath };
    } catch (error) {
      this.dx.out(`Error inspecting tab: ${error}`);
      return { code: '', language: 'plaintext', fileName: '', filePath: '' };
    }
  }

  async inspectVisibleEditors(): Promise<
    { code: string; language: string; fileName: string; filePath: string }[]
  > {
    try {
      // For now, just return the active editor since getVisibleTextEditors is not implemented
      const activeEditor = this.app.vscodeapis.getActiveTextEditor();
      if (!activeEditor) return [];

      const code = this.app.vscodeapis.getSelectionOrDocumentText(activeEditor);
      const language = activeEditor.document.languageId || 'plaintext';
      const fileName = this.app.vscodeapis.getDescriptiveName(activeEditor.document);
      const filePath = activeEditor.document.uri.fsPath;
      return [{ code, language, fileName, filePath }];
    } catch (error) {
      this.dx.out(`Error inspecting visible editors: ${error}`);
      return [];
    }
  }
}

// end, TabInspector.ts
