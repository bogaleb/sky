import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Static tests (repo convention): activity-stage is a client component with
// no jsdom in this repo, so we assert the retry contract on source text.

const src = () =>
  readFileSync(join(__dirname, '..', 'components', 'kid', 'activity-stage.tsx'), 'utf8');

describe('activity-stage grading-failure retry (Wave 10)', () => {
  it('renders a non-reader-friendly retry state, not a dead screen', () => {
    const s = src();
    expect(s).toContain('Try again');
    expect(s).toContain('btn-kid');
    expect(s).toContain('role="alert"');
    expect(s).toContain('aria-live="assertive"');
  });

  it('announces the failure aloud via the host character voice', () => {
    const s = src();
    expect(s).toContain('speakAs');
    expect(s).toContain('step.hostCharacter');
  });

  it('remembers the last answer and re-submits it on retry', () => {
    const s = src();
    expect(s).toContain('lastAnswerRef');
    expect(s).toContain('retrySubmit');
    // The retry path reuses commit(), so grading logic is untouched.
    expect(s).toContain('void commit(lastAnswerRef.current)');
  });

  it('keeps server-side grading intact (onSubmit still awaited in try)', () => {
    const s = src();
    expect(s).toContain('await onSubmit(step.activityId, answer, latencyMs)');
  });

  it('resets the error state when a new activity arrives', () => {
    const s = src();
    expect(s).toContain('setSubmitError(false)');
  });

  it('has no emoji in the retry copy', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    const s = src();
    const retryBlock = s.slice(s.indexOf('submitError && !feedback'));
    expect(retryBlock).not.toMatch(emoji);
  });
});
