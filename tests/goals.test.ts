import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { weekStartMonday, clampTarget, goalReached } from '../lib/kid/goals';

describe('weekStartMonday', () => {
  it('returns the Monday of the week for a Friday (2026-09-25)', () => {
    expect(weekStartMonday(new Date('2026-09-25T12:00:00Z'))).toBe('2026-09-21');
  });

  it('returns the same day for a Monday', () => {
    expect(weekStartMonday(new Date('2026-09-21T12:00:00Z'))).toBe('2026-09-21');
  });

  it('rolls a Sunday back to the previous Monday', () => {
    expect(weekStartMonday(new Date('2026-09-27T12:00:00Z'))).toBe('2026-09-21');
  });

  it('handles a Saturday', () => {
    expect(weekStartMonday(new Date('2026-09-26T12:00:00Z'))).toBe('2026-09-21');
  });

  it('crosses a month boundary correctly', () => {
    // 2026-10-01 is a Thursday; Monday is 2026-09-28.
    expect(weekStartMonday(new Date('2026-10-01T12:00:00Z'))).toBe('2026-09-28');
  });

  it('returns YYYY-MM-DD format', () => {
    expect(weekStartMonday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('clampTarget', () => {
  it('keeps sane values', () => {
    expect(clampTarget(5)).toBe(5);
    expect(clampTarget(1)).toBe(1);
    expect(clampTarget(20)).toBe(20);
  });

  it('rounds fractional targets', () => {
    expect(clampTarget(4.6)).toBe(5);
  });

  it('clamps out-of-range targets', () => {
    expect(clampTarget(0)).toBe(1);
    expect(clampTarget(-3)).toBe(1);
    expect(clampTarget(100)).toBe(20);
  });

  it('falls back to 5 for non-finite input', () => {
    expect(clampTarget(NaN)).toBe(5);
    expect(clampTarget(Infinity)).toBe(5);
  });
});

describe('goalReached', () => {
  it('is true at or above the target', () => {
    expect(goalReached(5, 5)).toBe(true);
    expect(goalReached(9, 5)).toBe(true);
  });

  it('is false below the target', () => {
    expect(goalReached(3, 5)).toBe(false);
    expect(goalReached(0, 5)).toBe(false);
  });

  it('is false for a non-positive target', () => {
    expect(goalReached(0, 0)).toBe(false);
  });
});

describe('parent_goals migration', () => {
  const sql = readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '20260925000900_parent_goals.sql'),
    'utf8'
  );

  it('creates the parent_goals table with the required columns', () => {
    expect(sql).toMatch(/create table (if not exists )?public\.parent_goals/);
    expect(sql).toContain('child_id uuid primary key');
    expect(sql).toContain('references public.children (id) on delete cascade');
    expect(sql).toContain('week_start date not null');
    expect(sql).toContain('target int not null default 5');
    expect(sql).toContain('celebrated boolean');
  });

  it('enables RLS with a parent-ownership policy', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('parent_id = auth.uid()');
  });
});
