/**
 * Seasons — Sky's seasonal calendar. The map dresses up for the season:
 * spooky pumpkins in October, falling snow in winter, blossoms in spring,
 * sunshine in summer, and drifting leaves in autumn.
 */

export type SeasonId = 'halloween' | 'winter' | 'spring' | 'summer' | 'autumn';

export interface SeasonMeta {
  id: SeasonId;
  label: string;
  greeting: string;
}

export const SEASON_META: Record<SeasonId, SeasonMeta> = {
  halloween: { id: 'halloween', label: 'Spooky Season', greeting: 'Happy spooky season, explorer!' },
  winter: { id: 'winter', label: 'Winter', greeting: 'Cozy winter wishes, explorer!' },
  spring: { id: 'spring', label: 'Spring', greeting: 'Happy spring, explorer!' },
  summer: { id: 'summer', label: 'Summer', greeting: 'Sunny summer fun, explorer!' },
  autumn: { id: 'autumn', label: 'Autumn', greeting: 'Happy autumn, explorer!' },
};

/**
 * Map a date to Sky's season. October is spooky season; December through
 * February is winter; March through May is spring; June through August is
 * summer; September and November are autumn.
 */
export function seasonFor(date: Date = new Date()): SeasonId {
  const month = date.getMonth();
  if (month === 9) return 'halloween';
  if (month === 11 || month === 0 || month === 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

export function seasonMetaFor(date: Date = new Date()): SeasonMeta {
  return SEASON_META[seasonFor(date)];
}
