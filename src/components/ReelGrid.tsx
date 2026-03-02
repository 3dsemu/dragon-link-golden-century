'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ReelGrid as ReelGridType, SymbolId, WinLine } from '../lib/types';
import SymbolDisplay from './SymbolDisplay';
import { REEL_STRIPS } from '../lib/reels';

// Layout constants
const ROW_HEIGHT = 70;   // px — matches the original cell height
const GAP = 4;           // px — matches Tailwind gap-1
const STEP = ROW_HEIGHT + GAP; // 74 px per symbol slot
const VISIBLE_H = 3 * ROW_HEIGHT + 2 * GAP; // 218 px — height of the visible window
const SLIDE_Y = 3 * STEP; // 222 px — distance the strip must travel to go from randoms → finals

// Strip layout (top → bottom):
//   [rand0, rand1, rand2,  final0, final1, final2]
// translateY(0)    → window sees rand0/rand1/rand2 (spinning symbols)
// translateY(-222) → window sees final0/final1/final2 (result symbols)

interface ReelGridProps {
  grid: ReelGridType;
  spinning: boolean;
  winLines: WinLine[];
  showingWins: boolean;
  onSpinComplete?: () => void;
}

function randSym(reel: number): SymbolId {
  const strip = REEL_STRIPS[reel];
  return strip[Math.floor(Math.random() * strip.length)];
}

type Phase = 'idle' | 'spinning' | 'sliding' | 'done';

interface ReelState {
  phase: Phase;
  /** Current symbols shown during rapid-spin phase */
  spinSymbols: SymbolId[];
  /** 6-symbol strip for the slide phase: [rand0,rand1,rand2, final0,final1,final2] */
  stripSymbols: SymbolId[];
  /** Current CSS translateY value for the strip */
  stripY: number;
  /** Whether the 1-second CSS transition is active */
  stripTransition: boolean;
}

function makeIdle(grid: ReelGridType, reel: number): ReelState {
  return {
    phase: 'idle',
    spinSymbols: grid[reel],
    stripSymbols: [...grid[reel], ...grid[reel]],
    stripY: 0,
    stripTransition: false,
  };
}

