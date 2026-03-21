import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import type { Asset } from '../types';

const COLUMNS = 3;
const GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS;

interface PendingScreenProps {
  assets: Asset[];
  onBack: () => void;
  onDeleted: (count: number) => void;
}

type DeleteState = 'idle' | 'deleting' | 'done';

export default function PendingScreen({ assets, onBack, onDeleted }: PendingScreenProps) {
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
  const [uriMap, setUriMap] = useState<Record<string, string>>({});

  // Resolve ph:// → file:// URIs for thumbnails
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      assets.map((a) =>
        MediaLibrary.getAssetInfoAsync(a)
          .then((info) => ({ id: a.id, uri: info.localUri ?? a.uri }))
          .catch(() => ({ id: a.id, uri: a.uri })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach((r) => { map[r.id] = r.uri; });
      setUriMap(map);
    });
    return () => { cancelled = true; };
  }, [assets]);

  const handleDelete = useCallback(async () => {
    setDeleteState('deleting');
    const ids = assets.map((a) => a.id);
    try {
      const success = await MediaLibrary.deleteAssetsAsync(ids);
      if (success) {
        onDeleted(ids.length);
        setDeleteState('done');
      } else {
        // User cancelled iOS dialog
        setDeleteState('idle');
      }
    } catch {
      setDeleteState('idle');
    }
  }, [assets, onDeleted]);

  const renderItem = useCallback(({ item }: { item: Asset }) => {
    const uri = uriMap[item.id];
    return (
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
            <ActivityIndicator size="small" color={COLORS.textTertiary} />
          </View>
        )}
        {item.mediaType === 'video' && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶</Text>
          </View>
        )}
      </View>
    );
  }, [uriMap]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{assets.length} Foto Seçildi</Text>
        <View style={styles.backButton} />
      </View>

      {deleteState === 'done' ? (
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneText}>{assets.length} fotoğraf silindi.</Text>
          <TouchableOpacity style={styles.doneButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>Swipe'a Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={COLUMNS}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.deleteButton, deleteState === 'deleting' && styles.deleteButtonDisabled]}
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
                <Text style={styles.deleteButtonText}>🗑️  {assets.length} Fotoğrafı Sil</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>iOS tek seferlik onay isteyecek</Text>
          </View>
        </>
      )}
    </SafeAreaView>
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
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
  },
  grid: {
    padding: GAP,
    paddingBottom: 120,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
  },
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
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  doneEmoji: {
    fontSize: 64,
  },
  doneText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.textPrimary,
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
