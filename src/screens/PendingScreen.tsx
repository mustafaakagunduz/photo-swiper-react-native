import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import type { Asset } from '../types';

const COLUMNS = 3;
const GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PendingScreenProps {
  assets: Asset[];
  onBack: () => void;
  onDeleted: (count: number) => void;
}

type DeleteState = 'idle' | 'deleting' | 'done';

export default function PendingScreen({ assets, onBack, onDeleted }: PendingScreenProps) {
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');

  // Kurtarılmak istenen asset ID'leri
  const [rescuedIds, setRescuedIds] = useState<Set<string>>(new Set());

  // Tamamlandıktan sonra gösterilecek sayılar
  const [finalDeletedCount, setFinalDeletedCount] = useState(0);
  const [finalRescuedCount, setFinalRescuedCount] = useState(0);

  // Fotoğrafa dokunulunca kurtarma durumunu toggle et
  const toggleRescue = useCallback((id: string) => {
    setRescuedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toDeleteAssets = assets.filter((a) => !rescuedIds.has(a.id));
  const deleteCount = toDeleteAssets.length;
  const rescueCount = rescuedIds.size;

  const handleDelete = useCallback(async () => {
    // Hepsi kurtarıldıysa direkt tamamla
    if (deleteCount === 0) {
      setFinalDeletedCount(0);
      setFinalRescuedCount(rescuedIds.size);
      onDeleted(0);
      setDeleteState('done');
      return;
    }

    setDeleteState('deleting');
    const ids = toDeleteAssets.map((a) => a.id);
    try {
      const success = await MediaLibrary.deleteAssetsAsync(ids);
      if (success) {
        setFinalDeletedCount(ids.length);
        setFinalRescuedCount(rescuedIds.size);
        onDeleted(ids.length);
        setDeleteState('done');
      } else {
        // Kullanıcı iOS onay dialogunu iptal etti
        setDeleteState('idle');
      }
    } catch {
      setDeleteState('idle');
    }
  }, [deleteCount, toDeleteAssets, rescuedIds, onDeleted]);

  const renderItem = useCallback(
    ({ item }: { item: Asset }) => {
      const isVideo = item.mediaType === 'video';
      const isRescued = rescuedIds.has(item.id);

      return (
        <TouchableOpacity
          style={[styles.thumb, isRescued && styles.thumbRescued]}
          onPress={() => toggleRescue(item.id)}
          activeOpacity={0.75}
        >
          {/* expo-image: ph:// URI'larını natively destekler (foto + video ilk kare) */}
          <Image source={{ uri: item.uri }} style={styles.thumbImg} contentFit="cover" />

          {/* Video süre badge'i */}
          {isVideo && item.duration != null && item.duration > 0 && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>{formatDuration(item.duration)}</Text>
            </View>
          )}

          {/* Kurtarıldı overlay */}
          {isRescued && (
            <View style={styles.rescuedOverlay}>
              <View style={styles.rescuedCheck}>
                <Text style={styles.rescuedCheckText}>✓</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [rescuedIds, toggleRescue],
  );

  // ---- Tamamlandı ekranı ----
  if (deleteState === 'done') {
    const allRescued = finalDeletedCount === 0 && finalRescuedCount > 0;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>{allRescued ? '💚' : '✅'}</Text>
          {finalDeletedCount > 0 && (
            <Text style={styles.doneText}>
              {finalDeletedCount} fotoğraf silindi.
            </Text>
          )}
          {finalRescuedCount > 0 && (
            <Text style={styles.doneRescuedText}>
              {finalRescuedCount} fotoğraf kurtarıldı.
            </Text>
          )}
          {finalDeletedCount === 0 && finalRescuedCount === 0 && (
            <Text style={styles.doneText}>Tamamlandı.</Text>
          )}
          <TouchableOpacity style={styles.doneButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>Swipe'a Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Ana ekran ----
  const allRescued = deleteCount === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{assets.length} Foto</Text>
          {rescueCount > 0 && (
            <View style={styles.rescueBadge}>
              <Text style={styles.rescueBadgeText}>{rescueCount} kurtarıldı</Text>
            </View>
          )}
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Hint */}
      <Text style={styles.hint}>
        {rescueCount === 0
          ? 'Korumak istediğin fotoğrafa dokun'
          : allRescued
          ? 'Hepsi kurtarıldı — aşağıdan onayla'
          : `${deleteCount} silinecek · ${rescueCount} kurtarılacak`}
      </Text>

      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {allRescued ? (
          // Hepsi kurtarıldı
          <TouchableOpacity
            style={styles.allRescuedButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.allRescuedButtonText}>
              💚  Hepsini Koru & Devam Et
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleteState === 'deleting' && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={deleteState === 'deleting'}
            activeOpacity={0.8}
          >
            {deleteState === 'deleting' ? (
              <View style={styles.deletingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.deleteButtonText}>Siliniyor…</Text>
              </View>
            ) : (
              <Text style={styles.deleteButtonText}>
                🗑️  {deleteCount} Fotoğrafı Sil
                {rescueCount > 0 ? `  ·  ${rescueCount} Koru` : ''}
              </Text>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.footerHint}>iOS tek seferlik onay isteyecek</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
  },
  rescueBadge: {
    backgroundColor: 'rgba(48,209,88,0.15)',
    borderWidth: 1,
    borderColor: COLORS.keepBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rescueBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.keep,
    fontWeight: '600',
  },

  // Hint
  hint: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Grid
  grid: {
    padding: GAP,
    paddingBottom: 130,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },

  // Thumbnails
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbRescued: {
    borderColor: COLORS.keep,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  // Video süre badge'i
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Kurtarıldı overlay
  rescuedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48,209,88,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescuedCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.keep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescuedCheckText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.delete,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '700',
  },
  deletingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  allRescuedButton: {
    backgroundColor: COLORS.keep,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  allRescuedButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '700',
  },
  footerHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },

  // Done screen
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  doneEmoji: {
    fontSize: 64,
    marginBottom: 4,
  },
  doneText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.textPrimary,
  },
  doneRescuedText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.keep,
  },
  doneButton: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '700',
  },
});
