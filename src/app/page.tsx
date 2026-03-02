'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GamePhase } from '../lib/types';
import {
  createInitialState,
  performSpin,
  evaluateWins,
  countScatters,
  getScatterPayout,
  countFireballs,
  initHoldAndSpin,
  holdAndSpinSpin,
  calculateHoldAndSpinWin,
  getDefaultJackpots,
} from '../lib/gameEngine';
import { audioManager } from '../lib/audio';
import ReelGrid from '../components/ReelGrid';
import JackpotDisplay from '../components/JackpotDisplay';
import HoldAndSpinGrid from '../components/HoldAndSpinGrid';
import WinCelebration from '../components/WinCelebration';
import DragonBackground from '../components/DragonBackground';
import Paytable from '../components/Paytable';

export default function Home() {
  const [game, setGame] = useState<GameState>(createInitialState);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [winOverlayText, setWinOverlayText] = useState('');
  const [wonJackpot, setWonJackpot] = useState<string | null>(null);
  const [hsSpinning, setHsSpinning] = useState(false);
  const [showFreeGamesIntro, setShowFreeGamesIntro] = useState(false);
  const [particleEffects, setParticleEffects] = useState(false);
  const [showCelebration, setShowCelebration] = useState<{ amount: number; isJackpot: boolean; type?: string } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const autoPlayRef = useRef(false);
  const audioInitRef = useRef(false);

  // Initialize audio on first interaction
  const initAudio = useCallback(() => {
    if (!audioInitRef.current) {
      audioManager.init();
      audioInitRef.current = true;
    }
  }, []);

  // Calculate total bet
  const totalBet = game.denomination * game.bet;

  // Update jackpots when bet changes
  useEffect(() => {
    setGame(prev => ({
      ...prev,
      jackpots: getDefaultJackpots(prev.denomination * prev.bet),
      totalBet: prev.denomination * prev.bet,
    }));
  }, [game.denomination, game.bet]);

  // SPIN handler
  const handleSpin = useCallback(() => {
    initAudio();
    if (game.phase !== 'idle' && game.phase !== 'showing-wins') return;
    if (game.balance < totalBet) return;

    audioManager.spinStart();

    const newGrid = performSpin();
    
    setGame(prev => ({
      ...prev,
      phase: 'spinning' as GamePhase,
      balance: prev.balance - totalBet,
      targetGrid: newGrid,
      winLines: [],
      currentWin: 0,
      lastWin: 0,
      spinCount: prev.spinCount + 1,
    }));
  }, [game.phase, game.balance, totalBet, initAudio]);

  // Spin complete handler
  const handleSpinComplete = useCallback(() => {
    setGame(prev => {
      const grid = prev.targetGrid;
      const newState = { ...prev, reelGrid: grid, phase: 'idle' as GamePhase };

      // Evaluate wins
      const winLines = evaluateWins(grid, totalBet);
      const totalLineWin = winLines.reduce((sum, wl) => sum + wl.payout, 0);

      // Check scatters
      const scatters = countScatters(grid);
      const scatterWin = getScatterPayout(scatters.count, totalBet);

      // Check fireballs
      const fireballs = countFireballs(grid);

      let phase: GamePhase = 'idle';
      const currentWin = totalLineWin + scatterWin;
      const balance = prev.balance + currentWin;

      // Determine next phase
      if (fireballs.count >= 6) {
        // Hold and Spin triggered!
        phase = 'hold-and-spin';
        const hsState = initHoldAndSpin(grid, totalBet);
        newState.holdAndSpin = hsState;
        audioManager.holdAndSpinTrigger();
      } else if (scatters.count >= 3) {
        // Free Games triggered!
        phase = 'free-games';
        newState.freeGames = {
          active: true,
          spinsRemaining: 6,
          totalWin: currentWin,
          totalSpins: 6,
        };
        audioManager.freeGamesTrigger();
      } else if (winLines.length > 0 || scatterWin > 0) {
        phase = 'showing-wins';
        if (currentWin > totalBet * 20) {
          audioManager.winBig();
          setShowCelebration({ amount: currentWin, isJackpot: false });
        } else if (currentWin > totalBet * 10) {
          audioManager.winBig();
        } else if (currentWin > totalBet * 3) {
          audioManager.winMedium();
        } else {
          audioManager.winSmall();
        }
      }

      return {
        ...newState,
        phase,
        winLines,
        currentWin,
        lastWin: currentWin,
        balance,
      };
    });
  }, [totalBet]);

  // Show win overlay for big wins
  useEffect(() => {
    if (game.currentWin > totalBet * 5 && (game.phase === 'showing-wins' || game.phase === 'idle')) {
      setShowWinOverlay(true);
      setWinOverlayText(`$${game.currentWin.toFixed(2)}`);
      setParticleEffects(true);
      const timer = setTimeout(() => {
        setShowWinOverlay(false);
        setParticleEffects(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [game.currentWin, game.phase, totalBet]);

  // Show free games intro
  useEffect(() => {
    if (game.phase === 'free-games' && game.freeGames.active && game.freeGames.spinsRemaining === game.freeGames.totalSpins) {
      setShowFreeGamesIntro(true);
      const timer = setTimeout(() => setShowFreeGamesIntro(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.freeGames.active, game.freeGames.spinsRemaining, game.freeGames.totalSpins]);

  // Auto-dismiss showing-wins phase
  useEffect(() => {
    if (game.phase === 'showing-wins') {
      const timer = setTimeout(() => {
        setGame(prev => ({ ...prev, phase: 'idle' }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [game.phase]);

  // Auto-play for free games
  useEffect(() => {
    if (game.phase === 'free-games' && game.freeGames.active && game.freeGames.spinsRemaining > 0 && !showFreeGamesIntro) {
      const timer = setTimeout(() => {
        handleFreeGameSpin();
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (game.phase === 'free-games' && game.freeGames.spinsRemaining === 0) {
      // Free games complete
      const timer = setTimeout(() => {
        setShowWinOverlay(true);
        setWinOverlayText(`FREE GAMES WIN\n$${game.freeGames.totalWin.toFixed(2)}`);
        setParticleEffects(true);
        audioManager.winBig();
        setTimeout(() => {
          setShowWinOverlay(false);
          setParticleEffects(false);
          setGame(prev => ({
            ...prev,
            phase: 'idle',
            freeGames: { ...prev.freeGames, active: false },
          }));
        }, 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase, game.freeGames.spinsRemaining, game.freeGames.active, showFreeGamesIntro]);

  // Free game spin
  const handleFreeGameSpin = useCallback(() => {
    const newGrid = performSpin();
    const winLines = evaluateWins(newGrid, totalBet);
    const totalLineWin = winLines.reduce((sum, wl) => sum + wl.payout, 0);
    const scatters = countScatters(newGrid);
    const scatterWin = getScatterPayout(scatters.count, totalBet);
    const fireballs = countFireballs(newGrid);
    const spinWin = totalLineWin + scatterWin;

    if (spinWin > 0) {
      if (spinWin > totalBet * 5) audioManager.winBig();
      else audioManager.winSmall();
    }

    setGame(prev => {
      let additionalSpins = 0;
      if (scatters.count >= 3) {
        additionalSpins = 6;
        audioManager.freeGamesTrigger();
      }

      // Check for Hold & Spin within free games
      if (fireballs.count >= 6) {
        const hsState = initHoldAndSpin(newGrid, totalBet);
        return {
          ...prev,
          reelGrid: newGrid,
          targetGrid: newGrid,
          winLines,
          currentWin: spinWin,
          balance: prev.balance + spinWin,
          holdAndSpin: hsState,
          phase: 'hold-and-spin' as GamePhase,
          freeGames: {
            ...prev.freeGames,
            spinsRemaining: prev.freeGames.spinsRemaining - 1 + additionalSpins,
            totalWin: prev.freeGames.totalWin + spinWin,
          },
        };
      }

      return {
        ...prev,
        reelGrid: newGrid,
        targetGrid: newGrid,
        winLines,
        currentWin: spinWin,
        lastWin: spinWin,
        balance: prev.balance + spinWin,
        freeGames: {
          ...prev.freeGames,
          spinsRemaining: prev.freeGames.spinsRemaining - 1 + additionalSpins,
          totalWin: prev.freeGames.totalWin + spinWin,
        },
      };
    });
  }, [totalBet]);

  // Hold and Spin auto-spin
  useEffect(() => {
    if (game.phase === 'hold-and-spin' && game.holdAndSpin.active && !hsSpinning) {
      const timer = setTimeout(() => {
        setHsSpinning(true);
        setTimeout(() => {
          setGame(prev => {
            const newHsState = holdAndSpinSpin(prev.holdAndSpin, totalBet);
            
            // Play sound for new fireballs
            if (newHsState.justLanded.some(Boolean)) {
              audioManager.fireballLand();
            }

            if (newHsState.complete) {
              const winAmount = calculateHoldAndSpinWin(newHsState, prev.jackpots);
              
              if (newHsState.grandWon) {
                audioManager.grandJackpot();
                setWonJackpot('grand');
                setShowCelebration({ amount: winAmount, isJackpot: true, type: 'GRAND' });
              } else if (winAmount > prev.jackpots.major * 0.5) {
                audioManager.holdAndSpinComplete();
                setShowCelebration({ amount: winAmount, isJackpot: false });
              } else {
                audioManager.holdAndSpinComplete();
              }

              return {
                ...prev,
                holdAndSpin: { ...newHsState, totalWin: winAmount },
                phase: 'hold-and-spin-complete' as GamePhase,
                balance: prev.balance + winAmount,
                currentWin: winAmount,
                lastWin: winAmount,
              };
            }

            return {
              ...prev,
              holdAndSpin: newHsState,
            };
          });
          setHsSpinning(false);
        }, 600);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.holdAndSpin.active, game.holdAndSpin.spinsRemaining, hsSpinning, totalBet, game.holdAndSpin]);

  // Hold and Spin complete - show results and return
  useEffect(() => {
    if (game.phase === 'hold-and-spin-complete') {
      const timer = setTimeout(() => {
        setShowWinOverlay(true);
        setWinOverlayText(
          game.holdAndSpin.grandWon
            ? `🏆 GRAND JACKPOT! 🏆\n$${game.holdAndSpin.totalWin.toFixed(2)}`
            : `HOLD & SPIN WIN\n$${game.holdAndSpin.totalWin.toFixed(2)}`
        );
        setParticleEffects(true);

        setTimeout(() => {
          setShowWinOverlay(false);
          setParticleEffects(false);
          setWonJackpot(null);
          setGame(prev => ({
            ...prev,
            phase: prev.freeGames.active ? 'free-games' as GamePhase : 'idle' as GamePhase,
            holdAndSpin: {
              active: false,
              grid: Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => null)),
              spinsRemaining: 0,
              totalWin: 0,
              justLanded: new Array(15).fill(false),
              complete: false,
              grandWon: false,
            },
          }));
        }, 4000);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.holdAndSpin.totalWin, game.holdAndSpin.grandWon, game.freeGames.active]);

  // Auto-play
  useEffect(() => {
    autoPlayRef.current = game.autoPlay;
  }, [game.autoPlay]);

  useEffect(() => {
    if (game.autoPlay && game.phase === 'idle' && !game.freeGames.active && !game.holdAndSpin.active) {
      const timer = setTimeout(() => {
        if (autoPlayRef.current) handleSpin();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [game.autoPlay, game.phase, game.freeGames.active, game.holdAndSpin.active, handleSpin]);

  // Bet adjustment
  const adjustBet = (direction: 'up' | 'down') => {
    initAudio();
    audioManager.buttonClick();
    const betLevels = [10, 20, 25, 50, 100, 200, 250, 500];
    const currentIdx = betLevels.indexOf(game.bet);
    let newIdx = direction === 'up' ? currentIdx + 1 : currentIdx - 1;
    newIdx = Math.max(0, Math.min(betLevels.length - 1, newIdx));
    setGame(prev => ({ ...prev, bet: betLevels[newIdx] }));
  };

  // Denomination adjustment
  const adjustDenom = (direction: 'up' | 'down') => {
    initAudio();
    audioManager.buttonClick();
    const denoms = [0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00];
    const currentIdx = denoms.indexOf(game.denomination);
    let newIdx = direction === 'up' ? currentIdx + 1 : currentIdx - 1;
    newIdx = Math.max(0, Math.min(denoms.length - 1, newIdx));
    setGame(prev => ({ ...prev, denomination: denoms[newIdx] }));
  };

  // Max bet handler
  const handleMaxBet = () => {
    if (game.phase !== 'idle') return;
    initAudio();
    audioManager.buttonClick();
    setGame(prev => ({ ...prev, bet: 500 }));
  };

  const canSpin = (game.phase === 'idle' || game.phase === 'showing-wins') && game.balance >= totalBet && !game.freeGames.active;
  const isHoldAndSpin = game.phase === 'hold-and-spin' || game.phase === 'hold-and-spin-spinning' || game.phase === 'hold-and-spin-complete';

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-between overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0a0015 0%, #150020 30%, #0a0015 100%)',
      }}
    >
      {/* Dragon background decoration */}
      <DragonBackground />

      {/* Particle effects */}
      {particleEffects && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${60 + Math.random() * 40}%`,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: ['#FFD700', '#FF4500', '#FF6B00', '#FFFFFF'][i % 4],
                animation: `particleFloat ${1 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Win Celebration Component */}
      {showCelebration && (
        <WinCelebration
          amount={showCelebration.amount}
          isJackpot={showCelebration.isJackpot}
          jackpotType={showCelebration.type}
          onComplete={() => setShowCelebration(null)}
        />
      )}

      {/* Win Overlay */}
      {showWinOverlay && !showCelebration && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center grand-reveal">
            {winOverlayText.split('\n').map((line, i) => (
              <div
                key={i}
                className={`${i === 0 ? 'text-2xl md:text-4xl' : 'text-4xl md:text-6xl'} font-bold shimmer-text`}
                style={{ marginBottom: '10px' }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Games Intro */}
      {showFreeGamesIntro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center grand-reveal">
            <div className="text-3xl md:text-5xl font-bold text-red-500 mb-2" style={{ textShadow: '0 0 30px rgba(255,0,0,0.5)' }}>
              🏴 FREE GAMES! 🏴
            </div>
            <div className="text-xl md:text-2xl text-gold font-bold">
              {game.freeGames.totalSpins} Free Spins Awarded!
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="relative z-10 text-center pt-2">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-2xl">🐉</span>
          <h1 className="text-xl md:text-2xl font-bold tracking-wider shimmer-text">
            DRAGON LINK
          </h1>
          <span className="text-2xl">🐉</span>
        </div>
        <h2 className="text-sm md:text-base font-bold text-gold tracking-widest" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
          ✦ GOLDEN CENTURY ✦
        </h2>
      </div>

      {/* Jackpot Display */}
      <div className="relative z-10 w-full max-w-xl px-2">
        <JackpotDisplay jackpots={game.jackpots} wonJackpot={wonJackpot} />
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 w-full max-w-xl px-2 flex-1 flex items-center">
        <div className="w-full">
          {/* Free Games Header */}
          {game.freeGames.active && (
            <div className="text-center mb-2 py-1 rounded-lg"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.3), transparent)' }}>
              <span className="text-red-400 font-bold text-sm">
                FREE GAMES: {game.freeGames.spinsRemaining} of {game.freeGames.totalSpins} remaining
              </span>
              <span className="text-gold font-bold text-sm ml-3">
                Win: ${game.freeGames.totalWin.toFixed(2)}
              </span>
            </div>
          )}

          {/* Hold and Spin Header */}
          {isHoldAndSpin && (
            <div className="text-center mb-2 py-1 rounded-lg"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,69,0,0.3), transparent)' }}>
              <span className="text-orange-400 font-bold text-lg shimmer-text">
                🔥 HOLD & SPIN 🔥
              </span>
              <span className="text-white font-bold text-sm ml-3">
                Spins: {game.holdAndSpin.spinsRemaining}
              </span>
            </div>
          )}

          {/* Reel Grid or Hold & Spin Grid */}
          {isHoldAndSpin ? (
            <HoldAndSpinGrid state={game.holdAndSpin} spinning={hsSpinning} />
          ) : (
            <ReelGrid
              grid={game.phase === 'spinning' ? game.targetGrid : game.reelGrid}
              spinning={game.phase === 'spinning'}
              winLines={game.winLines}
              showingWins={game.phase === 'showing-wins'}
              onSpinComplete={handleSpinComplete}
            />
          )}

          {/* Win Display */}
          {game.lastWin > 0 && game.phase !== 'spinning' && !isHoldAndSpin && (
            <div className="text-center mt-2">
              <span className="text-gold font-bold text-lg" style={{ textShadow: '0 0 15px rgba(255,215,0,0.5)' }}>
                WIN: ${game.lastWin.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full max-w-xl px-2 pb-3">
        {/* Info Bar */}
        <div className="flex justify-between items-center mb-2 px-2">
          <div className="text-center">
            <div className="text-xs text-gray-400">BALANCE</div>
            <div className="text-sm font-bold text-white">${game.balance.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">DENOM</div>
            <div className="text-sm font-bold text-gold">${game.denomination.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">BET</div>
            <div className="text-sm font-bold text-gold">{game.bet} cr</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">TOTAL BET</div>
            <div className="text-sm font-bold text-white">${totalBet.toFixed(2)}</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Info / Paytable */}
          <button
            onClick={() => { initAudio(); setShowPaytable(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
              active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
              border: '1px solid #555',
              color: '#FFD700',
            }}
            title="Paytable"
          >
            ℹ️
          </button>

          {/* Denomination controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustDenom('down')}
              disabled={game.phase !== 'idle'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                disabled:opacity-30 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #444 0%, #222 100%)',
                border: '1px solid #666',
              }}
            >
              −
            </button>
            <button
              onClick={() => adjustDenom('up')}
              disabled={game.phase !== 'idle'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                disabled:opacity-30 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #444 0%, #222 100%)',
                border: '1px solid #666',
              }}
            >
              +
            </button>
          </div>

          {/* Bet controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustBet('down')}
              disabled={game.phase !== 'idle'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                disabled:opacity-30 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #444 0%, #222 100%)',
                border: '1px solid #666',
              }}
            >
              BET−
            </button>
            <button
              onClick={() => adjustBet('up')}
              disabled={game.phase !== 'idle'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                disabled:opacity-30 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #444 0%, #222 100%)',
                border: '1px solid #666',
              }}
            >
              BET+
            </button>
          </div>

          {/* Max Bet */}
          <button
            onClick={handleMaxBet}
            disabled={game.phase !== 'idle'}
            className="px-2 py-2 rounded-lg text-xs font-bold transition-all
              disabled:opacity-30 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #8B0000 0%, #4a0000 100%)',
              border: '1px solid #FF4500',
              color: '#FFD700',
            }}
          >
            MAX
          </button>

          {/* Spin Button */}
          <button
            onClick={() => {
              initAudio();
              if (canSpin) handleSpin();
            }}
            disabled={!canSpin}
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg
              disabled:opacity-40 active:scale-95 transition-all duration-150"
            style={{
              background: canSpin
                ? 'linear-gradient(180deg, #FF4500 0%, #DC143C 50%, #8B0000 100%)'
                : 'linear-gradient(180deg, #444 0%, #222 100%)',
              border: `3px solid ${canSpin ? '#FFD700' : '#444'}`,
              boxShadow: canSpin ? '0 0 20px rgba(255,69,0,0.5), 0 0 40px rgba(255,69,0,0.2)' : 'none',
              color: canSpin ? '#FFD700' : '#666',
            }}
          >
            {game.phase === 'spinning' ? '...' : 'SPIN'}
          </button>

          {/* Auto Play */}
          <button
            onClick={() => {
              initAudio();
              audioManager.buttonClick();
              setGame(prev => ({ ...prev, autoPlay: !prev.autoPlay }));
            }}
            className={`px-2 py-2 rounded-lg text-xs font-bold transition-all
              ${game.autoPlay ? 'text-gold' : 'text-gray-400'}
            `}
            style={{
              background: game.autoPlay
                ? 'linear-gradient(180deg, #4a3000 0%, #2a1a00 100%)'
                : 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
              border: `1px solid ${game.autoPlay ? '#FFD700' : '#444'}`,
            }}
          >
            AUTO
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              initAudio();
              const newEnabled = !game.soundEnabled;
              setGame(prev => ({ ...prev, soundEnabled: newEnabled }));
              audioManager.setEnabled(newEnabled);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
              border: '1px solid #444',
              color: game.soundEnabled ? '#00FF88' : '#666',
            }}
          >
            {game.soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-600 pb-1 z-10">
        For entertainment only. No real money.
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <Paytable
          onClose={() => setShowPaytable(false)}
          denomination={game.denomination}
          bet={game.bet}
        />
      )}
    </div>
  );
}
