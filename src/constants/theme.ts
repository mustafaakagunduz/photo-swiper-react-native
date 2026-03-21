import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export const COLORS = {
  background: '#0a0a0a',
  surface: '#141414',
  card: '#1c1c1e',
  border: '#2c2c2e',

  keep: '#30d158',
  keepLight: 'rgba(48, 209, 88, 0.15)',
  keepBorder: 'rgba(48, 209, 88, 0.6)',

  delete: '#ff453a',
  deleteLight: 'rgba(255, 69, 58, 0.15)',
  deleteBorder: 'rgba(255, 69, 58, 0.6)',

  textPrimary: '#ffffff',
  textSecondary: '#ebebf599',
  textTertiary: '#ebebf54d',

  accent: '#0a84ff',
  undo: '#ffd60a',
  overlay: 'rgba(0,0,0,0.6)',
};

export const TYPOGRAPHY = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.4 },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

export const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15;
export const ROTATION_ANGLE = 12; // degrees at full swipe
export const CARD_BORDER_RADIUS = 20;

export const BATCH_SIZE = 60;
export const PRELOAD_AHEAD = 5;
