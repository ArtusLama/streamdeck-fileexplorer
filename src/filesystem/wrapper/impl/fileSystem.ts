import fs from "fs-extra";
import path from "path";
import { FileSystemWrapper } from "../fileSystemWrapper";
import { spawn } from "cross-spawn";
import open from "open";
import streamDeck from "@elgato/streamdeck";


const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

// TODO: Test all methods on MAC!
export class FileSystem implements FileSystemWrapper {

    // TODO: Use real dialog
    public openFolderPickerDialog(): Promise<string | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("WORK IN PROGRESS");
            }, 1000);
        });
    }

    public openExplorerWithPath(path: string): void {
        open(path).catch((err) => {
            streamDeck.logger.error(`Failed to open explorer with path ${path}: ${err}`);
        });
    }

    public startCmdWithPath(path: string): void {
        if (isWindows) {
            spawn("cmd.exe", ["/k"], { cwd: path, detached: true, stdio: "ignore", shell: true }).unref();
        } else if (isMac) {
            spawn("open", ["-a", "Terminal", path], { stdio: "ignore", detached: true }).unref();
        }
    }

    public async getFolderContent(folderPath: string): Promise<string[]> {
        const items = await fs.readdir(folderPath);
        return items.map(item => path.join(folderPath, item));
    }

    public async isPathDirectory(path: string): Promise<boolean> {
        const exists = await fs.pathExists(path);
        if (!exists) return false;
        const stats = await fs.stat(path);
        return stats.isDirectory();
    }

    public async getFileExtension(filePath: string): Promise<string | undefined> {
        const exists = await fs.pathExists(filePath);
        if (!exists) return undefined;
        return path.extname(filePath) || undefined;
    }

    public async getFileName(filePath: string): Promise<string | undefined> {
        const exists = await fs.pathExists(filePath);
        if (!exists) return undefined;
        return path.basename(filePath) || undefined;
    }

    public async getFolderName(folderPath: string): Promise<string | undefined> {
        const exists = await fs.pathExists(folderPath);
        if (!exists) return undefined;
        return path.basename(folderPath) || undefined;
    }

    // TODO: Only works for files, not folders!
    public async getFileOrFolderSize(path: string): Promise<number | undefined> {
        const exists = await fs.pathExists(path);
        if (!exists) return undefined;
        const stats = await fs.stat(path);
        return stats.size;
    }

    public async getLastModifiedTime(path: string): Promise<Date | undefined> {
        const exists = await fs.pathExists(path);
        if (!exists) return undefined;
        const stats = await fs.stat(path);
        return stats.mtime;
    }

    public getParentPath(folderPath: string): string | undefined {
        const parentPath = path.dirname(folderPath);
        if (parentPath === folderPath) {
            return undefined;
        }
        return parentPath;
    }

    public openFileWithDefaultApplication(filePath: string): void {
        // TODO: sometimes doesn't work. Maybe because of spaces in path?!
        open(filePath).catch((err) => {
            streamDeck.logger.error(`Failed to open file ${filePath}: ${err}`);
        });
    }

    public revealFileInExplorer(filePath: string): void {
        if (isWindows) {
            spawn("explorer", ["/select,", filePath], { detached: true, stdio: "ignore" }).unref();
        } else if (isMac) {
            spawn("open", ["-R", filePath], { detached: true, stdio: "ignore" }).unref();
        }
    }

    public async pathExists(path: string): Promise<boolean> {
        return fs.pathExists(path);
    }


}