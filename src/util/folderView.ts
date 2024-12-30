import { FolderItem } from "./folderItem";
import { Pagination } from "./pagination";
import streamDeck, { EventEmitter } from "@elgato/streamdeck";
import fs from "fs";
import open from "open";
import path from "path";


type FolderViewEvents = {
    "open-folder": [folderPath: string];
}

export class FolderView extends EventEmitter<FolderViewEvents> {
    
    public currentFolderPath: string | null = null;
    public folderItems: Pagination<FolderItem> = new Pagination();
    public actionItemOffsets: Map<string, number> = new Map();

    public recalculateItemsPerPage(): void {
        this.folderItems.setItemsPerPage(this.actionItemOffsets.size);
    }


    public async openFolder(folderPath: string): Promise<void> {
        this.currentFolderPath = folderPath;
        await this.loadFolderItems(folderPath);
        this.folderItems.setCurrentPage(0);
        this.emit("open-folder", folderPath);
    }

    public async openParentFolder(): Promise<void> {
        if (this.currentFolderPath === null) return;
        await this.openFolder(path.dirname(this.currentFolderPath));
    }

    public async loadFolderItems(folderPath: string): Promise<void> {
        if (folderPath === null) return;
        if (!fs.existsSync(folderPath)) {
            streamDeck.logger.error(`Folder does not exist: ${folderPath}`);
            return;
        }
        if (!fs.statSync(folderPath).isDirectory()) {
            streamDeck.logger.error(`Path is not a folder: ${folderPath}`);
            return;
        }

        const files = await fs.promises.readdir(folderPath);
        const items = files.map((file) => new FolderItem(path.join(folderPath, file)));

        items.sort((a, b) => {
            const aIsDir = a.isDirectory();
            const bIsDir = b.isDirectory();

            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;

            return a.getName().localeCompare(b.getName());
        });

        this.folderItems.setItems(items);
    }

    public openFolderInExplorer(): void {
        if (this.currentFolderPath === null) return;
        streamDeck.logger.info(`Opening folder in explorer: ${this.currentFolderPath}`);
        open(this.currentFolderPath);
    }

    public delete(): void {
        this.currentFolderPath = null;
        this.folderItems.setItems([]);
    }



}