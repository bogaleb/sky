/**
 * Card payload mapping: translate raw activity card JSON into the shapes
 * the kid renderers expect. The DB uses several key conventions
 * (`sets`, `text`/`script`, `path`); this normalizes them in one place.
 */

/** Shapes the count pond can draw. Unknown labels fall back to a star. */
const COUNT_SHAPES = new Set(['apple', 'star', 'fish', 'bird', 'cookie', 'clap']);

export function shapeForCountLabel(label: string): string {
  const l = label.toLowerCase().trim();
  let singular = l;
  if (l.endsWith('ies')) singular = l.slice(0, -3) + 'y';
  else if (l.endsWith('s') && !l.endsWith('ss')) singular = l.slice(0, -1);
  return COUNT_SHAPES.has(singular) ? singular : 'star';
}

/** Expand tap_count `sets: [{count, label}]` into tappable objects. */
export function countObjectsFrom(
  payload: Record<string, unknown>,
): { id: string; shape: string }[] {
  const sets = (payload.sets as { count: number; label: string }[] | undefined) ?? [];
  const objects: { id: string; shape: string }[] = [];
  sets.forEach((s, si) => {
    const shape = shapeForCountLabel(s.label || '');
    const n = Math.max(0, Math.min(12, Math.floor(s.count) || 0));
    for (let i = 0; i < n; i++) objects.push({ id: `s${si}-o${i}`, shape });
  });
  return objects;
}

/** Derive what the trace canvas should draw from the prompt text. */
export function traceTargetFrom(prompt: string): string {
  const p = prompt.trim();
  let m = p.match(/letter\s+([A-Za-z])/i);
  if (m) return m[1];
  m = p.match(/tall line/i);
  if (m) return 'big tall line';
  m = p.match(/^trace\s+([a-z])\b/i);
  if (m) return m[1];
  m = p.match(/word\s+'([^']+)'/i);
  if (m) return m[1];
  m = p.match(/draw\s+a\s+(\w+)/i);
  if (m) {
    const shape = m[1].toLowerCase();
    if (shape === 'circle' || shape === 'sun') return shape;
    return 'circle';
  }
  // Freeform scribble/paint prompts: no guide, just the brush.
  return '';
}

/** listen_repeat cards use `text` or `script` depending on the author. */
export function listenScriptFrom(payload: Record<string, unknown>): string {
  return ((payload.text ?? payload.script) as string) ?? '';
}
