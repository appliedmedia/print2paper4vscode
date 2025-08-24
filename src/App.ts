import * as vscode from 'vscode';
import { VSCodeAPIs } from './VSCodeAPIs.js';
import { UI } from './UI.js';
import { PDF } from './PDF.js';
import { PaperPrinter } from './PaperPrinter.js';
import { Stylize } from './Stylize.js';
import { TabInspector } from './TabInspector.js';
import { OS } from './OS.js';
import { History } from './History.js';

export class App {
    vscodeapis: VSCodeAPIs;
    ui: UI;
    pdf: PDF;
    paperprinter: PaperPrinter;
    stylize: Stylize;
    tabinspector: TabInspector;
    os: OS;
    history: History;

    constructor(context: vscode.ExtensionContext) {
        // Create components - VSCodeAPIs gets context directly
        this.vscodeapis = new VSCodeAPIs(this, context);
        this.ui = new UI(this);
        this.pdf = new PDF(this);
        this.paperprinter = new PaperPrinter(this);
        this.stylize = new Stylize(this);
        this.tabinspector = new TabInspector(this);
        this.os = OS.create(this);
        const HISTORY_SIZE = 20;
        this.history = new History(this, HISTORY_SIZE);
    }

    init(): void {
        // Initialize all components
        this.vscodeapis.init();
        this.ui.init();
        this.os.init();
        this.history.init();
        this.pdf.init();
        this.paperprinter.init();
        this.stylize.init();
        this.tabinspector.init();
        
        this.ui.debugOut('App initialized successfully', 'info', 'App');
    }

    done(): void {
        // Cleanup all components
        this.vscodeapis.done();
        this.tabinspector.done();
        this.pdf.done();
        this.paperprinter.done();
        this.stylize.done();
        this.os.done();
        this.history.done();
        this.ui.done();
        
        this.ui.debugOut('App cleanup completed', 'info', 'App');
    }

    /**
     * Generic template replacement function
     * Replaces all {{key}} placeholders in source text with values from dictionary
     * @param source - The source text containing {{key}} placeholders
     * @param dictionary - Key-value pairs for replacement
     * @returns The source text with all placeholders replaced
     */
    templateDictReplace(source: string, dictionary: Record<string, string>): string {
        return source.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return dictionary[key] || match; // Return original if key not found
        });
    }
}