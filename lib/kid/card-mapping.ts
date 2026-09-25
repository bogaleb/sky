/**
 * Card payload mapping: translate raw activity card JSON into the shapes
 * the kid renderers expect. The DB uses several key conventions
 * (`sets`, `text`/`script`, `path`); this normalizes them in one place.
 */

/** Shapes the count pond can draw. Unknown labels fall back to a star. */
const COUNT_SHAPES = new Set(['apple', 'star', 'fish', 'bird', 'cookie', 'clap', 'blob']);

export function shapeForCountLabel(label: string): string {
  const l = label.toLowerCase().trim();
  // Keyword hits first: "blue paint blobs" -> blob even though the full
  // phrase won't singularize into the set.
  for (const shape of COUNT_SHAPES) {
    if (l.includes(shape)) return shape;
  }
  let singular = l;
  if (l.endsWith('ies')) singular = l.slice(0, -3) + 'y';
  else if (l.endsWith('s') && !l.endsWith('ss')) singular = l.slice(0, -1);
  return COUNT_SHAPES.has(singular) ? singular : 'star';
}

/**
 * Expand tap_count payloads into tappable objects. Two conventions exist:
 * - `sets: [{count, label}]` (legacy), and
 * - `{thing, total}` (the content bank: every shipped tap_count activity).
 */
export function countObjectsFrom(
  payload: Record<string, unknown>,
): { id: string; shape: string }[] {
  const objects: { id: string; shape: string }[] = [];
  const pushSet = (count: unknown, label: string, prefix: string) => {
    const shape = shapeForCountLabel(label || '');
    const n = Math.max(0, Math.min(12, Math.floor(count as number) || 0));
    for (let i = 0; i < n; i++) objects.push({ id: `${prefix}-o${i}`, shape });
  };
  const sets = (payload.sets as { count: number; label: string }[] | undefined) ?? [];
  sets.forEach((s, si) => pushSet(s.count, s.label || '', `s${si}`));
  if (objects.length === 0 && typeof payload.total === 'number') {
    pushSet(payload.total, String(payload.thing ?? ''), 't');
  }
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
