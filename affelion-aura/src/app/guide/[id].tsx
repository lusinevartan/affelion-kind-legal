import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen, Text } from '../../ui/components';
import { colors, radius, space } from '../../ui/theme';
import { useAppState } from '../../features/store/AppStore';
import { askGuide, GUIDE_NAME, type GuideMessage } from '../../services/ai/guide';

const SUGGESTIONS = ['Why is my centre this colour?', 'What does the halo mean?', 'How did my voice change the portrait?', 'What would move this toward teal?'];

/** Sasha, the guide: grounded answers about this scan only. */
export default function GuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement } = useAppState();
  const record = scans.find((s) => s.id === id) ?? null;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = React.useState<GuideMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);

  React.useEffect(() => {
    if (!entitlement.isPro && record) router.replace({ pathname: '/paywall', params: { from: record.id } });
  }, [entitlement.isPro, record]);

  if (!record) {
    return (
      <Screen>
        <Text variant="title">Scan not found</Text>
        <Button label="Home" variant="secondary" onPress={() => router.replace('/home')} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const next: GuideMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const reply = await askGuide(q, record, messages);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.night }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="eyebrow" color={colors.bone70}>
            ← Back
          </Text>
        </Pressable>
        <Text variant="eyebrow" color={colors.bone50}>
          {GUIDE_NAME}
        </Text>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
        <View style={styles.assistant}>
          <Text variant="bodySmall" color={colors.bone70}>
            {`I'm ${GUIDE_NAME}, your guide. I can explain this portrait using only what was measured: a pulse of ${record.heart.bpm.toFixed(0)} bpm, variability of ${record.heart.rmssd.toFixed(0)} ms, and your voice sample. I won't guess about anything that wasn't measured, and I'm not a substitute for a clinician.`}
          </Text>
        </View>
        {messages.map((m, i) => (
          <View key={i} style={m.role === 'user' ? styles.user : styles.assistant}>
            <Text variant="bodySmall" color={m.role === 'user' ? colors.night : colors.bone}>
              {m.content}
            </Text>
          </View>
        ))}
        {busy ? (
          <View style={styles.assistant}>
            <Text variant="bodySmall" color={colors.bone50}>
              Thinking…
            </Text>
          </View>
        ) : null}
        {messages.length === 0 ? (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} accessibilityRole="button" onPress={() => void send(s)} style={styles.chip}>
                <Text variant="bodySmall">{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: insets.bottom + space.md }]}>
        <TextInput
          accessibilityLabel={`Ask ${GUIDE_NAME} about this portrait`}
          value={input}
          onChangeText={setInput}
          placeholder={`Ask ${GUIDE_NAME} about this portrait`}
          placeholderTextColor={colors.bone30}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => void send(input)}
          editable={!busy}
        />
        <Button label="Send" onPress={() => void send(input)} disabled={!input.trim() || busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xl, paddingBottom: space.md },
  thread: { paddingHorizontal: space.xl, gap: space.md, paddingBottom: space.xl },
  assistant: { alignSelf: 'flex-start', maxWidth: '88%', backgroundColor: colors.ink2, padding: space.lg, borderRadius: radius.lg },
  user: { alignSelf: 'flex-end', maxWidth: '88%', backgroundColor: colors.bone, padding: space.lg, borderRadius: radius.lg },
  suggestions: { gap: space.sm, marginTop: space.md },
  chip: { paddingVertical: space.md, paddingHorizontal: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineStrong, alignSelf: 'flex-start' },
  composer: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, alignItems: 'center' },
  input: { flex: 1, minHeight: 52, color: colors.bone, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hairlineStrong, paddingHorizontal: space.lg, fontSize: 16 },
});
