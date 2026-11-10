import { NativeModule, registerWebModule } from 'expo';
import type { PermissionStatus, PpgModuleEvents, PpgStartOptions } from './AffelionPpg.types';

/** Web has no torch control; PPG is unavailable and the app shows a device-only message. */
class AffelionPpgModule extends NativeModule<PpgModuleEvents> {
  async isAvailable(): Promise<boolean> {
    return false;
  }
  async permissionStatus(): Promise<PermissionStatus> {
    return 'denied';
  }
  async start(_options?: PpgStartOptions): Promise<void> {
    throw new Error('Rear-camera PPG is only available on iOS and Android devices.');
  }
  async stop(): Promise<void> {}
}

export default registerWebModule(AffelionPpgModule, 'AffelionPpgModule');
