import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { useAppActions } from '../features/store/AppStore';
import { AuraView } from '../render/fluid/AuraView';
import { placeholderMask } from '../render/fluid/FluidSim';
import { PREVIEW_PARAMS } from '../features/scan/previewParams';

/**
 * Three pages on the black stage, over one live preview. One statement each, set large; what
 * it is, how it is made, what it is for. Permissions are asked for when the scan starts.
 */
const PAGES = [
  { n: '01', title: 'Grounding you can see.', body: 'Affelion Aura translates your real heart rate, HRV, and voice into a living color portrait. It does not capture invisible light.' },
  { n: '02', title: 'One minute. Three readings.', body: 'Fingertip on the rear camera for your pulse and HRV. Front camera for your outline. Five seconds of your voice for pitch and variance. All of it stays on your phone.' },
  { n: '03', title: 'Breathe. Watch it settle.', body: 'A few minutes of paced breathing, and the portrait moves with your heart rhythm. Every colour follows a fixed rule from a measurement. Nothing is predicted or diagnosed. Not a medical device.' },
];

export default function Onboarding() {
  const { completeOnboarding } = useAppActions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = React.useState(0);
  const width = Dimensions.get('window').width;
  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const mask = React.useMemo(() => placeholderMask(), []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };
  const finish = () => completeOnboarding().then(() => router.replace('/home'));
  const next = () => {
    if (page < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
      setPage(page + 1);
    } else void finish();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuraView params={PREVIEW_PARAMS} mask={mask} quality="low" style={StyleSheet.absoluteFill} />
      <View style={styles.shade} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + space.lg }]}>
        <Text variant="eyebrow" color={colors.stageFg}>
          Affelion Aura
        </Text>
        <Text variant="eyebrow" color={colors.stageFg70}>
          {PAGES[page]!.n} / 03
        </Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{ marginHorizontal: -space.xl }}>
          {PAGES.map((p) => (
            <View key={p.n} style={{ width, paddingHorizontal: space.xl }}>
              <Text variant="hero" color={colors.stageFg} accessibilityRole="header" style={styles.statement}>
                {p.title}
              </Text>
              <Text variant="bodySmall" color={colors.stageFg70} style={{ marginTop: space.lg, maxWidth: 330 }}>
                {p.body}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.actions}>
          <Button label={page === PAGES.length - 1 ? 'Begin' : 'Continue'} onPaper={false} onPress={next} block />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={styles.dots}>
              {PAGES.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
              ))}
            </View>
            {page < PAGES.length - 1 ? <Button label="Skip" variant="ghost" onPaper={false} onPress={() => void finish()} /> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.stage },
  // Keeps the statement legible wherever the fluid drifts.
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.82) 55%, #000 100%)' },
  statement: { fontSize: 56, lineHeight: 54, letterSpacing: -2.1, maxWidth: 340 },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  bottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: 0 },
  actions: { marginTop: space.xl, gap: space.sm },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 20, height: 1, backgroundColor: colors.stageHairline },
  dotOn: { backgroundColor: colors.stageFg },
});
