import fs from "fs";
import path from "path";

export class FolderItem {

    public path: string;

    constructor(path: string) {
        this.path = path;
    }

    private getStats(): fs.Stats {
        return fs.statSync(this.path);
    }

    public isDirectory(): boolean {
        return this.getStats().isDirectory();
    }

    public getName(): string {
        return path.basename(this.path);
    }

    public getBaseName(): string {
        return path.basename(this.path, path.extname(this.path));
    }

    public getSize(): number {
        return this.getStats().size;
    }

    public getExtension(): string | undefined {
        return this.isDirectory() ? undefined : path.extname(this.path);
    }

    public getLastMod(): Date {
        return this.getStats().mtime;
    }

    public getCreationDate(): Date {
        return this.getStats().birthtime;
    }

    

}