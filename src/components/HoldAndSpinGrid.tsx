'use client';
import React, { useMemo } from 'react';
import { HoldAndSpinState } from '../lib/types';

interface HoldAndSpinGridProps {
  state: HoldAndSpinState;
  spinning: boolean;
}

export default function HoldAndSpinGrid({ state, spinning }: HoldAndSpinGridProps) {
  // Count filled positions
  const filledCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        if (state.grid[r][row]) count++;
      }
    }
    return count;
  }, [state.grid]);

  return (
    <div className="relative">
      {/* Progress bar showing how many positions filled */}
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-xs text-orange-300 font-bold">
          {filledCount}/15 FIREBALLS
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < filledCount
                  ? 'linear-gradient(180deg, #FF8C00, #FF4500)'
                  : 'rgba(255, 69, 0, 0.2)',
                boxShadow: i < filledCount ? '0 0 4px rgba(255, 140, 0, 0.8)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="grid grid-cols-5 gap-1 p-2 rounded-xl relative"
        style={{
          background: 'linear-gradient(180deg, #1a0000 0%, #2a0000 50%, #1a0000 100%)',
          border: '3px solid #FF4500',
          boxShadow: '0 0 40px rgba(255, 69, 0, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {[0, 1, 2, 3, 4].map(reel => (
          <div key={reel} className="flex flex-col gap-1">
            {[0, 1, 2].map(row => {
              const cell = state.grid[reel][row];
              const justLanded = state.justLanded[reel * 3 + row];
              const isEmpty = cell === null;

              return (
                <div
                  key={`${reel}-${row}`}
                  className={`
                    relative flex items-center justify-center rounded-lg overflow-hidden
                    ${justLanded ? 'fireball-land' : ''}
                    ${isEmpty && spinning ? 'animate-pulse' : ''}
                  `}
                  style={{
                    height: '70px',
                    background: cell
                      ? 'radial-gradient(circle, #FF8C00 0%, #FF4500 40%, #8B0000 80%, #4a0000 100%)'
                      : 'rgba(20, 0, 0, 0.6)',
                    border: cell
                      ? '2px solid #FFD700'
                      : '1px solid rgba(255, 69, 0, 0.2)',
                    boxShadow: cell
                      ? '0 0 15px rgba(255, 140, 0, 0.5), inset 0 0 10px rgba(255, 215, 0, 0.3)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {cell ? (
                    <div className="flex flex-col items-center justify-center">
                      {cell.type === 'credits' ? (
                        <>
                          <span className="text-lg leading-none">🔥</span>
                          <span className="text-white font-bold text-xs drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(255,215,0,0.8)' }}>
                            ${cell.value.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg leading-none">🔥</span>
                          <span
                            className={`font-bold text-xs tracking-wider ${
                              cell.type === 'grand' ? 'text-red-300 jackpot-flash' :
                              cell.type === 'major' ? 'text-orange-200' :
                              cell.type === 'minor' ? 'text-blue-200' :
                              'text-green-200'
                            }`}
                            style={{ textShadow: '0 0 10px currentColor' }}
                          >
                            {cell.type.toUpperCase()}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-red-900/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border border-red-900/10" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Spinning overlay for empty cells */}
        {spinning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full rounded-xl"
              style={{
                background: 'radial-gradient(circle, rgba(255, 140, 0, 0.05) 0%, transparent 70%)',
              }}
            />
          </div>
        )}
      </div>

      {/* Spins remaining display */}
      <div className="flex justify-center mt-2 gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-4 rounded-full"
            style={{
              background: i <= state.spinsRemaining
                ? 'linear-gradient(180deg, #FFD700, #FF8C00)'
                : 'rgba(100, 50, 0, 0.3)',
              border: i <= state.spinsRemaining ? '1px solid #FFD700' : '1px solid rgba(100, 50, 0, 0.3)',
              boxShadow: i <= state.spinsRemaining ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none',
            }}
          />
        ))}
        <span className="text-xs text-orange-300 ml-1 font-bold">
          {state.spinsRemaining} SPINS LEFT
        </span>
      </div>
    </div>
  );
}
