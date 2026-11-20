import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StoryCard } from '../render/polaroid/StoryCard';
import { AuraView } from '../render/fluid/AuraView';
import { AURA_COLORS } from '../core/color/palette';
import { mapBiometricsToAura } from '../core/color/mapping';
import { useAppState } from '../features/store/AppStore';
import { getCachedMask } from '../features/scan/sessionCache';
import { formatDate } from '../ui/format';

/**
 * Review-build only: draws the 9:16 "Share my color" card for a chosen color, free or Pro, so it
 * can be checked and captured (scripts/story-previews.mjs). On a phone this route goes home.
 */
const READINGS = {
  magenta: { bpm: 84, rmssd: 62, variance: 0.62 },
  golden_yellow: { bpm: 76, rmssd: 45, variance: 0.7 },
  sky_blue: { bpm: 72, rmssd: 50, variance: 0.3 },
} as const;

export default function StoryPreview() {
  const { color = 'magenta', plan = 'free' } = useLocalSearchParams<{ color?: keyof typeof READINGS; plan?: 'free' | 'pro' }>();
  const { scans } = useAppState();
  const base = scans[0] ?? null;
  const aura = React.useMemo(() => {
    const r = READINGS[color] ?? READINGS.magenta;
    const heart = { bpm: r.bpm, rmssd: r.rmssd, sdnn: r.rmssd * 1.1, pnn50: 20, beatCount: 44, quality: 0.9, durationSec: 40 };
    const voice = { dominantPitchHz: 172, variance: r.variance, stability: 0.6, pitchVarianceSemitones: r.variance * 4, energyVariance: r.variance * 0.8, spectralCentroidHz: 1300, voicedRatio: 0.6, quality: 0.8, durationSec: 5 };
    return mapBiometricsToAura({ heart, voice });
  }, [color]);
  const mask = React.useMemo(() => (base ? getCachedMask(base.id) : null), [base]);
  if (Platform.OS !== 'web') return <Redirect href="/home" />;
  const c = AURA_COLORS[aura.primaryColorId];
  return (
    <View style={styles.root}>
      <StoryCard
        width={360}
        auraNode={<AuraView params={aura} mask={mask} stillUri={base?.stillUri ?? null} style={StyleSheet.absoluteFill} />}
        colorName={c.name}
        colorHex={c.hex}
        meaning={c.meaning}
        date={formatDate(Date.UTC(2026, 10, 20, 17))}
        showWordmark={plan !== 'pro'}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'flex-start', backgroundColor: '#808080' } });
