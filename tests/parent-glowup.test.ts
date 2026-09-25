import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Wave 9 parent zone glow-up: the parent side adopts the Wave 8 design-system
// contract (font-display, glass-kid, btn-kid, card-kid, SkyBackdrop) in a
// parent-appropriate way, while every flow stays byte-identical:
// PIN gate logic, auth server actions, profile one-tap flow, dashboard
// section order. No emoji on any parent surface.
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const ui = read('components/ui.tsx');
const authForm = read('components/auth-form.tsx');
const pinGate = read('components/parent/pin-gate.tsx');
const dashboard = read('components/parent/dashboard.tsx');
const profiles = read('app/profiles/page.tsx');
const weeklyGoals = read('components/parent/weekly-goals.tsx');
const familyBoard = read('components/parent/family-leaderboard.tsx');
const reportCard = read('components/parent/report-card.tsx');
const playCards = read('components/parent/play-cards.tsx');
const certificate = read('components/parent/certificate.tsx');

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;
const PARENT_FILES = {
  ui, authForm, pinGate, dashboard, profiles, weeklyGoals, familyBoard, reportCard, playCards, certificate,
};

describe('parent glow-up design contract', () => {
  it('uses font-display headings across parent surfaces', () => {
    for (const [name, src] of Object.entries({ authForm, pinGate, dashboard, profiles, weeklyGoals, familyBoard, certificate })) {
      expect(src, name).toContain('font-display');
    }
  });

  it('uses card-kid on parent content panels', () => {
    for (const [name, src] of Object.entries({ ui, dashboard, weeklyGoals, familyBoard, reportCard, playCards, profiles })) {
      expect(src, name).toContain('card-kid');
    }
  });

  it('uses btn-kid for parent primary actions', () => {
    expect(ui).toContain('btn-kid');
    expect(pinGate).toContain('btn-kid');
    expect(dashboard).toContain('btn-kid');
    expect(weeklyGoals).toContain('btn-kid');
    expect(certificate).toContain('btn-kid');
  });

  it('floats parent pages over the ambient SkyBackdrop (once per page)', () => {
    for (const [name, src] of Object.entries({ ui, pinGate, dashboard, profiles })) {
      expect(src, name).toContain('SkyBackdrop');
      const renders = (src.match(/<SkyBackdrop \/>/g) ?? []).length;
      expect(renders, `${name} renders backdrop once`).toBe(1);
    }
  });

  it('keeps parent brand tokens for continuity', () => {
    for (const [name, src] of Object.entries(PARENT_FILES)) {
      expect(src, name).toMatch(/parent-sky|parent-ink/);
    }
  });

  it('adds no emoji to any parent surface', () => {
    for (const [name, src] of Object.entries(PARENT_FILES)) {
      expect(src.replace(EMOJI, ''), name).not.toMatch(EMOJI);
    }
  });
});

describe('parent flows unchanged (visual pass only)', () => {
  it('keeps the PIN gate logic byte-identical', () => {
    expect(pinGate).toContain('verifyParentZonePin');
    expect(pinGate).toContain("sessionStorage.setItem('sky_parent_zone', 'unlocked')");
    expect(pinGate).toContain('/^\\d{4,6}$/');
    expect(pinGate).toContain('onUnlocked()');
  });

  it('keeps auth form behavior and server actions', () => {
    expect(authForm).toContain('useActionState');
    expect(authForm).toContain('signIn');
    expect(authForm).toContain('signUp');
    expect(authForm).toContain('needsConfirmation');
    expect(authForm).toContain('name="email"');
    expect(authForm).toContain('name="password"');
    expect(authForm).toContain('Welcome back');
    expect(authForm).toContain('Create your parent account');
    expect(authForm).toContain('Check your inbox');
  });

  it('keeps the profile picker one-tap flow with ProfileAvatar', () => {
    expect(profiles).toContain('ProfileAvatar');
    expect(profiles).toContain('action={selectProfile}');
    expect(profiles).toContain('name="child_id"');
    expect(profiles).toContain('Who is playing?');
    expect(profiles).toContain('Tap your face to start.');
  });

  it('keeps every dashboard section in order', () => {
    // ChildReport's internal render order (defined before Dashboard in the file).
    const childReport = dashboard.slice(
      dashboard.indexOf('function ChildReport'),
      dashboard.indexOf('/** The parent dashboard')
    );
    const childOrder = [
      'Weekly digest',
      'WeeklyGoals',
      'Celebrate',
      'ReportCard',
      'Suggested focus',
      'Skill mastery',
      'Learning by subject',
      'Recent activity',
    ];
    let last = -1;
    for (const heading of childOrder) {
      const idx = childReport.indexOf(heading);
      expect(idx, heading).toBeGreaterThan(-1);
      expect(idx, `${heading} order`).toBeGreaterThan(last);
      last = idx;
    }
    // Dashboard shell render order.
    const shell = dashboard.slice(dashboard.indexOf('export default function Dashboard'));
    const shellOrder = ['Learning reports', 'Back to profiles', 'Lock', 'ChildReport', 'FamilyLeaderboard', 'PlayCards'];
    last = -1;
    for (const heading of shellOrder) {
      const idx = shell.indexOf(heading);
      expect(idx, heading).toBeGreaterThan(-1);
      expect(idx, `${heading} order`).toBeGreaterThan(last);
      last = idx;
    }
  });

  it('keeps dashboard data wiring (no logic changes)', () => {
    expect(dashboard).toContain('getDashboardData');
    expect(dashboard).toContain('getWeeklyDigest');
    expect(dashboard).toContain('FamilyLeaderboard');
    expect(dashboard).toContain('PlayCards');
    expect(dashboard).toContain('ReportCard');
  });
});
