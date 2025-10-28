import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { OpenFolder } from "./actions/openFolder";
import { FileSystem } from "./filesystem/wrapper/impl/fileSystem";
import { FolderItemView } from "./actions/folderItemView";
import { FolderViewManager } from "./filesystem/streamdeck/devices/deviceManager";
import { NextPage } from "./actions/nextPage";
import { PrevPage } from "./actions/prevPage";
import { OpenParentFolder } from "./actions/openParentFolder";
import { SortContent } from "./actions/sortContent";
import { Analytics, createAnalytics } from "./analytics/analytics";


streamDeck.logger.setLevel(LogLevel.INFO);



function registerActions(filesystem: FileSystem): void {
    streamDeck.logger.info("Registering actions");

    streamDeck.actions.registerAction(new OpenFolder(filesystem));
    streamDeck.actions.registerAction(new OpenParentFolder());
    streamDeck.actions.registerAction(new FolderItemView());
    streamDeck.actions.registerAction(new NextPage());
    streamDeck.actions.registerAction(new PrevPage());
    streamDeck.actions.registerAction(new SortContent());
}

async function startup(): Promise<void> {
    const filesystem = new FileSystem();
    registerActions(filesystem);

    FolderViewManager.init(filesystem);

    await streamDeck.connect();
    streamDeck.logger.info("Connected to StreamDeck");

    await createAnalytics();
    await Analytics.instance?.startup();

    streamDeck.system.onApplicationDidTerminate(shutdown);

    streamDeck.logger.info("Setup complete");
}

async function shutdown(): Promise<void> {
    FolderViewManager.instance.clear();

    streamDeck.logger.info("StreamDeck disconnected");
    await Analytics.instance?.shutdown();
}


startup();