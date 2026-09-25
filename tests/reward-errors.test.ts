import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_BUFFERED_REWARD_ERRORS,
  createRewardErrorBuffer,
} from '../lib/kid/reward-errors';

const learningSrc = () =>
  readFileSync(join(__dirname, '..', 'app', 'actions', 'learning.ts'), 'utf8');

describe('createRewardErrorBuffer (pure, DOM-free)', () => {
  it('buffers entries up to the cap, dropping the oldest first', () => {
    const buf = createRewardErrorBuffer();
    for (let i = 0; i < MAX_BUFFERED_REWARD_ERRORS + 5; i += 1) {
      buf.push('child-1', 'awardStars', new Error(`boom ${i}`));
    }
    expect(buf.size()).toBe(MAX_BUFFERED_REWARD_ERRORS);
    const drained = buf.drain();
    expect(drained).toHaveLength(MAX_BUFFERED_REWARD_ERRORS);
    expect(drained[0].message).toBe('boom 5'); // oldest five dropped
    expect(drained[MAX_BUFFERED_REWARD_ERRORS - 1].message).toBe(
      `boom ${MAX_BUFFERED_REWARD_ERRORS + 4}`,
    );
    expect(buf.size()).toBe(0);
  });

  it('drain empties the buffer', () => {
    const buf = createRewardErrorBuffer();
    buf.push('c', 'stickers', 'plain string failure');
    expect(buf.drain()).toHaveLength(1);
    expect(buf.drain()).toHaveLength(0);
  });

  it('stringifies Error objects and truncates long messages', () => {
    const buf = createRewardErrorBuffer();
    buf.push('c', 'trophies', new Error('kaboom'));
    buf.push('c', 'trophies', 'x'.repeat(1000));
    const [first, second] = buf.drain();
    expect(first.message).toBe('kaboom');
    expect(second.message).toHaveLength(500);
    expect(first.step).toBe('trophies');
    expect(first.childId).toBe('c');
    expect(typeof first.at).toBe('number');
  });

  it('handles non-Error, non-string values without throwing', () => {
    const buf = createRewardErrorBuffer();
    expect(() => {
      buf.push('c', 'quest', undefined);
      buf.push('c', 'quest', { code: 500 });
      buf.push('c', 'quest', null);
    }).not.toThrow();
    expect(buf.size()).toBe(3);
  });
});

describe('reward_error event kind wiring (static)', () => {
  it('is an accepted learning_events kind', () => {
    expect(learningSrc()).toContain("'reward_error'");
  });

  it('exposes a never-throwing logRewardError server action', () => {
    const src = learningSrc();
    expect(src).toContain('export async function logRewardError');
  });

  it('documents the Track 1 contract in the client module', () => {
    const src = readFileSync(join(__dirname, '..', 'lib', 'kid', 'reward-errors.ts'), 'utf8');
    expect(src).toContain('export function reportRewardError');
    expect(src).toContain('game-shell');
    expect(src).toContain('MAX_BUFFERED_REWARD_ERRORS');
  });
});
