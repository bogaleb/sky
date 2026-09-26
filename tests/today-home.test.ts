import { describe, expect, it } from 'vitest';
import { AGE_PROFILES, ageProfile } from '../lib/kid/age-profile';
import { GAME_META, gameFitsAge } from '../lib/kid/game-catalog';
import { isGameSkillCode } from '../lib/kid/game-skills';
import { buildGarden, plantFor, plantLine, type SkillMasterySnapshot } from '../lib/kid/garden';
import { buildToday, skillsByNeed } from '../lib/kid/today';
import { INITIAL_TEACH, supportReached, teachReducer, type TeachLines } from '../lib/kid/teaching';
import { RHYME_SETS, pickSession, rhymeLines } from '../lib/kid/rhymes';
import { generateQuestion as timeQuestion, timeLines } from '../lib/kid/time';
import { generateQuestion as moneyQuestion, moneyLines } from '../lib/kid/money';
import { GAME_REGISTRY, VISIBLE_GAMES } from '../components/kid/game-registry';

const NOW = new Date(2026, 8, 26, 10, 0, 0);
const games = GAME_REGISTRY.map((g) => ({ id: g.id, group: g.group, hidden: g.hidden }));

function skill(code: string, subject: string, over: Partial<SkillMasterySnapshot> = {}): SkillMasterySnapshot {
  return { code, subject, status: null, currentLevel: 1, nextReviewAt: null, lastPracticedAt: null, ...over };
}

describe('age profiles', () => {
  it('get simpler and bigger for younger children', () => {
    const [p3, p5, p7] = [AGE_PROFILES['3-4'], AGE_PROFILES['5-6'], AGE_PROFILES['7-8']];
    expect(p3.minTarget).toBeGreaterThan(p5.minTarget);
    expect(p5.minTarget).toBeGreaterThan(p7.minTarget);
    expect(p3.pathLength).toBeLessThanOrEqual(p5.pathLength);
    expect(p3.tileText).toBe('none'); // pre-readers: pictures and voice
    expect(p3.autoNarrate).toBe(true);
    expect(p7.showLibrary).toBe(true);
    expect(p3.showLibrary).toBe(false);
    expect(p3.gardenSubjects.length).toBeLessThan(p7.gardenSubjects.length);
  });

  it('falls back to the middle profile for unknown bands', () => {
    expect(ageProfile(undefined).band).toBe('5-6');
    expect(ageProfile(null).band).toBe('5-6');
  });
});

describe('game catalog', () => {
  it('describes every registered game', () => {
    for (const g of GAME_REGISTRY) {
      const meta = GAME_META[g.id];
      expect(meta, g.id).toBeDefined();
      expect(meta.say.length, `${g.id} say`).toBeGreaterThan(10);
      expect(meta.ages.length, `${g.id} ages`).toBeGreaterThan(0);
      for (const s of meta.skills) expect(isGameSkillCode(s), `${g.id} ${s}`).toBe(true);
    }
  });

  it('keeps age-inappropriate games away from the youngest', () => {
    expect(gameFitsAge('fractions', '3-4')).toBe(false);
    expect(gameFitsAge('time', '3-4')).toBe(false);
    expect(gameFitsAge('rhymes', '3-4')).toBe(true);
    // Every band has plenty to play.
    for (const band of ['3-4', '5-6', '7-8'] as const) {
      expect(VISIBLE_GAMES.filter((g) => gameFitsAge(g.id, band)).length, band).toBeGreaterThan(15);
    }
  });
});

