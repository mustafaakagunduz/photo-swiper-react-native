import { useState, useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { BATCH_SIZE } from '../constants/theme';
import type { Asset } from '../types';

interface UseMediaAssetsReturn {
  assets: Asset[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  loadInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  deleteAssets: (ids: string[]) => Promise<boolean>;
  /**
   * Galeri seçici modaldan dönen veriyle hook'u başlatır.
   * loadInitial çağırmak yerine bu çağrılınca swipe session
   * seçilen fotoğraftan itibaren başlar, loadMore önceki kaldığı
   * yerden (afterCursor) devam eder.
   */
  initWithData: (
    initialAssets: Asset[],
    afterCursor: string | undefined,
    initialHasMore: boolean,
  ) => void;
}

export function useMediaAssets(): UseMediaAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // endCursor tracks where we left off for pagination
  const endCursorRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);

  const loadInitial = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch first batch
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: [
          MediaLibrary.MediaType.photo,
          MediaLibrary.MediaType.video,
        ],
        first: BATCH_SIZE,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // newest first
      });

      // totalCount from expo-media-library represents all matching assets.
      // If it equals BATCH_SIZE exactly and hasNextPage is true, it may be
      // a capped value — in that case do a separate lightweight count query.
      let total: number = result.totalCount ?? result.assets.length;

      if (result.hasNextPage && total <= BATCH_SIZE) {
        // SDK didn't return the real total; fetch a single item just for totalCount
        try {
          const countResult = await MediaLibrary.getAssetsAsync({
            mediaType: [
              MediaLibrary.MediaType.photo,
              MediaLibrary.MediaType.video,
            ],
            first: 1,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          if (countResult.totalCount && countResult.totalCount > total) {
            total = countResult.totalCount;
          }
        } catch {
          // keep existing total
        }
      }

      setTotalCount(total);
      setAssets(result.assets);
      endCursorRef.current = result.endCursor;
      setHasMore(result.hasNextPage);
    } catch (e: any) {
      setError(e?.message ?? 'Medya yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;

    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: [
          MediaLibrary.MediaType.photo,
          MediaLibrary.MediaType.video,
        ],
        first: BATCH_SIZE,
        after: endCursorRef.current,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // newest first
      });

      setAssets((prev) => [...prev, ...result.assets]);
      endCursorRef.current = result.endCursor;
      setHasMore(result.hasNextPage);
    } catch (e: any) {
      setError(e?.message ?? 'Daha fazla medya yüklenirken hata oluştu.');
    } finally {
      loadingRef.current = false;
    }
  }, [hasMore]);

  /**
   * deleteAssets — bulk delete via iOS Photos framework.
   * On iOS, deleteAssetsAsync with multiple IDs shows a SINGLE native
   * confirmation dialog: "Delete X Photos?" — user confirms once for all.
   * Moves items to "Recently Deleted" (kept for 30 days).
   * Returns true if deletion was confirmed, false if user cancelled.
   */
  const deleteAssets = useCallback(async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return false;
    try {
      const success = await MediaLibrary.deleteAssetsAsync(ids);
      return success;
    } catch (e: any) {
      console.warn('[GaleriCleaner] deleteAssets error:', e?.message);
      return false;
    }
  }, []);

  /**
   * GalleryPickerModal'dan dönen slice + cursor ile hook'u sıfırlar.
   * Böylece swipe session seçilen fotoğraftan başlar,
   * loadMore ise modalın bıraktığı cursor'dan devam eder.
   */
  const initWithData = useCallback(
    (
      initialAssets: Asset[],
      afterCursor: string | undefined,
      initialHasMore: boolean,
    ) => {
      // Devam eden yükleme varsa beklet (olası yarış koşulu)
      loadingRef.current = false;
      setAssets(initialAssets);
      endCursorRef.current = afterCursor;
      setHasMore(initialHasMore);
      setTotalCount(0); // başlangıç noktasından kalan miktar bilinmiyor
      setError(null);
      setIsLoading(false);
    },
    [],
  );

  return {
    assets,
    totalCount,
    isLoading,
    error,
    loadInitial,
    loadMore,
    hasMore,
    deleteAssets,
    initWithData,
  };
}
