import * as React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import type { AuraParams } from '../../core/types';
import type { SilhouetteMask } from '../fluid/FluidSim';
import { AuraView, type AuraViewRef } from '../fluid/AuraView';
import { Text } from '../../ui/components/Text';
import { FRAME_STYLES, type FrameStyleId } from './styles';

export const POLAROID_ASPECT = 0.8; // image area 4:5 inside the paper

export interface PolaroidCardProps {
  /** Camera still underneath the aura. */
  stillUri: string | null;
  /** Live aura (GL) or a pre-rendered aura PNG with alpha. */
  aura: { kind: 'live'; params: AuraParams | null; mask: SilhouetteMask | null; paused?: boolean } | { kind: 'image'; uri: string };
  width: number;
  caption?: string;
  /** Small secondary line, e.g. date. */
  subcaption?: string;
  /** Pro exports hide the wordmark. */
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
  auraRef?: React.Ref<AuraViewRef>;
  /** Tappable regions rendered over the image area. */
  overlay?: React.ReactNode;
  /** Frame style (Pro styles are presentation only). */
  frame?: FrameStyleId;
  /** Called when a pre-rendered aura image has loaded and the card is ready to capture. */
  onAuraImageLoad?: () => void;
}

/**
 * The Polaroid frame: paper, a 4:5 window holding the developed portrait, and a caption area
 * at the bottom. A pre-rendered aura image already contains the black-and-white still. Sized by width so it can be captured at any pixel ratio.
 */
export type PolaroidCardHandle = React.ComponentRef<typeof View>;

export const PolaroidCard = React.forwardRef<PolaroidCardHandle, PolaroidCardProps>(function PolaroidCard(
  { stillUri, aura, width, caption, subcaption, showWordmark = true, style, auraRef, overlay, frame = 'classic', onAuraImageLoad },
  ref,
) {
  const f = FRAME_STYLES[frame];
  const border = Math.round(width * f.border);
  const imageW = width - border * 2;
  const imageH = Math.round(imageW / POLAROID_ASPECT);
  const bottom = Math.round(width * f.bottom);
  return (
    <View ref={ref} collapsable={false} style={[styles.paper, { width, backgroundColor: f.paper, paddingTop: border, paddingHorizontal: border, paddingBottom: bottom, borderRadius: Math.max(2, width * f.cornerRadius) }, style]}>
      <View style={[styles.window, { width: imageW, height: imageH }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
        {aura.kind === 'live' ? (
          <AuraView ref={auraRef} params={aura.params} mask={aura.mask} stillUri={stillUri} paused={aura.paused} style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: aura.uri }} style={StyleSheet.absoluteFill} contentFit="cover" onLoad={onAuraImageLoad} onError={onAuraImageLoad} />
        )}
        {overlay}
      </View>
      <View style={[styles.captionArea, { height: bottom - border }]}>
        {caption ? (
          <Text variant="heading" color={f.caption} style={{ fontSize: Math.max(12, width * 0.05) }} numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
        <View style={styles.footer}>
          {subcaption ? (
            <Text variant="caption" color={f.subcaption} style={{ fontSize: Math.max(9, width * 0.03) }}>
              {subcaption}
            </Text>
          ) : (
            <View />
          )}
          {showWordmark ? (
            <Text variant="caption" color={f.subcaption} style={{ fontSize: Math.max(9, width * 0.03), letterSpacing: 1 }}>
              AFFELION AURA
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  paper: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  window: { backgroundColor: '#000000', overflow: 'hidden' },
  captionArea: { justifyContent: 'space-between', paddingTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
});
