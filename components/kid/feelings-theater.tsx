'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pickSession, ROUNDS_PER_GAME, type FaceParams, type FeelingRound } from '@/lib/kid/feelings';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface FeelingsTheaterProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'breathe' | 'won';

const BREATHE_ROUND_INDEX = 4; // pause for a breathing break after 4 rounds

/** Big original SVG face built from face params. No emoji, ever. */
function FeelingFace({ face, size = 'h-44 w-44 md:h-64 md:w-64' }: { face: FaceParams; size?: string }) {
  const eyeY = 78;
  return (
    <svg viewBox="0 0 200 200" className={size} role="img" aria-label="Feeling face">
      <circle cx="100" cy="100" r="88" fill="#FFE3B3" stroke="#E8B04B" strokeWidth="6" />
      {/* Eyes */}
      {face.eyes === 'dots' && (
        <>
          <circle cx="68" cy={eyeY} r="11" fill="#17324F" />
          <circle cx="132" cy={eyeY} r="11" fill="#17324F" />
          <circle cx="72" cy={eyeY - 4} r="3.5" fill="#fff" />
          <circle cx="136" cy={eyeY - 4} r="3.5" fill="#fff" />
        </>
      )}
      {face.eyes === 'happy-arcs' && (
        <>
          <path d="M52 82 Q68 62 84 82" fill="none" stroke="#17324F" strokeWidth="9" strokeLinecap="round" />
          <path d="M116 82 Q132 62 148 82" fill="none" stroke="#17324F" strokeWidth="9" strokeLinecap="round" />
        </>
      )}
      {face.eyes === 'worried' && (
        <>
          <circle cx="68" cy={eyeY + 6} r="10" fill="#17324F" />
          <circle cx="132" cy={eyeY + 6} r="10" fill="#17324F" />
          <circle cx="68" cy={eyeY - 12} r="5" fill="#BEE3F8" opacity="0.9" />
          <circle cx="132" cy={eyeY - 12} r="5" fill="#BEE3F8" opacity="0.9" />
        </>
      )}
      {/* Brows */}
      {face.brows === 'up' && (
        <>
          <path d="M48 50 Q68 36 88 46" fill="none" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
          <path d="M112 46 Q132 36 152 50" fill="none" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {face.brows === 'down' && (
        <>
          <path d="M48 44 Q68 58 88 48" fill="none" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
          <path d="M112 48 Q132 58 152 44" fill="none" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {face.brows === 'flat' && (
        <>
          <path d="M52 48 L84 48" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
          <path d="M116 48 L148 48" stroke="#7C4A1E" strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {/* Mouth */}
      {face.mouth === 'smile' && (
        <path d="M65 130 Q100 162 135 130" fill="none" stroke="#7C2D12" strokeWidth="10" strokeLinecap="round" />
      )}
      {face.mouth === 'frown' && (
        <path d="M65 150 Q100 118 135 150" fill="none" stroke="#7C2D12" strokeWidth="10" strokeLinecap="round" />
      )}
      {face.mouth === 'open' && (
        <ellipse cx="100" cy="140" rx="20" ry="24" fill="#7C2D12" />
      )}
      {face.mouth === 'wavy' && (
        <path d="M65 138 Q78 128 90 138 Q102 148 114 138 Q126 128 135 138" fill="none" stroke="#7C2D12" strokeWidth="9" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Tuno's slow-breathing break: breathe in 4, hold 4, breathe out 4, with an animated circle. */
function BreathingBreak({ onDone, nickname }: { onDone: () => void; nickname: string }) {
  const [step, setStep] = useState<'in' | 'hold' | 'out' | 'done'>('in');
  const [count, setCount] = useState(4);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const speak = (text: string) => speakAs('tuno', text);
    const steps: Array<{ s: 'in' | 'hold' | 'out'; counts: number; say: string }> = [
      { s: 'in', counts: 4, say: 'Breathe in with me. In... two... three... four...' },
      { s: 'hold', counts: 4, say: 'Hold it soft and still. Two... three... four...' },
      { s: 'out', counts: 4, say: 'And breathe out slow. Out... two... three... four...' },
    ];
    let cancelled = false;
    let t = 0;
    steps.forEach(({ s, counts, say }) => {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        setStep(s);
        setCount(counts);
        speak(say);
        for (let c = counts - 1; c >= 1; c--) {
          const cid = window.setTimeout(() => {
            if (!cancelled) setCount(c);
          }, (counts - c) * 1000);
          timers.current.push(cid);
        }
      }, t);
      timers.current.push(id);
      t += counts * 1000 + 600;
    });
    const doneId = window.setTimeout(() => {
      if (cancelled) return;
      setStep('done');
      speakAs('tuno', `Wonderful breathing, ${nickname}. Feelings come and go, like clouds.`);
    }, t + 800);
    timers.current.push(doneId);
    return () => {
      cancelled = true;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      stopSpeaking();
    };
  }, [nickname]);

  const scale = step === 'in' ? 1.35 : step === 'hold' ? 1.35 : step === 'out' ? 1 : 1;
  const label =
    step === 'in' ? 'Breathe in' : step === 'hold' ? 'Hold' : step === 'out' ? 'Breathe out' : 'Lovely';

  return (
    <div className="animate-kid-pop-in flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
      <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">Breathing break</h2>
      <p className="mt-1 text-base font-bold text-kid-ink-700">Follow the circle with Tuno.</p>
      <div className="my-8 flex h-56 w-56 items-center justify-center">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full bg-kid-mint-400 shadow-xl"
          style={{ transform: `scale(${scale})`, transition: 'transform 4s ease-in-out' }}
          aria-hidden
        >
          <span className="text-4xl font-black tabular-nums text-white">{count}</span>
        </div>
      </div>
      <p className="text-xl font-black text-kid-ink-900" aria-live="polite">
        {label}
      </p>
      {step === 'done' && (
        <button
          type="button"
          onClick={() => {
            playSfx('pop');
            onDone();
          }}
          className="mt-6 min-h-[72px] rounded-full bg-kid-mint-500 px-10 py-3 text-xl font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Keep playing
        </button>
      )}
    </div>
  );
}

export default function FeelingsTheater({ childId, nickname = 'friend', onExit }: FeelingsTheaterProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds] = useState<FeelingRound[]>(() => pickSession(Date.now()));
  const [roundIndex, setRoundIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'feelings_game',
    stickerId: 'feelings-friend',
    trophyEvent: 'feelings_done',
    milestone: 'feelings_theater_win',
  });
  const starBalance = session.starBalance ?? 0;
  const [didBreathe, setDidBreathe] = useState(false);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const round: FeelingRound | undefined = useMemo(
    () => rounds[roundIndex],
    [rounds, roundIndex]
  );

  const startShow = useCallback(() => {
    setPhase('play');
    setRoundIndex(0);
    setPicked(null);
    setWrongPick(null);
    setDidBreathe(false);
    playSfx('whoosh');
    speakAs(
      'tuno',
      `Welcome to my Feelings Theater, ${nickname}. Every feeling is okay. Let's name them together!`
    );
  }, [nickname]);

  const handleWin = useCallback(async () => {
    const stars = 15;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs('tuno', `Beautiful work, ${nickname}! You named every feeling. You earned ${stars} stars!`);
    await session.complete({ stars, extraMetadata: { rounds: ROUNDS_PER_GAME } });
  }, [childId, nickname, session]);

  const advance = useCallback(() => {
    if (roundIndex + 1 >= ROUNDS_PER_GAME) {
      void handleWin();
      return;
    }
    if (roundIndex + 1 === BREATHE_ROUND_INDEX && !didBreathe) {
      setPhase('breathe');
      setDidBreathe(true);
      return;
    }
    setRoundIndex((i) => i + 1);
    setPicked(null);
    setWrongPick(null);
  }, [roundIndex, didBreathe, handleWin]);

  const choose = useCallback(
    (index: number) => {
      if (picked !== null || !round) return;
      if (index === round.answerIndex) {
        setPicked(index);
        playSfx('correct');
        const praise =
          round.kind === 'name'
            ? `Yes! That face feels ${round.emotion.name}. ${round.emotion.kidDefinition}`
            : `Lovely idea! ${round.emotion.comfortTip}`;
        speakAs('tuno', praise);
        window.setTimeout(() => advance(), 2200);
      } else {
        setWrongPick(index);
        playSfx('wrong');
        speakAs('tuno', `That's okay, ${nickname}. Every feeling is okay. Try another one.`);
        window.setTimeout(() => setWrongPick(null), 1200);
      }
    },
    [picked, round, nickname, advance]
  );

  const resumeAfterBreathe = useCallback(() => {
    setPhase('play');
    setRoundIndex(BREATHE_ROUND_INDEX);
    setPicked(null);
    setWrongPick(null);
    playSfx('pop');
    speakAs('tuno', `Ready for more feelings, ${nickname}?`);
  }, [nickname]);

  const hearPrompt = useCallback(() => {
    if (!round) return;
    if (round.kind === 'name') {
      speakAs('tuno', `How does this face feel? ${round.choices.map((c) => c).join(', ')}?`);
    } else {
      speakAs('tuno', `${round.emotion.scenario} What would help? ${round.choices.join(', ')}?`);
    }
  }, [round]);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="animate-kid-pop-in flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <FeelingFace face={{ mouth: 'smile', eyes: 'happy-arcs' }} />
          <h1 className="mt-4 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Tuno&rsquo;s Feelings Theater
          </h1>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            Name big feelings, find what helps, and breathe with Tuno. Every feeling is okay.
          </p>
          <button
            type="button"
            onClick={startShow}
            className="mt-6 min-h-[72px] rounded-full bg-kid-mint-500 px-10 py-3 text-xl font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Start the show
          </button>
        </div>
      )}

      {phase === 'play' && round && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Feelings Theater</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Tuno</span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              {roundIndex + 1} / {ROUNDS_PER_GAME}
            </div>
          </div>

          {round.kind === 'name' ? (
            <div className="mt-4 flex w-full flex-col items-center">
              <div className="animate-kid-pop-in rounded-kid-card bg-white/90 p-4 shadow-xl">
                <FeelingFace face={round.emotion.face} />
              </div>
              <p className="mt-4 text-center text-xl font-black text-kid-ink-900 md:text-2xl">
                How does this face feel?
              </p>
            </div>
          ) : (
            <div className="mt-4 w-full">
              <div className="animate-kid-pop-in rounded-kid-card bg-white/90 p-5 shadow-xl md:p-6">
                <p className="text-lg font-bold text-kid-ink-900 md:text-xl">{round.emotion.scenario}</p>
              </div>
              <p className="mt-4 text-center text-xl font-black text-kid-ink-900 md:text-2xl">
                What would help?
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={hearPrompt}
            className="mt-3 rounded-full bg-white/70 px-5 py-2 text-sm font-bold text-kid-ink-700 shadow backdrop-blur transition-transform active:scale-95"
            aria-label="Hear the question read aloud"
          >
            Hear it
          </button>

          <div className="mt-3 grid w-full grid-cols-1 gap-3" role="group" aria-label="Choices">
            {round.choices.map((choice, i) => {
              const isAnswer = picked === i;
              const isWrong = wrongPick === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  aria-label={choice}
                  className={`min-h-[72px] w-full rounded-kid-card px-5 py-4 text-left text-lg font-black shadow-lg transition-transform md:text-xl ${
                    isAnswer
                      ? 'bg-kid-mint-400 text-white scale-[1.02]'
                      : isWrong
                        ? 'animate-kid-shake bg-kid-coral-300 text-kid-ink-900'
                        : 'bg-white/95 text-kid-ink-900 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'breathe' && <BreathingBreak onDone={resumeAfterBreathe} nickname={nickname} />}

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Every feeling is okay, ${nickname}!`}
          message={`You named all ${ROUNDS_PER_GAME} feelings and earned`}
          stickerId="feelings-friend"
          hostAvatar={<FeelingFace face={{ mouth: 'smile', eyes: 'happy-arcs' }} size="h-24 w-24 md:h-28 md:w-28" />}
          onPlayAgain={startShow}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
