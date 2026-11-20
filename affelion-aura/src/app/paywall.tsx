import * as React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Rule, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { PLANS, purchasesAreSimulated, purchasesAvailable, type PlanId } from '../services/entitlements';
import { useAppActions, useAppState } from '../features/store/AppStore';
import { PRIVACY_URL, TERMS_URL, openLink } from '../services/links';
import { trialAdjective, trialTerms } from '../services/trial';

/** What Pro adds, in plain words. Four lines, no more. */
const BENEFITS = [
  'Unlimited scans, any day you like.',
  'The full breakdown behind every color.',
  'Your history, so you can see how you change.',
  'Guided practice with Sasha, and clean exports.',
];

/**
 * Soft paywall, set like a price list on the table: no countdowns, no badges shouting, the
 * annual plan marked best value in words, cancel and restore in plain sight. Annual and
 * monthly are listed; the one-time purchase sits behind a quiet link so the choice stays
 * simple.
 */
export default function Paywall() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { entitlement, prices, pricesStatus } = useAppState();
  const { purchase, restore, manageSubscriptions, refreshPrices } = useAppActions();
  const pricesReady = pricesStatus === 'ready';
  const [plan, setPlan] = React.useState<PlanId>('annual');
  const [busy, setBusy] = React.useState(false);
  const [showOnce, setShowOnce] = React.useState(false);
  const listedPlans = React.useMemo(() => {
    const order: PlanId[] = showOnce ? ['annual', 'monthly', 'lifetime'] : ['annual', 'monthly'];
    // A store build lists only what the store actually offers, at the store's price.
    const simulated = purchasesAreSimulated();
    return order
      .map((id) => PLANS.find((p) => p.id === id))
      .filter((p): p is (typeof PLANS)[number] => !!p && (simulated || !!prices[p.id]));
  }, [showOnce, prices]);
  // A free trial appears only when the store offers one on the chosen plan to this person.
  const trial = prices[plan]?.trial ?? null;

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
        Keep your Aura.
      </Text>
      <View style={{ marginTop: space.lg, gap: space.sm, maxWidth: 340 }}>
        {BENEFITS.map((b) => (
          <View key={b} style={styles.benefit}>
            <Text variant="mono" color={colors.bone50}>
              +
            </Text>
            <Text variant="bodySmall" color={colors.bone70} style={{ flex: 1 }}>
              {b}
            </Text>
          </View>
        ))}
      </View>

      {!pricesReady ? (
        <View style={{ marginTop: space.xxl }} accessibilityLiveRegion="polite">
          <Rule />
          <Text variant="heading" style={{ marginTop: space.lg }}>
            {pricesStatus === 'loading' ? 'Loading prices…' : 'We could not load prices.'}
          </Text>
          {pricesStatus === 'unavailable' ? (
            <>
              <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
                Check your connection and try again. Nothing has been charged.
              </Text>
              <Button label="Try again" variant="secondary" onPress={() => void refreshPrices()} style={{ marginTop: space.lg, alignSelf: 'flex-start' }} />
            </>
          ) : null}
        </View>
      ) : (
      <View style={{ marginTop: space.xxl }}>
        <Rule />
        {listedPlans.map((listed) => {
          // The store's own price, in the person's currency, wins over the listed figure.
          const store = prices[listed.id];
          const p = store ? { ...listed, price: store.price, perMonth: store.perMonth ? `${store.perMonth} / month` : listed.id === 'annual' ? null : listed.perMonth } : listed;
          const selected = p.id === plan;
          const offer = store?.trial ?? null;
          return (
            <View key={p.id}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${p.title}, ${offer ? trialTerms(offer, p.price, p.period) : `${p.price} ${p.period}`}${p.recommended ? ', best value' : ''}`}
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
                      {offer ? trialTerms(offer, p.price, p.period) : p.note}
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
      )}

      {pricesReady && !showOnce ? (
        <Button label="Prefer to pay once?" variant="ghost" onPress={() => setShowOnce(true)} style={{ alignSelf: 'flex-start', marginTop: space.sm }} />
      ) : null}

      <Button
        label={entitlement.isPro ? 'You already have Pro' : !purchasesAvailable() ? 'Purchases are not available in this build' : trial ? `Start ${trialAdjective(trial)} free trial` : `Continue with ${PLANS.find((p) => p.id === plan)?.title}`}
        onPress={() => void buy()}
        loading={busy}
        disabled={entitlement.isPro || !purchasesAvailable() || !pricesReady}
        block
        style={{ marginTop: space.lg }}
      />

      <Text variant="caption" color={colors.bone50} style={{ marginTop: space.lg }}>
        Subscriptions renew until canceled. Cancel any time from your App Store or Google Play subscriptions; access continues to the end of the paid period.
      </Text>
      <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.sm }}>
        <Button label="Restore" variant="ghost" onPress={() => void restore().then((e) => Alert.alert(e.isPro ? 'Restored' : 'Nothing to restore', e.isPro ? 'Pro is active.' : 'No previous purchase was found for this account.'))} />
        <Button label="Manage or cancel" variant="ghost" onPress={() => void manageSubscriptions()} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.xl }}>
        <Button label="Terms of Use" variant="ghost" onPress={() => openLink(TERMS_URL)} />
        <Button label="Privacy Policy" variant="ghost" onPress={() => openLink(PRIVACY_URL)} />
      </View>
      {purchasesAreSimulated() ? (
        <Text variant="mono" color={colors.bone30} style={{ marginTop: space.xl }}>
          Test build · purchases simulated · no payment taken
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg, minHeight: 72 },
  benefit: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  planLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, flex: 1 },
});
