import { NativeModule, requireNativeModule } from 'expo';
import type { PermissionStatus, PpgModuleEvents, PpgStartOptions } from './AffelionPpg.types';

declare class AffelionPpgModule extends NativeModule<PpgModuleEvents> {
  isAvailable(): Promise<boolean>;
  permissionStatus(): Promise<PermissionStatus>;
  start(options?: PpgStartOptions): Promise<void>;
  stop(): Promise<void>;
}

export default requireNativeModule<AffelionPpgModule>('AffelionPpg');
