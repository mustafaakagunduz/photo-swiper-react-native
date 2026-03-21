import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { Asset } from '../types';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

// ---------------------------------------------------------------------------
// Video component — ph:// URI'yı doğrudan AVPlayer'a verir (sandbox-safe)
// ---------------------------------------------------------------------------

interface VideoMediaProps {
  asset: Asset;
  isActive: boolean;
}

function VideoMedia({ asset, isActive }: VideoMediaProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  // ph:// URI'yı doğrudan ver — AVPlayer natively destekler.
  // file:// çevirisi PlayerRemoteXPC sandbox'ını ihlal eder (err=-12860 / -17507).
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // asset değişince source yükle; bittikten sonra playerReady=true
  useEffect(() => {
    setPlayerReady(false);
    player
      .replaceAsync(asset.uri)
      .then(() => setPlayerReady(true))
      .catch((e) => {
        console.warn('[MediaView] replaceAsync failed:', e);
        setPlayerReady(true);
      });
  }, [asset.uri, player]);

  // play() yalnızca source yüklendikten sonra çalışır
  useEffect(() => {
    if (!playerReady) return;
    if (isActive) {
      player.muted = isMuted;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, playerReady, player, isMuted]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    player.muted = next;
  }, [isMuted, player]);

  return (
    <TouchableWithoutFeedback onPress={toggleMute}>
      <View style={styles.mediaContainer}>
        {!playerReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.textSecondary} size="large" />
          </View>
        )}
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
// Photo component — expo-image ph:// natively destekler
// ---------------------------------------------------------------------------

function PhotoMedia({ asset }: { asset: Asset }) {
  return (
    <View style={styles.mediaContainer}>
      <Image
        source={{ uri: asset.uri }}
        style={styles.media}
        contentFit="contain"
        transition={200}
      />
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
