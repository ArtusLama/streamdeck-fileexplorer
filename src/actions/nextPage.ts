import { action, JsonObject, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { FolderViewDevices } from "../util/folderViewDevices";


@action({ UUID: "de.artus.fileexplorer.nextpage" })
export class NextPage extends SingletonAction<JsonObject> {
    
    private folderViewDevices: FolderViewDevices;

    constructor(folderViewDevices: FolderViewDevices) {
        super();
        this.folderViewDevices = folderViewDevices;
    }

    override onKeyDown(event: KeyDownEvent<JsonObject>): Promise<void> | void {
        const folderView = this.folderViewDevices.get(event.action.device.id);
        if (!folderView) return;

        folderView.folderItems.goToNextPage();
    }

    override onWillAppear(event: WillAppearEvent<JsonObject>): Promise<void> | void {
        const folderView = this.folderViewDevices.get(event.action.device.id);
        if (!folderView) return;

        folderView.folderItems.addListener("update", () => this.update(event.action.id, event.action.device.id));
        this.update(event.action.id, event.action.device.id);
    }

    override onWillDisappear(event: WillDisappearEvent<JsonObject>): Promise<void> | void {
        const folderView = this.folderViewDevices.get(event.action.device.id);
        if (!folderView) return;

        folderView.folderItems.removeListener("update", () => this.update(event.action.id, event.action.device.id));
    }

    private update(actionId: string, deviceId: string): void {
        const folderView = this.folderViewDevices.get(deviceId);
        if (!folderView) return;

        const action = this.actions.filter(action => action.device.id === deviceId).find(action => action.id === actionId);
        if (!action) return;
        if (!action.isKey() || action.isInMultiAction()) return;

        action.setState(folderView.folderItems.isLastPage() ? 1 : 0);
    }

}