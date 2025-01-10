import streamDeck, {
	action,
	DialAction,
	JsonObject,
	KeyAction,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
} from "@elgato/streamdeck";
import open from "open";

import { FolderItem } from "../util/folderItem";
import { FolderView } from "../util/folderView";
import { FolderViewDevices } from "../util/folderViewDevices";

@action({ UUID: "de.artus.fileexplorer.folderitemview" })
export class FolderItemView extends SingletonAction<JsonObject> {
	// To prevent multiple updates in a short time => to prevent flickering
	private actionLoadTimeout = new Map<string, NodeJS.Timeout>();
	private actionLoadTimeoutTime = 50;

	private folderViewDevices: FolderViewDevices;

	constructor(folderViewDevices: FolderViewDevices) {
		super();
		this.folderViewDevices = folderViewDevices;
	}

	private handleTimeoutAction(deviceId: string, action: () => void) {
		if (this.actionLoadTimeout.has(deviceId)) {
			clearTimeout(this.actionLoadTimeout.get(deviceId)!);
		}

		const timeout = setTimeout(() => {
			action();
			this.actionLoadTimeout.delete(deviceId);
		}, this.actionLoadTimeoutTime);

		this.actionLoadTimeout.set(deviceId, timeout);
	}

	private reloadKeysWithTimeout(deviceId: string, folderView: FolderView) {
		this.handleTimeoutAction(deviceId, () => {
			this.recalculateActionOffsets(deviceId, folderView);
			folderView.recalculateItemsPerPage();
		});
	}

	override async onKeyDown(event: KeyDownEvent<JsonObject>): Promise<void> {
		const folderView = this.getFolderView(event.action.device.id);
		if (!folderView) return;

		const item = this.getFolderItemByActionId(event.action.id, folderView);
		if (!item) return;

		if (item.isDirectory()) {
			await folderView.openFolder(item.path);
		} else {
			streamDeck.logger.info(`Opening file: ${item.path}`);
			open(item.path);
		}
	}

	private getActionItemOffsets(deviceId: string): Map<string, number> | undefined {
		const device = streamDeck.devices.getDeviceById(deviceId);
		if (!device) return undefined;

		const actionItemOffsets = new Map<string, number>();
		const actions = this.actions
			.toArray()
			.filter((action) => this.isValidActionForDevice(action, deviceId))
			.sort((a, b) => {
				if (!a.coordinates || !b.coordinates) return 0;
				if (a.coordinates.row === b.coordinates.row) {
					return a.coordinates.column - b.coordinates.column;
				}
				return a.coordinates.row - b.coordinates.row;
			});

		actions.forEach((action, index) => {
			actionItemOffsets.set(action.id, index);
		});

		return actionItemOffsets;
	}

	private getFolderView(deviceId: string): FolderView | undefined {
		return this.folderViewDevices.get(deviceId);
	}

	private isValidAction(action: KeyAction<JsonObject> | DialAction<JsonObject>): action is KeyAction<JsonObject> {
		return action.isKey() && !action.isInMultiAction();
	}

	private isValidActionForDevice(action: KeyAction<JsonObject> | DialAction<JsonObject>, deviceId: string): boolean {
		return action.device.id === deviceId && this.isValidAction(action);
	}

	override onWillAppear(event: WillAppearEvent<JsonObject>): Promise<void> | void {
		if (!this.isValidAction(event.action)) return;

		const deviceId = event.action.device.id;
		const actionId = event.action.id;
		const folderView = this.getFolderView(deviceId);

		if (folderView) {
			folderView.folderItems.addListener("update", () => this.onUpdateFolderView(actionId, deviceId, folderView));
			this.updateToDefault(event.action);
			this.reloadKeysWithTimeout(deviceId, folderView);
		}
	}

	override onWillDisappear(event: WillDisappearEvent<JsonObject>): void {
		const deviceId = event.action.device.id;
		const actionId = event.action.id;
		const folderView = this.getFolderView(deviceId);

		if (folderView) {
			folderView.folderItems.removeListener("update", () => this.onUpdateFolderView(actionId, deviceId, folderView));
			this.recalculateActionOffsets(deviceId, folderView);
			folderView.recalculateItemsPerPage();
		}
	}

	public recalculateActionOffsets(deviceId: string, folderView: FolderView): void {
		const actionItemOffsets = this.getActionItemOffsets(deviceId);
		if (actionItemOffsets !== undefined) {
			folderView.actionItemOffsets = actionItemOffsets;
		}
	}

	private getActionForDevice(actionId: string, deviceId: string): KeyAction<JsonObject> | DialAction<JsonObject> | undefined {
		return this.actions.filter((action) => this.isValidActionForDevice(action, deviceId)).find((action) => action.id === actionId);
	}

	private onUpdateFolderView(actionId: string, deviceId: string, folderView: FolderView): void {
		const action = this.getActionForDevice(actionId, deviceId);
		if (folderView === undefined || action === undefined) return;

		const item = this.getFolderItemByActionId(actionId, folderView);
		if (!item) {
			this.updateToDefault(action);
			return;
		}

		this.updateAction(action, item);
	}

	private getFolderItemByActionId(actionId: string, folderView: FolderView): FolderItem | undefined {
		const offset = folderView.actionItemOffsets.get(actionId);
		return offset === undefined ? undefined : folderView.folderItems.getItemOnCurrentPage(offset);
	}

	private formatTitle(title: string): string {
		// split title after 8 characters and add a newline
		return title.replace(/(.{7})(?=.)/g, "$1-\n");
	}

	private async updateAction(action: KeyAction<JsonObject> | DialAction<JsonObject>, item: FolderItem): Promise<void> {
		if (!this.isValidAction(action)) return;

		await action.setImage(undefined);

		const title = this.formatTitle(item.getName());
		await action.setTitle(title || item.getName());
		await action.setState(item.isDirectory() ? 0 : 1);
		await action.setImage(item.isDirectory() ? undefined : item.path);
	}

	private updateToDefault(action: KeyAction<JsonObject> | DialAction<JsonObject>) {
		if (!this.isValidAction(action)) return;

		action.setImage(undefined);
		action.setTitle("");
		action.setState(2);
	}
}
