import { action, DialAction, DidReceiveSettingsEvent, KeyAction, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { SortContentSettings } from "../types/actions/settings/sortContentSettings";
import { GlobalFolderViewSettings } from "../filesystem/streamdeck/settings/globalSettings";
import { FolderViewSortDirection } from "../types/folderViewSettings/sortDirection";
import { FolderViewSortType } from "../types/folderViewSettings/sortType";
import { Analytics } from "../analytics/analytics";

/**
 * This StreamDeck action allows to sort the content of the currently opened folder on the Stream Deck.
 */
@action({ UUID: "de.artus.fileexplorer.sortcontent" })
export class SortContent extends SingletonAction<SortContentSettings> {

    public longPressTimeout: Map<string, NodeJS.Timeout> = new Map();
    public isGettingSettings: string[] = [];
    public isSettingSettings: string[] = [];


    public override onWillAppear(ev: WillAppearEvent<SortContentSettings>): Promise<void> | void {
        this.updateKeyTitleAndState(ev.action, this.getDefaultedSettings(ev.payload.settings).updateTitleToType, ev.payload.settings.switchSetting === "type");

        GlobalFolderViewSettings.instance.on("onUpdateSettings", () => this.syncToGlobalSettings(ev.action));
        this.syncToGlobalSettings(ev.action);
    }

    public async syncToGlobalSettings(action: DialAction<SortContentSettings> | KeyAction<SortContentSettings>): Promise<void> {
        const globalSettings = GlobalFolderViewSettings.instance;
        const actionId = action.id;

        this.isGettingSettings.push(actionId);
        const settings = await action.getSettings()
        this.isGettingSettings = this.isGettingSettings.filter(id => id !== actionId);
        const defaultedSettings = this.getDefaultedSettings(settings);

        this.isSettingSettings.push(actionId);
        await action.setSettings({
            ...settings,
            sortType: globalSettings.sortType,
            sortDirection: globalSettings.sortDirection,
            sortFoldersFirst: globalSettings.sortFoldersFirst
        });
        this.isSettingSettings = this.isSettingSettings.filter(id => id !== actionId);

        this.updateKeyTitleAndState(action, defaultedSettings.updateTitleToType, defaultedSettings.switchSetting === "type");
    }

    public override async onKeyDown(ev: KeyDownEvent<SortContentSettings>): Promise<void> {
        const actionId = ev.action.id;

        if (this.longPressTimeout.has(actionId)) {
            clearTimeout(this.longPressTimeout.get(actionId))
        }

        this.longPressTimeout.set(actionId, setTimeout(() => {
            const settings = ev.payload.settings;
            const defaultedSettings = this.getDefaultedSettings(settings);
            if (defaultedSettings.longPressToggle) {
                const switchSetting = defaultedSettings.switchSetting === "type" ? "direction" : "type";
                ev.action.setSettings({
                    ...settings,
                    switchSetting: switchSetting
                }).then(() => {
                    this.updateKeyTitleAndState(ev.action, defaultedSettings.updateTitleToType, switchSetting === "type");
                    this.sendAnalytics(switchSetting === "type" ? "sort_type" : "sort_direction");
                });
            }

            this.longPressTimeout.delete(actionId);
        }, 500))
    }


    public override onKeyUp(ev: KeyUpEvent<SortContentSettings>): Promise<void> | void {
        const actionId = ev.action.id;
        let isLongPress: boolean = true;

        if (this.longPressTimeout.has(actionId)) {
            isLongPress = false;
            clearTimeout(this.longPressTimeout.get(actionId));
            this.longPressTimeout.delete(actionId);
        }

        const defaultedSettings = this.getDefaultedSettings(ev.payload.settings);

        if (!isLongPress || !defaultedSettings.longPressToggle) {
            const globalSettings = GlobalFolderViewSettings.instance;
            const allSettings = this.getAllSettingsStates();

            switch (defaultedSettings.switchSetting) {
                case "type":
                    globalSettings.sortType = this.getNextSetting<FolderViewSortType>(allSettings.sortType, globalSettings.sortType);
                    this.sendAnalytics("sort_type");
                    break;
                case "direction":
                    globalSettings.sortDirection = this.getNextSetting<FolderViewSortDirection>(allSettings.sortDirection, globalSettings.sortDirection);
                    this.sendAnalytics("sort_direction");
                    break;
            }

            globalSettings.emit("onUpdateSettings");
        }
    }




    public override onDidReceiveSettings(ev: DidReceiveSettingsEvent<SortContentSettings>): Promise<void> | void {
        const settings = ev.payload.settings;
        const globalSettings = GlobalFolderViewSettings.instance;
        const actionId = ev.action.id;

        // Prevent circular updates: ignore if this specific action is currently getting or setting settings
        if (this.isGettingSettings.includes(actionId) || this.isSettingSettings.includes(actionId)) return;

        // Check if settings actually changed before emitting update event
        const sortTypeChanged = settings.sortType !== undefined && settings.sortType !== globalSettings.sortType;
        const sortDirectionChanged = settings.sortDirection !== undefined && settings.sortDirection !== globalSettings.sortDirection;
        const sortFoldersFirstChanged = settings.sortFoldersFirst !== undefined && settings.sortFoldersFirst !== globalSettings.sortFoldersFirst;

        if (sortTypeChanged || sortDirectionChanged || sortFoldersFirstChanged) {
            globalSettings.sortType = settings.sortType ?? globalSettings.sortType;
            globalSettings.sortDirection = settings.sortDirection ?? globalSettings.sortDirection;
            globalSettings.sortFoldersFirst = settings.sortFoldersFirst ?? globalSettings.sortFoldersFirst;

            globalSettings.emit("onUpdateSettings");
        }

        // Update title and state if display settings changed (even if sort settings didn't)
        const defaultedSettings = this.getDefaultedSettings(settings);
        this.updateKeyTitleAndState(ev.action, defaultedSettings.updateTitleToType, defaultedSettings.switchSetting === "type");
    }

    public updateKeyTitleAndState(action: DialAction<SortContentSettings> | KeyAction<SortContentSettings>, updateTitle: boolean, switchTypeSelected: boolean): void {
        const globalSettings = GlobalFolderViewSettings.instance;

        if (action.isKey()) {
            action.setState(globalSettings.sortDirection === "asc" ? 0 : 1);
        }

        if (updateTitle) {
            const typeTitles: Record<FolderViewSortType, string> = {
                name: "Name",
                date: "Date",
                size: "Size"
            }
            const format = switchTypeSelected ? "-> %s" : "[%s]";
            action.setTitle(format.replace("%s", typeTitles[globalSettings.sortType]));
        } else {
            action.setTitle("");
        }
    }

    public getDefaultedSettings(settings: SortContentSettings): Required<SortContentSettings> {
        const globalSettings = GlobalFolderViewSettings.instance;
        return {
            sortType: settings.sortType ?? globalSettings.sortType,
            sortDirection: settings.sortDirection ?? globalSettings.sortDirection,
            sortFoldersFirst: settings.sortFoldersFirst ?? globalSettings.sortFoldersFirst,
            switchSetting: settings.switchSetting ?? "type",
            updateTitleToType: settings.updateTitleToType ?? false,
            longPressToggle: settings.longPressToggle ?? true
        }
    }

    public getAllSettingsStates(): { sortType: FolderViewSortType[]; sortDirection: FolderViewSortDirection[]; sortFoldersFirst: boolean[] } {
        return {
            sortType: ["name", "date", "size"],
            sortDirection: ["asc", "desc"],
            sortFoldersFirst: [true, false]
        };
    }

    public getNextSetting<T>(allSettings: T[], currentSetting: T): T {
        const currentIndex = allSettings.indexOf(currentSetting);
        if (currentIndex === -1 || currentIndex === allSettings.length - 1) {
            return allSettings[0];
        } else {
            return allSettings[currentIndex + 1];
        }
    }

    public sendAnalytics(changed: "sort_direction" | "sort_type"): void {
        Analytics.instance?.sendEvent({
            event: "sort_changed",
            properties: {
                changed: changed
            }
        })
    }

}
