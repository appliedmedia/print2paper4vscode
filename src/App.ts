import { VSCodeAPIs } from './VSCodeAPIs';
import { UI } from './UI';
import { PDF } from './PDF';
import { PaperPrinter } from './PaperPrinter';
import { Stylize } from './Stylize';
import { TabInspector } from './TabInspector';
import { OS } from './OS';
import { UIMenuMgr } from './UIMenuMgr';
import { Diagnostics } from './Diagnostics';
import type { ExtensionContext } from 'vscode';

export class App {
  vscodeapis: VSCodeAPIs;
  ui: UI;
  pdf: PDF;
  paperprinter: PaperPrinter;
  stylize: Stylize;
  tabinspector: TabInspector;
  os: OS;
  uimenumgr: UIMenuMgr;
  dx: Diagnostics;

  constructor(context: ExtensionContext, vscode: any) {
    // Create Diagnostics instance first
    this.dx = new Diagnostics('App');

    // Create components - VSCodeAPIs first, then UI, then others in alphabetical order
    this.vscodeapis = new VSCodeAPIs(this, vscode, context);
    this.ui = new UI(this);
    this.os = OS.create(this);
    this.pdf = new PDF(this);
    this.paperprinter = new PaperPrinter(this);
    this.stylize = new Stylize(this);
    this.tabinspector = new TabInspector(this);
    this.uimenumgr = new UIMenuMgr(this);
  }

  init(): void {
    // Initialize all components - VSCodeAPIs first, then UI, then others in alphabetical order
    this.vscodeapis.init();
    this.ui.init();
    this.os.init();
    this.pdf.init();
    this.paperprinter.init();
    this.stylize.init();
    this.tabinspector.init();
    this.uimenumgr.init();

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
    this.uimenumgr.done();
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
      return key in dictionary ? dictionary[key] : match; // Return value even if empty string
    });
  }
}
