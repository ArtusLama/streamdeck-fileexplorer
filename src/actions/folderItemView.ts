import streamDeck, { action, DialAction, JsonObject, KeyAction, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { FolderViewDevices } from "../util/folderViewDevices";
import { FolderView } from "../util/folderView";
import { FolderItem } from "../util/folderItem";
import open from "open";


// TODO: flickering / sorting kinda updates when opening the profile at first since willAppear is called => recalculates everything
@action({ UUID: "de.artus.fileexplorer.folderitemview" })
export class FolderItemView extends SingletonAction<JsonObject> {

    private folderViewDevices: FolderViewDevices;

    constructor(folderViewDevices: FolderViewDevices) {
        super();
        this.folderViewDevices = folderViewDevices;
    }

    override async onKeyDown(event: KeyDownEvent<JsonObject>): Promise<void> {
        const folderView = this.getFolderView(event.action.device.id);
        if (!folderView) return;

        const item = this.getFolderItemByActionId(event.action.id, event.action.device.id);
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
            .filter(action => this.isValidActionForDevice(action, deviceId))
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

    private isValidAction(action: KeyAction<JsonObject> | DialAction<JsonObject>): boolean {
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
            folderView.folderItems.addListener("update", () => this.onUpdateFolderView(actionId, deviceId));
            this.recalculateActionOffsets(deviceId);
            folderView.recalculateItemsPerPage();
        }
    }

    override onWillDisappear(event: WillDisappearEvent<JsonObject>): void {
        const deviceId = event.action.device.id;
        const actionId = event.action.id;
        const folderView = this.getFolderView(deviceId);

        if (folderView) {
            folderView.folderItems.removeListener("update", () => this.onUpdateFolderView(actionId, deviceId));
            this.recalculateActionOffsets(deviceId);
            folderView.recalculateItemsPerPage();
        }
    }

    public recalculateActionOffsets(deviceId: string): void {
        const folderView = this.getFolderView(deviceId);
        if (!folderView) return;

        const actionItemOffsets = this.getActionItemOffsets(deviceId);
        if (actionItemOffsets) {
            folderView.actionItemOffsets = actionItemOffsets;
        }
    }

    private onUpdateFolderView(actionId: string, deviceId: string): void {
        const folderView = this.getFolderView(deviceId);
        const action = this.actions.filter(action => this.isValidActionForDevice(action, deviceId)).find(action => action.id === actionId);

        if (!folderView || !action) return;

        const item = this.getFolderItemByActionId(actionId, deviceId);
        if (!item) {
            this.updateToDefault(action);
            return;
        }

        this.updateAction(action, item);
    }

    private getFolderItemByActionId(actionId: string, deviceId: string): FolderItem | undefined {
        const folderView = this.getFolderView(deviceId);
        if (!folderView) return undefined;

        const offset = folderView.actionItemOffsets.get(actionId);
        if (offset === undefined) return undefined;

        return folderView.folderItems.getItemOnCurrentPage(offset);
    }


    private updateAction(action: KeyAction<JsonObject> | DialAction<JsonObject>, item: FolderItem) {
        if (!this.isValidAction(action)) return;

        // TODO: is already handled by the line above but typescript doesn't know that...
        if (!action.isKey()) return;

        // split title after 8 characters and add a newline
        const title = item.getName().replace(/(.{7})(?=.)/g, "$1-\n");
        action.setTitle(title || item.getName());
        action.setState(item.isDirectory() ? 0 : 1);
        action.setImage(item.isDirectory() ? undefined : item.path);
    }

    private updateToDefault(action: KeyAction<JsonObject> | DialAction<JsonObject>) {
        if (!this.isValidAction(action)) return;

        // TODO: is already handled by the line above but typescript doesn't know that...
        if (!action.isKey()) return;

        action.setTitle("");
        action.setImage(undefined);
        action.setState(2)
    }


}