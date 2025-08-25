import * as vscode from 'vscode';
import { App } from './App';

let app: App;

export function activate(context: vscode.ExtensionContext) {
    app = new App(context);
    app.init();
    app.ui.debugOut('Print2Paper4VSCode extension is now active!', 'info', 'entrypoint');
}

export function deactivate() {
    // Cleanup handled by App class
    if (app) {
        app.done();
    }
}


