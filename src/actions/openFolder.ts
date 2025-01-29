import streamDeck, { action, DeviceType, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import fs from "fs";
import path from "path";

import { FolderViewDevices } from "../util/folderViewDevices";
import { FolderView } from "../util/folderView";
import open from "open";

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

		if (event.payload.settings.clickAction === "explorer") {
			streamDeck.logger.info(`Opening folder in explorer: ${folderpath}`);
			open(folderpath);
		} else {
			await this.openProfile(folderView, folderpath, event.action.device.id, event.action.device.type, event.payload.settings.openProfile ?? false);
		}
		
	}

	public async openProfile(folderView: FolderView, folderPath: string, deviceId: string, deviceType: DeviceType, autoOpenProfile: boolean): Promise<void> {
		await folderView.openFolder(folderPath);

		if (autoOpenProfile) {
			const profileMap: Partial<Record<DeviceType, string>> = {
				0: "FolderView",
				2: "FolderViewXL",
				7: "FolderViewPlus",
			};

			const profileName = profileMap[deviceType];

			if (profileName) {
				await streamDeck.profiles.switchToProfile(deviceId, profileName);
			}
		}
	}
}

type OpenFolderSettings = {
	folderpath: string;
	openProfile: boolean | undefined;
	clickAction: "profile" | "explorer";
};
