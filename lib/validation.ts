import { z } from 'zod';
import { AGE_BANDS, AVATAR_IDS } from './avatars';

const email = z
  .string()
  .trim()
  .min(1, { message: 'Enter your email address.' })
  .email({ message: 'That email address does not look right.' })
  .max(254, { message: 'That email address is too long.' });

const password = z
  .string()
  .min(8, { message: 'Use at least 8 characters.' })
  .max(128, { message: 'That password is too long.' })
  .regex(/[A-Za-z]/, { message: 'Include at least one letter.' })
  .regex(/[0-9]/, { message: 'Include at least one number.' });

export const signupSchema = z.object({ email, password });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'Enter your password.' }).max(128),
});

const pinDigits = z
  .string()
  .regex(/^\d{4,6}$/, { message: 'The PIN is 4 to 6 digits.' });

export const pinSchema = z
  .object({ pin: pinDigits, confirm: pinDigits })
  .refine((v) => v.pin === v.confirm, {
    message: 'The two PINs do not match.',
    path: ['confirm'],
  });

// Nicknames are the only personal data a child has in Sky (COPPA: minimal).
// Letters, numbers, spaces, hyphens and apostrophes; 1–24 chars after trim.
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Give your child a nickname.' })
  .max(24, { message: 'Keep the nickname under 24 characters.' })
  .regex(/^[A-Za-z0-9'’\- ]+$/, {
    message: 'Use letters, numbers, spaces, hyphens or apostrophes.',
  })
  .transform((v) => v.replace(/\s+/g, ' '));

export const childSchema = z.object({
  nickname: nicknameSchema,
  avatar_id: z.enum(AVATAR_IDS, { message: 'Pick an avatar.' }),
  age_band: z.enum(AGE_BANDS, { message: 'Pick an age band.' }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChildInput = z.infer<typeof childSchema>;
