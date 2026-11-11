export interface PpgStartOptions {
  /** Torch brightness 0..1 (iOS honours levels; Android torch is on/off). Default 0.6. */
  torchLevel?: number;
  /** Requested frames per second. Default 30. */
  fps?: number;
  /** Fraction of frame width/height used as the centre region of interest. Default 0.5. */
  roi?: number;
  /** Seconds of auto exposure before locking exposure and white balance. Default 1.2. */
  warmupSeconds?: number;
}

export interface PpgSampleEvent {
  /** Seconds on the camera clock (monotonic, arbitrary origin). */
  t: number;
  r: number;
  g: number;
  b: number;
  /** True once exposure and white balance are locked. Samples before this are warm-up. */
  locked: boolean;
}

export interface PpgStatusEvent {
  state: 'running' | 'locked' | 'stopped' | 'error';
  message?: string | null;
}

export type PpgModuleEvents = {
  onSample(event: PpgSampleEvent): void;
  onStatus(event: PpgStatusEvent): void;
};

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
