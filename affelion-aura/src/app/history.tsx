import * as React from 'react';
import { formatDate, formatDateTime } from '../ui/format';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Button, Card, Screen, Text } from '../ui/components';
import { colors, radius, space } from '../ui/theme';
import { useAppState } from '../features/store/AppStore';
import { AURA_COLORS } from '../core/color/palette';
import { Sparkline } from '../features/history/Sparkline';

/** History and trends. Pro feature; free users see their scans but the trend view asks to upgrade. */
export default function History() {
  const { scans, entitlement, practices } = useAppState();
  const chronological = [...scans].reverse();
  const bpm = chronological.map((s) => s.heart.bpm);
  const rmssd = chronological.map((s) => s.heart.rmssd);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="bodySmall" color={colors.bone70}>
            Back
          </Text>
        </Pressable>
        <Text variant="caption" color={colors.bone50}>
          {scans.length} {scans.length === 1 ? 'scan' : 'scans'}
        </Text>
      </View>
      <Text variant="title" style={{ marginTop: space.xl }}>
        History
      </Text>

      {entitlement.isPro ? (
        scans.length >= 2 ? (
          <Card style={{ marginTop: space.xl, gap: space.lg }}>
            <View>
              <Text variant="eyebrow" color={colors.bone60}>
                HEART RATE · BPM
              </Text>
              <Sparkline values={bpm} tint={colors.clay} />
            </View>
            <View>
              <Text variant="eyebrow" color={colors.bone60}>
                VARIABILITY · RMSSD MS
              </Text>
              <Sparkline values={rmssd} tint={AURA_COLORS.teal.hex} />
            </View>
            <Text variant="caption" color={colors.bone50}>
              Trends compare scans taken under similar conditions best: same time of day, seated, after a minute of rest.
            </Text>
          </Card>
        ) : (
          <Text variant="bodySmall" color={colors.bone50} style={{ marginTop: space.lg }}>
            Trends appear after your second scan.
          </Text>
        )
      ) : (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="heading">Trends are part of Pro</Text>
          <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
            See how your pulse and variability move across scans.
          </Text>
          <Button label="See plans" variant="secondary" onPress={() => router.push('/paywall')} style={{ marginTop: space.lg }} />
        </Card>
      )}

      {practices.length > 0 ? (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="eyebrow" color={colors.bone60}>
            PRACTICE SESSIONS
          </Text>
          {practices.slice(0, 8).map((p) => (
            <View key={p.id} style={styles.practiceRow} accessible accessibilityLabel={`Practice on ${formatDate(p.createdAt)}, coherence ${Math.round(p.before.coherence * 100)} to ${Math.round(p.after.coherence * 100)}`}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall">{formatDate(p.createdAt)} · {Math.round(p.durationSec / 60)} min at {p.breathsPerMinute}/min</Text>
                <Text variant="caption" color={colors.bone50}>
                  HRV {Math.round(p.before.rmssd)} → {Math.round(p.after.rmssd)} ms · {Math.round(p.highCoherenceSec)} s at high coherence
                </Text>
              </View>
              <Text variant="heading">{Math.round(p.before.coherence * 100)} → {Math.round(p.after.coherence * 100)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ marginTop: space.xl, gap: space.md }}>
        {scans.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`Portrait from ${formatDateTime(s.createdAt)}, ${AURA_COLORS[s.aura.primaryColorId].name}`}
            onPress={() => router.push({ pathname: '/portrait/[id]', params: { id: s.id } })}
          >
            <Card style={styles.row}>
              <View style={styles.thumbWrap}>
                {s.portraitUri || s.stillUri ? (
                  <Image source={{ uri: s.portraitUri ?? s.stillUri ?? undefined }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: AURA_COLORS[s.aura.primaryColorId].hex }]} />
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" color={colors.bone50}>
                  {formatDateTime(s.createdAt)}
                </Text>
                <Text variant="heading">{AURA_COLORS[s.aura.primaryColorId].name}</Text>
                <Text variant="caption" color={colors.bone70}>
                  {s.heart.bpm.toFixed(0)} bpm · RMSSD {s.heart.rmssd.toFixed(0)} ms
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  thumbWrap: { width: 56, height: 70, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.polaroidPaper, padding: 3 },
  thumb: { flex: 1, borderRadius: 2 },
  practiceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
});
