import * as React from 'react';
import { formatDate } from '../ui/format';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { useAppActions, useAppState } from '../features/store/AppStore';
import { PLANS } from '../services/entitlements';

export default function Settings() {
  const { entitlement, freeScansUsed } = useAppState();
  const { manageSubscriptions, restore, deleteAllData } = useAppActions();
  const plan = PLANS.find((p) => p.id === entitlement.plan);

  const confirmDelete = () => {
    Alert.alert('Delete all data?', 'Every scan, portrait and setting on this device will be removed. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => void deleteAllData() },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="bodySmall" color={colors.bone70}>
            Back
          </Text>
        </Pressable>
      </View>
      <Text variant="title" style={{ marginTop: space.xl }}>
        Settings
      </Text>

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
              ? `Renews or ends ${formatDate(entitlement.expiresAt)}. Cancel any time; access continues to the end of the period.`
              : 'Lifetime access. Nothing renews.'
            : `${Math.max(0, 3 - freeScansUsed)} of 3 free scans left.`}
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
          Camera frames and audio are processed on this device and discarded. Only the derived numbers, the portrait parameters and the still photo you see are stored, here on your phone. Portraits leave the device only when you save or share them. If the guide is connected to a server, it receives the numbers from a scan and your question, never images or audio.
        </Text>
        <Button label="Delete all data" variant="danger" onPress={confirmDelete} style={{ marginTop: space.lg }} />
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          ABOUT
        </Text>
        <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
          Affelion Aura translates measured heart rate, heart-rate variability and vocal frequency into colour and motion. It does not detect energy fields, make predictions or diagnose anything. It is not a medical device.
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
