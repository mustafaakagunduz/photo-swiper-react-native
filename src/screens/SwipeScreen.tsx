import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMediaAssets } from '../hooks/useMediaAssets';
import { useSwipeSession } from '../hooks/useSwipeSession';
import SwipeCard from '../components/SwipeCard';
import ProgressHeader from '../components/ProgressHeader';
import ActionButtons from '../components/ActionButtons';
import GalleryPickerModal, {
  type PickerSelection,
} from '../components/GalleryPickerModal';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import type { Asset, SessionStats, SwipeDirection } from '../types';

interface SwipeScreenProps {
  onComplete: (stats: SessionStats) => void;
  onViewPending: (assets: Asset[], clearPending: () => void) => void;
}

export default function SwipeScreen({ onComplete, onViewPending }: SwipeScreenProps) {
  // Galeri seçici modal görünürlüğü
  const [pickerVisible, setPickerVisible] = useState(false);

  // Bu key değişince useSwipeSession state'ini sıfırlar
  const [sessionKey, setSessionKey] = useState('initial');

  const {
    assets,
    totalCount,
    isLoading,
    error,
    loadInitial,
    loadMore,
    hasMore,
    initWithData,
  } = useMediaAssets();

  const {
    currentIndex,
    stats,
    isComplete,
    handleSwipe,
    needsMoreAssets,
    pendingDeleteIds,
    pendingDeleteAssets,
    clearPending,
  } = useSwipeSession({
    assets,
    totalCount,
    hasMore,
    onLoadMore: loadMore,
    onComplete,
    resetKey: sessionKey,
  });

  // İlk yüklemede normal akış
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Kullanıcı galeriden bir başlangıç noktası seçti
  const handlePickerSelect = useCallback(
    ({ slicedAssets, endCursor, hasMore: pickerHasMore }: PickerSelection) => {
      setPickerVisible(false);
      // Önce verileri yükle, sonra session'ı sıfırla
      initWithData(slicedAssets, endCursor, pickerHasMore);
      setSessionKey(`pick-${Date.now()}`);
    },
    [initWithData],
  );

  // ActionButton'lardan programatik swipe
  const programmaticSwipe = useCallback(
    (direction: SwipeDirection) => {
      const currentAsset = assets[currentIndex];
      if (currentAsset) {
        handleSwipe(currentAsset, direction);
      }
    },
    [assets, currentIndex, handleSwipe],
  );

  // --- Render states ---

  if (isLoading && assets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Galeri yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitial}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (assets.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Galeri Boş</Text>
          <Text style={styles.emptyMessage}>
            Galerinizde görüntülenecek fotoğraf veya video bulunamadı.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentAsset: Asset | undefined = assets[currentIndex];
  const nextAsset: Asset | undefined = assets[currentIndex + 1];
  const isDone = isComplete || (!currentAsset && !hasMore);

  if (isDone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.doneIcon}>🎉</Text>
          <Text style={styles.doneTitle}>Tamamlandı!</Text>
          <Text style={styles.doneMessage}>Sonuçlar hesaplanıyor…</Text>
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress header */}
      <ProgressHeader
        current={currentIndex + 1}
        total={totalCount > 0 ? totalCount : assets.length}
        stats={stats}
      />

      {/* Başlangıç noktası seç butonu */}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.pickerButtonText}>📍 Başlangıç Noktası Seç</Text>
      </TouchableOpacity>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {/* Arka kart (bir sonraki, biraz küçük) */}
        {nextAsset && (
          <SwipeCard
            key={`back-${nextAsset.id}`}
            asset={nextAsset}
            isTop={false}
            onSwipe={handleSwipe}
            stackPosition={1}
          />
        )}

        {/* Ön kart (mevcut) */}
        {currentAsset && (
          <SwipeCard
            key={`top-${currentAsset.id}`}
            asset={currentAsset}
            isTop={true}
            onSwipe={handleSwipe}
            stackPosition={0}
          />
        )}

        {/* Daha fazla yüklenirken arka planda gösterge */}
        {needsMoreAssets && (
          <View style={styles.loadingMoreIndicator}>
            <ActivityIndicator color={COLORS.textTertiary} size="small" />
          </View>
        )}
      </View>

      {/* Bekleyen silme badge'i */}
      {pendingDeleteIds.length > 0 && (
        <TouchableOpacity
          style={styles.pendingBadge}
          onPress={() => onViewPending(pendingDeleteAssets, clearPending)}
          activeOpacity={0.8}
        >
          <Text style={styles.pendingBadgeText}>
            🗑️  {pendingDeleteIds.length} foto bekliyor — Gör & Sil
          </Text>
        </TouchableOpacity>
      )}

      {/* Action buttons */}
      <ActionButtons
        onDelete={() => programmaticSwipe('left')}
        onKeep={() => programmaticSwipe('right')}
        disabled={!currentAsset}
      />

      {/* Galeri seçici modal */}
      <GalleryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePickerSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.textPrimary,
  },
  errorMessage: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.textPrimary,
  },
  emptyMessage: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneIcon: {
    fontSize: 56,
  },
  doneTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.textPrimary,
  },
  doneMessage: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
  },
  loadingMoreIndicator: {
    position: 'absolute',
    bottom: -32,
  },
  pickerButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(10,132,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,132,255,0.35)',
    alignSelf: 'flex-start',
  },
  pickerButtonText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.accent,
    fontWeight: '600',
  },
  pendingBadge: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderWidth: 1,
    borderColor: COLORS.deleteBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pendingBadgeText: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.delete,
    fontWeight: '600',
  },
});
