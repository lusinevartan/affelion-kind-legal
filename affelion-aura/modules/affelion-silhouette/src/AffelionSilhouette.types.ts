import type { ViewProps } from 'react-native';

export interface MaskEvent {
  /** Mask dimensions in pixels. */
  width: number;
  height: number;
  /** Aspect ratio (w/h) of the full camera image in display orientation. */
  imageAspect: number;
  /** Base64 of width×height unsigned bytes, row-major, top-left origin, 255 = person. */
  data: string;
}

export interface FaceEvent {
  detected: boolean;
  /** Normalised centre and size relative to the full camera image (display orientation). */
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  /** Radians. */
  yaw?: number;
  pitch?: number;
  roll?: number;
}

export interface SilhouetteStatusEvent {
  state: 'running' | 'stopped' | 'error';
  source?: 'arkit' | 'avfoundation' | 'camerax-mlkit';
  message?: string;
}

export interface StillResult {
  uri: string;
  width: number;
  height: number;
}

export interface AffelionSilhouetteViewProps extends ViewProps {
  /** Start/stop the camera and trackers. */
  active: boolean;
  /** Long side of the emitted mask in pixels (64..512). Default 160. */
  maskSize?: number;
  /** Mask emission rate. Default 15. */
  maskFps?: number;
  onMask?: (event: { nativeEvent: MaskEvent }) => void;
  onFace?: (event: { nativeEvent: FaceEvent }) => void;
  onStatus?: (event: { nativeEvent: SilhouetteStatusEvent }) => void;
}

export interface AffelionSilhouetteViewRef {
  captureStill(): Promise<StillResult>;
}
