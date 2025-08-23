import type { App } from './App';
import { OS } from './OS';

export class UI {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    init(): void {}

    done(): void {}

    showInformationMessage(message: string): void {
        this.app.vscodeapis.showInformationMessage(message);
    }

    showWarningMessage(message: string): void {
        this.app.vscodeapis.showWarningMessage(message);
    }

    showErrorMessage(message: string): void {
        this.app.vscodeapis.showErrorMessage(message);
    }

    setStatusBarMessage(text: string, timeoutMs?: number): unknown {
        return this.app.vscodeapis.setStatusBarMessage(text, timeoutMs);
    }

    debugOut(message: unknown, level: 'debug' | 'info' | 'warn' | 'error' = 'info', context?: string, data?: unknown): void {
        this.app.os.debugOut(message, level, context, data);
    }

    static debugOut(message: unknown, level: 'debug' | 'info' | 'warn' | 'error' = 'info', context?: string, data?: unknown): void {
        const ts = new Date().toISOString();
        const ctx = context ? `[${context}] ` : '';
        const base = typeof message === 'string' ? message : (() => { try { return JSON.stringify(message); } catch { return String(message); } })();
        const extra = (data === undefined) ? '' : ` | ${typeof data === 'string' ? data : (() => { try { return JSON.stringify(data); } catch { return String(data); } })()}`;
        const line = `${ts} ${level.toUpperCase()} ${ctx}${base}${extra}`;
        if (level === 'error') console.error(line);
        else if (level === 'warn') console.warn(line);
        else if (level === 'debug') {
            if (console.debug) console.debug(line); else console.log(line);
        } else console.log(line);
    }
}


