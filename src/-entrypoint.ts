import * as vscode from 'vscode';
import { App } from './App.js';

let app: App;

export function activate(context: vscode.ExtensionContext) {
  console.log('Print2Paper4VSCode extension activating...');
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
  console.log('Print2Paper4VSCode extension deactivated');
}
