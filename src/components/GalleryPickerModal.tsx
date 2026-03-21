import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import type { Asset } from '../types';

const GRID_COLS = 3;
const GAP = 2;
const TILE_SIZE =
  (Dimensions.get('window').width - GAP * (GRID_COLS + 1)) / GRID_COLS;
const PICKER_BATCH = 120;

export interface PickerSelection {
  /** Seçilen asset (başlangıç noktası) */
  asset: Asset;
  /** Seçilen asset dahil o asset'ten sona kadar yüklenmiş tüm asset'ler */
  slicedAssets: Asset[];
  /** Modal'ın yüklediği son sayfanın endCursor'ı (daha fazla yüklemek için) */
  endCursor: string | undefined;
  /** Modal'da daha yüklenecek asset var mı */
  hasMore: boolean;
}

interface GalleryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (params: PickerSelection) => void;
}

export default function GalleryPickerModal({
  visible,
  onClose,
  onSelect,
}: GalleryPickerModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Ref'ler stale-closure sorununu önler
  const loadingRef = useRef(false);
  const endCursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const assetsRef = useRef<Asset[]>([]);

  // State değiştiğinde ref'leri güncelle
  endCursorRef.current = endCursor;
  hasMoreRef.current = hasMore;
  assetsRef.current = assets;

  const loadMore = useCallback(async (after?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: [
          MediaLibrary.MediaType.photo,
          MediaLibrary.MediaType.video,
        ],
        first: PICKER_BATCH,
        after,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // en yeniden eskiye
      });

      setAssets((prev) =>
        after ? [...prev, ...result.assets] : result.assets,
      );
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
    } catch (e) {
      console.warn('[GaleriCleaner] GalleryPickerModal loadMore error:', e);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Modal her açıldığında sıfırla ve ilk batch'i yükle
  useEffect(() => {
    if (visible) {
      setAssets([]);
      setEndCursor(undefined);
      setHasMore(true);
      loadMore(undefined);
    }
  }, [visible, loadMore]);

  const handleSelect = useCallback(
    (asset: Asset, index: number) => {
      const currentAssets = assetsRef.current;
      const currentEndCursor = endCursorRef.current;
      const currentHasMore = hasMoreRef.current;

      onSelect({
        asset,
        slicedAssets: currentAssets.slice(index),
        endCursor: currentEndCursor,
        hasMore: currentHasMore,
      });
    },
    [onSelect],
  );

  const handleEndReached = useCallback(() => {
    if (!loadingRef.current && hasMoreRef.current && endCursorRef.current) {
      loadMore(endCursorRef.current);
    }
  }, [loadMore]);

  const renderItem = useCallback(
    ({ item, index }: { item: Asset; index: number }) => (
      <TouchableOpacity
        style={styles.tile}
        onPress={() => handleSelect(item, index)}
        activeOpacity={0.7}
      >
        {/* ph:// URI'ları iOS'ta thumbnail olarak çalışır, getAssetInfoAsync gerekmez */}
        <Image
          source={{ uri: item.uri }}
          style={styles.tileImage}
          resizeMode="cover"
        />
        {item.mediaType === 'video' && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [handleSelect],
  );

  const keyExtractor = useCallback((item: Asset) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Başlangıç Noktası</Text>

          {/* Sağ tarafı dengelemek için boş view */}
          <View style={styles.headerRight} />
        </View>

        <Text style={styles.subtitle}>
          Kaydırmaya başlamak istediğin fotoğrafa dokun
        </Text>

        {/* İlk yükleme göstergesi */}
        {isLoading && assets.length === 0 ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Galeri yükleniyor…</Text>
          </View>
        ) : (
          <FlatList
            data={assets}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={GRID_COLS}
            contentContainerStyle={styles.grid}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            removeClippedSubviews
            ListFooterComponent={
              isLoading ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={COLORS.accent} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Fotoğraf bulunamadı</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    width: 50,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 50,
  },
  subtitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  grid: {
    padding: GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