describe('growth garden', () => {
  it('grows from seed to bloom with mastery', () => {
    const math = (status: SkillMasterySnapshot['status'], level = 1) => [
      skill('count', 'math', { status, currentLevel: level }),
      skill('add', 'math', { status, currentLevel: level }),
    ];
    expect(plantFor('math', math(null)).stage).toBe(0);
    expect(plantFor('math', math('emerging')).stage).toBe(1);
    expect(plantFor('math', math('developing')).stage).toBe(2);
    expect(plantFor('math', math('proficient', 2)).stage).toBe(3);
    expect(plantFor('math', math('mastered', 5)).stage).toBe(4);
  });

  it('always shows mastery (a mastered skill is at least a bud)', () => {
    const skills = [skill('count', 'math', { status: 'mastered', currentLevel: 5 }), ...['a', 'b', 'c', 'd', 'e'].map((c) => skill(c, 'math'))];
    expect(plantFor('math', skills).stage).toBeGreaterThanOrEqual(3);
  });

  it('builds one plant per profile subject and speaks without numbers', () => {
    const garden = buildGarden(AGE_PROFILES['3-4'].gardenSubjects, []);
    expect(garden.map((p) => p.subject)).toEqual(AGE_PROFILES['3-4'].gardenSubjects);
    expect(plantLine('math', garden[0])).toMatch(/seed/);
    expect(plantLine('math', garden[0])).not.toMatch(/\d/);
  });
});

describe("today's path", () => {
  it('starts with a lesson and ends with a calm or creative stop, sized by age', () => {
    for (const band of ['3-4', '5-6', '7-8'] as const) {
      const profile = AGE_PROFILES[band];
      const { path } = buildToday({ profile, games, skills: [], now: NOW });
      expect(path, band).toHaveLength(profile.pathLength);
      expect(path[0].kind).toBe('lesson');
      expect(['story', 'create']).toContain(path[path.length - 1].reason);
    }
  });

  it('only offers age-appropriate games and interleaves subjects', () => {
    for (const band of ['3-4', '5-6', '7-8'] as const) {
      const { path, shelf } = buildToday({ profile: AGE_PROFILES[band], games, skills: [], now: NOW });
      const gameStops = path.filter((s) => s.kind === 'game');
      for (const s of gameStops) expect(gameFitsAge(s.gameId!, band), `${band} ${s.gameId}`).toBe(true);
      for (const id of shelf) expect(gameFitsAge(id, band), `${band} shelf ${id}`).toBe(true);
      const groups = gameStops.map((s) => GAME_REGISTRY.find((g) => g.id === s.gameId)!.group);
      expect(new Set(groups).size).toBe(groups.length);
      // The shelf never repeats a path game.
      for (const s of gameStops) expect(shelf).not.toContain(s.gameId);
    }
  });

  it('sends the child to the skill that is due for review first', () => {
    const skills = [
      skill('count', 'math', { status: 'proficient', nextReviewAt: '2026-09-30T00:00:00Z' }),
      skill('rhyming', 'reading', { status: 'developing', nextReviewAt: '2026-09-20T00:00:00Z' }),
    ];
    const { path } = buildToday({ profile: AGE_PROFILES['5-6'], games, skills, now: NOW });
    expect(path[1]).toMatchObject({ kind: 'game', gameId: 'rhymes', reason: 'review', skill: 'rhyming' });
  });

  it('orders need: overdue reviews, then weak skills; never mastered ones', () => {
    const order = skillsByNeed(
      [
        skill('a', 'math', { status: 'mastered', nextReviewAt: '2026-01-01T00:00:00Z' }),
        skill('b', 'math', { status: 'emerging' }),
        skill('c', 'math', { status: 'proficient', nextReviewAt: '2026-09-01T00:00:00Z' }),
      ],
      NOW
    ).map((s) => s.code);
    expect(order).toEqual(['c', 'b']);
  });

  it('is stable within a day', () => {
    const a = buildToday({ profile: AGE_PROFILES['7-8'], games, skills: [], now: NOW });
    const b = buildToday({ profile: AGE_PROFILES['7-8'], games, skills: [], now: new Date(2026, 8, 26, 18) });
    expect(a).toEqual(b);
  });
});

