import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { Asset } from '../types';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

// ---------------------------------------------------------------------------
// Video component — resolves localUri before attempting playback
// ---------------------------------------------------------------------------

interface VideoMediaProps {
  asset: Asset;
  isActive: boolean;
}

function VideoMedia({ asset, isActive }: VideoMediaProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Resolve ph:// → file:// URI via getAssetInfoAsync
  useEffect(() => {
    let cancelled = false;
    setResolving(true);
    setLocalUri(null);

    MediaLibrary.getAssetInfoAsync(asset)
      .then((info) => {
        if (!cancelled) {
          setLocalUri(info.localUri ?? asset.uri);
          setResolving(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fall back to the ph:// URI and hope for the best
          setLocalUri(asset.uri);
          setResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asset]);

  // Player'ı kaynaksız başlat — useVideoPlayer(localUri) yaklaşımı
  // localUri null→string geçişinde player'ı otomatik güncellemez.
  // Bunun yerine player.replace() ile açıkça kaynak yüklüyoruz.
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // localUri çözümlenince kaynağı yükle
  useEffect(() => {
    if (!localUri) return;
    player.replace(localUri);
  }, [localUri, player]);

  // Aktif/pasif duruma göre oynat / durdur
  useEffect(() => {
    if (!localUri) return;
    if (isActive) {
      player.muted = isMuted;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, localUri, player, isMuted]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    player.muted = next;
  }, [isMuted, player]);

  if (resolving) {
    return (
      <View style={styles.mediaContainer}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.textSecondary} size="large" />
          <Text style={styles.loadingLabel}>Video yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={toggleMute}>
      <View style={styles.mediaContainer}>
        <VideoView
          player={player}
          style={styles.media}
          contentFit="contain"
          nativeControls={false}
        />
        {/* Duration badge */}
        {asset.duration != null && asset.duration > 0 && (
          <View style={[styles.durationBadge, styles.noPointer]}>
            <Text style={styles.durationText}>{formatDuration(asset.duration)}</Text>
          </View>
        )}
        {/* Mute badge */}
        <View style={[styles.muteButton, styles.noPointer]}>
          <Text style={styles.muteIcon}>{isMuted ? '🔇' : '🔊'}</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ---------------------------------------------------------------------------
// Photo component
// ---------------------------------------------------------------------------

function PhotoMedia({ asset }: { asset: Asset }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uri, setUri] = useState<string | null>(null);

  // Resolve ph:// → file:// URI (same approach as VideoMedia)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setUri(null);

    MediaLibrary.getAssetInfoAsync(asset)
      .then((info) => {
        if (!cancelled) {
          setUri(info.localUri ?? asset.uri);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUri(asset.uri);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asset.id]);

  return (
    <View style={styles.mediaContainer}>
      {(loading || !uri) && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.textSecondary} size="large" />
        </View>
      )}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Fotoğraf yüklenemedi</Text>
        </View>
      ) : uri ? (
        <Image
          source={{ uri }}
          style={styles.media}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

interface MediaViewProps {
  asset: Asset;
  isActive: boolean;
}

export default function MediaView({ asset, isActive }: MediaViewProps) {
  if (asset.mediaType === 'video') {
    return <VideoMedia asset={asset} isActive={isActive} />;
  }
  return <PhotoMedia asset={asset} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  mediaContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  media: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    gap: 12,
  },
  loadingLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorText: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    color: '#fff',
    fontWeight: '600',
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 6,
    borderRadius: 8,
  },
  muteIcon: {
    fontSize: 16,
  },
  noPointer: {
    pointerEvents: 'none' as const,
  },
});
