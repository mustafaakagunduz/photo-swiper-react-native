import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

type PermissionState = 'idle' | 'requesting' | 'denied' | 'blocked';

export default function PermissionScreen({
  onPermissionGranted,
}: PermissionScreenProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const [state, setState] = useState<PermissionState>('idle');

  const requestPermission = useCallback(async () => {
    setState('requesting');
    try {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync(false);

      if (status === 'granted') {
        onPermissionGranted();
      } else if (!canAskAgain) {
        setState('blocked');
      } else {
        setState('denied');
      }
    } catch (e) {
      console.warn('[GaleriCleaner] Permission error:', e);
      setState('denied');
    }
  }, [onPermissionGranted]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Monogram mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>GC</Text>
        </View>

        {/* Title */}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Galeri Cleaner</Text>
          <Text style={styles.subtitle}>{t.appTagline}</Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          <FeatureRow symbol="←" text={t.swipeLeftDelete} color={COLORS.delete} />
          <View style={styles.divider} />
          <FeatureRow symbol="→" text={t.swipeRightKeep} color={COLORS.keep} />
          <View style={styles.divider} />
          <FeatureRow symbol="↺" text={t.undoMistake} color={COLORS.undo} />
          <View style={styles.divider} />
          <FeatureRow symbol="↓" text={t.deletedToRecent} color={COLORS.accent} />
        </View>

        {/* Permission states */}
        {state === 'idle' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t.grantAccess}</Text>
          </TouchableOpacity>
        )}

        {state === 'requesting' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loadingText}>{t.waitingPermission}</Text>
          </View>
        )}

        {state === 'denied' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t.permissionDenied}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t.tryAgain}</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'blocked' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t.permissionBlocked}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openSettings}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t.openSettings}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>{t.disclaimer}</Text>
      </View>

      {/* Language switch — bottom center */}
      <View style={styles.langSwitchContainer}>
        <LanguageSwitch language={language} onToggle={toggleLanguage} />
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({
  symbol,
  text,
  color,
}: {
  symbol: string;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={[styles.featureSymbol, { color }]}>{symbol}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const PILL_W = 56;
const TRACK_H = 38;

function LanguageSwitch({
  language,
  onToggle,
}: {
  language: 'tr' | 'en';
  onToggle: () => void;
}) {
  const anim = useRef(new Animated.Value(language === 'tr' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: language === 'tr' ? 0 : 1,
      useNativeDriver: false,
      bounciness: 10,
      speed: 14,
    }).start();
  }, [language, anim]);

  const pillLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, PILL_W + 3],
  });

  const trOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
  const enOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Pressable onPress={onToggle} style={langStyles.wrapper}>
      <View style={langStyles.track}>
        {/* sliding pill */}
        <Animated.View style={[langStyles.pill, { left: pillLeft }]} />
        {/* labels */}
        <Animated.Text style={[langStyles.label, { opacity: trOpacity }]}>TR</Animated.Text>
        <Animated.Text style={[langStyles.label, { opacity: enOpacity }]}>EN</Animated.Text>
      </View>
      <Text style={langStyles.hint}>Language / Dil</Text>
    </Pressable>
  );
}

const langStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  track: {
    width: PILL_W * 2 + 6,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    width: PILL_W,
    height: TRACK_H - 6,
    borderRadius: (TRACK_H - 6) / 2,
    backgroundColor: COLORS.accent,
    top: 3,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    width: PILL_W,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
    zIndex: 1,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 3,
  },
  titleGroup: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  featureSymbol: {
    fontSize: 17,
    fontWeight: '600',
    width: 22,
    textAlign: 'center',
  },
  featureText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 52,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  langSwitchContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
});
