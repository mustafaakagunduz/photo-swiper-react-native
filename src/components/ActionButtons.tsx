import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export default function ActionButtons({
  onKeep,
  onDelete,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      {/* DELETE button */}
      <TouchableOpacity
        style={[styles.button, styles.deleteButton, disabled && styles.disabled]}
        onPress={onDelete}
        disabled={disabled}
        activeOpacity={0.75}
      >
        <Text style={styles.buttonIcon}>✕</Text>
        <Text style={[styles.buttonLabel, { color: COLORS.delete }]}>Sil</Text>
      </TouchableOpacity>

      {/* Hint text */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>← Sil · Koru →</Text>
      </View>

      {/* KEEP button */}
      <TouchableOpacity
        style={[styles.button, styles.keepButton, disabled && styles.disabled]}
        onPress={onKeep}
        disabled={disabled}
        activeOpacity={0.75}
      >
        <Text style={styles.buttonIcon}>✓</Text>
        <Text style={[styles.buttonLabel, { color: COLORS.keep }]}>Koru</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.deleteLight,
    borderColor: COLORS.deleteBorder,
  },
  keepButton: {
    backgroundColor: COLORS.keepLight,
    borderColor: COLORS.keepBorder,
  },
  buttonIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 26,
  },
  buttonLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.4,
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
});
