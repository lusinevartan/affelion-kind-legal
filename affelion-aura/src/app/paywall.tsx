import * as React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Rule, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { PLANS, purchasesAreSimulated, type PlanId } from '../services/entitlements';
import { useAppActions, useAppState } from '../features/store/AppStore';

/**
 * Soft paywall, set like a price list on the table: no countdowns, no badges shouting, the
 * annual plan marked best value in words, cancel and restore in plain sight.
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
        <Text variant="eyebrow" color={colors.bone70}>
          Affelion Aura Pro
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Not now" hitSlop={12} onPress={() => router.back()}>
          <Text variant="eyebrow" color={colors.bone70}>
            Not now
          </Text>
        </Pressable>
      </View>

      <Text variant="display" style={{ marginTop: space.xxxl }}>
        The numbers behind every colour.
      </Text>
      <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.md, maxWidth: 330 }}>
        The free portrait shows you the picture. Pro shows the measurements, how they move across scans, unlimited practice, Sasha, premium frames and clean exports.
      </Text>

      <View style={{ marginTop: space.xxl }}>
        <Rule />
        {PLANS.map((p) => {
          const selected = p.id === plan;
          return (
            <View key={p.id}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${p.title}, ${p.price} ${p.period}${p.recommended ? ', best value' : ''}`}
                onPress={() => setPlan(p.id)}
                style={styles.plan}
              >
                <View style={styles.planLeft}>
                  <Text variant="mono" color={selected ? colors.bone : colors.bone50}>
                    {selected ? '●' : '○'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="heading">
                      {p.title}
                      {p.recommended ? <Text variant="mono" color={colors.fg60}>{'   best value'}</Text> : null}
                    </Text>
                    <Text variant="caption" color={colors.bone50} style={{ marginTop: 2 }}>
                      {p.note}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                    {p.price}
                  </Text>
                  <Text variant="mono" color={colors.bone50}>
                    {p.perMonth ?? p.period}
                  </Text>
                </View>
              </Pressable>
              <Rule />
            </View>
          );
        })}
      </View>

      <Button label={entitlement.isPro ? 'You already have Pro' : `Continue with ${PLANS.find((p) => p.id === plan)?.title}`} onPress={() => void buy()} loading={busy} disabled={entitlement.isPro} block style={{ marginTop: space.xl }} />

      <Text variant="caption" color={colors.bone50} style={{ marginTop: space.lg }}>
        Subscriptions renew until cancelled. Cancel any time from your App Store or Google Play subscriptions; access continues to the end of the paid period.
      </Text>
      <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.sm }}>
        <Button label="Restore" variant="ghost" onPress={() => void restore().then((e) => Alert.alert(e.isPro ? 'Restored' : 'Nothing to restore', e.isPro ? 'Pro is active.' : 'No previous purchase was found for this account.'))} />
        <Button label="Manage or cancel" variant="ghost" onPress={() => void manageSubscriptions()} />
      </View>
      {purchasesAreSimulated() ? (
        <Text variant="mono" color={colors.bone30} style={{ marginTop: space.xl }}>
          dev build · purchases simulated · no payment taken
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg, minHeight: 72 },
  planLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, flex: 1 },
});
