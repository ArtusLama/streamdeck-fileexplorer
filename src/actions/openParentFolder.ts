import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { FolderViewManager } from "../filesystem/streamdeck/devices/deviceManager";
import { Analytics } from "../analytics/analytics";
import { OpenParentFolderSettings } from "../types/actions/settings/openParentFolderSettings";

/**
 * This StreamDeck action allows to open the parent folder of the currently viewed folder on the Stream Deck.
 */
@action({ UUID: "de.artus.fileexplorer.openparentfolder" })
export class OpenParentFolder extends SingletonAction<OpenParentFolderSettings> {


    public override async onKeyDown(ev: KeyDownEvent<OpenParentFolderSettings>): Promise<void> {
        const folderView = FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id);
        if (!folderView) return;
        if (!folderView.currentPath) return;

        folderView.loadParentFolder();
        Analytics.instance?.sendEvent({
            event: "open_parent_folder"
        });
    }


}

