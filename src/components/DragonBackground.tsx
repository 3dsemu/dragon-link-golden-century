'use client';
import React from 'react';

export default function DragonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main gradient background */}
      <div className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 50%, rgba(255, 140, 0, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 100% 50%, rgba(255, 140, 0, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #050010 0%, #0a0018 30%, #0d0020 50%, #0a0018 70%, #050010 100%)
          `,
        }}
      />

      {/* Great Wall silhouette at bottom */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 800 100" preserveAspectRatio="none" style={{ height: '80px', opacity: 0.12 }}>
        <path d="M0,100 L0,70 L20,70 L20,60 L30,60 L30,70 L50,70 L50,55 L55,55 L55,45 L60,45 L60,55 L65,55 L65,70 L80,70 L80,65 L90,65 L90,70 L120,70 L120,50 L125,50 L125,40 L130,40 L130,50 L135,50 L135,70 L160,70 L160,60 L170,60 L170,70 L200,70 L200,55 L205,55 L205,42 L210,42 L210,55 L215,55 L215,70 L240,70 L240,65 L250,65 L250,70 L280,70 L280,48 L285,48 L285,38 L290,38 L290,48 L295,48 L295,70 L320,70 L320,60 L330,60 L330,70 L360,70 L360,52 L365,52 L365,40 L370,40 L370,52 L375,52 L375,70 L400,70 L400,65 L410,65 L410,70 L440,70 L440,55 L445,55 L445,43 L450,43 L450,55 L455,55 L455,70 L480,70 L480,60 L490,60 L490,70 L520,70 L520,50 L525,50 L525,38 L530,38 L530,50 L535,50 L535,70 L560,70 L560,65 L570,65 L570,70 L600,70 L600,52 L605,52 L605,42 L610,42 L610,52 L615,52 L615,70 L640,70 L640,60 L650,60 L650,70 L680,70 L680,48 L685,48 L685,36 L690,36 L690,48 L695,48 L695,70 L720,70 L720,65 L730,65 L730,70 L760,70 L760,55 L765,55 L765,44 L770,44 L770,55 L775,55 L775,70 L800,70 L800,100 Z"
          fill="url(#wallGradient)"
        />
        <defs>
          <linearGradient id="wallGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
        </defs>
      </svg>

      {/* Decorative dragon curves */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none" style={{ opacity: 0.04 }}>
        {/* Dragon curve left */}
        <path d="M-50,300 C50,200 100,100 200,150 C300,200 250,350 150,400 C50,450 -50,400 -50,300Z" 
          fill="none" stroke="#FFD700" strokeWidth="2" />
        {/* Dragon curve right */}
        <path d="M850,300 C750,200 700,100 600,150 C500,200 550,350 650,400 C750,450 850,400 850,300Z" 
          fill="none" stroke="#FFD700" strokeWidth="2" />
      </svg>

      {/* Animated floating orbs */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            left: `${15 + i * 18}%`,
            top: `${20 + Math.sin(i) * 30}%`,
            background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent)',
            animation: `particleFloat ${8 + i * 2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-2xl opacity-30">🐉</div>
      <div className="absolute top-2 right-2 text-2xl opacity-30 transform scale-x-[-1]">🐉</div>

      {/* Gold border lines */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FFD70030, #FFD70060, #FFD70030, transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FFD70030, #FFD70060, #FFD70030, transparent)' }} />
    </div>
  );
}
