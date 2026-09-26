import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GAME_SKILL_CODES, isGameSkillCode, type GameAttempt } from '../lib/kid/game-skills';
import { createAttemptBuffer } from '../lib/kid/attempt-buffer';
import { generateRound, skillForRound, NUM_LEVELS } from '../lib/kid/numbers';
import { ALL_PHONICS, skillForPhonics } from '../lib/kid/phonics';
import { WORDS, buildWordsLevel } from '../lib/kid/words';
import { OPPOSITE_PAIRS, oppositeSkillLevel } from '../lib/kid/opposites';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migDir = join(root, 'supabase', 'migrations');
const allSql = readdirSync(migDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(migDir, f), 'utf8'))
  .join('\n');

// Skill codes seeded by the migrations: ('subject', 'code', 'Name', ...
const seededCodes = new Set(
  [...allSql.matchAll(/\(\s*'[a-z]+',\s*'([a-z_]+)',\s*'[^']+',/g)].map((m) => m[1])
);

describe('game skill codes', () => {
  it('every code a game can report exists in the skills taxonomy', () => {
    // record_game_attempts rejects unknown skills, which would drop the batch.
    const missing = GAME_SKILL_CODES.filter((c) => !seededCodes.has(c));
    expect(missing).toEqual([]);
  });

  it('every skill used by a game component is a known game skill code', () => {
    const kidDir = join(root, 'components', 'kid');
    const used = new Set<string>();
    for (const f of readdirSync(kidDir).filter((f) => f.endsWith('.tsx'))) {
      const src = readFileSync(join(kidDir, f), 'utf8');
      for (const m of src.matchAll(/skill:\s*'([a-z_]+)'/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(10);
    expect([...used].filter((c) => !isGameSkillCode(c))).toEqual([]);
  });
});

describe('item -> skill evidence mappings', () => {
  it('number rounds map to a real skill at a sane level', () => {
    for (const lv of NUM_LEVELS) {
      for (let seed = 1; seed < 40; seed++) {
        const { skill, level } = skillForRound(generateRound(lv, seed));
        expect(isGameSkillCode(skill)).toBe(true);
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(5);
      }
    }
    expect(skillForRound(generateRound(3, 7)).skill).toBe('add');
    expect(skillForRound(generateRound(4, 7)).skill).toBe('subtract');
  });

  it('phonics: blends count toward blending, sight words toward sight_words', () => {
    for (const w of ALL_PHONICS) {
      const { skill } = skillForPhonics(w);
      expect(skill).toBe(w.level === 3 ? 'sight_words' : 'blending');
    }
  });

  it('spelling and opposites levels stay within 1–5', () => {
    for (const w of WORDS) expect([2, 3]).toContain(buildWordsLevel(w));
    for (const p of OPPOSITE_PAIRS) expect([2, 3]).toContain(oppositeSkillLevel(p.word));
  });
});

describe('attempt buffer', () => {
  function setup(flushAt = 3) {
    const sent: GameAttempt[][] = [];
    let fail = false;
    let t = 0;
    const buffer = createAttemptBuffer({
      flushAt,
      now: () => t,
      send: async (batch) => {
        if (fail) throw new Error('offline');
        sent.push(batch);
      },
    });
    return {
      buffer,
      sent,
      tick: (ms: number) => (t += ms),
      setFail: (v: boolean) => (fail = v),
    };
  }

  it('batches answers and flushes at the threshold', async () => {
    const { buffer, sent, tick } = setup(3);
    tick(1000);
    buffer.add({ skill: 'add', correct: true });
    tick(2000);
    buffer.add({ skill: 'add', correct: false });
    expect(sent).toHaveLength(0);
    buffer.add({ skill: 'count', correct: true, level: 2 });
    await buffer.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0].map((a) => a.latency_ms)).toEqual([1000, 2000, 0]);
    expect(sent[0][2]).toMatchObject({ skill: 'count', correct: true, level: 2 });
  });

  it('treats long gaps as breaks, not latency', async () => {
    const { buffer, sent, tick } = setup(1);
    tick(10 * 60 * 1000);
    buffer.add({ skill: 'add', correct: true });
    await buffer.flush();
    expect(sent[0][0].latency_ms).toBeUndefined();
  });

  it('keeps answers after a failed send and delivers them later', async () => {
    const { buffer, sent, setFail } = setup(10);
    setFail(true);
    buffer.add({ skill: 'add', correct: true });
    buffer.add({ skill: 'add', correct: false });
    await buffer.flush();
    expect(sent).toHaveLength(0);
    expect(buffer.size).toBe(2);
    setFail(false);
    await buffer.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toHaveLength(2);
    expect(buffer.size).toBe(0);
  });

  it('caps backlog so a dead network cannot grow memory', async () => {
    const { buffer, sent, setFail } = setup(1000);
    setFail(true);
    for (let i = 0; i < 200; i++) buffer.add({ skill: 'add', correct: i >= 150 });
    expect(buffer.size).toBe(200);
    await buffer.flush();
    // One batch (50) of backlog is kept: the newest answers.
    expect(buffer.size).toBe(50);
    setFail(false);
    await buffer.flush();
    expect(buffer.size).toBe(0);
    expect(sent.flat().every((a) => a.correct)).toBe(true);
  });
});
