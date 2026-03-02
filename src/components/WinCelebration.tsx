'use client';
import React, { useEffect, useState } from 'react';

interface WinCelebrationProps {
  amount: number;
  isJackpot?: boolean;
  jackpotType?: string;
  onComplete?: () => void;
}

export default function WinCelebration({ amount, isJackpot, jackpotType, onComplete }: WinCelebrationProps) {
  const [countedAmount, setCountedAmount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    // Count up animation
    const steps = 30;
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = amount;
        clearInterval(interval);
        setShowFinal(true);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
      setCountedAmount(current);
    }, 50);

    return () => clearInterval(interval);
  }, [amount, onComplete]);

  const dragonEmojis = ['🐉', '🐲', '🔥', '💎', '👑', '🏆'];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-xl"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20}%`,
              animation: `particleFloat ${2 + Math.random() * 3}s ease-out forwards`,
              animationDelay: `${Math.random() * 1.5}s`,
              fontSize: `${12 + Math.random() * 20}px`,
            }}
          >
            {isJackpot ? '🔥' : dragonEmojis[i % dragonEmojis.length]}
          </div>
        ))}
      </div>

      {/* Main win display */}
      <div className="text-center grand-reveal relative">
        {/* Dragon frame */}
        <div className="flex justify-center gap-4 mb-2 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>🐉</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🔥</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🐉</span>
        </div>

        {isJackpot && (
          <div className="text-2xl md:text-3xl font-bold mb-2 jackpot-flash">
            {jackpotType === 'grand' ? '🏆 GRAND JACKPOT! 🏆' :
             jackpotType === 'major' ? '🌟 MAJOR JACKPOT! 🌟' :
             jackpotType === 'minor' ? '💫 MINOR JACKPOT! 💫' :
             '✨ MINI JACKPOT! ✨'}
          </div>
        )}

        {!isJackpot && (
          <div className="text-xl md:text-2xl font-bold text-orange-400 mb-2"
            style={{ textShadow: '0 0 20px rgba(255,140,0,0.5)' }}>
            {amount > 100 ? '🌟 BIG WIN! 🌟' : 'WIN!'}
          </div>
        )}

        <div
          className={`text-5xl md:text-7xl font-bold ${showFinal ? 'shimmer-text' : ''}`}
          style={{
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.3)',
            transform: showFinal ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}
        >
          ${countedAmount.toFixed(2)}
        </div>

        <div className="flex justify-center gap-4 mt-3 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🐲</span>
          <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>💰</span>
          <span className="animate-bounce" style={{ animationDelay: '0.5s' }}>🐲</span>
        </div>
      </div>
    </div>
  );
}
