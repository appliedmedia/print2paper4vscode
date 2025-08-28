import * as vscode from 'vscode';
import { App } from './App.js';

let app: App;

export function activate(context: vscode.ExtensionContext) {
  try {
    app = new App(context, vscode);
    app.init();
    app.ui.debugOut('Print2Paper4VSCode extension is now active!', 'info', 'entrypoint');
  } catch (error) {
    console.error('Failed to activate extension:', error);
  }
}
export function deactivate() {
  if (app) {
    app.done();
  }
  console.log('Print extension is now deactivated!');
}
