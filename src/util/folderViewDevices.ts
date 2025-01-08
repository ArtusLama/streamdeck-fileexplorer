import { DeviceMapManager } from "./deviceManager";
import { FolderView } from "./folderView";

export class FolderViewDevices extends DeviceMapManager<FolderView> {
	override remove(deviceId: string): void {
		const folderView = this.get(deviceId);
		if (folderView) folderView.delete();

		super.remove(deviceId);
	}
}
