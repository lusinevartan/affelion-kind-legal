import * as React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Screen, Text } from '../ui/components';
import { colors, radius, space } from '../ui/theme';
import { PLANS, type PlanId } from '../services/entitlements';
import { useAppActions, useAppState } from '../features/store/AppStore';

/**
 * Soft paywall. Shown only after a real portrait exists. Plain pricing, obvious cancellation,
 * a visible "Not now", and restore. No countdowns, no fake scarcity.
 */
export default function Paywall() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { entitlement } = useAppState();
  const { purchase, restore, manageSubscriptions } = useAppActions();
  const [plan, setPlan] = React.useState<PlanId>('annual');
  const [busy, setBusy] = React.useState(false);

  const buy = async () => {
    try {
      setBusy(true);
      const e = await purchase(plan);
      if (e.isPro) {
        if (from) router.replace({ pathname: '/report/[id]', params: { id: from } });
        else router.back();
      }
    } catch (err) {
      Alert.alert('Purchase did not complete', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="eyebrow" color={colors.bone60}>
          AFFELION AURA PRO
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Not now" hitSlop={12} onPress={() => router.back()}>
          <Text variant="bodySmall" color={colors.bone70}>
            Not now
          </Text>
        </Pressable>
      </View>

      <Text variant="title" style={{ marginTop: space.xxl }}>
        Your portrait, fully explained.
      </Text>
      <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>
        The free portrait shows you the picture. Pro shows you the numbers behind every colour and how they change over time.
      </Text>

      <View style={{ marginTop: space.xl, gap: space.sm }}>
        {[
          'Unlimited scans',
          'Full breakdown: every region tied to its measurement',
          'History and trends across scans',
          'Sasha, your guide: grounded answers about your results',
          'Premium frame styles and clean, high-resolution exports',
        ].map((f) => (
          <View key={f} style={styles.feature}>
            <View style={styles.tick} />
            <Text variant="bodySmall" color={colors.bone}>
              {f}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: space.xxl, gap: space.md }}>
        {PLANS.map((p) => {
          const selected = p.id === plan;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${p.title}, ${p.price} ${p.period}${p.recommended ? ', best value' : ''}`}
              onPress={() => setPlan(p.id)}
              style={[styles.plan, selected && styles.planSelected]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
                  <Text variant="heading">{p.title}</Text>
                  {p.recommended ? (
                    <View style={styles.badge}>
                      <Text variant="caption" color={colors.black}>
                        Best value
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" color={colors.bone50} style={{ marginTop: 4 }}>
                  {p.note}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="heading">{p.price}</Text>
                <Text variant="caption" color={colors.bone50}>
                  {p.perMonth ?? p.period}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button label={entitlement.isPro ? 'You already have Pro' : `Continue with ${PLANS.find((p) => p.id === plan)?.title}`} onPress={() => void buy()} loading={busy} disabled={entitlement.isPro} block style={{ marginTop: space.xl }} />

      <Text variant="caption" color={colors.bone50} style={{ marginTop: space.lg }} align="center">
        Subscriptions renew automatically until cancelled. Cancel any time from your App Store or Google Play subscriptions; access continues to the end of the paid period.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xl, marginTop: space.lg }}>
        <Pressable accessibilityRole="button" onPress={() => void restore().then((e) => Alert.alert(e.isPro ? 'Restored' : 'Nothing to restore', e.isPro ? 'Pro is active.' : 'No previous purchase was found for this account.'))}>
          <Text variant="bodySmall" color={colors.bone70}>
            Restore purchase
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void manageSubscriptions()}>
          <Text variant="bodySmall" color={colors.bone70}>
            Manage or cancel
          </Text>
        </Pressable>
      </View>

      <Text variant="caption" color={colors.bone30} style={{ marginTop: space.xxl }} align="center">
        Development build: purchases are simulated locally and no payment is taken.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  tick: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.clay, marginTop: 8 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    minHeight: 72,
  },
  planSelected: { borderColor: colors.clay, backgroundColor: colors.surfaceRaised },
  badge: { backgroundColor: colors.clay, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
});
