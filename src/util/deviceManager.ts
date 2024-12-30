

export class DeviceMapManager<T> {

    
    private devices: Map<string, T> = new Map();

    
    public add(deviceId: string, device: T): void {
        this.devices.set(deviceId, device);
    }

    
    public get(deviceId: string): T | undefined {
        return this.devices.get(deviceId);
    }

    
    public remove(deviceId: string): void {
        this.devices.delete(deviceId);
    }

    
    public getDevices(): string[] {
        return Array.from(this.devices.keys());
    }

    
    public getAll(): T[] {
        return Array.from(this.devices.values());
    }

    
    public clear(): void {
        this.devices.clear();
    }


}
