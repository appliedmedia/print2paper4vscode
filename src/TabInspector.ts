import * as vscode from 'vscode';
import type { App } from './App.js';

export type TabCategory = 'editor-nonmd' | 'editor-md' | 'preview';

export class TabInspector {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    init(): void {}

    done(): void {}

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

    async capturePreviewHtml(): Promise<{ html: string; name: string } | null> {
        try {
            // Reuse existing capture path which returns HTML via ClipboardCapture
            const html = await this.app.paperprinter['clipboardCapture'].captureAndConvert();
            const name = this.app.vscodeapis.getActiveTabName();
            return html ? { html, name } : null;
        } catch {
            return null;
        }
    }
}


