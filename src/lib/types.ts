export type SymbolId =
  | 'wild'
  | 'scatter'
  | 'fireball'
  | 'warrior'
  | 'ladies'
  | 'vessel'
  | 'chest'
  | 'K'
  | 'Q'
  | 'J'
  | '10'
  | '9';

export interface SymbolDef {
  id: SymbolId;
  name: string;
  emoji: string;
  pays: Record<number, number>; // count -> multiplier of total bet
}

export type ReelGrid = SymbolId[][]; // [reel][row]

export interface WinLine {
  lineIndex: number;
  symbol: SymbolId;
  count: number;
  payout: number;
  positions: [number, number][]; // [reel, row]
}

export interface FireballValue {
  type: 'credits' | 'mini' | 'minor' | 'major' | 'grand';
  value: number; // multiplier of bet for credits, or jackpot amount
}

export interface HoldAndSpinState {
  active: boolean;
  grid: (FireballValue | null)[][]; // 5x3 grid of locked fireballs
  spinsRemaining: number;
  totalWin: number;
  justLanded: boolean[];  // flat 15-element array tracking which positions just landed
  complete: boolean;
  grandWon: boolean;
}

export interface FreeGamesState {
  active: boolean;
  spinsRemaining: number;
  totalWin: number;
  totalSpins: number;
}

export type GamePhase = 
  | 'idle' 
  | 'spinning' 
  | 'showing-wins'
  | 'hold-and-spin'
  | 'hold-and-spin-spinning'
  | 'hold-and-spin-result'
  | 'hold-and-spin-complete'
  | 'free-games'
  | 'free-games-spinning';

export interface GameState {
  balance: number;
  bet: number;
  denomination: number;
  totalBet: number;
  phase: GamePhase;
  reelGrid: ReelGrid;
  targetGrid: ReelGrid;
  winLines: WinLine[];
  currentWin: number;
  lastWin: number;
  holdAndSpin: HoldAndSpinState;
  freeGames: FreeGamesState;
  jackpots: {
    mini: number;
    minor: number;
    major: number;
    grand: number;
  };
  autoPlay: boolean;
  soundEnabled: boolean;
  spinCount: number;
}
