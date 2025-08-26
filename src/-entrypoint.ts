import * as vscode from 'vscode';
import { App } from './App';

let app: App;

export function activate(context: vscode.ExtensionContext) {
  try {
    app = new App(context, vscode);
    app.init();
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
