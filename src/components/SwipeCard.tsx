import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import type { Asset, SwipeDirection } from '../types';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SWIPE_THRESHOLD,
  CARD_BORDER_RADIUS,
  COLORS,
  TYPOGRAPHY,
} from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import MediaView from './MediaView';

const FLY_DISTANCE = SCREEN_WIDTH * 1.6;

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

// ---------------------------------------------------------------------------
// ExitCard — swipe commit edilince bağımsız uçuş animasyonu yapar
// Böylece next card anında isTop=true olup gesture'a hazır olur
// ---------------------------------------------------------------------------

export interface ExitCardProps {
  asset: Asset;
  direction: SwipeDirection;
  /** translateX değeri onSwipe çağrıldığı andaki kart pozisyonu */
  startX: number;
  onComplete: () => void;
}

export function ExitCard({ asset, direction, startX, onComplete }: ExitCardProps) {
  const translateX = useSharedValue(startX);

  useEffect(() => {
    const targetX = direction === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
    translateX.value = withTiming(
      targetX,
      { duration: 220, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
    ],
    zIndex: 100,
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]} pointerEvents="none">
      <MediaView asset={asset} isActive={false} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// SwipeCard
// ---------------------------------------------------------------------------

interface SwipeCardProps {
  asset: Asset;
  isTop: boolean;
  /** startX: kart uçuşa geçtiği andaki translateX — ExitCard için gerekli */
  onSwipe: (asset: Asset, direction: SwipeDirection, startX: number) => void;
  stackPosition: 0 | 1;
  /** Top kartın translateX shared value'su — back card animasyonu için (okur) */
  topCardTranslateX?: SharedValue<number>;
  /**
   * isTop=true olan kart için: gesture sırasında translateX değerini buraya yazar.
   * Back card'ın topCardTranslateX prop'uyla aynı referans olmalı.
   */
  sharedTranslateX?: SharedValue<number>;
}

export default function SwipeCard({
  asset,
  isTop,
  onSwipe,
  stackPosition,
  topCardTranslateX,
  sharedTranslateX,
}: SwipeCardProps) {
  const { t } = useLanguage();
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
  }, [asset.id, translateX]);

  const triggerSwipe = (direction: SwipeDirection, startX: number) => {
    onSwipe(asset, direction, startX);
  };

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      // Back card'ın scale/opacity animasyonu için top card'ın konumunu paylaş
      if (sharedTranslateX) sharedTranslateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        // Swipe'ı anında commit et — ExitCard fly-out animasyonunu halleder
        const startX = translateX.value;
        if (sharedTranslateX) sharedTranslateX.value = 0;
        runOnJS(triggerSwipe)('right', startX);
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        const startX = translateX.value;
        if (sharedTranslateX) sharedTranslateX.value = 0;
        runOnJS(triggerSwipe)('left', startX);
      } else {
        // Eşiğin altında — geri snap
        translateX.value = withSpring(0, SPRING_CONFIG);
        if (sharedTranslateX) sharedTranslateX.value = 0;
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    if (stackPosition === 1) {
      // Back card: top kartın hareketine göre canlan
      const sourceX = topCardTranslateX ? topCardTranslateX.value : translateX.value;
      const dragRatio = Math.min(
        Math.abs(sourceX) / SWIPE_THRESHOLD,
        1,
      );
      const scale = interpolate(dragRatio, [0, 1], [0.94, 1]);
      const opacity = interpolate(dragRatio, [0, 0.3], [0.7, 1]);
      return {
        transform: [{ scale }],
        opacity,
      };
    }

    // Saf yatay kayma — rotasyon ve Y ekseni yok
    return {
      transform: [
        { translateX: translateX.value },
      ],
    };
  });

  const keepLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.6, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const deleteLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.6, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const keepTintStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.18],
      Extrapolation.CLAMP,
    );
    return { opacity, backgroundColor: COLORS.keep };
  });

  const deleteTintStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.18, 0],
      Extrapolation.CLAMP,
    );
    return { opacity, backgroundColor: COLORS.delete };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          stackPosition === 1 && styles.backCard,
        ]}
      >
        <MediaView asset={asset} isActive={isTop} />

        <Animated.View style={[StyleSheet.absoluteFill, styles.tint, styles.noPointer, keepTintStyle]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.tint, styles.noPointer, deleteTintStyle]} />

        <Animated.View style={[styles.labelContainer, styles.keepLabel, styles.noPointer, keepLabelStyle]}>
          <Text style={[styles.labelText, { color: COLORS.keep }]}>{t.keepVerb}</Text>
        </Animated.View>

        <Animated.View style={[styles.labelContainer, styles.deleteLabel, styles.noPointer, deleteLabelStyle]}>
          <Text style={[styles.labelText, { color: COLORS.delete }]}>{t.deleteVerb}</Text>
        </Animated.View>

        {asset.mediaType === 'video' && (
          <View style={[styles.typeBadge, styles.noPointer]}>
            <Text style={styles.typeBadgeText}>▶ Video</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.72,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  backCard: {
    zIndex: 0,
  },
  tint: {
    borderRadius: CARD_BORDER_RADIUS,
  },
  noPointer: {
    pointerEvents: 'none' as const,
  },
  labelContainer: {
    position: 'absolute',
    top: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 10,
  },
  keepLabel: {
    left: 20,
    borderColor: COLORS.keep,
    transform: [{ rotate: '-15deg' }],
  },
  deleteLabel: {
    right: 20,
    borderColor: COLORS.delete,
    transform: [{ rotate: '15deg' }],
  },
  labelText: {
    ...TYPOGRAPHY.title2,
    fontWeight: '900',
    letterSpacing: 2,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -32 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#fff',
    fontWeight: '600',
  },
});
