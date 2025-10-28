import streamDeck, { action, DialAction, DidReceiveSettingsEvent, KeyAction, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { FolderViewManager } from "../filesystem/streamdeck/devices/deviceManager";
import { PrevPageSettings } from "../types/actions/settings/prevPageSetting";
import { Analytics } from "../analytics/analytics";


/**
 * This StreamDeck action displays one item of a folder which is opened on the StreamDeck.
 */
@action({ UUID: "de.artus.fileexplorer.prevpage" })
export class PrevPage extends SingletonAction<PrevPageSettings> {


    public longPressTimeout: Map<string, NodeJS.Timeout> = new Map();
    

    public override onKeyDown(ev: KeyDownEvent<PrevPageSettings>): Promise<void> | void {
        const folderView = FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id);
        if (!folderView) return;

        const settings = this.getDefaultedSettings(ev.payload.settings);
        const actionId = ev.action.id;

        if (this.longPressTimeout.has(actionId)) {
            clearTimeout(this.longPressTimeout.get(actionId))
        }

        this.longPressTimeout.set(actionId, setTimeout(() => {
            switch (settings.longpressaction) {
                case "prev":
                    folderView.openPreviousPage()
                    this.sendClickAnalytics("backward", "previous");
                    break;
                case "first":
                    folderView.openFirstPage()
                    this.sendClickAnalytics("backward", "first");
                    break;
            }

            this.longPressTimeout.delete(actionId);
        }, settings.longpresstrigger))
    }

    public override onKeyUp(ev: KeyUpEvent<PrevPageSettings>): Promise<void> | void {
        const actionId = ev.action.id;
        let isLongPress: boolean = true;

        if (this.longPressTimeout.has(actionId)) {
            isLongPress = false;
            clearTimeout(this.longPressTimeout.get(actionId));
            this.longPressTimeout.delete(actionId);
        }

        if (!isLongPress) {
            const folderView = FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id);
            if (!folderView) return;

            const settings = this.getDefaultedSettings(ev.payload.settings);

            switch (settings.clickaction) {
                case "prev":
                    folderView.openPreviousPage()
                    this.sendClickAnalytics("backward", "previous");
                    break;
                case "first":
                    folderView.openFirstPage()
                    this.sendClickAnalytics("backward", "first");
                    break;
            }
        }
    }


    public override async onWillAppear(ev: WillAppearEvent<PrevPageSettings>): Promise<void> {
        if (!ev.payload.settings.longpresstrigger) {
            ev.action.setSettings({
                ...ev.payload.settings,
                longpresstrigger: 500
            });
        }

        const folderView = FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id);
        if (!folderView) return;

        folderView.on("visibleContentChanged", () => this.updateDisplayCallback(ev.action.id));
        this.updateDisplayCallback(ev.action.id);
    }

    public override onWillDisappear(ev: WillDisappearEvent<PrevPageSettings>): Promise<void> | void {
        const folderView = FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id);
        if (!folderView) return;

        folderView.off("visibleContentChanged", () => this.updateDisplayCallback(ev.action.id));
    }

    public override onDidReceiveSettings(ev: DidReceiveSettingsEvent<PrevPageSettings>): Promise<void> | void {
        this.updateTitle(ev.action, ev.payload.settings);
    }

    public updateDisplayCallback(actionId: string): void {
        const action = streamDeck.actions.getActionById(actionId);
        if (!action) return;
        if (!this.isValidAction(action)) return;

        const folderView = FolderViewManager.instance.getFolderViewForDevice(action.device.id);
        if (!folderView) return;

        if (folderView.isFirstPage() || folderView.currentPath === undefined) {
            action.setState(1);
        } else {
            action.setState(0);
        }

        action.getSettings(); // Triggers onDidReceiveSettings so we dont have to call updateTitle here -> less code duplication
    }

    public updateTitle(action: DialAction<PrevPageSettings> | KeyAction<PrevPageSettings>, settings: PrevPageSettings): void {
        const folderView = FolderViewManager.instance.getFolderViewForDevice(action.device.id);
        if (!folderView) return;

        const defaultedSettings = this.getDefaultedSettings(settings);

        if (defaultedSettings.showcurrentpage) {
            const currentPage = folderView.getCurrentPage();
            const lastPage = folderView.getTotalPages();

            if (lastPage === 0) {
                action.setTitle("");
            } else {
                action.setTitle(`${currentPage + 1}/${lastPage}`);
            }
           
        } else {
            action.setTitle("");
        }
    }

    public isValidAction(action: DialAction<PrevPageSettings> | KeyAction<PrevPageSettings>): action is KeyAction<PrevPageSettings> {
        return action.isKey() && !action.isInMultiAction();
    }


    public getDefaultedSettings(settings: PrevPageSettings): Required<PrevPageSettings> {
        return {
            ...settings,
            clickaction: settings.clickaction ?? "prev",
            longpressaction: settings.longpressaction ?? "first",
            longpresstrigger: settings.longpresstrigger ?? 500,
            showcurrentpage: settings.showcurrentpage ?? false
        };
    }

    public sendClickAnalytics(direction: "backward" | "forward", target: "first" | "last" | "next" | "previous"): void {
        Analytics.instance?.sendEvent({
            event: "page_navigated",
            properties: {
                direction: direction,
                target: target
            }
        })
    }


}

