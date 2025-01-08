import streamDeck, {
	action,
	KeyDownEvent,
	SingletonAction,
} from "@elgato/streamdeck";
import fs from "fs";
import path from "path";

import { FolderViewDevices } from "../util/folderViewDevices";

function isFolderValid(folderPath: string): boolean {
	try {
		const fullPath = path.resolve(folderPath);
		return fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory();
	} catch (error) {
		streamDeck.logger.error("Error checking folder:", error);
		return false;
	}
}

@action({ UUID: "de.artus.fileexplorer.openfolder" })
export class OpenFolder extends SingletonAction<OpenFolderSettings> {
	private folderViewDevices: FolderViewDevices;

	constructor(folderViewDevices: FolderViewDevices) {
		super();
		this.folderViewDevices = folderViewDevices;
	}

	override async onKeyDown(event: KeyDownEvent<OpenFolderSettings>): Promise<void> {
		const folderView = this.folderViewDevices.get(event.action.device.id);
		if (!folderView) return;

		const folderpath = event.payload.settings.folderpath;
		if (!folderpath || !isFolderValid(folderpath)) return;

		await folderView.openFolder(folderpath);

		if (event.payload.settings.openProfile) {
			streamDeck.profiles.switchToProfile(event.action.device.id, "FolderView");
		}
	}
}

type OpenFolderSettings = {
	folderpath: string;
	openProfile: boolean;
};
