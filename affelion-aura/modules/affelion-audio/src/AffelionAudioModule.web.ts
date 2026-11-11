import { NativeModule, registerWebModule } from 'expo';
import type { AudioModuleEvents, AudioPermissionStatus } from './AffelionAudio.types';

class AffelionAudioModule extends NativeModule<AudioModuleEvents> {
  async permissionStatus(): Promise<AudioPermissionStatus> {
    return 'denied';
  }
  async requestPermission(): Promise<AudioPermissionStatus> {
    return 'denied';
  }
  async start(): Promise<{ sampleRate: number }> {
    throw new Error('Voice capture is only available on iOS and Android devices.');
  }
  async stop(): Promise<void> {}
}

export default registerWebModule(AffelionAudioModule, 'AffelionAudioModule');
