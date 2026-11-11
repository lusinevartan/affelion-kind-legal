import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { Text } from './Text';

/**
 * A measurement, labelled like a figure in an archive: "FIG. 02  HRV" above a mono value.
 * Used on the dark table and on the paper sheet.
 */
export function Figure({ n, label, value, unit, note, onPaper = true, large = false }: { n?: string; label: string; value: string; unit?: string; note?: string; onPaper?: boolean; large?: boolean }) {
  const fg = onPaper ? colors.fg : colors.stageFg;
  const dim = onPaper ? colors.fg50 : colors.stageFg50;
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${note ? `. ${note}` : ''}`}>
      <Text variant="eyebrow" color={dim}>
        {n ? `Fig. ${n}  ` : ''}
        {label}
      </Text>
      <View style={styles.row}>
        <Text variant={large ? 'display' : 'title'} color={fg} style={large ? undefined : { fontSize: 26, lineHeight: 28 }}>
          {value}
        </Text>
        {unit ? (
          <Text variant="mono" color={dim} style={{ marginBottom: 4 }}>
            {unit}
          </Text>
        ) : null}
      </View>
      {note ? (
        <Text variant="caption" color={dim}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

/** Hairline rule. */
export function Rule({ onPaper = true, style }: { onPaper?: boolean; style?: object }) {
  return <View style={[styles.rule, { backgroundColor: onPaper ? colors.hairline : colors.stageHairline }, style]} />;
}

const styles = StyleSheet.create({
  wrap: { gap: 4, paddingVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  rule: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
