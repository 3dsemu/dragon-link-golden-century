'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ReelGrid as ReelGridType, SymbolId, WinLine } from '../lib/types';
import SymbolDisplay from './SymbolDisplay';
import { REEL_STRIPS } from '../lib/reels';

interface ReelGridProps {
  grid: ReelGridType;
  spinning: boolean;
  winLines: WinLine[];
  showingWins: boolean;
  onSpinComplete?: () => void;
}

// Generate random symbols for spinning animation
function getRandomSymbol(reelIndex: number): SymbolId {
  const strip = REEL_STRIPS[reelIndex];
  return strip[Math.floor(Math.random() * strip.length)];
}

export default function ReelGrid({ grid, spinning, winLines, showingWins, onSpinComplete }: ReelGridProps) {
  const [displayGrid, setDisplayGrid] = useState<ReelGridType>(grid);
  const [reelsStopped, setReelsStopped] = useState([true, true, true, true, true]);
  const spinIntervals = useRef<NodeJS.Timeout[]>([]);
  const spinTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Get all winning positions
  const winPositions = new Set<string>();
  if (showingWins) {
    winLines.forEach(wl => {
      wl.positions.forEach(([reel, row]) => {
        winPositions.add(`${reel}-${row}`);
      });
    });
  }

  useEffect(() => {
    if (spinning) {
      setReelsStopped([false, false, false, false, false]);

      // Clear any existing intervals
      spinIntervals.current.forEach(clearInterval);
      spinTimeouts.current.forEach(clearTimeout);
      spinIntervals.current = [];
      spinTimeouts.current = [];

      // Start spinning animation for each reel
      for (let reel = 0; reel < 5; reel++) {
        const interval = setInterval(() => {
          setDisplayGrid(prev => {
            const newGrid = [...prev];
            newGrid[reel] = [
              getRandomSymbol(reel),
              getRandomSymbol(reel),
              getRandomSymbol(reel),
            ];
            return newGrid;
          });
        }, 60);
        spinIntervals.current.push(interval);

        // Stop each reel with a delay
        const timeout = setTimeout(() => {
          clearInterval(spinIntervals.current[reel]);
          setDisplayGrid(prev => {
            const newGrid = [...prev];
            newGrid[reel] = grid[reel];
            return newGrid;
          });
          setReelsStopped(prev => {
            const next = [...prev];
            next[reel] = true;
            return next;
          });
        }, 600 + reel * 300);
        spinTimeouts.current.push(timeout);
      }

      // All reels stopped
      const completeTimeout = setTimeout(() => {
        onSpinComplete?.();
      }, 600 + 4 * 300 + 200);
      spinTimeouts.current.push(completeTimeout);
    } else {
      setDisplayGrid(grid);
    }

    return () => {
      spinIntervals.current.forEach(clearInterval);
      spinTimeouts.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, grid]);

  return (
    <div className="relative">
      {/* Reel grid container */}
      <div
        className="grid grid-cols-5 gap-1 p-2 rounded-xl relative"
        style={{
          background: 'linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)',
          border: '3px solid #FFD700',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {[0, 1, 2, 3, 4].map(reel => (
          <div key={reel} className="flex flex-col gap-1">
            {[0, 1, 2].map(row => {
              const symbol = displayGrid[reel]?.[row] || '9';
              const isWinning = winPositions.has(`${reel}-${row}`);
              const isStopped = reelsStopped[reel];

              return (
                <div
                  key={`${reel}-${row}`}
                  className={`
                    relative flex items-center justify-center
                    rounded-lg overflow-hidden transition-all duration-200
                    ${!isStopped ? 'opacity-70' : 'opacity-100'}
                    ${isWinning ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
                  `}
                  style={{
                    height: '70px',
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
        ))}
      </div>
    </div>
  );
}
