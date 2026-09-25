import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import SkyBackdrop from '@/components/kid/sky-backdrop';

// Parent-facing UI primitives. Calm, high-contrast, generous touch targets.
// Wave 9 glow-up: primary actions use the Wave 8 design-system button,
// cards get the elevated card-kid treatment, and PageShell floats over the
// ambient SkyBackdrop — the premium companion to the kid app.

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'btn-kid btn-kid-sky',
    secondary:
      'bg-white text-parent-sky-700 border border-parent-sky-200 hover:bg-parent-sky-50',
    ghost: 'bg-transparent text-parent-ink-600 hover:bg-parent-sky-100',
    danger: 'bg-parent-rose-600 text-white hover:brightness-95',
  };
  const sizes: Record<string, string> = {
    md: 'px-5 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-parent-pill font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, ...props }: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div className="w-full">
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-sm font-semibold text-parent-ink-900"
      >
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-base text-parent-ink-900 placeholder:text-parent-ink-400 ${
          error ? 'border-parent-rose-600' : 'border-parent-sky-200'
        }`}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-parent-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-parent-ink-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-kid rounded-parent-card border border-parent-sky-100 bg-white p-6 shadow-[0_8px_30px_rgba(18,60,96,0.08)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl border border-parent-rose-600/30 bg-parent-rose-600/5 px-4 py-3 text-sm font-medium text-parent-rose-600"
    >
      {message}
    </p>
  );
}

// Narrow centered shell for auth / onboarding steps — floats over the
// ambient SkyBackdrop for a premium first impression.
export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <SkyBackdrop />
      <div className={`relative z-10 w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>{children}</div>
    </main>
  );
}