describe('teaching feedback ladder', () => {
  const lines: TeachLines = { hint: 'look at the end', explain: 'cat and hat both end in at', praise: 'yes' };
  const wrong = (s = INITIAL_TEACH, key = 'x', hintAfter = 1, showMeAfter = 2) =>
    teachReducer(s, { type: 'wrong', key, lines, hintAfter, showMeAfter });

  it('hint first, then a worked example', () => {
    const one = wrong();
    expect(one).toMatchObject({ mode: 'hint', wrong: 1, message: lines.hint, tried: ['x'] });
    const two = wrong(one, 'y');
    expect(two).toMatchObject({ mode: 'show', wrong: 2, message: lines.explain, tried: ['x', 'y'] });
    expect(supportReached(INITIAL_TEACH, one)).toBe('hint_used');
    expect(supportReached(one, two)).toBe('show_me');
    expect(supportReached(two, wrong(two, 'z'))).toBeNull(); // no duplicate logging
  });

  it('respects the profile thresholds and resets per item', () => {
    const s = wrong(INITIAL_TEACH, 'x', 1, 3);
    expect(wrong(s, 'y', 1, 3).mode).toBe('hint');
    expect(teachReducer(s, { type: 'correct', lines }).mode).toBe('correct');
    expect(teachReducer(s, { type: 'reset' })).toEqual(INITIAL_TEACH);
  });
});

describe('teaching lines', () => {
  it('rhyme hints never give the answer; explanations always do', () => {
    for (const r of pickSession(42)) {
      const l = rhymeLines(r);
      expect(l.hint.toLowerCase(), r.answer).not.toMatch(new RegExp(`\\b${r.answer}\\b`));
      expect(l.explain).toContain(r.answer);
    }
  });

  it('clock explanations read the hands and end on the answer', () => {
    for (const level of [1, 2, 3] as const) {
      for (let seed = 1; seed < 25; seed++) {
        const q = timeQuestion(level, seed);
        const l = timeLines(q);
        expect(l.hint).not.toContain(q.answer);
        expect(l.explain).toContain(q.answer);
        expect(l.explain).toMatch(/long hand/);
      }
    }
  });

  it('money explanations count on from the biggest coin to the answer', () => {
    for (const level of [1, 2, 3] as const) {
      for (let seed = 1; seed < 25; seed++) {
        const q = moneyQuestion(level, seed);
        const l = moneyLines(q);
        expect(l.explain).toContain(`${q.answer} cent`);
        const counts = l.explain.match(/first: ([\d, ]+)\./)![1].split(', ').map(Number);
        expect(counts[counts.length - 1]).toBe(q.answer);
        for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]);
      }
    }
  });
});

describe('rhyme content', () => {
  // Words that rhyme by sound but not by spelling of the family.
  const SOUND_ALIKE = new Set(['kite', 'bread', 'whale', 'door', 'floor']);
  it('every listed rhyme really rhymes, and no word is both rhyme and non-rhyme', () => {
    for (const set of RHYME_SETS) {
      const ending = set.family.replace(/^-/, '');
      expect(set.prompt.endsWith(ending), set.prompt).toBe(true);
      for (const w of set.rhymes) {
        expect(w.endsWith(ending) || SOUND_ALIKE.has(w), `${w} should rhyme with ${set.prompt}`).toBe(true);
        expect(set.nonRhymes, `${w} in ${set.prompt}`).not.toContain(w);
      }
      for (const w of set.nonRhymes) expect(w.endsWith(ending), `${w} must not rhyme with ${set.prompt}`).toBe(false);
    }
  });
});

describe('worked example timing', () => {
  it('always arrives while a real choice remains', async () => {
    const { effectiveShowMeAfter } = await import('../components/kid/game-frame');
    // 7–8 waits for 3 wrong answers — but with 3 choices, only 2 wrong are possible.
    expect(effectiveShowMeAfter(AGE_PROFILES['7-8'], 3)).toBe(2);
    expect(effectiveShowMeAfter(AGE_PROFILES['7-8'], 5)).toBe(3);
    expect(effectiveShowMeAfter(AGE_PROFILES['5-6'], 3)).toBe(2);
    // Never earlier than the hint.
    expect(effectiveShowMeAfter({ hintAfter: 1, showMeAfter: 3 }, 2)).toBe(1);
    expect(effectiveShowMeAfter(AGE_PROFILES['7-8'])).toBe(3);
  });
});
