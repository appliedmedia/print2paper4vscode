import * as vscode from 'vscode';
import { App } from './App.js';

let app: App;

export function activate(context: vscode.ExtensionContext) {
    app = new App(context);
    app.init();
    app.ui.debugOut('Print extension is now active!', 'info', 'entrypoint');
}

export function deactivate() {
    // Cleanup handled by App class
    if (app) {
        app.done();
    }
}


