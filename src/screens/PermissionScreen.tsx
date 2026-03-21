import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

type PermissionState = 'idle' | 'requesting' | 'denied' | 'blocked';

export default function PermissionScreen({
  onPermissionGranted,
}: PermissionScreenProps) {
  const [state, setState] = useState<PermissionState>('idle');

  const requestPermission = useCallback(async () => {
    setState('requesting');
    try {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync(false);

      if (status === 'granted') {
        onPermissionGranted();
      } else if (!canAskAgain) {
        // Permanently denied — must go to Settings
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
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🖼️</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Galeri Cleaner</Text>
        <Text style={styles.subtitle}>
          Fotoğraf ve videolarını hızlıca temizle
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          <FeatureRow icon="👆" text="Sola kaydır → Sil" color={COLORS.delete} />
          <FeatureRow icon="👉" text="Sağa kaydır → Koru" color={COLORS.keep} />
          <FeatureRow icon="↩️" text="Yanlış silmede geri al" color={COLORS.undo} />
          <FeatureRow icon="🗂️" text="Silinen → Son Silinenler" color={COLORS.accent} />
        </View>

        {/* Permission states */}
        {state === 'idle' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Galeriye Erişime İzin Ver</Text>
          </TouchableOpacity>
        )}

        {state === 'requesting' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loadingText}>İzin bekleniyor…</Text>
          </View>
        )}

        {state === 'denied' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Galeri erişimi reddedildi. Uygulamanın çalışabilmesi için
              erişime izin verilmesi gerekiyor.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'blocked' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Galeri erişimi kalıcı olarak engellendi. Devam etmek için
              Ayarlar'dan izni manuel olarak ver.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openSettings}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Ayarları Aç</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Uygulama hiçbir veriyi buluta yüklemez.{'\n'}Her şey cihazınızda kalır.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({
  icon,
  text,
  color,
}: {
  icon: string;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
  );
}

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
    gap: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  icon: {
    fontSize: 52,
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
    marginTop: -8,
  },
  featureList: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    ...TYPOGRAPHY.callout,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#fff',
    fontWeight: '700',
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
    marginTop: 8,
  },
});
