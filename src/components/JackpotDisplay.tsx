'use client';
import React, { useEffect, useState, useRef } from 'react';

interface JackpotDisplayProps {
  jackpots: {
    mini: number;
    minor: number;
    major: number;
    grand: number;
  };
  wonJackpot?: string | null;
}

export default function JackpotDisplay({ jackpots, wonJackpot }: JackpotDisplayProps) {
  const [displayValues, setDisplayValues] = useState(jackpots);
  const incrementRef = useRef<NodeJS.Timeout | null>(null);

  // Slowly increment progressive jackpots for visual effect
  useEffect(() => {
    if (incrementRef.current) clearInterval(incrementRef.current);
    setDisplayValues(jackpots);

    incrementRef.current = setInterval(() => {
      setDisplayValues(prev => ({
        ...prev,
        major: prev.major + 0.01,
        grand: prev.grand + 0.05,
      }));
    }, 2000);

    return () => {
      if (incrementRef.current) clearInterval(incrementRef.current);
    };
  }, [jackpots]);

  const jackpotList = [
    { key: 'grand', label: 'GRAND', value: displayValues.grand, color: '#FF0000', glow: '#FF000080', icon: '🐉' },
    { key: 'major', label: 'MAJOR', value: displayValues.major, color: '#FF6B00', glow: '#FF6B0080', icon: '🔥' },
    { key: 'minor', label: 'MINOR', value: displayValues.minor, color: '#00BFFF', glow: '#00BFFF80', icon: '💎' },
    { key: 'mini', label: 'MINI', value: displayValues.mini, color: '#00FF88', glow: '#00FF8880', icon: '✨' },
  ];

  return (
    <div className="flex justify-center gap-1.5 mb-2">
      {jackpotList.map(jp => (
        <div
          key={jp.key}
          className={`
            flex flex-col items-center px-2 py-1.5 rounded-lg relative overflow-hidden
            ${wonJackpot === jp.key ? 'jackpot-flash' : ''}
          `}
          style={{
            background: `linear-gradient(180deg, ${jp.color}25 0%, #0a0a1a 50%, ${jp.color}15 100%)`,
            border: `2px solid ${jp.color}90`,
            boxShadow: `0 0 15px ${jp.glow}, inset 0 0 15px ${jp.color}10`,
            minWidth: '75px',
            flex: 1,
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${jp.color} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />

          <div className="relative z-10 flex items-center gap-1">
            <span className="text-xs">{jp.icon}</span>
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: jp.color }}
            >
              {jp.label}
            </span>
          </div>
          <span
            className="relative z-10 text-sm font-bold tabular-nums"
            style={{
              color: '#FFFFFF',
              textShadow: `0 0 10px ${jp.glow}`,
            }}
          >
            ${jp.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
