'use client';
import React from 'react';
import { SYMBOLS } from '../lib/symbols';
import { SymbolId } from '../lib/types';

interface PaytableProps {
  onClose: () => void;
  denomination: number;
  bet: number;
}

const symbolOrder: SymbolId[] = ['warrior', 'ladies', 'vessel', 'chest', 'K', 'Q', 'J', '10', '9'];

export default function Paytable({ onClose, denomination, bet }: PaytableProps) {
  const totalBet = denomination * bet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-4 mx-2"
        style={{
          background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0015 50%, #1a0a2e 100%)',
          border: '2px solid #FFD700',
          boxShadow: '0 0 40px rgba(255,215,0,0.3), inset 0 0 40px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold shimmer-text tracking-wider">PAYTABLE</h2>
          <p className="text-xs text-gray-400 mt-1">Current Bet: ${totalBet.toFixed(2)}</p>
        </div>

        {/* Jackpots Section */}
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
          <h3 className="text-sm font-bold text-gold mb-2 text-center">JACKPOTS (Hold & Spin)</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 rounded" style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)' }}>
              <div className="text-red-400 font-bold">GRAND</div>
              <div className="text-white">Fill all 15 positions</div>
              <div className="text-gold font-bold">${(totalBet * 2000).toFixed(0)}+</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)' }}>
              <div className="text-orange-400 font-bold">MAJOR</div>
              <div className="text-white">Random during H&S</div>
              <div className="text-gold font-bold">${(totalBet * 200).toFixed(0)}+</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)' }}>
              <div className="text-cyan-400 font-bold">MINOR</div>
              <div className="text-white">Random during H&S</div>
              <div className="text-gold font-bold">${(totalBet * 20).toFixed(2)}</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: 'rgba(180,0,255,0.1)', border: '1px solid rgba(180,0,255,0.3)' }}>
              <div className="text-purple-400 font-bold">MINI</div>
              <div className="text-white">Random during H&S</div>
              <div className="text-gold font-bold">${(totalBet * 8).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Symbol Pays */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gold mb-2 text-center">SYMBOL PAYS</h3>
          <div className="space-y-1">
            {symbolOrder.map(id => {
              const sym = SYMBOLS[id];
              return (
                <div key={id} className="flex items-center justify-between px-3 py-1.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl w-8 text-center">{sym.emoji}</span>
                    <span className="text-xs text-gray-300 font-medium">{sym.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {sym.pays[5] > 0 && (
                      <span className="text-gold">5×: <span className="font-bold">${(sym.pays[5] * totalBet).toFixed(2)}</span></span>
                    )}
                    {sym.pays[4] > 0 && (
                      <span className="text-yellow-500">4×: <span className="font-bold">${(sym.pays[4] * totalBet).toFixed(2)}</span></span>
                    )}
                    {sym.pays[3] > 0 && (
                      <span className="text-yellow-600">3×: <span className="font-bold">${(sym.pays[3] * totalBet).toFixed(2)}</span></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Symbols */}
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="text-sm font-bold text-gold mb-2 text-center">SPECIAL SYMBOLS</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-xl">👑</span>
              <div>
                <span className="text-yellow-400 font-bold">WILD (Emperor)</span>
                <span className="text-gray-300"> — Appears on reels 2-5. Substitutes for all symbols except Scatter and Fireball.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">🏴</span>
              <div>
                <span className="text-red-400 font-bold">SCATTER (Flag)</span>
                <span className="text-gray-300"> — 3+ triggers Free Games. 3×: ${(5 * totalBet).toFixed(2)}, 4×: ${(20 * totalBet).toFixed(2)}, 5×: ${(50 * totalBet).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <span className="text-orange-400 font-bold">FIREBALL</span>
                <span className="text-gray-300"> — 6+ on screen triggers Hold & Spin bonus. Each fireball holds a credit value or jackpot symbol.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Rules */}
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="text-sm font-bold text-gold mb-2 text-center">GAME RULES</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <p>• 5 reels, 3 rows with 50 paylines</p>
            <p>• Wins pay left to right on adjacent reels starting from reel 1</p>
            <p>• Only the highest win per payline is paid</p>
            <p>• Wild substitutes for all except Scatter and Fireball</p>
            <p>• Hold & Spin: 6+ fireballs trigger 3 respins. New fireballs reset respins to 3</p>
            <p>• Hold & Spin: Fill all 15 positions for the GRAND jackpot!</p>
            <p>• Free Games: 3+ scatters award 6 free spins with mystery door feature</p>
            <p>• Theoretical RTP: ~95.2%</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="px-8 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 100%)',
              color: '#000',
              boxShadow: '0 2px 10px rgba(255,215,0,0.3)',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
