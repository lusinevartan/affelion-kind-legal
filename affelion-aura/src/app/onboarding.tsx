import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, Text } from '../ui/components';
import { colors, radius, space } from '../ui/theme';
import { useAppActions } from '../features/store/AppStore';

/**
 * Three honest screens. What the app does, what it measures, what it does not claim.
 * Progressive disclosure: permissions are explained here and requested only when the scan starts.
 */
const PAGES = [
  {
    eyebrow: 'What this is',
    title: 'A portrait of your pulse and voice, painted in colour.',
    body: 'Affelion Aura translates your real heart rate, HRV, and voice into a living color portrait. It does not capture invisible light.',
  },
  {
    eyebrow: 'What it measures',
    title: 'Three signals, about a minute.',
    body: 'Your fingertip on the rear camera with the flash on reads your pulse and HRV. The front camera maps your outline. Five seconds of your voice are analysed for pitch, variance and stability. Everything is processed on your phone. No audio or video is stored or uploaded.',
  },
  {
    eyebrow: 'What it is not',
    title: 'Not a reading of anything invisible.',
    body: 'The colours are a deterministic translation of physical measurements. The same numbers always produce the same portrait. This is not a medical device and it does not detect energy, predict anything, or diagnose anything.',
  },
];

export default function Onboarding() {
  const { completeOnboarding } = useAppActions();
  const [page, setPage] = React.useState(0);
  const width = Dimensions.get('window').width;
  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  const next = async () => {
    if (page < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
      setPage(page + 1);
      return;
    }
    await completeOnboarding();
    router.replace('/home');
  };

  return (
    <Screen padded={false} bottomInset={0}>
      <View style={styles.brand}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 2 }}>
          AFFELION AURA
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {PAGES.map((p) => (
          <View key={p.eyebrow} style={[styles.page, { width }]}>
            <View style={styles.art}>
              <View style={[styles.orb, { backgroundColor: p.eyebrow === 'What this is' ? '#1FB5A3' : p.eyebrow === 'What it measures' ? '#F0781E' : '#4A4BC0' }]} />
            </View>
            <Text variant="caption" color={colors.brass} style={{ letterSpacing: 1.5 }}>
              {p.eyebrow.toUpperCase()}
            </Text>
            <Text variant="title" style={{ marginTop: space.sm }}>
              {p.title}
            </Text>
            <Text variant="body" color={colors.bone70} style={{ marginTop: space.lg }}>
              {p.body}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={page === PAGES.length - 1 ? 'Begin' : 'Continue'} onPress={() => void next()} block />
        {page < PAGES.length - 1 ? (
          <Button
            label="Skip"
            variant="ghost"
            onPress={() => {
              void completeOnboarding().then(() => router.replace('/home'));
            }}
            block
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { paddingHorizontal: space.xl, paddingBottom: space.lg },
  page: { paddingHorizontal: space.xl, paddingTop: space.lg },
  art: { height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: space.xxl },
  orb: { width: 150, height: 150, borderRadius: 75, opacity: 0.85, shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 40 },
  footer: { paddingHorizontal: space.xl, gap: space.sm, paddingTop: space.lg },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: space.md },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.hairlineStrong },
  dotActive: { backgroundColor: colors.bone, width: 18 },
});
