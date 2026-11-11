import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import type * as React from 'react';

/**
 * Polaroid export. The on-screen Polaroid card (still + aura overlay + paper frame + caption)
 * is captured as a bitmap at a chosen pixel ratio. Free tier exports at 2× with the
 * "Affelion Aura" caption; Pro exports at 3× with a clean frame.
 */

export interface ExportOptions {
  /** Device pixel ratio multiplier for the capture. */
  pixelRatio?: number;
  fileName?: string;
}

export async function capturePolaroid(viewRef: React.RefObject<unknown>, opts: ExportOptions = {}): Promise<string> {
  const target = viewRef.current;
  if (!target) throw new Error('Portrait is not ready to export yet.');
  const tmp = await captureRef(target as never, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    // react-native-view-shot captures at device scale; `width/height` would resample, so we
    // let the card itself be sized for the requested ratio instead.
  });
  const name = opts.fileName ?? `affelion-aura-${Date.now()}.png`;
  const dest = new File(Paths.document, name);
  const src = new File(tmp);
  if (dest.exists) dest.delete();
  src.copy(dest);
  return dest.uri;
}

export async function saveToPhotos(uri: string): Promise<boolean> {
  const perm = await requestPermissionsAsync(true);
  if (!perm.granted) return false;
  await Asset.create(uri);
  return true;
}

export async function sharePortrait(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your portrait' });
}
