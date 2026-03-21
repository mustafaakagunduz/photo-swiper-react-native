import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { SessionStats } from '../types';

interface ProgressHeaderProps {
  current: number;
  total: number;
  stats: SessionStats;
}

export default function ProgressHeader({
  current,
  total,
  stats,
}: ProgressHeaderProps) {
  const { t } = useLanguage();
  const progress = total > 0 ? current / total : 0;

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%` as any, { duration: 300 }),
  }));

  const remaining = Math.max(total - stats.kept - stats.deleted, 0);

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, barStyle]} />
      </View>

      <View style={styles.row}>
        <Text style={styles.counterText}>
          <Text style={styles.counterCurrent}>{Math.min(current, total)}</Text>
          <Text style={styles.counterSeparator}> / </Text>
          <Text style={styles.counterTotal}>{total}</Text>
        </Text>

        <View style={styles.chips}>
          <StatChip value={stats.kept} label={t.statKeptLabel} color={COLORS.keep} />
          <StatChip value={stats.deleted} label={t.statDeletedLabel} color={COLORS.delete} />
          <StatChip value={remaining} label={t.statRemainingLabel} color={COLORS.textSecondary} />
        </View>
      </View>
    </View>
  );
}

function StatChip({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    ...TYPOGRAPHY.subhead,
  },
  counterCurrent: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
  },
  counterSeparator: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  counterTotal: {
    color: COLORS.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    alignItems: 'center',
    gap: 1,
  },
  chipValue: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '700',
  },
  chipLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontSize: 10,
  },
});
