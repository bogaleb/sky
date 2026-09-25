import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AVATARS } from '@/components/avatars';
import { Button, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    title: 'Create your children’s profiles',
    body: 'A nickname and an avatar is all it takes. No email for kids, no personal data beyond what learning needs.',
  },
  {
    title: 'They fly between islands',
    body: 'Reading, math, science, music and more — each island is hosted by a character who teaches, celebrates, and comforts.',
  },
  {
    title: 'You see proof of learning',
    body: 'A weekly digest in plain language: what they mastered, what they practiced, and what still needs work.',
  },
];

const TRUST = [
  { title: 'No ads, ever', body: 'No third-party trackers in kid sessions. No chat, no location, no surprises.' },
  { title: 'PIN-protected parent zone', body: 'Settings, limits and reports live behind your parent PIN — visually separate from the kid world.' },
  { title: 'Adapts to your child', body: 'Difficulty adjusts per skill, within the session. Struggling gets help; excelling moves ahead.' },
];

export default async function LandingPage() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }
  if (signedIn) redirect('/profiles');

  return (
    <main>
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-2xl font-extrabold tracking-tight text-parent-sky-900">
          Sky
        </p>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center sm:pt-16">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-parent-sky-900 sm:text-6xl">
          Where children learn through adventure
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-parent-ink-600 sm:text-xl">
          Sky is a learning adventure for ages 3–8: reading, math, science,
          music and more, guided by characters who feel alive — and a weekly
          digest that proves it worked.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Start free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              I have an account
            </Button>
          </Link>
        </div>

        {/* Cast teaser */}
        <div className="mt-14 flex flex-wrap items-end justify-center gap-5 sm:gap-7">
          {Object.entries(AVATARS).map(([id, { name, Component }]) => (
            <figure key={id} className="flex w-20 flex-col items-center gap-1.5">
              <Component className="h-20 w-20 drop-shadow-[0_6px_12px_rgba(18,60,96,0.15)] transition-transform hover:-translate-y-1 sm:h-24 sm:w-24" />
              <figcaption className="text-sm font-semibold text-parent-ink-600">
                {name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-parent-sky-900">
          How Sky works
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <p className="flex h-10 w-10 items-center justify-center rounded-full bg-parent-sky-100 text-lg font-extrabold text-parent-sky-700">
                {i + 1}
              </p>
              <h3 className="mt-4 text-lg font-bold text-parent-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-parent-ink-600">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-white/60 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-parent-sky-900">
            Built for parents’ peace of mind
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TRUST.map((item) => (
              <Card key={item.title}>
                <h3 className="text-lg font-bold text-parent-ink-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-parent-ink-600">{item.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/signup">
              <Button size="lg">Create your family account</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-parent-ink-400">
        <p>
          Sky collects the minimum data needed to teach: a parent email and each
          child’s nickname, avatar and age band. COPPA-shaped by default.
        </p>
      </footer>
    </main>
  );
}
