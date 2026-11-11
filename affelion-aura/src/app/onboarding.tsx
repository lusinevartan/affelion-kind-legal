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
 * Three pages over one live preview. One line each, no explaining beyond what is honest and
 * necessary. Permissions are asked for when the scan starts.
 */
const PAGES = [
  { n: '01', title: 'A portrait of your pulse and voice.', body: 'Affelion Aura translates your real heart rate, HRV, and voice into a living color portrait. It does not capture invisible light.' },
  { n: '02', title: 'One minute. Three readings.', body: 'Fingertip on the rear camera for your pulse and HRV. Front camera for your outline. Five seconds of your voice for pitch and variance. All of it stays on your phone.' },
  { n: '03', title: 'Same numbers, same portrait.', body: 'Every colour follows a fixed rule from a measurement. Nothing is predicted or diagnosed. Not a medical device.' },
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
      <StatusBar style="dark" />
      <AuraView params={PREVIEW_PARAMS} mask={mask} quality="low" paper style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + space.lg }]}>
        <Text variant="eyebrow" color={colors.bone70}>
          Affelion Aura
        </Text>
        <Text variant="eyebrow" color={colors.bone50}>
          {PAGES[page]!.n} / 03
        </Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{ marginHorizontal: -space.xl }}>
          {PAGES.map((p) => (
            <View key={p.n} style={{ width, paddingHorizontal: space.xl }}>
              <Text variant="display">{p.title}</Text>
              <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.md, maxWidth: 330 }}>
                {p.body}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.actions}>
          <Button label={page === PAGES.length - 1 ? 'Begin' : 'Continue'} onPress={next} block />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={styles.dots}>
              {PAGES.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
              ))}
            </View>
            {page < PAGES.length - 1 ? <Button label="Skip" variant="ghost" onPress={() => void finish()} /> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  bottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: 0 },
  actions: { marginTop: space.xl, gap: space.sm },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 20, height: 1, backgroundColor: colors.hairlineStrong },
  dotOn: { backgroundColor: colors.fg },
});
