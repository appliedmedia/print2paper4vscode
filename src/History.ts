import type { App } from './App';

export class History {
    private app: App;
    private maxSize: number;
    private entries: string[] = [];
    private storePath: string;

    constructor(app: App, maxSize: number) {
        this.app = app;
        this.maxSize = Math.max(1, maxSize);
        const root = this.app.vscodeapis.getGlobalStoragePath();
        this.storePath = this.app.os.pathJoin(root, 'history.json');
    }

    init(): void {
        try {
            this.app.os.ensureDir(this.app.vscodeapis.getGlobalStoragePath());
            if (this.app.os.exists(this.storePath)) {
                const loaded = this.app.os.readJsonFile<string[]>(this.storePath);
                this.entries = Array.isArray(loaded) ? loaded.filter(p => !!p) : [];
            }
            this.pruneAndDeleteOverflow();
        } catch {
            this.entries = [];
        }
    }

    done(): void {
        // persist on shutdown
        this.save();
    }

    add(filePath: string): void {
        if (!filePath) return;
        // de-dup move-to-front
        this.entries = [filePath, ...this.entries.filter(p => p !== filePath && this.app.os.exists(p))];
        this.pruneAndDeleteOverflow();
        this.save();
    }

    getEntries(): string[] {
        // return existing files only
        this.entries = this.entries.filter(p => this.app.os.exists(p));
        return [...this.entries];
    }

    async open(filePath: string): Promise<void> {
        if (!filePath) return;
        await this.app.os.fileOpen(filePath);
    }

    private pruneAndDeleteOverflow(): void {
        // filter to existing files first
        this.entries = this.entries.filter(p => this.app.os.exists(p));
        while (this.entries.length > this.maxSize) {
            const removed = this.entries.pop();
            if (removed) {
                try { this.app.os.fileDelete(removed); } catch {}
            }
        }
    }

    private save(): void {
        try {
            const json = JSON.stringify(this.entries, null, 2);
            this.app.os.fileWrite(this.storePath, json);
        } catch {}
    }
}


