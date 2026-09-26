import { describe, it, expect, vi } from 'vitest';
import {
  EMOTIONS,
  MOUTHS,
  EYE_KINDS,
  BROW_KINDS,
  getEmotion,
  pickSession,
  ROUNDS_PER_GAME,
} from '../lib/kid/feelings';

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: vi.fn(),
  awardStickers: vi.fn(),
}));
vi.mock('@/app/actions/trail', () => ({ bumpQuestProgress: vi.fn() }));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: vi.fn() }));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: vi.fn(),
  recordGameAttempts: vi.fn(async () => ({ recorded: 0, leveledSkills: [] })),
}));
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: vi.fn() }));

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

describe('emotions data', () => {
  it('has exactly 12 emotions', () => {
    expect(EMOTIONS.length).toBe(12);
  });

  it('has the 12 expected emotion ids', () => {
    const ids = EMOTIONS.map((e) => e.id).sort();
    expect(ids).toEqual(
      ['angry', 'brave', 'calm', 'excited', 'frustrated', 'happy', 'jealous', 'proud', 'sad', 'scared', 'shy', 'surprised'].sort()
    );
  });

  it('gives every emotion a name, kid definition, scenario, and comfort tip', () => {
    for (const e of EMOTIONS) {
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.kidDefinition.length).toBeGreaterThan(0);
      // Scenario is two sentences.
      expect(e.scenario.split(/[.!?]+/).filter((s) => s.trim().length > 0).length).toBe(2);
      expect(e.comfortTip.length).toBeGreaterThan(0);
    }
  });

  it('keeps face params inside the allowed sets', () => {
    for (const e of EMOTIONS) {
      expect(MOUTHS).toContain(e.face.mouth);
      expect(EYE_KINDS).toContain(e.face.eyes);
      if (e.face.brows !== undefined) expect(BROW_KINDS).toContain(e.face.brows);
    }
  });

  it('has no emoji in any text', () => {
    for (const e of EMOTIONS) {
      expect(EMOJI_RE.test(e.name)).toBe(false);
      expect(EMOJI_RE.test(e.kidDefinition)).toBe(false);
      expect(EMOJI_RE.test(e.scenario)).toBe(false);
      expect(EMOJI_RE.test(e.comfortTip)).toBe(false);
    }
  });

  it('looks emotions up by id', () => {
    expect(getEmotion('happy')?.name).toBe('Happy');
    expect(getEmotion('nope')).toBeUndefined();
  });
});

describe('pickSession', () => {
  it('builds 8 rounds mixing name and help kinds', () => {
    const rounds = pickSession(42);
    expect(rounds.length).toBe(ROUNDS_PER_GAME);
    const kinds = rounds.map((r) => r.kind);
    expect(kinds).toContain('name');
    expect(kinds).toContain('help');
    expect(kinds.filter((k) => k === 'name').length).toBe(4);
    expect(kinds.filter((k) => k === 'help').length).toBe(4);
  });

  it('is deterministic for the same seed', () => {
    const a = pickSession(7);
    const b = pickSession(7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('varies across seeds', () => {
    const a = JSON.stringify(pickSession(1));
    const b = JSON.stringify(pickSession(999));
    expect(a).not.toBe(b);
  });

  it('never repeats an emotion within a session', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const ids = pickSession(seed).map((r) => r.emotion.id);
      expect(new Set(ids).size).toBe(ROUNDS_PER_GAME);
    }
  });

  it('always includes the answer among three unique choices', () => {
    for (const seed of [5, 17, 99]) {
      for (const r of pickSession(seed)) {
        expect(r.choices.length).toBe(3);
        expect(new Set(r.choices).size).toBe(3);
        const answer = r.kind === 'name' ? r.emotion.name : r.emotion.comfortTip;
        expect(r.choices[r.answerIndex]).toBe(answer);
      }
    }
  });
});

describe('content hygiene', () => {
  it('has no emoji in any user-facing string the lib exports', async () => {
    // Walks every string reachable from the module's exports — emotion names,
    // kid definitions, scenarios, comfort tips — the exact copy the theater
    // speaks and shows. Stronger than scanning the source text: it covers
    // only strings that can actually reach the kid.
    const lib = await import('../lib/kid/feelings');
    const strings: string[] = [];
    const seen = new Set<unknown>();
    const walk = (v: unknown) => {
      if (typeof v === 'string') {
        strings.push(v);
        return;
      }
      if (v === null || typeof v !== 'object' || seen.has(v)) return;
      seen.add(v);
      for (const value of Object.values(v)) walk(value);
    };
    walk(lib);
    expect(strings.length).toBeGreaterThan(20);
    for (const s of strings) {
      expect(EMOJI_RE.test(s), `emoji in: ${s.slice(0, 60)}`).toBe(false);
    }
  });

  it('renders the theater intro with no emoji in the markup', async () => {
    const { default: FeelingsTheater } = await import(
      '@/components/kid/feelings-theater'
    );
    const { renderToString } = await import('react-dom/server');
    const { createElement } = await import('react');
    const html = renderToString(
      createElement(FeelingsTheater, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
    );
    expect(html).toContain('Feelings Theater');
    expect(EMOJI_RE.test(html)).toBe(false);
  });
});
