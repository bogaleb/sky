import { describe, expect, it, vi } from 'vitest';
// celebration.tsx re-exports the win layer from game-shell.tsx, which pulls
// in server actions — mock the server-only guard like game-shell.test.ts does.
vi.mock('server-only', () => ({}));
import { toPlannedStep, type ServerPlanItem } from '../lib/kid/types';
import { praiseFor, encourage } from '../components/kid/celebration';

const item: ServerPlanItem = {
  activity: { id: 'a1', kind: 'multiple_choice', level: 2, points: 10 },
  reason: 'new_learning',
  targetLevel: 2,
  card: {
    id: 'a1',
    skill_id: 's1',
    level: 2,
    kind: 'multiple_choice',
    prompt_text: 'Which one?',
    prompt_audio: null,
    card: { options: [{ id: 'o1', label: 'A' }], narration: 'Which one?' },
    points: 10,
  },
  skillName: 'Letters',
  subjectCode: 'reading',
  subjectName: 'Reading',
  islandName: 'The Floating Library',
  hostCharacter: 'luna',
};

describe('toPlannedStep', () => {
  it('maps server plan items to client-safe steps without answer keys', () => {
    const step = toPlannedStep(item);
    expect(step.activityId).toBe('a1');
    expect(step.kind).toBe('multiple_choice');
    expect(step.hostCharacter).toBe('luna');
    expect(step.islandName).toBe('The Floating Library');
    expect(step.card.prompt_text).toBe('Which one?');
    // The stripped card must not contain an answer key.
    expect(JSON.stringify(step.card)).not.toContain('answer');
  });

  it('passes through all seven activity kinds', () => {
    const kinds = ['multiple_choice', 'tap_target', 'tap_count', 'sequence', 'sort', 'trace', 'listen_repeat'] as const;
    for (const kind of kinds) {
      const step = toPlannedStep({ ...item, activity: { ...item.activity, kind } });
      expect(step.kind).toBe(kind);
    }
  });
});

describe('celebration copy', () => {
  it('praiseFor escalates with streak', () => {
    expect(praiseFor(6)).toBe('On fire!');
    expect(praiseFor(4)).toBe('Streak power!');
    expect(typeof praiseFor(1)).toBe('string');
  });

  it('encourage returns a gentle line', () => {
    expect(typeof encourage()).toBe('string');
  });
});

describe('card payload mapping', () => {
  it('expands tap_count sets into tappable objects', async () => {
    const { countObjectsFrom } = await import('../lib/kid/card-mapping');
    const objs = countObjectsFrom({ sets: [{ count: 3, label: 'apples' }] });
    expect(objs).toHaveLength(3);
    expect(objs[0].shape).toBe('apple');
    expect(new Set(objs.map((o) => o.id)).size).toBe(3);
  });

  it('singularizes count labels and falls back to star', async () => {
    const { shapeForCountLabel } = await import('../lib/kid/card-mapping');
    expect(shapeForCountLabel('apples')).toBe('apple');
    expect(shapeForCountLabel('fish')).toBe('fish');
    expect(shapeForCountLabel('puppies')).toBe('star'); // no puppy shape -> star
    expect(shapeForCountLabel('balloons')).toBe('star');
    expect(shapeForCountLabel('birds')).toBe('bird');
  });

  it('expands tap_count thing/total payloads (content-bank convention)', async () => {
    const { countObjectsFrom } = await import('../lib/kid/card-mapping');
    const objs = countObjectsFrom({
      thing: 'blue paint blobs',
      total: 3,
      narration: 'Oh no — the Paint sprites spilled! How many blue blobs do you see?',
    });
    expect(objs).toHaveLength(3);
    expect(objs[0].shape).toBe('blob');
    expect(new Set(objs.map((o) => o.id)).size).toBe(3);
  });

  it('clamps thing/total counts to the pond maximum', async () => {
    const { countObjectsFrom } = await import('../lib/kid/card-mapping');
    expect(countObjectsFrom({ thing: 'stars', total: 99 })).toHaveLength(12);
    expect(countObjectsFrom({ thing: 'stars', total: 0 })).toHaveLength(0);
    expect(countObjectsFrom({})).toHaveLength(0);
  });

  it('maps blob labels by keyword', async () => {
    const { shapeForCountLabel } = await import('../lib/kid/card-mapping');
    expect(shapeForCountLabel('blue paint blobs')).toBe('blob');
    expect(shapeForCountLabel('paint blob')).toBe('blob');
  });

  it('derives trace targets from prompt text', async () => {
    const { traceTargetFrom } = await import('../lib/kid/card-mapping');
    expect(traceTargetFrom('Trace the big letter A.')).toBe('A');
    expect(traceTargetFrom('Trace the little letter e.')).toBe('e');
    expect(traceTargetFrom('Trace the big tall line.')).toBe('big tall line');
    expect(traceTargetFrom('Trace m. Stay on the line!')).toBe('m');
    expect(traceTargetFrom("Trace the whole word 'cat' in one smooth motion.")).toBe('cat');
    expect(traceTargetFrom('Draw a rectangle like this one.')).toBe('circle');
    expect(traceTargetFrom('Scribble all over the sky with the wide brush!')).toBe('');
  });

  it('reads listen script from text or script keys', async () => {
    const { listenScriptFrom } = await import('../lib/kid/card-mapping');
    expect(listenScriptFrom({ text: 'Breathe in...' })).toBe('Breathe in...');
    expect(listenScriptFrom({ script: 'Say sunshine!' })).toBe('Say sunshine!');
    expect(listenScriptFrom({})).toBe('');
  });
});
