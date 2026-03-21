import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { SessionStats } from '../types';

interface ResultScreenProps {
  result: SessionStats;
  onRestart: () => void;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}

type DeleteState = 'pending' | 'deleting' | 'done' | 'cancelled';

export default function ResultScreen({ result, onRestart, onBulkDelete }: ResultScreenProps) {
  const { t } = useLanguage();
  const [deleteState, setDeleteState] = useState<DeleteState>(
    result.pendingDeleteIds.length > 0 ? 'pending' : 'done',
  );
  const [deletedCount, setDeletedCount] = useState(result.deleted);

  const headerOpacity = useSharedValue(0);
  const card1Scale = useSharedValue(0.85);
  const card2Scale = useSharedValue(0.85);
  const card3Scale = useSharedValue(0.85);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 350 });
    card1Scale.value = withDelay(80, withSpring(1, { damping: 18, stiffness: 200 }));
    card2Scale.value = withDelay(160, withSpring(1, { damping: 18, stiffness: 200 }));
    card3Scale.value = withDelay(240, withSpring(1, { damping: 18, stiffness: 200 }));
    buttonOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
  }, [headerOpacity, card1Scale, card2Scale, card3Scale, buttonOpacity]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const card1Style = useAnimatedStyle(() => ({ transform: [{ scale: card1Scale.value }] }));
  const card2Style = useAnimatedStyle(() => ({ transform: [{ scale: card2Scale.value }] }));
  const card3Style = useAnimatedStyle(() => ({ transform: [{ scale: card3Scale.value }] }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  const handleBulkDelete = useCallback(async () => {
    setDeleteState('deleting');
    const success = await onBulkDelete(result.pendingDeleteIds);
    if (success) {
      setDeletedCount(result.pendingDeleteIds.length);
      setDeleteState('done');
    } else {
      setDeleteState('cancelled');
    }
  }, [onBulkDelete, result.pendingDeleteIds]);

  const pendingCount = result.pendingDeleteIds.length;
  const finalDeleted = deleteState === 'done' ? deletedCount : 0;
  const deleteRate =
    result.total > 0 ? Math.round((finalDeleted / result.total) * 100) : 0;

  const summaryMessage = getSummaryMessage(t, deleteRate, deleteState, pendingCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.title}>{t.sessionCompleted}</Text>
          <Text style={styles.subtitle}>{summaryMessage}</Text>
        </Animated.View>

        {/* Bulk delete action */}
        {(deleteState === 'pending' || deleteState === 'deleting' || deleteState === 'cancelled') && pendingCount > 0 && (
          <Animated.View style={[styles.bulkDeleteCard, card1Style]}>
            <Text style={styles.bulkDeleteTitle}>
              {t.pendingDeleteTitle(pendingCount)}
            </Text>
            <Text style={styles.bulkDeleteSubtitle}>
              {t.iosSingleConfirm}
            </Text>

            {deleteState === 'deleting' ? (
              <View style={styles.deletingRow}>
                <ActivityIndicator color={COLORS.delete} />
                <Text style={styles.deletingText}>{t.deletingLabel}</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleBulkDelete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteButtonText}>
                    {t.deleteNPhotos(pendingCount)}
                  </Text>
                </TouchableOpacity>

                {deleteState === 'cancelled' && (
                  <Text style={styles.cancelledText}>{t.cancelledMsg}</Text>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, styles.statCardDelete, card1Style]}>
            <Text style={[styles.statValue, { color: COLORS.delete }]}>
              {deleteState === 'done' ? finalDeleted : (deleteState === 'pending' || deleteState === 'cancelled') ? pendingCount : 0}
            </Text>
            <Text style={styles.statLabel}>
              {deleteState === 'done' ? t.statDeleted : t.statToDelete}
            </Text>
            {deleteState === 'done' && (
              <Text style={styles.statSubLabel}>{t.movedToRecent}</Text>
            )}
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardKeep, card2Style]}>
            <Text style={[styles.statValue, { color: COLORS.keep }]}>
              {result.kept}
            </Text>
            <Text style={styles.statLabel}>{t.statKept}</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardTotal, card3Style]}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>
              {result.total}
            </Text>
            <Text style={styles.statLabel}>{t.statTotal}</Text>
            {deleteState === 'done' && (
              <Text style={styles.statSubLabel}>{t.cleanedPercent(deleteRate)}</Text>
            )}
          </Animated.View>
        </View>

        {/* Summary bar */}
        <Animated.View style={[styles.summaryBar, card3Style]}>
          <View style={styles.summaryBarFill}>
            {(deleteState === 'done' ? finalDeleted : pendingCount) > 0 && (
              <View
                style={[
                  styles.summaryBarSegment,
                  {
                    flex: deleteState === 'done' ? finalDeleted : pendingCount,
                    backgroundColor: COLORS.delete,
                    opacity: deleteState === 'done' ? 1 : 0.5,
                  },
                ]}
              />
            )}
            {result.kept > 0 && (
              <View
                style={[
                  styles.summaryBarSegment,
                  {
                    flex: result.kept,
                    backgroundColor: COLORS.keep,
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.summaryBarLegend}>
            <LegendDot
              color={COLORS.delete}
              label={
                deleteState === 'done'
                  ? `${t.statDeleted} (${finalDeleted})`
                  : `${t.statToDelete} (${pendingCount})`
              }
            />
            <LegendDot color={COLORS.keep} label={`${t.statKept} (${result.kept})`} />
          </View>
        </Animated.View>

        {/* Restart button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={onRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.restartButtonText}>{t.newSession}</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>{t.recentFilesNote}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendDot}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function getSummaryMessage(
  t: ReturnType<typeof useLanguage>['t'],
  deleteRate: number,
  state: DeleteState,
  pendingCount: number,
): string {
  if (state === 'pending' || state === 'cancelled') {
    if (pendingCount === 0) return t.summaryNone;
    return t.summaryPending(pendingCount);
  }
  if (deleteRate === 0) return t.summaryZero;
  if (deleteRate < 10) return t.summarySmall;
  if (deleteRate < 30) return t.summaryMedium;
  if (deleteRate < 60) return t.summaryLarge;
  return t.summaryMax;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  bulkDeleteCard: {
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.deleteBorder,
    borderRadius: 14,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  bulkDeleteTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bulkDeleteSubtitle: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: COLORS.delete,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  deleteButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '600',
  },
  deletingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deletingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  cancelledText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCardDelete: {
    backgroundColor: COLORS.deleteLight,
    borderColor: COLORS.deleteBorder,
  },
  statCardKeep: {
    backgroundColor: COLORS.keepLight,
    borderColor: COLORS.keepBorder,
  },
  statCardTotal: {
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderColor: 'rgba(10,132,255,0.25)',
  },
  statValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  statLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  statSubLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  summaryBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  summaryBarFill: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  summaryBarSegment: {
    height: '100%',
  },
  summaryBarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    gap: 16,
    alignItems: 'center',
  },
  restartButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  restartButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '600',
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
