import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import type { SessionStats } from '../types';

interface ResultScreenProps {
  result: SessionStats;
  onRestart: () => void;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}

type DeleteState = 'pending' | 'deleting' | 'done' | 'cancelled';

export default function ResultScreen({ result, onRestart, onBulkDelete }: ResultScreenProps) {
  const [deleteState, setDeleteState] = useState<DeleteState>(
    result.pendingDeleteIds.length > 0 ? 'pending' : 'done',
  );
  const [deletedCount, setDeletedCount] = useState(result.deleted);

  const headerOpacity = useSharedValue(0);
  const card1Scale = useSharedValue(0.7);
  const card2Scale = useSharedValue(0.7);
  const card3Scale = useSharedValue(0.7);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    card1Scale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 180 }));
    card2Scale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 180 }));
    card3Scale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 180 }));
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: 350 }));
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
  const finalKept = result.kept + (deleteState !== 'done' ? pendingCount : 0);
  const deleteRate =
    result.total > 0 ? Math.round((finalDeleted / result.total) * 100) : 0;

  const summary = getSummaryMessage(deleteRate, deleteState, pendingCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.celebration}>{summary.emoji}</Text>
          <Text style={styles.title}>Oturum Tamamlandı</Text>
          <Text style={styles.subtitle}>{summary.message}</Text>
        </Animated.View>

        {/* Bulk delete action — shown when there are pending deletes */}
        {(deleteState === 'pending' || deleteState === 'deleting' || deleteState === 'cancelled') && pendingCount > 0 && (
          <Animated.View style={[styles.bulkDeleteCard, card1Style]}>
            <Text style={styles.bulkDeleteTitle}>
              {pendingCount} fotoğraf silinmeyi bekliyor
            </Text>
            <Text style={styles.bulkDeleteSubtitle}>
              Tek bir onay ile hepsini sil — iOS tek seferlik izin ister.
            </Text>

            {deleteState === 'deleting' ? (
              <View style={styles.deletingRow}>
                <ActivityIndicator color={COLORS.delete} />
                <Text style={styles.deletingText}>Siliniyor…</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleBulkDelete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteButtonText}>
                    🗑️  {pendingCount} Fotoğrafı Sil
                  </Text>
                </TouchableOpacity>

                {deleteState === 'cancelled' && (
                  <Text style={styles.cancelledText}>
                    İptal edildi — fotoğraflar silinmedi.
                  </Text>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, styles.statCardDelete, card1Style]}>
            <Text style={styles.statIcon}>🗑️</Text>
            <Text style={[styles.statValue, { color: COLORS.delete }]}>
              {deleteState === 'done' ? finalDeleted : (deleteState === 'pending' || deleteState === 'cancelled') ? pendingCount : 0}
            </Text>
            <Text style={styles.statLabel}>
              {deleteState === 'done' ? 'Silindi' : 'Silinecek'}
            </Text>
            {deleteState === 'done' && (
              <Text style={styles.statSubLabel}>(Son Silinenler'e taşındı)</Text>
            )}
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardKeep, card2Style]}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: COLORS.keep }]}>
              {result.kept}
            </Text>
            <Text style={styles.statLabel}>Tutuldu</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardTotal, card3Style]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>
              {result.total}
            </Text>
            <Text style={styles.statLabel}>Toplam</Text>
            {deleteState === 'done' && (
              <Text style={styles.statSubLabel}>{deleteRate}% temizlendi</Text>
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
                  ? `Silindi (${finalDeleted})`
                  : `Silinecek (${pendingCount})`
              }
            />
            <LegendDot color={COLORS.keep} label={`Tutuldu (${result.kept})`} />
          </View>
        </Animated.View>

        {/* Restart button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={onRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.restartButtonText}>🔄  Yeni Oturum Başlat</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Silinen öğeler iOS "Son Silinenler" klasöründe{'\n'}30 gün boyunca saklanır.
          </Text>
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
  deleteRate: number,
  state: DeleteState,
  pendingCount: number,
): { emoji: string; message: string } {
  if (state === 'pending' || state === 'cancelled') {
    if (pendingCount === 0) return { emoji: '📱', message: 'Hiçbir şey işaretlemedin.' };
    return {
      emoji: '🗑️',
      message: `${pendingCount} fotoğraf silme için işaretlendi.`,
    };
  }
  if (deleteRate === 0) {
    return { emoji: '📱', message: 'Hiçbir şey silmedin, galerin aynen korundu.' };
  } else if (deleteRate < 10) {
    return { emoji: '🧹', message: 'Küçük bir temizlik yaptın!' };
  } else if (deleteRate < 30) {
    return { emoji: '✨', message: 'Galerini güzel bir şekilde temizledin.' };
  } else if (deleteRate < 60) {
    return { emoji: '🚀', message: 'Harika! Ciddi bir temizlik yaptın.' };
  } else {
    return { emoji: '🔥', message: 'Vay be! Galerin neredeyse sıfırlandı.' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  celebration: {
    fontSize: 64,
    marginBottom: 4,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bulkDeleteCard: {
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: 1,
    borderColor: COLORS.deleteBorder,
    borderRadius: 16,
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
    fontWeight: '700',
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
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
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderColor: 'rgba(10,132,255,0.3)',
  },
  statIcon: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  },
  summaryBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryBarFill: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
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
    width: 10,
    height: 10,
    borderRadius: 5,
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
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  restartButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '700',
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
