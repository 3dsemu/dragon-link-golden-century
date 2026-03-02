import { SymbolDef, SymbolId } from './types';

// Symbol definitions with pay multipliers (x total bet)
export const SYMBOLS: Record<SymbolId, SymbolDef> = {
  wild: {
    id: 'wild',
    name: 'Emperor',
    emoji: '👑',
    pays: { 2: 2, 3: 10, 4: 50, 5: 250 },
  },
  scatter: {
    id: 'scatter',
    name: 'Flag',
    emoji: '🚩',
    pays: { 3: 5, 4: 20, 5: 250 },
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    emoji: '🔥',
    pays: {},
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    emoji: '⚔️',
    pays: { 2: 1, 3: 5, 4: 25, 5: 125 },
  },
  ladies: {
    id: 'ladies',
    name: 'Ladies',
    emoji: '👘',
    pays: { 3: 4, 4: 20, 5: 100 },
  },
  vessel: {
    id: 'vessel',
    name: 'Vessel',
    emoji: '⛵',
    pays: { 3: 3, 4: 15, 5: 75 },
  },
  chest: {
    id: 'chest',
    name: 'Chest',
    emoji: '📦',
    pays: { 3: 2, 4: 10, 5: 50 },
  },
  K: {
    id: 'K',
    name: 'King',
    emoji: 'K',
    pays: { 3: 1.5, 4: 5, 5: 25 },
  },
  Q: {
    id: 'Q',
    name: 'Queen',
    emoji: 'Q',
    pays: { 3: 1.5, 4: 5, 5: 25 },
  },
  J: {
    id: 'J',
    name: 'Jack',
    emoji: 'J',
    pays: { 3: 1, 4: 3, 5: 15 },
  },
  '10': {
    id: '10',
    name: 'Ten',
    emoji: '10',
    pays: { 3: 1, 4: 3, 5: 15 },
  },
  '9': {
    id: '9',
    name: 'Nine',
    emoji: '9',
    pays: { 3: 0.5, 4: 2, 5: 10 },
  },
};

// Symbols that count as high-pay (win with 2 matching from left)
export const HIGH_PAY_SYMBOLS: SymbolId[] = ['wild', 'warrior'];

// Wild appears only on reels 2-5
export const WILD_REELS = [1, 2, 3, 4]; // 0-indexed

export const SYMBOL_ORDER: SymbolId[] = [
  'warrior', 'ladies', 'vessel', 'chest', 'K', 'Q', 'J', '10', '9'
];
