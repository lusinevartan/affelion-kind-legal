import { NativeModule, requireNativeModule } from 'expo';
import type { AudioModuleEvents, AudioPermissionStatus } from './AffelionAudio.types';

declare class AffelionAudioModule extends NativeModule<AudioModuleEvents> {
  permissionStatus(): Promise<AudioPermissionStatus>;
  requestPermission(): Promise<AudioPermissionStatus>;
  start(): Promise<{ sampleRate: number }>;
  stop(): Promise<void>;
}

export default requireNativeModule<AffelionAudioModule>('AffelionAudio');
