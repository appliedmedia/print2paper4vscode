"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabInspector = void 0;
/**
 * TabInspector - VS Code tab inspection and content extraction
 *
 * Inspects active VS Code tabs to determine content type (editor vs preview),
 * extracts text content, detects language IDs, and captures preview HTML.
 * Handles both text editor tabs and webview preview tabs.
 *
 * @input reg - Registry instance for accessing VS Code APIs
 * @output Tab metadata, source code content, language detection, preview HTML
 *
 * @example
 * const inspector = new TabInspector({ reg });
 * const category = inspector.detectActiveTabCategory();
 * const content = inspector.getEditorSelectionOrAll();
 */
class TabInspector {
    static id = 'tabinspector';
    reg;
    fn;
    dx;
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('vscodeapis.getActiveTextEditor', 'vscodeapis.getSelectionOrDocumentText', 'vscodeapis.getDescriptiveName');
        this.dx = this.fn.dx.sub({ name: 'TabInspector' });
    }
    done() {
        this.dx.done();
    }
    detectActiveTabCategory() {
        const editor = this.fn.vscodeapis.getActiveTextEditor();
        if (editor) {
            const lang = editor.document.languageId;
            if (lang === 'markdown')
                return 'editor-md';
            return 'editor-nonmd';
        }
        // No text editor; likely a webview/preview
        return 'preview';
    }
    getEditorSelectionOrAll() {
        const editor = this.fn.vscodeapis.getActiveTextEditor();
        if (!editor)
            return null;
        const text = this.fn.vscodeapis.getSelectionOrDocumentText(editor);
        const languageId = editor.document.languageId || 'plaintext';
        const name = this.fn.vscodeapis.getDescriptiveName(editor.document);
        return { text, languageId, name };
    }
    async inspectTab() {
        try {
            const editor = this.fn.vscodeapis.getActiveTextEditor();
            if (!editor) {
                return { code: '', language: 'plaintext', fileName: '', filePath: '' };
            }
            const code = this.fn.vscodeapis.getSelectionOrDocumentText(editor);
            const language = editor.document.languageId || 'plaintext';
            const fileName = this.fn.vscodeapis.getDescriptiveName(editor.document);
            const filePath = editor.document.uri.fsPath;
            return { code, language, fileName, filePath };
        }
        catch (error) {
            this.dx.out(`Error inspecting tab: ${error}`);
            return { code: '', language: 'plaintext', fileName: '', filePath: '' };
        }
    }
    async inspectVisibleEditors() {
        try {
            // For now, just return the active editor since getVisibleTextEditors is not implemented
            const activeEditor = this.fn.vscodeapis.getActiveTextEditor();
            if (!activeEditor)
                return [];
            const code = this.fn.vscodeapis.getSelectionOrDocumentText(activeEditor);
            const language = activeEditor.document.languageId || 'plaintext';
            const fileName = this.fn.vscodeapis.getDescriptiveName(activeEditor.document);
            const filePath = activeEditor.document.uri.fsPath;
            return [{ code, language, fileName, filePath }];
        }
        catch (error) {
            this.dx.out(`Error inspecting visible editors: ${error}`);
            return [];
        }
    }
}
exports.TabInspector = TabInspector;
// end, TabInspector.ts
//# sourceMappingURL=TabInspector.js.map