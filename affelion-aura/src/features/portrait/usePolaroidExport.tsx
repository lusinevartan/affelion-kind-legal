import * as React from 'react';
import { formatDate } from '../../ui/format';
import { Alert, StyleSheet, View } from 'react-native';
import type { ScanRecord } from '../../core/types';
import { AURA_COLORS } from '../../core/color/palette';
import type { AuraViewRef } from '../../render/fluid/AuraView';
import { PolaroidCard, type PolaroidCardHandle } from '../../render/polaroid/PolaroidCard';
import { capturePolaroid, saveToPhotos, sharePortrait } from '../../services/export';
import { updatePortraitUri } from '../../services/storage';
import type { FrameStyleId } from '../../render/polaroid/styles';

/**
 * Export pipeline that never depends on capturing a live GL surface (unreliable on Android):
 *   1. snapshot the on-screen aura GL view to a PNG with alpha,
 *   2. render an off-screen Polaroid at export size with that PNG layered over the still,
 *   3. capture that card as a bitmap, persist and save/share.
 */
export function usePolaroidExport(record: ScanRecord | null, opts: { clean: boolean; exportWidth: number; onSaved?: () => Promise<void> | void; frame?: FrameStyleId }) {
  const auraRef = React.useRef<AuraViewRef>(null);
  const exportCardRef = React.useRef<PolaroidCardHandle>(null);
  const [auraImageUri, setAuraImageUri] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'save' | 'share' | null>(null);
  const pending = React.useRef<((uri: string) => void) | null>(null);

  // Once the off-screen card has the aura image, give it a frame to lay out, then capture.
  React.useEffect(() => {
    if (!auraImageUri || !pending.current) return;
    const resolve = pending.current;
    pending.current = null;
    const id = setTimeout(() => {
      capturePolaroid(exportCardRef, { fileName: record ? `affelion-aura-${record.id}.png` : undefined })
        .then(resolve)
        .catch((e: unknown) => {
          Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
          setBusy(null);
        });
    }, 120);
    return () => clearTimeout(id);
  }, [auraImageUri, record]);

  const run = React.useCallback(
    async (mode: 'save' | 'share') => {
      if (!record || busy) return;
      try {
        setBusy(mode);
        const snap = await auraRef.current?.snapshot();
        if (!snap) throw new Error('The aura has not rendered yet.');
        const uri = await new Promise<string>((resolve) => {
          pending.current = resolve;
          setAuraImageUri(snap.uri);
        });
        await updatePortraitUri(record.id, uri);
        await opts.onSaved?.();
        if (mode === 'save') {
          const ok = await saveToPhotos(uri);
          Alert.alert(ok ? 'Saved' : 'Not saved', ok ? 'Your portrait is in your photo library.' : 'Photo library permission was not granted.');
        } else {
          await sharePortrait(uri);
        }
      } catch (e) {
        Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setBusy(null);
        setAuraImageUri(null);
      }
    },
    [record, busy, opts],
  );

  const exportCard =
    record && auraImageUri ? (
      <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PolaroidCard
          ref={exportCardRef}
          width={opts.exportWidth}
          stillUri={record.stillUri}
          aura={{ kind: 'image', uri: auraImageUri }}
          caption={AURA_COLORS[record.aura.primaryColorId].name}
          subcaption={formatDate(record.createdAt)}
          showWordmark={!opts.clean}
          frame={opts.frame ?? 'classic'}
        />
      </View>
    ) : null;

  return { auraRef, busy, run, exportCard };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
