export interface PcmEvent {
  sampleRate: number;
  /** Little-endian Float32 samples in −1..1. */
  data: Uint8Array;
}

export interface AudioStatusEvent {
  state: 'running' | 'stopped' | 'error';
  message?: string;
}

export type AudioModuleEvents = {
  onPcm(event: PcmEvent): void;
  onStatus(event: AudioStatusEvent): void;
};

export type AudioPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Convert the event payload to Float32 samples without copying when alignment allows. */
export function pcmToFloat32(data: Uint8Array): Float32Array {
  if (data.byteOffset % 4 === 0) {
    return new Float32Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 4));
  }
  const copy = new Uint8Array(data.byteLength - (data.byteLength % 4));
  copy.set(data.subarray(0, copy.length));
  return new Float32Array(copy.buffer);
}
