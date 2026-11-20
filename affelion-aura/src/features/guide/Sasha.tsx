import * as React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../ui/components/Text';
import { colors, space } from '../../ui/theme';
import { GUIDE_NAME } from '../../services/ai/guide';

/**
 * Sasha's face. She is shown simply as Sasha, the guide, with no label on the picture. Two
 * things stay true underneath: her first message says she is an AI, because a person has to be
 * told that when the conversation starts, and she never claims to be a person if asked.
 */
const PORTRAIT = require('../../../assets/sasha.jpg') as number;
const AVATAR = require('../../../assets/sasha-avatar.jpg') as number;

const DESCRIPTION = `Portrait of ${GUIDE_NAME}, your guide: a woman with long blonde hair and blue eyes on a black background.`;

/** Small round portrait for headers and rows. */
export function SashaAvatar({ size = 32, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.stage }, style]}>
      <Image source={AVATAR} style={{ width: size, height: size }} contentFit="cover" accessible accessibilityLabel={DESCRIPTION} accessibilityIgnoresInvertColors />
    </View>
  );
}

/** Her portrait on the black stage, named and labeled, to open the conversation. */
export function SashaStage({ height = 340, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.stage, { height }, style]}>
      <Image source={PORTRAIT} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: '18%', left: '50%' }} accessible accessibilityLabel={DESCRIPTION} accessibilityIgnoresInvertColors />
      <View style={styles.scrim} pointerEvents="none" />
      <View style={styles.caption}>
        <Text variant="display" color={colors.stageFg} accessibilityRole="header">
          {GUIDE_NAME}
        </Text>
        <Text variant="eyebrow" color={colors.stageFg} style={{ marginTop: space.xs }}>
          Answers only from your readings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: colors.stage, overflow: 'hidden', justifyContent: 'flex-end' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, experimental_backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0))' },
  caption: { paddingHorizontal: space.xl, paddingBottom: space.lg },
});
