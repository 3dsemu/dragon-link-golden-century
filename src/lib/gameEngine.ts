import { SymbolId, ReelGrid, WinLine, FireballValue, GameState, HoldAndSpinState } from './types';
import { SYMBOLS, HIGH_PAY_SYMBOLS } from './symbols';
import { PAYLINES } from './paylines';
import { generateRandomPositions, generateGrid } from './reels';

// ========================
// WIN EVALUATION
// ========================

export function evaluateWins(grid: ReelGrid, totalBet: number): WinLine[] {
  const wins: WinLine[] = [];

  for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const lineSymbols: SymbolId[] = line.map((row, reel) => grid[reel][row]);

    const result = evaluateLine(lineSymbols, line);
    if (result) {
      const payout = (result.payout * totalBet);
      wins.push({
        lineIndex: lineIdx,
        symbol: result.symbol,
        count: result.count,
        payout: Math.round(payout * 100) / 100,
        positions: result.positions,
      });
    }
  }

  return wins;
}

function evaluateLine(
  symbols: SymbolId[],
  lineRows: number[]
): { symbol: SymbolId; count: number; payout: number; positions: [number, number][] } | null {
  // Find the first non-wild, non-scatter, non-fireball symbol from left
  let matchSymbol: SymbolId | null = null;
  let count = 0;
  const positions: [number, number][] = [];

  for (let i = 0; i < 5; i++) {
    const sym = symbols[i];

    if (sym === 'scatter' || sym === 'fireball') {
      break; // Scatter and fireball don't count in line pays
    }

    if (sym === 'wild') {
      if (matchSymbol === null) {
        // Wild acting as itself or substitute
        count++;
        positions.push([i, lineRows[i]]);
        continue;
      } else {
        // Wild substituting
        count++;
        positions.push([i, lineRows[i]]);
        continue;
      }
    }

    if (matchSymbol === null) {
      matchSymbol = sym;
      count++;
      positions.push([i, lineRows[i]]);
    } else if (sym === matchSymbol) {
      count++;
      positions.push([i, lineRows[i]]);
    } else {
      break;
    }
  }

  // If all wilds, treat as wild symbol
  if (matchSymbol === null && count > 0) {
    matchSymbol = 'wild';
  }

  if (!matchSymbol) return null;

  // Check minimum count for payout
  const isHighPay = HIGH_PAY_SYMBOLS.includes(matchSymbol);
  const minCount = isHighPay ? 2 : 3;

  if (count < minCount) return null;

  const symbolDef = SYMBOLS[matchSymbol];
  const payout = symbolDef.pays[count] || 0;

  if (payout === 0) return null;

  return { symbol: matchSymbol, count, payout, positions };
}

// ========================
// SCATTER EVALUATION
// ========================

export function countScatters(grid: ReelGrid): { count: number; positions: [number, number][] } {
  let count = 0;
  const positions: [number, number][] = [];

  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === 'scatter') {
        count++;
        positions.push([reel, row]);
      }
    }
  }

  return { count, positions };
}

export function getScatterPayout(count: number, totalBet: number): number {
  const scatterPays: Record<number, number> = { 3: 5, 4: 20, 5: 50 };
  return (scatterPays[count] || 0) * totalBet;
}

// ========================
// FIREBALL EVALUATION
// ========================

export function countFireballs(grid: ReelGrid): { count: number; positions: [number, number][] } {
  let count = 0;
  const positions: [number, number][] = [];

  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === 'fireball') {
        count++;
        positions.push([reel, row]);
      }
    }
  }

  return { count, positions };
}

export function generateFireballValue(totalBet: number): FireballValue {
  const rand = Math.random();

  // Probability distribution for fireball values
  if (rand < 0.005) {
    return { type: 'major', value: 0 };
  } else if (rand < 0.02) {
    return { type: 'minor', value: 0 };
  } else if (rand < 0.06) {
    return { type: 'mini', value: 0 };
  } else {
    // Credit values: 1x to 250x bet, weighted toward lower values
    const creditRand = Math.random();
    let multiplier: number;
    if (creditRand < 0.35) {
      multiplier = 1;
    } else if (creditRand < 0.55) {
      multiplier = 2;
    } else if (creditRand < 0.70) {
      multiplier = 3;
    } else if (creditRand < 0.80) {
      multiplier = 5;
    } else if (creditRand < 0.87) {
      multiplier = 8;
    } else if (creditRand < 0.92) {
      multiplier = 10;
    } else if (creditRand < 0.95) {
      multiplier = 15;
    } else if (creditRand < 0.97) {
      multiplier = 25;
    } else if (creditRand < 0.985) {
      multiplier = 50;
    } else if (creditRand < 0.995) {
      multiplier = 100;
    } else {
      multiplier = 250;
    }
    return { type: 'credits', value: multiplier * totalBet };
  }
}

// ========================
// HOLD AND SPIN
// ========================

