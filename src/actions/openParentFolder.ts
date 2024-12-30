import { action, JsonObject, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { FolderViewDevices } from "../util/folderViewDevices";
import { FolderView } from "../util/folderView";

@action({ UUID: "de.artus.fileexplorer.openparent" })
export class OpenParentFolder extends SingletonAction<JsonObject> {

    private folderViewDevices: FolderViewDevices;

    constructor(folderViewDevices: FolderViewDevices) {
        super();
        this.folderViewDevices = folderViewDevices;
    }

    private getFolderView(deviceId: string): FolderView | undefined {
        return this.folderViewDevices.get(deviceId);
    }

    override async onKeyDown(event: KeyDownEvent<JsonObject>): Promise<void> {
        const folderView = this.getFolderView(event.action.device.id);
        if (!folderView) return;

        await folderView.openParentFolder();
    }

}