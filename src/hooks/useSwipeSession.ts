import { useState, useCallback, useRef, useEffect } from 'react';
import { PRELOAD_AHEAD } from '../constants/theme';
import type { Asset, SessionStats, SwipeDirection } from '../types';

interface UseSwipeSessionReturn {
  currentIndex: number;
  stats: SessionStats;
  isComplete: boolean;
  handleSwipe: (asset: Asset, direction: SwipeDirection) => void;
  needsMoreAssets: boolean;
  pendingDeleteIds: string[];
  pendingDeleteAssets: Asset[];
  clearPending: () => void;
}

interface SwipeSessionOptions {
  assets: Asset[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onComplete: (stats: SessionStats) => void;
  /**
   * Bu değer değiştiğinde (örn. kullanıcı yeni bir başlangıç noktası seçince)
   * session tamamen sıfırlanır: currentIndex = 0, stats temizlenir,
   * pending liste boşaltılır.
   */
  resetKey?: string;
}

export function useSwipeSession({
  assets,
  totalCount,
  hasMore,
  onLoadMore,
  onComplete,
  resetKey,
}: SwipeSessionOptions): UseSwipeSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>({
    total: totalCount,
    kept: 0,
    deleted: 0,
    pendingDeleteIds: [],
  });
  const [isComplete, setIsComplete] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Track full Asset objects for display (not serialized into stats)
  const pendingAssetsRef = useRef<Asset[]>([]);

  // Sync total when initial load resolves
  useEffect(() => {
    setStats((prev) => ({ ...prev, total: totalCount }));
  }, [totalCount]);

  // resetKey değişince session'ı sıfırla (yeni başlangıç noktası seçildi)
  const prevResetKeyRef = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      setCurrentIndex(0);
      setStats({ total: 0, kept: 0, deleted: 0, pendingDeleteIds: [] });
      setIsComplete(false);
      pendingAssetsRef.current = [];
    }
  }, [resetKey]);

  // Trigger batch load when approaching end of loaded assets
  const needsMoreAssets = hasMore && currentIndex >= assets.length - PRELOAD_AHEAD;
  useEffect(() => {
    if (needsMoreAssets) onLoadMore();
  }, [needsMoreAssets, onLoadMore]);

  const checkCompletion = useCallback(
    (nextIndex: number, currentStats: SessionStats) => {
      if (nextIndex >= assets.length && !hasMore) {
        setTimeout(() => {
          setIsComplete(true);
          onComplete(currentStats);
        }, 400);
      }
    },
    [assets.length, hasMore, onComplete],
  );

  const handleSwipe = useCallback(
    (asset: Asset, direction: SwipeDirection) => {
      const nextIndex = currentIndexRef.current + 1;
      setCurrentIndex(nextIndex);

      if (direction === 'right') {
        // KEEP
        const newStats = { ...statsRef.current, kept: statsRef.current.kept + 1 };
        setStats(newStats);
        checkCompletion(nextIndex, newStats);
      } else {
        // Queue for bulk deletion — no iOS dialog yet
        pendingAssetsRef.current = [...pendingAssetsRef.current, asset];
        const newStats = {
          ...statsRef.current,
          pendingDeleteIds: [...statsRef.current.pendingDeleteIds, asset.id],
        };
        setStats(newStats);
        checkCompletion(nextIndex, newStats);
      }
    },
    [checkCompletion],
  );

  const clearPending = useCallback(() => {
    pendingAssetsRef.current = [];
    setStats((prev) => ({ ...prev, pendingDeleteIds: [] }));
  }, []);

  return {
    currentIndex,
    stats,
    isComplete,
    handleSwipe,
    needsMoreAssets,
    pendingDeleteIds: stats.pendingDeleteIds,
    pendingDeleteAssets: pendingAssetsRef.current,
    clearPending,
  };
}
