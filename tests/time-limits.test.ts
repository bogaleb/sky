// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import {
  BURST_GAP_MS,
  DEFAULT_DAILY_MINUTES,
  MAX_COUNTED_MINUTES_PER_BLOCK,
  MAX_DAILY_MINUTES,
  MIN_DAILY_MINUTES,
  TIME_LIMIT_WINDDOWN_COPY,
  buildTimeLimitStatus,
  computeActivePlayMinutes,
  startOfLocalDayIso,
  validateDailyMinutes,
  type PlayEvent,
} from '../lib/kid/time-limits';
import { TimeLimitWindDown } from '@/components/kid/bedtime';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/kid/audio', () => ({
  speak: vi.fn(),
  speakAs: vi.fn(),
  playSfx: vi.fn(),
  stopSpeaking: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: vi.fn(async () => {}),
  recordGameAttempts: vi.fn(async () => ({ recorded: 0, leveledSkills: [] })),
}));
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: vi.fn() }));

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

const MIN = 60_000;
const T0 = Date.parse('2026-09-26T12:00:00.000Z'); // a Saturday noon UTC

function ev(partial: Partial<PlayEvent> & { createdAtMs: number }): PlayEvent {
  return {
    eventType: 'attempt',
    sessionId: null,
    kind: null,
    ...partial,
  };
}

function sessionStart(sessionId: string, atMs: number): PlayEvent {
  return { eventType: 'milestone', sessionId, kind: 'session_start', createdAtMs: atMs };
}

function sessionComplete(sessionId: string, atMs: number): PlayEvent {
  return { eventType: 'milestone', sessionId, kind: 'session_complete', createdAtMs: atMs };
}

describe('validateDailyMinutes', () => {
  it('accepts the DB default and the boundary values', () => {
    expect(validateDailyMinutes(DEFAULT_DAILY_MINUTES)).toBe(30);
    expect(validateDailyMinutes(MIN_DAILY_MINUTES)).toBe(5);
    expect(validateDailyMinutes(MAX_DAILY_MINUTES)).toBe(180);
  });

  it('rejects out-of-range, fractional, and non-numeric input', () => {
    expect(validateDailyMinutes(4)).toBeNull();
    expect(validateDailyMinutes(181)).toBeNull();
    expect(validateDailyMinutes(30.5)).toBeNull();
    expect(validateDailyMinutes('30')).toBeNull();
    expect(validateDailyMinutes(NaN)).toBeNull();
    expect(validateDailyMinutes(undefined)).toBeNull();
    expect(validateDailyMinutes(null)).toBeNull();
    expect(validateDailyMinutes(-10)).toBeNull();
  });
});

describe('startOfLocalDayIso', () => {
  it('computes local midnight for America/New_York (EDT in September)', () => {
    // 2026-09-26 is in EDT (UTC-4): local midnight = 04:00Z.
    expect(startOfLocalDayIso('America/New_York', new Date(T0))).toBe('2026-09-26T04:00:00.000Z');
  });

  it('computes local midnight for a positive-offset zone', () => {
    // Australia/Sydney is UTC+10 in September: local midnight = 14:00Z previous day.
    expect(startOfLocalDayIso('Australia/Sydney', new Date(T0))).toBe('2026-09-25T14:00:00.000Z');
  });

  it('falls back to UTC for invalid or missing zones', () => {
    expect(startOfLocalDayIso('Mars/Olympus', new Date(T0))).toBe('2026-09-26T00:00:00.000Z');
    expect(startOfLocalDayIso(undefined, new Date(T0))).toBe('2026-09-26T00:00:00.000Z');
    expect(startOfLocalDayIso('', new Date(T0))).toBe('2026-09-26T00:00:00.000Z');
  });
});

