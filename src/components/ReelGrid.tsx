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

// Number of random symbol rows appended below the finals in the reel strip.
// The strip starts at a large negative offset that makes these randoms visible;
// the CSS transition then slides the strip DOWN until y=0 reveals the finals.
const RANDOM_ROWS = 14; // 14 rows × 3 symbols = 42 extra symbols per reel

// Starting translateY: positions the strip so the bottom randoms fill the window.
// Strip layout (top → bottom): [final0, final1, final2, rand_0 … rand_(N-1)]
// translateY(0)          → window sees final0/final1/final2 (landing position)
// translateY(START_Y)    → window sees the last 3 randoms   (spin start)
const START_Y = -(RANDOM_ROWS * 3 * STEP); // e.g. -(14 × 3 × 74) = -3108 px

// Per-reel CSS transition durations (ms). Reel 0 stops first, reel 4 last,
// producing a natural cascading "one by one" stop sequence.
const REEL_DURATIONS = [1200, 1500, 1800, 2100, 2400] as const;

// Strong ease-out curve: starts very fast (slot-machine blur), decelerates
// smoothly to rest with no bounce.
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

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

type Phase = 'idle' | 'sliding' | 'done';

interface ReelState {
  phase: Phase;
  /** Full strip: [final0, final1, final2, ...randoms] */
  strip: SymbolId[];
  /** Current CSS translateY in px */
  y: number;
  /** CSS transition string — 'none' for instant repositioning */
  transition: string;
}

function makeIdle(grid: ReelGridType, reel: number): ReelState {
  return {
    phase: 'idle',
    strip: grid[reel],
    y: 0,
    transition: 'none',
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
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Build the set of winning cell positions for highlighting
  const winPositions = new Set<string>();
  if (showingWins) {
    winLines.forEach(wl =>
      wl.positions.forEach(([r, row]) => winPositions.add(`${r}-${row}`))
    );
  }

  useEffect(() => {
    // Cancel any in-flight timers from a previous spin
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    if (!spinning) {
      setReels(Array.from({ length: 5 }, (_, i) => makeIdle(grid, i)));
      return;
    }

    // ── Step 1: Instantly jump all reels to START_Y (no transition) ──────────
    // Each strip has the final symbols at the top and random symbols below.
    // translateY(START_Y) makes the window show the bottom randoms.
    setReels(
      Array.from({ length: 5 }, (_, r) => ({
        phase: 'sliding' as Phase,
        strip: [
          ...grid[r],
          ...Array.from({ length: RANDOM_ROWS * 3 }, () => randSym(r)),
        ],
        y: START_Y,
        transition: 'none',
      }))
    );

    // ── Step 2: After one render cycle, start each reel's CSS transition ─────
    // All reels begin sliding simultaneously but each has a different duration,
    // so they stop one by one in a natural cascade.
    const t1 = setTimeout(() => {
      setReels(prev =>
        prev.map((s, i) => ({
          ...s,
          y: 0, // slide the strip DOWN until finals (top of strip) are visible
          transition: `transform ${REEL_DURATIONS[i]}ms ${EASING}`,
        }))
      );
    }, 30); // single rAF-equivalent delay so the initial position is committed
    timeouts.current.push(t1);

    // ── Step 3: Mark each reel done after its transition completes ───────────
    for (let r = 0; r < 5; r++) {
      const t = setTimeout(
        () => {
          setReels(prev => {
            const next = [...prev];
            next[r] = { ...next[r], phase: 'done', transition: 'none' };
            return next;
          });
        },
        30 + REEL_DURATIONS[r] + 50 // render delay + transition + small buffer
      );
      timeouts.current.push(t);
    }

    // ── Step 4: Notify parent when all reels have landed ────────────────────
    const tDone = setTimeout(
      () => onSpinComplete?.(),
      30 + Math.max(...REEL_DURATIONS) + 100
    );
    timeouts.current.push(tDone);

    return () => timeouts.current.forEach(clearTimeout);
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

          // ── Sliding phase: animated strip scrolls DOWN to reveal finals ──────
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
                    transform: `translateY(${state.y}px)`,
                    transition: state.transition,
                  }}
                >
                  {state.strip.map((symbol, idx) => {
                    // Indices 0-2 are the final result symbols (top of strip)
                    const isFinal = idx < 3;
                    const isWinning =
                      isFinal && winPositions.has(`${reel}-${idx}`);
                    return (
                      <div
                        key={idx}
                        className="relative flex items-center justify-center rounded-lg overflow-hidden"
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          marginBottom:
                            idx < state.strip.length - 1 ? `${GAP}px` : '0',
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

          // ── Idle / Done phase: static 3-cell display ─────────────────────────
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
