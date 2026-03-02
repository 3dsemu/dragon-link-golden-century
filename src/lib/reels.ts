import { SymbolId } from './types';

// Reel strips - each reel has a different distribution of symbols
// Wild only appears on reels 2-5, scatter can appear anywhere, fireball can appear anywhere

export const REEL_STRIPS: SymbolId[][] = [
  // Reel 1 (no wild)
  [
    '9', 'chest', 'J', '10', 'fireball', 'K', 'vessel', '9', 'Q',
    'ladies', '10', 'J', 'scatter', '9', 'chest', 'K', '10',
    'warrior', 'Q', '9', 'J', 'fireball', '10', 'vessel', 'K',
    'chest', '9', '10', 'ladies', 'J', 'Q', '9', 'fireball',
    '10', 'K', 'chest', 'J', '9', 'Q', '10', 'vessel',
    '9', 'J', 'K', '10', 'Q', '9', 'chest', 'J',
  ],
  // Reel 2 (includes wild)
  [
    '10', 'chest', 'K', 'wild', 'J', 'fireball', '9', 'Q',
    'vessel', '10', 'ladies', 'J', '9', 'K', 'scatter', 'chest',
    'Q', '10', 'fireball', '9', 'J', 'wild', 'K', 'vessel',
    '10', '9', 'Q', 'chest', 'J', '10', 'ladies', 'K',
    'fireball', '9', 'Q', '10', 'J', 'chest', '9', 'K',
    'warrior', '10', 'Q', '9', 'J', 'vessel', '10', 'K',
  ],
  // Reel 3 (includes wild)
  [
    'J', 'vessel', '10', 'K', 'fireball', '9', 'wild', 'Q',
    'chest', 'J', '10', 'scatter', '9', 'ladies', 'K', 'Q',
    '10', 'fireball', 'J', '9', 'chest', 'K', 'wild', '10',
    'Q', 'warrior', '9', 'J', 'vessel', '10', 'K', 'fireball',
    'Q', '9', 'J', '10', 'chest', 'K', '9', 'Q', 'J',
    '10', 'ladies', '9', 'K', 'Q', '10', 'J',
  ],
  // Reel 4 (includes wild)
  [
    'K', '10', 'chest', 'fireball', 'Q', '9', 'J', 'vessel',
    '10', 'wild', 'K', '9', 'ladies', 'Q', 'scatter', 'J',
    '10', 'fireball', '9', 'chest', 'K', 'Q', 'J', 'warrior',
    '10', '9', 'wild', 'K', 'vessel', 'Q', '10', 'J',
    '9', 'fireball', 'K', '10', 'chest', 'Q', '9', 'J',
    '10', 'K', 'ladies', 'Q', '9', 'J', '10', 'K',
  ],
  // Reel 5 (includes wild)
  [
    'Q', 'chest', '9', 'J', 'K', 'fireball', '10', 'vessel',
    'wild', '9', 'Q', 'J', 'scatter', '10', 'K', 'chest',
    '9', 'fireball', 'Q', 'ladies', 'J', '10', 'K', '9',
    'warrior', 'Q', 'wild', '10', 'J', 'chest', 'K', '9',
    'fireball', '10', 'Q', 'vessel', 'J', '9', 'K', '10',
    'Q', 'J', '9', 'chest', '10', 'K', 'Q', 'J',
  ],
];

// Get 3 consecutive symbols from a reel starting at position
export function getReelWindow(reelIndex: number, position: number): SymbolId[] {
  const strip = REEL_STRIPS[reelIndex];
  const len = strip.length;
  return [
    strip[position % len],
    strip[(position + 1) % len],
    strip[(position + 2) % len],
  ];
}

// Generate random reel positions
export function generateRandomPositions(): number[] {
  return REEL_STRIPS.map((strip) => Math.floor(Math.random() * strip.length));
}

// Generate a reel grid from positions
export function generateGrid(positions: number[]): SymbolId[][] {
  return positions.map((pos, reelIndex) => getReelWindow(reelIndex, pos));
}

// Generate a completely random grid (for special scenarios)
export function generateRandomGrid(): SymbolId[][] {
  const positions = generateRandomPositions();
  return generateGrid(positions);
}
