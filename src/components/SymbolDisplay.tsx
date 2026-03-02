'use client';
import React from 'react';
import { SymbolId } from '../lib/types';

const SYMBOL_COLORS: Record<SymbolId, string> = {
  wild: '#FFD700',
  scatter: '#FF4500',
  fireball: '#FF6B00',
  warrior: '#E8E8E8',
  ladies: '#FF69B4',
  vessel: '#87CEEB',
  chest: '#DAA520',
  K: '#C0C0C0',
  Q: '#C0C0C0',
  J: '#C0C0C0',
  '10': '#C0C0C0',
  '9': '#C0C0C0',
};

const SYMBOL_DISPLAY: Record<SymbolId, { icon: string; label: string; gradient: string }> = {
  wild: { icon: '👑', label: 'WILD', gradient: 'from-yellow-400 via-yellow-200 to-yellow-500' },
  scatter: { icon: '🏴', label: 'FREE', gradient: 'from-red-500 via-orange-400 to-red-600' },
  fireball: { icon: '🔥', label: '', gradient: 'from-orange-500 via-red-500 to-yellow-500' },
  warrior: { icon: '⚔️', label: '', gradient: 'from-gray-300 via-white to-gray-400' },
  ladies: { icon: '👘', label: '', gradient: 'from-pink-400 via-rose-300 to-pink-500' },
  vessel: { icon: '⛵', label: '', gradient: 'from-blue-300 via-cyan-200 to-blue-400' },
  chest: { icon: '💰', label: '', gradient: 'from-yellow-500 via-amber-400 to-yellow-600' },
  K: { icon: '', label: 'K', gradient: 'from-purple-400 via-purple-300 to-purple-500' },
  Q: { icon: '', label: 'Q', gradient: 'from-green-400 via-green-300 to-green-500' },
  J: { icon: '', label: 'J', gradient: 'from-blue-400 via-blue-300 to-blue-500' },
  '10': { icon: '', label: '10', gradient: 'from-teal-400 via-teal-300 to-teal-500' },
  '9': { icon: '', label: '9', gradient: 'from-red-400 via-red-300 to-red-500' },
};

interface SymbolDisplayProps {
  symbol: SymbolId;
  highlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SymbolDisplay({ symbol, highlighted = false, size = 'md' }: SymbolDisplayProps) {
  const display = SYMBOL_DISPLAY[symbol];
  const color = SYMBOL_COLORS[symbol];

  const sizeClasses = {
    sm: 'w-12 h-10 text-lg',
    md: 'w-full h-full text-2xl',
    lg: 'w-20 h-16 text-3xl',
  };

  const isCard = ['K', 'Q', 'J', '10', '9'].includes(symbol);
  const isFireball = symbol === 'fireball';
  const isWild = symbol === 'wild';
  const isScatter = symbol === 'scatter';

  return (
    <div
      className={`${sizeClasses[size]} flex flex-col items-center justify-center relative rounded-md
        ${highlighted ? 'win-highlight' : ''}
        ${isFireball ? 'fireball-symbol' : ''}
      `}
      style={{
        background: isFireball 
          ? 'radial-gradient(circle, #FF8C00 0%, #FF4500 40%, #8B0000 100%)'
          : isWild 
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)'
            : isScatter
              ? 'linear-gradient(135deg, #FF4500 0%, #DC143C 50%, #8B0000 100%)'
              : 'transparent',
        border: (isFireball || isWild || isScatter) ? '2px solid rgba(255,215,0,0.5)' : 'none',
        borderRadius: isFireball ? '50%' : '8px',
      }}
    >
      {isCard ? (
        <span
          className="font-bold drop-shadow-lg"
          style={{
            color: color,
            fontSize: size === 'md' ? '1.8rem' : size === 'lg' ? '2.2rem' : '1.2rem',
            textShadow: `0 0 10px ${color}40`,
          }}
        >
          {display.label}
        </span>
      ) : (
        <>
          <span className="drop-shadow-lg" style={{ fontSize: size === 'md' ? '1.8rem' : size === 'lg' ? '2.4rem' : '1.2rem' }}>
            {display.icon}
          </span>
          {display.label && (
            <span
              className="text-xs font-bold tracking-wider"
              style={{ color: '#FFD700', fontSize: '0.55rem' }}
            >
              {display.label}
            </span>
          )}
        </>
      )}
    </div>
  );
}
