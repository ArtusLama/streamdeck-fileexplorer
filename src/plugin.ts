import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { FolderItemView } from "./actions/folderItemView";
import { NextPage } from "./actions/nextPage";
import { OpenFolder } from "./actions/openFolder";
import { OpenParentFolder } from "./actions/openParentFolder";
import { PageInfo } from "./actions/pageInfo";
import { PreviousPage } from "./actions/previousPage";
import { FolderView } from "./util/folderView";
import { FolderViewDevices } from "./util/folderViewDevices";

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
