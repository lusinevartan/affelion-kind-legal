import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Button, Card, Screen, Text } from '../ui/components';
import { colors, radius, space } from '../ui/theme';
import { useAppState } from '../features/store/AppStore';
import { AURA_COLORS } from '../core/color/palette';
import { scanInsight } from '../core/insight/baseline';

export default function Home() {
  const { scans, entitlement, canScan, freeScansLeft: left, practices } = useAppState();
  const latest = scans[0] ?? null;
  const insight = latest ? scanInsight(latest, scans) : null;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 2 }}>
          AFFELION AURA
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={12} onPress={() => router.push('/settings')}>
          <Text variant="bodySmall" color={colors.bone70}>
            Settings
          </Text>
        </Pressable>
      </View>

      <Text variant="display" style={{ marginTop: space.xxl }}>
        {latest ? 'Welcome back.' : 'Your first portrait.'}
      </Text>
      <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>
        {latest
          ? 'Scan again to see how your pulse, variability and voice have shifted.'
          : 'About a minute: your face, your fingertip on the rear camera, and a few words.'}
      </Text>

      <View style={{ marginTop: space.xxl, gap: space.md }}>
        <Button
          label={canScan ? 'Begin scan' : 'Unlock unlimited scans'}
          onPress={() => router.push(canScan ? '/scan' : '/paywall')}
          block
          hint={canScan ? 'Starts the one-minute scan' : 'Opens plans'}
        />
        {!entitlement.isPro ? (
          <Text variant="caption" color={colors.bone50} align="center">
            {left > 0 ? `${left} of 3 free scans left` : 'Free scans used. Pro is unlimited.'}
          </Text>
        ) : (
          <Text variant="caption" color={colors.bone50} align="center">
            Pro · unlimited scans
          </Text>
        )}
      </View>

      {latest ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your latest portrait"
          onPress={() => router.push({ pathname: '/portrait/[id]', params: { id: latest.id } })}
          style={{ marginTop: space.xxxl }}
        >
          <Card style={styles.latest}>
            <View style={styles.thumbWrap}>
              {latest.portraitUri || latest.stillUri ? (
                <Image source={{ uri: latest.portraitUri ?? latest.stillUri ?? undefined }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: AURA_COLORS[latest.aura.primaryColorId].hex }]} />
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="caption" color={colors.bone50}>
                LATEST · {new Date(latest.createdAt).toLocaleDateString()}
              </Text>
              <Text variant="heading">{AURA_COLORS[latest.aura.primaryColorId].name} centre</Text>
              <Text variant="bodySmall" color={colors.bone70} numberOfLines={2}>
                {latest.aura.summary}
              </Text>
            </View>
          </Card>
        </Pressable>
      ) : null}

      {latest ? (
        <Card style={{ marginTop: space.lg }}>
          <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>
            PRACTICE
          </Text>
          <Text variant="heading" style={{ marginTop: space.sm }}>
            Steady your rhythm
          </Text>
          <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: 4 }}>
            Three minutes of paced breathing while the portrait follows your heart rhythm live. {practices.length > 0 ? `${practices.length} session${practices.length === 1 ? '' : 's'} so far.` : 'Your first session is free.'}
          </Text>
          {insight?.baseline ? (
            <Text variant="caption" color={colors.bone50} style={{ marginTop: space.sm }}>
              {insight.sentence}
            </Text>
          ) : null}
          <Button label="Begin practice" variant="secondary" onPress={() => router.push({ pathname: '/practice', params: { scanId: latest.id } })} block style={{ marginTop: space.lg }} />
        </Card>
      ) : null}

      {scans.length > 0 ? (
        <Button label="History and trends" variant="secondary" onPress={() => router.push('/history')} block style={{ marginTop: space.lg }} />
      ) : null}

      <Text variant="caption" color={colors.bone30} style={{ marginTop: space.xxxl }} align="center">
        Not a medical device. Colours are a translation of measured pulse and voice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latest: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  thumbWrap: { width: 72, height: 90, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.polaroidPaper, padding: 4 },
  thumb: { flex: 1, borderRadius: 2 },
});
