import { describe, expect, it } from 'vitest';
import {
  QUESTIONS,
  COUNTING_QUESTION,
  SOUND_QUESTION,
  SHAPE_QUESTION,
  PLACEMENT_LABELS,
  scorePlacement,
  placementStorageKey,
} from '../lib/kid/placement';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

describe('welcome quest placement', () => {
  it('has exactly three questions in play order', () => {
    expect(QUESTIONS).toHaveLength(3);
    expect(QUESTIONS.map((q) => q.kind)).toEqual(['counting', 'sound', 'shape']);
  });

  it('counting question is valid', () => {
    expect(COUNTING_QUESTION.count).toBeGreaterThanOrEqual(3);
    expect(COUNTING_QUESTION.count).toBeLessThanOrEqual(5);
    expect(COUNTING_QUESTION.choices).toHaveLength(3);
    expect(new Set(COUNTING_QUESTION.choices).size).toBe(3);
    expect(COUNTING_QUESTION.choices).toContain(COUNTING_QUESTION.count);
    expect(COUNTING_QUESTION.prompt.trim().length).toBeGreaterThan(5);
  });

  it('letter-sound question is valid', () => {
    expect(SOUND_QUESTION.letter).toHaveLength(1);
    expect(SOUND_QUESTION.choices).toHaveLength(3);
    expect(new Set(SOUND_QUESTION.choices).size).toBe(3);
    expect(SOUND_QUESTION.choices).toContain(SOUND_QUESTION.answer);
    expect(SOUND_QUESTION.prompt.trim().length).toBeGreaterThan(5);
  });

  it('shape question is valid', () => {
    expect(SHAPE_QUESTION.choices).toHaveLength(3);
    expect(new Set(SHAPE_QUESTION.choices).size).toBe(3);
    expect(SHAPE_QUESTION.choices).toContain(SHAPE_QUESTION.target);
    expect(['circle', 'triangle', 'square']).toContain(SHAPE_QUESTION.target);
  });

  it('scores 3 correct as level 3', () => {
    const r = scorePlacement([true, true, true]);
    expect(r.level).toBe(3);
    expect(r.correct).toBe(3);
    expect(r.label).toBe(PLACEMENT_LABELS[3]);
  });

  it('scores 2 correct as level 2', () => {
    for (const answers of [
      [true, true, false],
      [true, false, true],
      [false, true, true],
    ]) {
      const r = scorePlacement(answers);
      expect(r.level).toBe(2);
      expect(r.correct).toBe(2);
    }
  });

  it('scores 0 or 1 correct as level 1 (a warm welcome, never a failure)', () => {
    expect(scorePlacement([true, false, false]).level).toBe(1);
    expect(scorePlacement([false, false, false]).level).toBe(1);
    expect(scorePlacement([]).level).toBe(1);
  });

  it('every level has a distinct kid-friendly label', () => {
    const labels = Object.values(PLACEMENT_LABELS);
    expect(new Set(labels).size).toBe(3);
    for (const label of labels) {
      expect(label.trim().length).toBeGreaterThan(3);
      expect(EMOJI_RE.test(label)).toBe(false);
    }
  });

  it('placement content is emoji-free', () => {
    const texts = [
      COUNTING_QUESTION.prompt,
      SOUND_QUESTION.prompt,
      SOUND_QUESTION.letter,
      ...SOUND_QUESTION.choices,
      SHAPE_QUESTION.prompt,
    ];
    for (const t of texts) {
      expect(EMOJI_RE.test(t)).toBe(false);
    }
  });

  it('storage key is namespaced per child', () => {
    expect(placementStorageKey('abc')).toBe('sky-placement-abc');
    expect(placementStorageKey('abc')).not.toBe(placementStorageKey('xyz'));
  });
});
