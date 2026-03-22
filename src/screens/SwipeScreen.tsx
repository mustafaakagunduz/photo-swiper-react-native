import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { useMediaAssets } from '../hooks/useMediaAssets';
import { useSwipeSession } from '../hooks/useSwipeSession';
import SwipeCard, { ExitCard } from '../components/SwipeCard';
import ProgressHeader from '../components/ProgressHeader';
import ActionButtons from '../components/ActionButtons';
import GalleryPickerModal, {
  type PickerSelection,
} from '../components/GalleryPickerModal';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { Asset, SessionStats, SwipeDirection } from '../types';

interface SwipeScreenProps {
  onComplete: (stats: SessionStats) => void;
  onViewPending: (assets: Asset[], clearPending: () => void) => void;
}

interface ExitingCard {
  asset: Asset;
  direction: SwipeDirection;
  startX: number;
  /** Aynı asset çift commit'e karşı unique key */
  key: number;
}

export default function SwipeScreen({ onComplete, onViewPending }: SwipeScreenProps) {
  const { t } = useLanguage();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [sessionKey, setSessionKey] = useState('initial');
  const [exitingCard, setExitingCard] = useState<ExitingCard | null>(null);

  // Top kartın translateX'i — back card animasyonu için paylaşılan shared value
  const topCardTranslateX = useSharedValue(0);

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

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handlePickerSelect = useCallback(
    ({ slicedAssets, endCursor, hasMore: pickerHasMore }: PickerSelection) => {
      setPickerVisible(false);
      initWithData(slicedAssets, endCursor, pickerHasMore);
      setSessionKey(`pick-${Date.now()}`);
    },
    [initWithData],
  );

  /**
   * SwipeCard'dan gelen swipe callback'i.
   * startX: kart gesture bırakıldığındaki translateX — ExitCard animasyonu için.
   * handleSwipe'ı ANINDA çağırarak next card'ı aktive eder,
   * ExitCard eski kartın uçuş animasyonunu halleder.
   */
  const handleCardSwipe = useCallback(
    (asset: Asset, direction: SwipeDirection, startX: number) => {
      setExitingCard({ asset, direction, startX, key: Date.now() });
      handleSwipe(asset, direction);
      // topCardTranslateX'i sıfırla (yeni kart için)
      topCardTranslateX.value = 0;
    },
    [handleSwipe, topCardTranslateX],
  );

  /**
   * Buton swipe'ı — gesture olmadığından startX=0 ile ortadan uçar
   */
  const programmaticSwipe = useCallback(
    (direction: SwipeDirection) => {
      const currentAsset = assets[currentIndex];
      if (currentAsset) {
        setExitingCard({ asset: currentAsset, direction, startX: 0, key: Date.now() });
        handleSwipe(currentAsset, direction);
        topCardTranslateX.value = 0;
      }
    },
    [assets, currentIndex, handleSwipe, topCardTranslateX],
  );

  // --- Render states ---

  if (isLoading && assets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{t.loadingGallery}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.stateLabel}>{t.errorTitle}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitial}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>{t.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (assets.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.stateLabel}>{t.galleryEmpty}</Text>
          <Text style={styles.emptyMessage}>{t.noMediaFound}</Text>
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
          <Text style={styles.stateLabel}>{t.sessionComplete}</Text>
          <Text style={styles.doneMessage}>{t.calculatingResults}</Text>
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader
        current={currentIndex + 1}
        total={totalCount > 0 ? totalCount : assets.length}
        stats={stats}
      />

      {/* Tool row: start point picker */}
      <View style={styles.toolRow}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>{t.selectStartPoint}</Text>
        </TouchableOpacity>
      </View>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {/* Back card */}
        {nextAsset && (
          <SwipeCard
            key={`back-${nextAsset.id}`}
            asset={nextAsset}
            isTop={false}
            onSwipe={handleCardSwipe}
            stackPosition={1}
            topCardTranslateX={topCardTranslateX}
          />
        )}

        {/* Top card */}
        {currentAsset && (
          <SwipeCard
            key={`top-${currentAsset.id}`}
            asset={currentAsset}
            isTop={true}
            onSwipe={handleCardSwipe}
            stackPosition={0}
            sharedTranslateX={topCardTranslateX}
          />
        )}

        {/* ExitCard: uçuş animasyonu top card'dan bağımsız çalışır */}
        {exitingCard && (
          <ExitCard
            key={`exit-${exitingCard.key}`}
            asset={exitingCard.asset}
            direction={exitingCard.direction}
            startX={exitingCard.startX}
            onComplete={() => setExitingCard(null)}
          />
        )}

        {needsMoreAssets && (
          <View style={styles.loadingMoreIndicator}>
            <ActivityIndicator color={COLORS.textTertiary} size="small" />
          </View>
        )}
      </View>

      {/* Pending deletion badge */}
      {pendingDeleteIds.length > 0 && (
        <TouchableOpacity
          style={styles.pendingBadge}
          onPress={() => onViewPending(pendingDeleteAssets, clearPending)}
          activeOpacity={0.8}
        >
          <Text style={styles.pendingBadgeText}>
            {t.pendingBadge(pendingDeleteIds.length)}
          </Text>
        </TouchableOpacity>
      )}

      <ActionButtons
        onDelete={() => programmaticSwipe('left')}
        onKeep={() => programmaticSwipe('right')}
        disabled={!currentAsset}
      />

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
  stateLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 8,
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
  emptyMessage: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneMessage: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
  },
  loadingMoreIndicator: {
    position: 'absolute',
    bottom: -32,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
  },
  pickerButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,132,255,0.3)',
  },
  pickerButtonText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.accent,
    fontWeight: '600',
  },
  pendingBadge: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
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
