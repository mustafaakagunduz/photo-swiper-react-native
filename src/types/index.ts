import type { Asset } from 'expo-media-library';

export type { Asset };

export type SwipeDirection = 'left' | 'right';

export type MediaType = 'photo' | 'video';

export interface SwipeAction {
  asset: Asset;
  direction: SwipeDirection;
  timestamp: number;
}

export interface SessionStats {
  total: number;
  kept: number;
  deleted: number;
  pendingDeleteIds: string[]; // marked for deletion, not yet confirmed
}

export type SessionResult = SessionStats;

export type AppScreen = 'permission' | 'swipe' | 'pending' | 'result';
