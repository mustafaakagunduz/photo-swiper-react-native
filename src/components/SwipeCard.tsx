import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { Asset, SwipeDirection } from '../types';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SWIPE_THRESHOLD,
  ROTATION_ANGLE,
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

interface SwipeCardProps {
  asset: Asset;
  isTop: boolean;
  onSwipe: (asset: Asset, direction: SwipeDirection) => void;
  stackPosition: 0 | 1;
}

export default function SwipeCard({
  asset,
  isTop,
  onSwipe,
  stackPosition,
}: SwipeCardProps) {
  const { t } = useLanguage();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureActive = useSharedValue(false);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [asset.id, translateX, translateY]);

  const triggerSwipe = (direction: SwipeDirection) => {
    onSwipe(asset, direction);
  };

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onBegin(() => {
      gestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4;
    })
    .onEnd(() => {
      gestureActive.value = false;
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(FLY_DISTANCE, SPRING_CONFIG, () => {
          runOnJS(triggerSwipe)('right');
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-FLY_DISTANCE, SPRING_CONFIG, () => {
          runOnJS(triggerSwipe)('left');
        });
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    if (stackPosition === 1) {
      const dragRatio = Math.min(
        Math.abs(translateX.value) / SWIPE_THRESHOLD,
        1,
      );
      const scale = interpolate(dragRatio, [0, 1], [0.94, 1]);
      const opacity = interpolate(dragRatio, [0, 0.3], [0.7, 1]);
      return {
        transform: [{ scale }],
        opacity,
      };
    }

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
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
