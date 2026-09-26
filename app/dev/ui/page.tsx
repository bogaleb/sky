import { notFound } from 'next/navigation';
import UiPreview from './ui-preview';

// Local-only design preview: renders the Today home and GameFrame games with
// sample data so the kid UI can be reviewed (and screenshotted) at any age
// band without a Supabase project. 404s in production builds.
export default async function DevUiPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; band?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { view = 'home', band = '5-6' } = await searchParams;
  return <UiPreview view={view} band={band} />;
}
