import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Rule, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { AURA_COLORS } from '../core/color/palette';
import type { AuraColorId } from '../core/color/knowledgeBase';
import { useAppState } from '../features/store/AppStore';

/**
 * How it works, in plain words. What the app measures, what the person does, what the colors
 * mean and how to change them. Written to be read once, by anyone, without a glossary.
 */
const STEPS: { title: string; body: string }[] = [
  { title: 'Face the camera', body: 'Hold your phone in front of you so your head and shoulders fit in the oval. This gives the app your outline and one photo.' },
  { title: 'Cover the back camera with your fingertip', body: 'Rest it gently over the lens and the flash, and hold still for about 40 seconds. The light shines through your finger so the camera can see each heartbeat.' },
  { title: 'Say a few words', body: 'Talk in your normal voice for five seconds. The app listens to how high and how steady your voice is. It does not record or keep your words.' },
  { title: 'See your portrait', body: 'Your photo appears in black and white with your color around it.' },
];

const MEANINGS: { ids: AuraColorId[]; name: string; body: string }[] = [
  { ids: ['emerald', 'teal', 'aqua'], name: 'Greens and teals', body: 'A calm, steady heartbeat.' },
  { ids: ['deep_red', 'bright_orange', 'amber'], name: 'Reds and oranges', body: 'A fast or tense heartbeat.' },
  { ids: ['cobalt', 'indigo', 'violet'], name: 'Blues and purples', body: 'A slow, resting heartbeat.' },
  { ids: ['sky_blue'], name: 'Sky blue', body: 'Somewhere in between.' },
  { ids: ['golden_yellow', 'magenta'], name: 'Yellow and magenta', body: 'An active heartbeat with a lively voice.' },
  { ids: ['lime'], name: 'Lime green', body: 'Your heartbeat settled while you were being scanned.' },
  { ids: ['soft_white', 'muted_gray', 'charcoal'], name: 'White, pearl, gray, brown and charcoal', body: 'Very strong readings, or very quiet ones. A quiet portrait is common when you are tired.' },
];

const TIPS = ['Sit down and rest for a minute first.', 'Press lightly. Pressing hard blocks the signal.', 'Find a quiet spot for the voice step.', 'Scan at the same time each day if you want to compare.'];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Rule />
      <Text variant="eyebrow" color={colors.fg60} style={{ marginTop: space.lg }} accessibilityRole="header">
        {label}
      </Text>
      <View style={{ marginTop: space.md }}>{children}</View>
    </View>
  );
}

export default function HowItWorks() {
  const { canScan } = useAppState();
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={16} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}>
          <Text variant="eyebrow" color={colors.fg70}>
            ← Back
          </Text>
        </Pressable>
      </View>
      <Text variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
        How it works
      </Text>
      <Text variant="body" color={colors.fg70} style={{ marginTop: space.md }}>
        Affelion Aura makes a picture of how your body is doing right now. It reads your heartbeat and your voice, then turns those numbers into color around your photo. It is not magic and it does not see invisible light. It is not a medical device.
      </Text>

      <Section label="What you do">
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.disk} accessible={false}>
              <Text variant="label" color={colors.ground}>
                {i + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{s.title}</Text>
              <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: 4 }}>
                {s.body}
              </Text>
            </View>
          </View>
        ))}
      </Section>

      <Section label="What the color means">
        {MEANINGS.map((m) => (
          <View key={m.name} style={styles.meaning} accessible accessibilityLabel={`${m.name}. ${m.body}`}>
            <View style={styles.swatches}>
              {m.ids.map((id) => (
                <View key={id} style={[styles.swatch, { backgroundColor: AURA_COLORS[id].hex }]} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label">{m.name}</Text>
              <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: 2 }}>
                {m.body}
              </Text>
            </View>
          </View>
        ))}
        <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: space.md }}>
          Your voice changes how bright and how strong the color is. The same numbers always make the same picture. Tap a number on your portrait to see which reading made that color.
        </Text>
      </Section>

      <Section label="How to change it">
        <Text variant="bodySmall" color={colors.fg70}>
          Open Practice. Keep your fingertip on the back camera and breathe slowly with the circle: in as it grows, out as it shrinks. As your heartbeat steadies, your color shifts while you watch. At the end you see a before and an after.
        </Text>
      </Section>

      <Section label="Tips for a good scan">
        {TIPS.map((t) => (
          <Text key={t} variant="bodySmall" color={colors.fg70} style={{ marginBottom: space.sm }}>
            {t}
          </Text>
        ))}
      </Section>

      <Section label="Your privacy">
        <Text variant="bodySmall" color={colors.fg70}>
          Everything is worked out on your phone. Video and sound are thrown away right after they are read. Only your numbers, your photo and your portrait are saved, and only on your phone. You can delete all of it in Settings.
        </Text>
      </Section>

      <Button label={canScan ? 'Begin scan' : 'See plans'} onPress={() => router.push(canScan ? '/scan' : '/paywall')} block style={{ marginTop: space.xxl }} />
      <Text variant="caption" color={colors.fg60} align="center" style={{ marginTop: space.lg }}>
        Not a medical device. For health concerns, speak with a clinician.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { marginTop: space.xl },
  step: { flexDirection: 'row', gap: space.lg, marginBottom: space.lg },
  disk: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.fg, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  meaning: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start', marginBottom: space.md },
  swatches: { flexDirection: 'row', width: 54, marginTop: 3 },
  swatch: { width: 18, height: 18 },
});
