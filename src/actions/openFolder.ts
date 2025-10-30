import streamDeck, { action, KeyDownEvent, SendToPluginEvent, SingletonAction } from "@elgato/streamdeck";
import { OpenFolderSettings } from "../types/actions/settings/openFolderSettings";
import { FileSystem } from "../filesystem/wrapper/impl/fileSystem";
import spawn from "cross-spawn";
import argv from "string-argv";
import { FolderViewManager } from "../filesystem/streamdeck/devices/deviceManager";
import { Analytics } from "../analytics/analytics";


/**
 * This StreamDeck action allows to open a folder either on the StreamDeck itself or in the native explorer or cmd or with a custom command.
 */
@action({ UUID: "de.artus.fileexplorer.openfolder" })
export class OpenFolder extends SingletonAction<OpenFolderSettings> {


    constructor(private filesystem: FileSystem) {
        super();
    }


    public override async onKeyDown(ev: KeyDownEvent<OpenFolderSettings>): Promise<void> {
        const settings = await ev.action.getSettings();

        if (settings.folderpath) {

            if (settings.openaction) {
                Analytics.instance?.sendEvent({
                    event: "open_folder",
                    properties: {
                        open_action: settings.openaction
                    }
                });
            }

            switch (settings.openaction) {
                case "streamdeck":
                    streamDeck.logger.info(`Opening folder (${settings.folderpath}) on StreamDeck`);

                    FolderViewManager.instance.getFolderViewForDevice(ev.action.device.id)?.loadFolderPath(settings.folderpath);
					
                    if (settings.openprofile || settings.openprofile === undefined) {
                        streamDeck.logger.info(`Switching to FileExplorerView profile`);
                        streamDeck.profiles.switchToProfile(ev.action.device.id, "FileExplorerView");
                    }
                    break;

                case "nativeexplorer":
                    streamDeck.logger.info(`Opening folder (${settings.folderpath}) in native explorer`);
                    this.filesystem.openExplorerWithPath(settings.folderpath);
                    break;

                case "cmd":
                    streamDeck.logger.info(`Opening folder (${settings.folderpath}) in cmd`);
                    this.filesystem.startCmdWithPath(settings.folderpath);
                    break;

                case "custom":
                    if (settings.customcommand) {
                        streamDeck.logger.info(`Opening folder (${settings.folderpath}) with custom command: ${settings.customcommand}`);

                        const path = settings.folderpath;
                        const command = settings.customcommand.trim().replaceAll("{path}", `"${path}"`);

                        const parts = argv(command);
                        const cmd = parts.shift()!;
                        const args = parts;

                        spawn(cmd, args, { stdio: "ignore", shell: false, detached: true }).unref();
                    }
                    break;

                default:
                    streamDeck.logger.warn(`Unknown open action: ${settings.openaction}`);
                    break;
            }

        }
    }

    public override async onSendToPlugin(ev: SendToPluginEvent<{ event: string }, OpenFolderSettings>): Promise<void> {
        if (ev.payload && ev.payload.event === "openfolder") {

            const path = await this.filesystem.openFolderPickerDialog();

            if (path) {
                const settings = await ev.action.getSettings()

                ev.action.setSettings({
                    ...settings,
                    folderpath: path
                })
            }
        }
    }

}