export function initHoldAndSpin(
  grid: ReelGrid,
  totalBet: number
): HoldAndSpinState {
  const hsGrid: (FireballValue | null)[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => null)
  );
  const justLanded = new Array(15).fill(false);

  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === 'fireball') {
        hsGrid[reel][row] = generateFireballValue(totalBet);
        justLanded[reel * 3 + row] = true;
      }
    }
  }

  return {
    active: true,
    grid: hsGrid,
    spinsRemaining: 3,
    totalWin: 0,
    justLanded,
    complete: false,
    grandWon: false,
  };
}

export function holdAndSpinSpin(
  state: HoldAndSpinState,
  totalBet: number
): HoldAndSpinState {
  const newGrid = state.grid.map(reel => [...reel]);
  const justLanded = new Array(15).fill(false);
  let newLanded = false;

  // For each empty position, chance to land a fireball
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (newGrid[reel][row] === null) {
        // ~15% chance per empty position per spin
        if (Math.random() < 0.15) {
          newGrid[reel][row] = generateFireballValue(totalBet);
          justLanded[reel * 3 + row] = true;
          newLanded = true;
        }
      }
    }
  }

  const spinsRemaining = newLanded ? 3 : state.spinsRemaining - 1;

  // Check if all 15 positions are filled
  let allFilled = true;
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (newGrid[reel][row] === null) {
        allFilled = false;
        break;
      }
    }
    if (!allFilled) break;
  }

  const complete = allFilled || spinsRemaining <= 0;

  return {
    active: !complete,
    grid: newGrid,
    spinsRemaining,
    totalWin: 0, // calculated at end
    justLanded,
    complete,
    grandWon: allFilled,
  };
}

export function calculateHoldAndSpinWin(
  state: HoldAndSpinState,
  jackpots: { mini: number; minor: number; major: number; grand: number }
): number {
  let total = 0;

  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      const cell = state.grid[reel][row];
      if (cell) {
        switch (cell.type) {
          case 'credits':
            total += cell.value;
            break;
          case 'mini':
            total += jackpots.mini;
            break;
          case 'minor':
            total += jackpots.minor;
            break;
          case 'major':
            total += jackpots.major;
            break;
          case 'grand':
            total += jackpots.grand;
            break;
        }
      }
    }
  }

  if (state.grandWon) {
    total += jackpots.grand;
  }

  return Math.round(total * 100) / 100;
}

// ========================
// SPIN LOGIC
// ========================

// Boost fireball chance for more exciting gameplay
function generateBoostedGrid(): ReelGrid {
  // Normal spin with chance to force fireballs for bonus triggering
  const positions = generateRandomPositions();
  const grid = generateGrid(positions);

  // Small random chance to boost fireballs for more exciting gameplay
  const boostChance = Math.random();
  if (boostChance < 0.04) {
    // Force 6+ fireballs (trigger hold and spin) ~4% of spins
    return forceFireballs(grid, 6 + Math.floor(Math.random() * 3));
  }

  return grid;
}

function forceFireballs(grid: ReelGrid, count: number): ReelGrid {
  const newGrid = grid.map(reel => [...reel]);
  const positions: [number, number][] = [];

  // Collect all positions
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      positions.push([reel, row]);
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Place fireballs
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const [reel, row] = positions[i];
    newGrid[reel][row] = 'fireball';
  }

  return newGrid;
}

export function performSpin(): ReelGrid {
  return generateBoostedGrid();
}

export function performFreeGameSpin(): ReelGrid {
  // Free games have enhanced chances
  const grid = generateBoostedGrid();
  return grid;
}

// ========================
// JACKPOT VALUES
// ========================

export function getDefaultJackpots(totalBet: number) {
  return {
    mini: Math.round(totalBet * 10 * 100) / 100,
    minor: Math.round(totalBet * 25 * 100) / 100,
    major: Math.round(totalBet * 100 * 100) / 100,  // Progressive, starts at 100x
    grand: Math.round(totalBet * 1000 * 100) / 100,  // Progressive, starts at 1000x
  };
}

// ========================
// INITIAL STATE
// ========================

export function createInitialState(): GameState {
  const denomination = 0.01;
  const bet = 50; // 50 credits
  const totalBet = denomination * bet;
  const grid = performSpin();

  return {
    balance: 1000,
    bet,
    denomination,
    totalBet,
    phase: 'idle',
    reelGrid: grid,
    targetGrid: grid,
    winLines: [],
    currentWin: 0,
    lastWin: 0,
    holdAndSpin: {
      active: false,
      grid: Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => null)),
      spinsRemaining: 0,
      totalWin: 0,
      justLanded: new Array(15).fill(false),
      complete: false,
      grandWon: false,
    },
    freeGames: {
      active: false,
      spinsRemaining: 0,
      totalWin: 0,
      totalSpins: 0,
    },
    jackpots: getDefaultJackpots(totalBet),
    autoPlay: false,
    soundEnabled: true,
    spinCount: 0,
  };
}
