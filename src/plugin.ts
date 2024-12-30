import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { FolderViewDevices } from "./util/folderViewDevices";
import { FolderView } from "./util/folderView";
import { FolderItemView } from "./actions/folderItemView";
import { OpenParentFolder } from "./actions/openParentFolder";
import { NextPage } from "./actions/nextPage";
import { PreviousPage } from "./actions/previousPage";
import { PageInfo } from "./actions/pageInfo";
import { OpenFolder } from "./actions/openFolder";


// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.INFO);


const folderViewDeviceManager = new FolderViewDevices();

streamDeck.actions.registerAction(new FolderItemView(folderViewDeviceManager));
streamDeck.actions.registerAction(new OpenParentFolder(folderViewDeviceManager));
streamDeck.actions.registerAction(new NextPage(folderViewDeviceManager));
streamDeck.actions.registerAction(new PreviousPage(folderViewDeviceManager));
streamDeck.actions.registerAction(new PageInfo(folderViewDeviceManager));
streamDeck.actions.registerAction(new OpenFolder(folderViewDeviceManager));

// Finally, connect to the Stream Deck.
streamDeck.connect().then(() => {
    streamDeck.devices.onDeviceDidConnect((event) => folderViewDeviceManager.add(event.device.id, new FolderView()));
    streamDeck.devices.onDeviceDidDisconnect((event) => folderViewDeviceManager.remove(event.device.id));
});


