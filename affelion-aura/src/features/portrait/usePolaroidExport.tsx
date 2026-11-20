import * as React from 'react';
import { formatDate } from '../../ui/format';
import { Alert, StyleSheet, View } from 'react-native';
import type { ScanRecord } from '../../core/types';
import { AURA_COLORS } from '../../core/color/palette';
import type { AuraViewRef } from '../../render/fluid/AuraView';
import { PolaroidCard, type PolaroidCardHandle } from '../../render/polaroid/PolaroidCard';
import { StoryCard } from '../../render/polaroid/StoryCard';
import { capturePolaroid, saveToPhotos, sharePortrait } from '../../services/export';
import { updatePortraitUri } from '../../services/storage';
import { deleteFiles } from '../../services/files';
import type { FrameStyleId } from '../../render/polaroid/styles';

/**
 * Export pipeline that never depends on capturing a live GL surface (unreliable on Android):
 *   1. snapshot the on-screen aura GL view to a PNG with alpha,
 *   2. render an off-screen Polaroid at export size with that PNG layered over the still,
 *   3. capture that card as a bitmap, persist and save/share.
 * 'story' does the same with the 9:16 share card and shares it without replacing the saved
 * portrait.
 */
export function usePolaroidExport(record: ScanRecord | null, opts: { clean: boolean; exportWidth: number; onSaved?: () => Promise<void> | void; frame?: FrameStyleId }) {
  const auraRef = React.useRef<AuraViewRef>(null);
  const exportCardRef = React.useRef<PolaroidCardHandle>(null);
  const [auraImageUri, setAuraImageUri] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'save' | 'share' | 'story' | null>(null);
  const pending = React.useRef<((uri: string) => void) | null>(null);
  // The last story card made. Kept until the next one, because a share sheet can still be reading it.
  const lastStory = React.useRef<string | null>(null);

  // Capture once the off-screen card has actually drawn the aura image. A fixed delay is not
  // enough for a large image on a slow phone, so the image's own load event triggers it, with a
  // fallback in case that event never arrives.
  const capture = React.useCallback(() => {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    // One more frame so the loaded image is on screen before the bitmap is taken.
    requestAnimationFrame(() => {
      capturePolaroid(exportCardRef, { fileName: record ? `affelion-halo-${record.id}-${Date.now().toString(36)}.png` : undefined })
        .then(resolve)
        .catch((e: unknown) => {
          Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
          setBusy(null);
          setAuraImageUri(null);
        });
    });
  }, [record]);

  React.useEffect(() => {
    if (!auraImageUri) return;
    const id = setTimeout(capture, 2500);
    return () => clearTimeout(id);
  }, [auraImageUri, capture]);

  const run = React.useCallback(
    async (mode: 'save' | 'share' | 'story') => {
      if (!record || busy) return;
      try {
        setBusy(mode);
        const snap = await auraRef.current?.snapshot();
        if (!snap) throw new Error('The aura has not rendered yet.');
        const uri = await new Promise<string>((resolve) => {
          pending.current = resolve;
          setAuraImageUri(snap.uri);
        });
        if (mode === 'story') {
          if (lastStory.current && lastStory.current !== uri) deleteFiles([lastStory.current]);
          lastStory.current = uri;
          await sharePortrait(uri);
          return;
        }
        const previous = record.portraitUri;
        await updatePortraitUri(record.id, uri);
        if (previous && previous !== uri) deleteFiles([previous]);
        await opts.onSaved?.();
        if (mode === 'save') {
          const ok = await saveToPhotos(uri);
          Alert.alert(ok ? 'Saved' : 'Not saved', ok ? 'Your portrait is in your photo library.' : 'Halo is not allowed to save to your photos. You can turn that on in Settings.');
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
        {busy === 'story' ? (
          <StoryCard
            ref={exportCardRef}
            width={opts.exportWidth}
            auraUri={auraImageUri}
            colorName={AURA_COLORS[record.aura.primaryColorId].name}
            colorHex={AURA_COLORS[record.aura.primaryColorId].hex}
            meaning={AURA_COLORS[record.aura.primaryColorId].meaning}
            date={formatDate(record.createdAt)}
            showWordmark={!opts.clean}
            onImageLoad={capture}
          />
        ) : (
        <PolaroidCard
          ref={exportCardRef}
          width={opts.exportWidth}
          stillUri={record.stillUri}
          aura={{ kind: 'image', uri: auraImageUri }}
          caption={AURA_COLORS[record.aura.primaryColorId].name}
          subcaption={formatDate(record.createdAt)}
          showWordmark={!opts.clean}
          frame={opts.frame ?? 'classic'}
          onAuraImageLoad={capture}
        />
        )}
      </View>
    ) : null;

  return { auraRef, busy, run, exportCard };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
