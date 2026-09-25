import { describe, expect, it } from 'vitest';
import {
  childSchema,
  loginSchema,
  nicknameSchema,
  pinSchema,
  signupSchema,
} from '../lib/validation';

describe('signupSchema', () => {
  it('accepts a valid email and strong password', () => {
    expect(
      signupSchema.safeParse({ email: 'parent@example.com', password: 'sunshine42' })
        .success
    ).toBe(true);
  });

  it('rejects bad emails and weak passwords', () => {
    expect(
      signupSchema.safeParse({ email: 'not-an-email', password: 'sunshine42' })
        .success
    ).toBe(false);
    expect(
      signupSchema.safeParse({ email: 'a@b.co', password: 'short1' }).success
    ).toBe(false);
    expect(
      signupSchema.safeParse({ email: 'a@b.co', password: 'nonumbershere' })
        .success
    ).toBe(false);
    expect(
      signupSchema.safeParse({ email: 'a@b.co', password: '12345678' }).success
    ).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires a non-empty password but no strength rules', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.co', password: 'whatever' }).success
    ).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(
      false
    );
  });
});

describe('pinSchema', () => {
  it('accepts 4–6 digits when both entries match', () => {
    expect(pinSchema.safeParse({ pin: '1234', confirm: '1234' }).success).toBe(true);
    expect(pinSchema.safeParse({ pin: '123456', confirm: '123456' }).success).toBe(
      true
    );
  });

  it('rejects non-digits, wrong lengths, and mismatches', () => {
    expect(pinSchema.safeParse({ pin: '123', confirm: '123' }).success).toBe(false);
    expect(pinSchema.safeParse({ pin: '1234567', confirm: '1234567' }).success).toBe(
      false
    );
    expect(pinSchema.safeParse({ pin: '12a4', confirm: '12a4' }).success).toBe(false);
    expect(pinSchema.safeParse({ pin: '1234', confirm: '4321' }).success).toBe(false);
  });
});

describe('nicknameSchema', () => {
  it('accepts ordinary nicknames and collapses whitespace', () => {
    expect(nicknameSchema.safeParse('Maya').success).toBe(true);
    const r = nicknameSchema.safeParse('  Sam   Rivera  ');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('Sam Rivera');
  });

  it('rejects empty, too-long, and hostile input', () => {
    expect(nicknameSchema.safeParse('').success).toBe(false);
    expect(nicknameSchema.safeParse('   ').success).toBe(false);
    expect(nicknameSchema.safeParse('a'.repeat(25)).success).toBe(false);
    expect(nicknameSchema.safeParse('<script>alert(1)</script>').success).toBe(false);
    expect(nicknameSchema.safeParse('Maya; DROP TABLE').success).toBe(false);
  });

  it('allows hyphens and apostrophes', () => {
    expect(nicknameSchema.safeParse("O'Brien").success).toBe(true);
    expect(nicknameSchema.safeParse('Anne-Marie').success).toBe(true);
  });
});

describe('childSchema', () => {
  it('accepts a complete valid profile', () => {
    expect(
      childSchema.safeParse({
        nickname: 'Milo',
        avatar_id: 'bea',
        age_band: '5-6',
      }).success
    ).toBe(true);
  });

  it('rejects unknown avatars and age bands', () => {
    expect(
      childSchema.safeParse({
        nickname: 'Milo',
        avatar_id: 'spongebob',
        age_band: '5-6',
      }).success
    ).toBe(false);
    expect(
      childSchema.safeParse({
        nickname: 'Milo',
        avatar_id: 'bea',
        age_band: '9-10',
      }).success
    ).toBe(false);
  });
});
