// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  MAX_BUFFERED_REWARD_ERRORS,
  createRewardErrorBuffer,
  reportRewardError,
} from '../lib/kid/reward-errors';

vi.mock('server-only', () => ({}));

// Fake Supabase: the auth user owns child c1; rpc('log_event') records its
// args so we can assert the reward_error event payload end to end.
const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];
let rpcImpl: (args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> =
  async () => ({ data: 'event-1', error: null });

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    const chain = (result: unknown) => {
      const q: Record<string, unknown> = {
        select: () => q,
        eq: () => q,
        single: async () => result,
        insert: async () => result,
      };
      return q;
    };
    return {
      auth: { getUser: async () => ({ data: { user: { id: 'parent-1' } }, error: null }) },
      from: (table: string) =>
        table === 'children'
          ? chain({ data: { id: 'c1', age_band: '4-5' }, error: null })
          : chain({ data: null, error: null }),
      rpc: async (fn: string, args: Record<string, unknown>) => {
        rpcCalls.push({ fn, args });
        return rpcImpl(args);
      },
    };
  }),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  rpcCalls.length = 0;
  rpcImpl = async () => ({ data: 'event-1', error: null });
  vi.useRealTimers();
  // Warm the server-action module so the client's dynamic import resolves
  // from cache during the timed flush below.
  await import('@/app/actions/learning');
});

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

describe('client → server reward-error pipeline', () => {
  it('reportRewardError flushes to a reward_error learning event', async () => {
    // The client-side buffer flushes on a timer via a dynamic import of the
    // server action — drive the whole chain with fake timers.
    vi.useFakeTimers();
    reportRewardError('c1', 'awardStars', new Error('boom'));
    await vi.advanceTimersByTimeAsync(50);

    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe('log_event');
    expect(rpcCalls[0].args).toMatchObject({
      p_child_id: 'c1',
      p_event_type: 'reward_error',
    });
    expect(rpcCalls[0].args.p_metadata).toMatchObject({
      step: 'awardStars',
      message: 'boom',
    });

    // The buffer was drained: no duplicate event on a later flush.
    await vi.advanceTimersByTimeAsync(1000);
    expect(rpcCalls).toHaveLength(1);
    vi.useRealTimers();
  });

  it('reportRewardError never throws and stays silent on server failure', async () => {
    rpcImpl = async () => ({ data: null, error: new Error('db down') });
    vi.useFakeTimers();
    expect(() => reportRewardError('c1', 'trophies', { code: 500 })).not.toThrow();
    await vi.advanceTimersByTimeAsync(50);
    // Best-effort: the flush ran (and swallowed the failure) without
    // crashing the test or leaving a buffered retry.
    expect(rpcCalls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(rpcCalls).toHaveLength(1);
    vi.useRealTimers();
  });

  it('logRewardError accepts the reward_error kind directly', async () => {
    const { logRewardError } = await import('@/app/actions/learning');
    await expect(logRewardError('c1', 'stickers', 'kaboom')).resolves.toBeUndefined();
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].args.p_event_type).toBe('reward_error');
    expect(rpcCalls[0].args.p_metadata).toMatchObject({
      step: 'stickers',
      message: 'kaboom',
    });
  });

  it('logRewardError truncates long messages like the client buffer', async () => {
    const { logRewardError } = await import('@/app/actions/learning');
    await logRewardError('c1', 'quest', 'x'.repeat(1000));
    const meta = rpcCalls[0].args.p_metadata as { message: string };
    expect(meta.message).toHaveLength(500);
  });
});
