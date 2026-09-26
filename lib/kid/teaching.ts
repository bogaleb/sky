/**
 * Teaching feedback: what happens after a wrong answer.
 *
 * Instead of "shake and try again", a wrong answer climbs a short
 * scaffolding ladder (hint -> worked example), tuned per age profile:
 *
 *   wrong x hintAfter   -> 'hint'  a nudge toward what to look at
 *   wrong x showMeAfter -> 'show'  a worked example: the answer is
 *                                  highlighted and explained, and the child
 *                                  still makes the final tap themselves
 *   correct             -> 'correct'
 *
 * Pure reducer so the ladder is unit-tested; components/kid/game-frame.tsx
 * wraps it with speech and learning-event logging.
 */

export type TeachMode = 'idle' | 'hint' | 'show' | 'correct';

export interface TeachState {
  mode: TeachMode;
  /** Wrong answers on the current item. */
  wrong: number;
  /** Choices already tried on this item (rendered dimmed). */
  tried: string[];
  /** The line currently shown/spoken in the feedback bubble. */
  message: string;
}

export interface TeachLines {
  /** Nudge: what to look at. Never gives the answer away. */
  hint: string;
  /** Worked example: why the right answer is right. */
  explain: string;
  /** Short praise for a correct answer. */
  praise?: string;
}

export type TeachAction =
  | { type: 'wrong'; key: string; lines: TeachLines; hintAfter: number; showMeAfter: number }
  | { type: 'correct'; lines?: Pick<TeachLines, 'praise'> }
  | { type: 'reset' };

export const INITIAL_TEACH: TeachState = { mode: 'idle', wrong: 0, tried: [], message: '' };

export function teachReducer(state: TeachState, action: TeachAction): TeachState {
  switch (action.type) {
    case 'reset':
      return INITIAL_TEACH;
    case 'correct':
      return { ...state, mode: 'correct', message: action.lines?.praise ?? 'Yes! You got it!' };
    case 'wrong': {
      const wrong = state.wrong + 1;
      const tried = state.tried.includes(action.key) ? state.tried : [...state.tried, action.key];
      if (wrong >= action.showMeAfter) {
        return { mode: 'show', wrong, tried, message: action.lines.explain };
      }
      if (wrong >= action.hintAfter) {
        return { mode: 'hint', wrong, tried, message: action.lines.hint };
      }
      return { mode: 'idle', wrong, tried, message: 'Try again!' };
    }
  }
}

/** The support level newly reached by a transition, for learning_events. */
export function supportReached(prev: TeachState, next: TeachState): 'hint_used' | 'show_me' | null {
  if (next.mode === prev.mode) return null;
  if (next.mode === 'hint') return 'hint_used';
  if (next.mode === 'show') return 'show_me';
  return null;
}
