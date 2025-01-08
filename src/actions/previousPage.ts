import {
	action,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
} from "@elgato/streamdeck";

import { FolderViewDevices } from "../util/folderViewDevices";


@action({ UUID: "de.artus.fileexplorer.previouspage" })
export class PreviousPage extends SingletonAction<PreviousPageActionSettings> {
	private folderViewDevices: FolderViewDevices;

	constructor(folderViewDevices: FolderViewDevices) {
		super();
		this.folderViewDevices = folderViewDevices;
	}

	override onKeyDown(event: KeyDownEvent<PreviousPageActionSettings>): Promise<void> | void {
		const folderView = this.folderViewDevices.get(event.action.device.id);
		if (!folderView) return;

		if (event.payload.settings.goToFirstPage) {
			folderView.folderItems.setCurrentPage(0);
		} else {
			folderView.folderItems.goToPreviousPage();
		}
	}

	override onWillAppear(event: WillAppearEvent<PreviousPageActionSettings>): Promise<void> | void {
		const folderView = this.folderViewDevices.get(event.action.device.id);
		if (!folderView) return;

		folderView.folderItems.addListener("update", () => this.update(event.action.id, event.action.device.id));
		this.update(event.action.id, event.action.device.id);
	}

	override onWillDisappear(event: WillDisappearEvent<PreviousPageActionSettings>): Promise<void> | void {
		const folderView = this.folderViewDevices.get(event.action.device.id);
		if (!folderView) return;

		folderView.folderItems.removeListener("update", () => this.update(event.action.id, event.action.device.id));
	}

	private update(actionId: string, deviceId: string): void {
		const folderView = this.folderViewDevices.get(deviceId);
		if (!folderView) return;

		const action = this.actions
			.filter((action) => action.device.id === deviceId)
			.find((action) => action.id === actionId);
		if (!action) return;
		if (!action.isKey() || action.isInMultiAction()) return;

		action.setState(folderView.folderItems.isFirstPage() ? 1 : 0);
	}
}

export type PreviousPageActionSettings = {
	goToFirstPage: boolean;
}