describe('computeActivePlayMinutes', () => {
  const dayStart = Date.parse('2026-09-26T00:00:00.000Z');
  const now = T0;

  it('pairs session_start with session_complete by session id', () => {
    const events = [sessionStart('s1', dayStart + 60 * MIN), sessionComplete('s1', dayStart + 80 * MIN)];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(20);
  });

  it('sums multiple sessions', () => {
    const events = [
      sessionStart('s1', dayStart + 60 * MIN),
      sessionComplete('s1', dayStart + 70 * MIN),
      sessionStart('s2', dayStart + 200 * MIN),
      sessionComplete('s2', dayStart + 225 * MIN),
    ];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(35);
  });

  it('caps a single block at 90 minutes (abandoned-tab guard)', () => {
    const events = [sessionStart('s1', dayStart), sessionComplete('s1', dayStart + 200 * MIN)];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(MAX_COUNTED_MINUTES_PER_BLOCK);
  });

  it('counts an open session from its start until now', () => {
    const events = [sessionStart('s1', now - 10 * MIN)];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(10);
  });

  it('clamps a session that started before midnight to today\'s portion', () => {
    const events = [
      sessionStart('s1', dayStart - 10 * MIN), // 23:50 the previous day
      sessionComplete('s1', dayStart + 20 * MIN),
    ];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(20);
  });

  it('ignores a completion with no matching start outside today', () => {
    // Complete event with no start: counts from dayStart (today's portion).
    const events = [sessionComplete('s9', dayStart + 15 * MIN)];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(15);
  });

  it('clusters session-less free play into bursts split by a 10-minute gap', () => {
    const events = [
      ev({ createdAtMs: dayStart + 100 * MIN }),
      ev({ createdAtMs: dayStart + 102 * MIN }),
      ev({ createdAtMs: dayStart + 104 * MIN }),
      // Gap larger than BURST_GAP_MS starts a new burst.
      ev({ createdAtMs: dayStart + 104 * MIN + BURST_GAP_MS + MIN }),
      ev({ createdAtMs: dayStart + 106 * MIN + BURST_GAP_MS + MIN }),
    ];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(6);
  });

  it('counts a lone free-play event as at least one minute', () => {
    expect(computeActivePlayMinutes([ev({ createdAtMs: dayStart + 300 * MIN })], now, dayStart)).toBe(1);
  });

  it('excludes reward_error observability events', () => {
    const events = [
      ev({ eventType: 'reward_error', createdAtMs: dayStart + 300 * MIN }),
      ev({ eventType: 'reward_error', createdAtMs: dayStart + 320 * MIN }),
    ];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(0);
  });

  it('ignores events before the day boundary', () => {
    const events = [ev({ createdAtMs: dayStart - MIN })];
    expect(computeActivePlayMinutes(events, now, dayStart)).toBe(0);
  });

  it('returns 0 for no events', () => {
    expect(computeActivePlayMinutes([], now, dayStart)).toBe(0);
  });
});

describe('buildTimeLimitStatus', () => {
  it('reports remaining minutes and exhaustion', () => {
    expect(buildTimeLimitStatus(30, 10)).toEqual({
      limitMinutes: 30,
      usedMinutes: 10,
      remainingMinutes: 20,
      exhausted: false,
    });
    expect(buildTimeLimitStatus(30, 30)).toMatchObject({ remainingMinutes: 0, exhausted: true });
    expect(buildTimeLimitStatus(30, 45)).toMatchObject({ remainingMinutes: 0, exhausted: true });
  });

  it('clamps negative usage to zero', () => {
    expect(buildTimeLimitStatus(30, -5)).toMatchObject({ usedMinutes: 0, exhausted: false });
  });
});

describe('wind-down copy', () => {
  it('is warm, non-empty, and emoji-free', () => {
    const values = [
      TIME_LIMIT_WINDDOWN_COPY.heading('Maya'),
      TIME_LIMIT_WINDDOWN_COPY.body1,
      TIME_LIMIT_WINDDOWN_COPY.body2,
      TIME_LIMIT_WINDDOWN_COPY.cozyButton,
      TIME_LIMIT_WINDDOWN_COPY.doneButton,
      TIME_LIMIT_WINDDOWN_COPY.spoken('Maya'),
    ];
    for (const v of values) {
      expect(v.length).toBeGreaterThan(0);
      expect(v).not.toMatch(EMOJI_RE);
    }
    // Warm and encouraging: names the child, celebrates effort, promises tomorrow.
    expect(TIME_LIMIT_WINDDOWN_COPY.heading('Maya')).toContain('Maya');
    expect(TIME_LIMIT_WINDDOWN_COPY.body1).toMatch(/proud/i);
    expect(TIME_LIMIT_WINDDOWN_COPY.body2).toMatch(/tomorrow/i);
  });

  it('renders the wind-down at >=18px with no emoji', () => {
    const { container } = render(
      createElement(TimeLimitWindDown, {
        childId: 'c1',
        nickname: 'Ada',
        onDone: () => {},
      })
    );
    const html = container.innerHTML;
    // Warm, encouraging, and readable: text-xl (20px) and up, no emoji.
    expect(html).toMatch(/text-(xl|2xl|3xl)/);
    expect(html).not.toMatch(EMOJI_RE);
    expect(
      screen.getByText(TIME_LIMIT_WINDDOWN_COPY.heading('Ada'))
    ).toBeInTheDocument();
    expect(screen.getByText(TIME_LIMIT_WINDDOWN_COPY.body1)).toBeInTheDocument();
  });
});
