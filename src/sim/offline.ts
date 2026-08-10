import { OFFLINE } from './defs';
import type { SaveData } from './save';

export interface OfflineResult {
  seconds: number;
  scrap: number;
}

/**
 * Offline earnings: the army kept fighting while the player was away.
 * Rate is the save's rolling scrap/sec estimate, paid at reduced efficiency,
 * capped at OFFLINE.capHours.
 */
export function computeOffline(
  save: Pick<SaveData, 'lastSeen' | 'scrapRate'>,
  now = Date.now()
): OfflineResult | null {
  const awaySec = (now - save.lastSeen) / 1000;
  if (!isFinite(awaySec) || awaySec < OFFLINE.minAwaySec) return null;
  const capped = Math.min(awaySec, OFFLINE.capHours * 3600);
  const scrap = Math.floor(capped * save.scrapRate * OFFLINE.efficiency);
  if (scrap < 1) return null;
  return { seconds: awaySec, scrap };
}

export function fmtDuration(seconds: number): string {
  if (seconds >= 3600) {
    const totalMin = Math.round(seconds / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds)}s`;
}
