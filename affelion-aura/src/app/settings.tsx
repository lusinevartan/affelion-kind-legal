import * as React from 'react';
import { formatDate } from '../ui/format';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { useAppActions, useAppState } from '../features/store/AppStore';
import { PLANS, freeScanStatus } from '../services/entitlements';
import { useNow } from '../ui/useNow';
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL, openLink } from '../services/links';

export default function Settings() {
  const { entitlement, nextFreeScanAt } = useAppState();
  const now = useNow();
  const { manageSubscriptions, restore, deleteAllData } = useAppActions();
  const plan = PLANS.find((p) => p.id === entitlement.plan);

  const confirmDelete = () => {
    Alert.alert('Delete all data?', 'Every scan, photo, portrait, practice session and setting on this device will be removed. This cannot be undone. Your plan and your free-scan week are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => void deleteAllData() },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="eyebrow" color={colors.bone70}>
            ← Back
          </Text>
        </Pressable>
      </View>
      <Text variant="display" style={{ marginTop: space.xl }}>
        Settings
      </Text>
      <Button label="How it works" variant="ghost" onPress={() => router.push('/how')} style={{ marginTop: space.md }} />

      <Card style={{ marginTop: space.xl }}>
        <Text variant="eyebrow" color={colors.bone60}>
          PLAN
        </Text>
        <Text variant="heading" style={{ marginTop: space.sm }}>
          {entitlement.isPro ? `Pro · ${plan?.title ?? ''}` : 'Free'}
        </Text>
        <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: 4 }}>
          {entitlement.isPro
            ? entitlement.expiresAt
              ? `Renews or ends ${formatDate(entitlement.expiresAt)}. You can cancel any time and keep Pro until that date.`
              : 'Lifetime access. Nothing renews.'
            : `${freeScanStatus(nextFreeScanAt, now)}. One free scan a week, or go Pro for unlimited.`}
        </Text>
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          {entitlement.isPro ? (
            <Button label="Manage or cancel" variant="secondary" onPress={() => void manageSubscriptions()} style={{ flex: 1 }} />
          ) : (
            <Button label="See plans" onPress={() => router.push('/paywall')} style={{ flex: 1 }} />
          )}
          <Button label="Restore" variant="ghost" onPress={() => void restore()} />
        </View>
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          PRIVACY
        </Text>
        <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
          Camera frames and sound are handled on this phone and then thrown away. Only the numbers from your scan, the settings that draw your portrait, and the photo you see with its outline are saved, here on your phone. Portraits leave the device only when you save or share them. If the guide is connected to a server, it receives the numbers from a scan and your question, never images or audio.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xl, marginTop: space.sm }}>
          <Button label="Privacy Policy" variant="ghost" onPress={() => openLink(PRIVACY_URL)} />
          <Button label="Terms of Use" variant="ghost" onPress={() => openLink(TERMS_URL)} />
          <Button label="Get help" variant="ghost" onPress={() => openLink(SUPPORT_URL)} />
        </View>
        <Button label="Delete all data" variant="danger" onPress={confirmDelete} style={{ marginTop: space.lg }} />
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          ABOUT
        </Text>
        <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
          Affelion Aura turns your heart rate, how much it varies, and the pitch of your voice into color and motion. It does not detect energy fields, make predictions or diagnose anything. It is not a medical device. Sasha, the guide, is an AI assistant that answers only from the color knowledge base and your own measurements. Her portrait is a generated image, not a photograph of a real person.
        </Text>
        <Text variant="caption" color={colors.bone30} style={{ marginTop: space.md }}>
          Version 1.0.0
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
