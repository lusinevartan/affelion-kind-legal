import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../ui/components/Text';
import { colors } from '../../ui/theme';

export const STORY_ASPECT = 9 / 16;

export interface StoryCardProps {
  width: number;
  /** The rendered aura with the black-and-white still already inside it. */
  auraUri?: string;
  /** A live aura instead of an image (preview screen only). */
  auraNode?: React.ReactNode;
  colorName: string;
  colorHex: string;
  /** The plain meaning, e.g. "Calm and balanced". */
  meaning: string;
  date: string;
  /** Free shares carry the app name; Pro shares can be clean. */
  showWordmark: boolean;
  onImageLoad?: () => void;
}

export type StoryCardHandle = React.ComponentRef<typeof View>;

/**
 * The 9:16 share card for Stories, Reels and TikTok. Black stage, the portrait, the color named
 * in one large word and its plain meaning. Sized by width so it captures at any pixel ratio.
 * Every measure is a fraction of the width, so the card reads the same at every size.
 */
export const StoryCard = React.forwardRef<StoryCardHandle, StoryCardProps>(function StoryCard(
  { width, auraUri, auraNode, colorName, colorHex, meaning, date, showWordmark, onImageLoad },
  ref,
) {
  const height = Math.round(width / STORY_ASPECT);
  const pad = Math.round(width * 0.08);
  const imageW = width - pad * 2;
  const imageH = Math.round(imageW * 1.25);
  const u = width / 360; // type scales from a 360-wide design
  return (
    <View ref={ref} collapsable={false} style={[styles.root, { width, height, paddingHorizontal: pad, paddingTop: Math.round(height * 0.07), paddingBottom: Math.round(height * 0.05) }]}>
      <View style={styles.row}>
        <Text variant="eyebrow" color={colors.stageFg70} style={{ fontSize: 11 * u, lineHeight: 14 * u }}>
          My Halo today
        </Text>
        <Text variant="eyebrow" color={colors.stageFg70} style={{ fontSize: 11 * u, lineHeight: 14 * u }}>
          {date}
        </Text>
      </View>
      <View style={[styles.window, { width: imageW, height: imageH, marginTop: Math.round(16 * u) }]}>
        {auraNode ?? (auraUri ? <Image source={{ uri: auraUri }} style={StyleSheet.absoluteFill} contentFit="cover" onLoad={onImageLoad} onError={onImageLoad} /> : null)}
      </View>
      <View style={{ marginTop: Math.round(22 * u) }}>
        <View style={[styles.swatch, { backgroundColor: colorHex, width: 28 * u, height: 4 * u, marginBottom: 12 * u }]} />
        <Text variant="display" color={colors.stageFg} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 44 * u, lineHeight: 54 * u, letterSpacing: -1.5 * u }}>
          {colorName}
        </Text>
        <Text variant="body" color={colors.stageFg70} numberOfLines={2} style={{ fontSize: 16 * u, lineHeight: 22 * u, marginTop: 6 * u }}>
          {meaning}
        </Text>
      </View>
      <View style={styles.flex} />
      <View style={styles.row}>
        <Text variant="caption" color={colors.stageFg50} style={{ fontSize: 10 * u, lineHeight: 13 * u }}>
          Made from my pulse and voice
        </Text>
        {showWordmark ? (
          <Text variant="eyebrow" color={colors.stageFg} style={{ fontSize: 11 * u, lineHeight: 14 * u, letterSpacing: 1.2 * u }}>
            Affelion Halo
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: colors.stage },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  window: { backgroundColor: '#000000', overflow: 'hidden' },
  swatch: { borderRadius: 2 },
  flex: { flex: 1 },
});
