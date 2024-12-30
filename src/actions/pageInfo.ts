import { action, DidReceiveSettingsEvent, JsonObject, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { FolderViewDevices } from "../util/folderViewDevices";

// TODO: add checkbox for: open folder in explorer on click [yes/no]

@action({ UUID: "de.artus.fileexplorer.pageinfo" })
export class PageInfo extends SingletonAction<PageInfoSettings> {
    
    private folderViewDevices: FolderViewDevices;

    constructor(folderViewDevices: FolderViewDevices) {
        super();
        this.folderViewDevices = folderViewDevices;
    }

    override onWillAppear(event: WillAppearEvent<PageInfoSettings>): Promise<void> | void {
        const folderView = this.folderViewDevices.get(event.action.device.id);
        if (!folderView) return;

        folderView.folderItems.addListener("update", () => this.update(event.action.id, event.action.device.id));
        this.update(event.action.id, event.action.device.id);
    }

    override onWillDisappear(event: WillDisappearEvent<PageInfoSettings>): Promise<void> | void {
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

        const totalPages = folderView.folderItems.getTotalPages();
        const currentPage = folderView.folderItems.getCurrentPage() + (totalPages == 0 ? 0 : 1);

        action.setTitle(`${currentPage}/${totalPages}`);
    }

    override onKeyDown(event: KeyDownEvent<PageInfoSettings>): Promise<void> | void {
        const folderView = this.folderViewDevices.get(event.action.device.id);
        if (!folderView) return;

        switch (event.payload.settings.clickAction) {
            case "openFileExplorer":
                folderView.openFolderInExplorer();
                break;
            case "goToFirstPage":
                folderView.folderItems.setCurrentPage(0);
                break;
        }
    }

}

type PageInfoSettings = {
    clickAction: "nothing" | "openFileExplorer" | "goToFirstPage";
}