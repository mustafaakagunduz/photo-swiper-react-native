import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/i18n/LanguageContext';
import PermissionScreen from './src/screens/PermissionScreen';
import SwipeScreen from './src/screens/SwipeScreen';
import PendingScreen from './src/screens/PendingScreen';
import ResultScreen from './src/screens/ResultScreen';
import type { AppScreen, Asset, SessionStats } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('permission');
  const [sessionResult, setSessionResult] = useState<SessionStats | null>(null);
  const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);
  const clearPendingRef = useRef<(() => void) | null>(null);

  const handlePermissionGranted = useCallback(() => {
    setScreen('swipe');
  }, []);

  const handleSessionComplete = useCallback((stats: SessionStats) => {
    setSessionResult(stats);
    setScreen('result');
  }, []);

  const handleViewPending = useCallback((assets: Asset[], clearPending: () => void) => {
    setPendingAssets(assets);
    clearPendingRef.current = clearPending;
    setScreen('pending');
  }, []);

  const handlePendingBack = useCallback(() => {
    setScreen('swipe');
  }, []);

  const handlePendingDeleted = useCallback((count: number) => {
    // Clear the pending list in the swipe session
    clearPendingRef.current?.();
    clearPendingRef.current = null;
    // Go back to swipe after a short moment (PendingScreen shows success first)
  }, []);

  const handleRestart = useCallback(() => {
    setSessionResult(null);
    setScreen('swipe');
  }, []);

  const handleBulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    // Used by ResultScreen for the end-of-session bulk delete
    if (ids.length === 0) return false;
    const { deleteAssetsAsync } = await import('expo-media-library');
    try {
      return await deleteAssetsAsync(ids);
    } catch {
      return false;
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
        <StatusBar style="light" />

        {screen === 'permission' && (
          <PermissionScreen onPermissionGranted={handlePermissionGranted} />
        )}

        {/* Keep SwipeScreen mounted while on 'pending' so session state persists */}
        {(screen === 'swipe' || screen === 'pending') && (
          <SwipeScreen
            onComplete={handleSessionComplete}
            onViewPending={handleViewPending}
          />
        )}

        {/* PendingScreen overlays SwipeScreen so session isn't lost */}
        {screen === 'pending' && (
          <View style={StyleSheet.absoluteFillObject}>
            <PendingScreen
              assets={pendingAssets}
              onBack={handlePendingBack}
              onDeleted={handlePendingDeleted}
            />
          </View>
        )}

        {screen === 'result' && sessionResult !== null && (
          <ResultScreen
            result={sessionResult}
            onRestart={handleRestart}
            onBulkDelete={handleBulkDelete}
          />
        )}
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