export default function ReelGrid({
  grid,
  spinning,
  winLines,
  showingWins,
  onSpinComplete,
}: ReelGridProps) {
  const [reels, setReels] = useState<ReelState[]>(() =>
    Array.from({ length: 5 }, (_, i) => makeIdle(grid, i))
  );

  const intervals = useRef<(ReturnType<typeof setInterval> | null)[]>([
    null, null, null, null, null,
  ]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Stores the most-recent random symbols so the stop handler can capture them */
  const lastSpinSyms = useRef<SymbolId[][]>(
    Array.from({ length: 5 }, (_, i) => [...grid[i]])
  );

  // Build the set of winning cell positions for highlighting
  const winPositions = new Set<string>();
  if (showingWins) {
    winLines.forEach(wl =>
      wl.positions.forEach(([reel, row]) => winPositions.add(`${reel}-${row}`))
    );
  }

  useEffect(() => {
    // Clean up any running timers from a previous spin
    intervals.current.forEach(t => t != null && clearInterval(t));
    timeouts.current.forEach(t => clearTimeout(t));
    intervals.current = [null, null, null, null, null];
    timeouts.current = [];

    if (!spinning) {
      setReels(Array.from({ length: 5 }, (_, i) => makeIdle(grid, i)));
      return;
    }

    // ── Kick off all reels into the spinning phase ──────────────────────────
    setReels(
      Array.from({ length: 5 }, (_, i) => {
        const s = [randSym(i), randSym(i), randSym(i)];
        lastSpinSyms.current[i] = s;
        return {
          phase: 'spinning' as Phase,
          spinSymbols: s,
          stripSymbols: [...s, ...grid[i]],
          stripY: 0,
          stripTransition: false,
        };
      })
    );

    for (let r = 0; r < 5; r++) {
      const reel = r; // closure capture

      // Rapid random-symbol swap — creates the "blur" spin look
      intervals.current[reel] = setInterval(() => {
        const s = [randSym(reel), randSym(reel), randSym(reel)];
        lastSpinSyms.current[reel] = s;
        setReels(prev => {
          const next = [...prev];
          next[reel] = { ...next[reel], spinSymbols: s };
          return next;
        });
      }, 60);

      // ── Stop each reel with a cascading delay ─────────────────────────────
      const stopAt = 600 + reel * 300; // ms from spin start

      const t1 = setTimeout(() => {
        // Stop the rapid-change interval
        if (intervals.current[reel] != null) {
          clearInterval(intervals.current[reel]!);
          intervals.current[reel] = null;
        }

        // Capture the last random symbols for the top half of the slide strip
        const randSyms = lastSpinSyms.current[reel];

        // Strip: [rand0, rand1, rand2, final0, final1, final2]
        // Start with translateY(0) so the random symbols fill the visible window
        setReels(prev => {
          const next = [...prev];
          next[reel] = {
            phase: 'sliding',
            spinSymbols: randSyms,
            stripSymbols: [...randSyms, ...grid[reel]],
            stripY: 0,          // show randoms (top of strip)
            stripTransition: false,
          };
          return next;
        });

        // After one render cycle, enable the 1-second ease-out transition and
        // animate to translateY(-SLIDE_Y) to reveal the final symbols
        const t2 = setTimeout(() => {
          setReels(prev => {
            const next = [...prev];
            next[reel] = {
              ...next[reel],
              stripY: -SLIDE_Y,     // final position showing result symbols
              stripTransition: true, // activate CSS 1s ease-out
            };
            return next;
          });
        }, 30); // small delay so the initial render is committed first
        timeouts.current.push(t2);

        // Mark the reel as done once the transition finishes
        const t3 = setTimeout(() => {
          setReels(prev => {
            const next = [...prev];
            next[reel] = { ...next[reel], phase: 'done', stripTransition: false };
            return next;
          });
        }, 30 + 1050); // 30 ms render + 1000 ms transition + 50 ms buffer
        timeouts.current.push(t3);
      }, stopAt);
      timeouts.current.push(t1);
    }

    // Fire onSpinComplete after all reels have finished their 1-second slide
    // Last reel stops at 600 + 4×300 = 1800 ms, then 30 + 1050 = 1080 ms later → 2880 ms
    const allDone = setTimeout(() => onSpinComplete?.(), 1800 + 1080 + 50);
    timeouts.current.push(allDone);

    return () => {
      intervals.current.forEach(t => t != null && clearInterval(t));
      timeouts.current.forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, grid]);

  return (
    <div className="relative">
      <div
        className="grid grid-cols-5 gap-1 p-2 rounded-xl relative"
        style={{
          background:
            'linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)',
          border: '3px solid #FFD700',
          boxShadow:
            '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {[0, 1, 2, 3, 4].map(reel => {
          const state = reels[reel];

          // ── Spinning phase: rapid random symbols, slightly faded ────────────
          if (state.phase === 'spinning') {
            return (
              <div
                key={reel}
                style={{
                  height: `${VISIBLE_H}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${GAP}px`,
                }}
              >
                {[0, 1, 2].map(row => (
                  <div
                    key={row}
                    className="relative flex items-center justify-center rounded-lg overflow-hidden"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      background: 'rgba(10, 10, 40, 0.6)',
                      border: '1px solid rgba(255, 215, 0, 0.15)',
                      opacity: 0.65,
                    }}
                  >
                    <SymbolDisplay
                      symbol={state.spinSymbols[row] ?? '9'}
                      highlighted={false}
                    />
                  </div>
                ))}
              </div>
            );
          }

          // ── Sliding phase: strip animates from randoms → finals ─────────────
          if (state.phase === 'sliding') {
            return (
              <div
                key={reel}
                style={{
                  height: `${VISIBLE_H}px`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    transform: `translateY(${state.stripY}px)`,
                    transition: state.stripTransition
                      ? 'transform 1s ease-out'
                      : 'none',
                  }}
                >
                  {state.stripSymbols.map((symbol, idx) => {
                    // Indices 3-5 are the final result symbols
                    const isFinal = idx >= 3;
                    const finalRow = idx - 3;
                    const isWinning =
                      isFinal && winPositions.has(`${reel}-${finalRow}`);
                    return (
                      <div
                        key={idx}
                        className="relative flex items-center justify-center rounded-lg overflow-hidden"
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          marginBottom:
                            idx < state.stripSymbols.length - 1
                              ? `${GAP}px`
                              : '0',
                          background: isWinning
                            ? 'rgba(255, 215, 0, 0.15)'
                            : 'rgba(10, 10, 40, 0.6)',
                          border: '1px solid rgba(255, 215, 0, 0.15)',
                        }}
                      >
                        <SymbolDisplay
                          symbol={symbol}
                          highlighted={isWinning}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // ── Idle / Done phase: standard 3-cell display ──────────────────────
          const symbols = grid[reel];
          return (
            <div
              key={reel}
              style={{
                height: `${VISIBLE_H}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: `${GAP}px`,
              }}
            >
              {[0, 1, 2].map(row => {
                const symbol = symbols[row] ?? '9';
                const isWinning = winPositions.has(`${reel}-${row}`);
                return (
                  <div
                    key={row}
                    className={`
                      relative flex items-center justify-center
                      rounded-lg overflow-hidden transition-all duration-200
                      ${isWinning ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
                    `}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      background: isWinning
                        ? 'rgba(255, 215, 0, 0.15)'
                        : 'rgba(10, 10, 40, 0.6)',
                      border: '1px solid rgba(255, 215, 0, 0.15)',
                    }}
                  >
                    <SymbolDisplay symbol={symbol} highlighted={isWinning} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
