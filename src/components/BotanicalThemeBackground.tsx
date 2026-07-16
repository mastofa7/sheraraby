import React, { useMemo } from 'react';

// 1. Moorish/Andalusian Stone Arches Component
export function AncientArches() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none opacity-20 md:opacity-25 mix-blend-screen z-0">
      <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="archGold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0b3018" stopOpacity="0" />
            <stop offset="40%" stopColor="#dfba6b" stopOpacity="0.15" />
            <stop offset="80%" stopColor="#dfba6b" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#dfba6b" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        
        {/* Left Side Double Arch */}
        <path d="M-100,900 L-100,420 C-100,260 10,120 180,120 C350,120 460,260 460,420 L460,900" stroke="url(#archGold)" strokeWidth="2.5" strokeDasharray="12 6" />
        <path d="M-75,900 L-75,420 C-75,280 25,140 180,140 C335,140 435,280 435,420 L435,900" stroke="url(#archGold)" strokeWidth="1" />
        <path d="M40,900 L40,520 C40,420 100,320 180,320 C260,320 320,420 320,520 L320,900" stroke="url(#archGold)" strokeWidth="1.5" />
        
        {/* Right Side Double Arch */}
        <path d="M1080,900 L1080,420 C1080,260 1190,120 1360,120 C1530,120 1640,260 1640,420 L1640,900" stroke="url(#archGold)" strokeWidth="2.5" strokeDasharray="12 6" />
        <path d="M1105,900 L1105,420 C1105,280 1205,140 1360,140 C1515,140 1615,280 1615,420 L1615,900" stroke="url(#archGold)" strokeWidth="1" />
        <path d="M1220,900 L1220,520 C1220,420 1280,320 1360,320 C1440,320 1500,420 1500,520 L1500,900" stroke="url(#archGold)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// 2. Top-Left Cascading Branch with Pomegranate Flower (Jullanar)
export function TopLeftBranch() {
  return (
    <div className="absolute top-0 left-0 w-[42%] max-w-[340px] aspect-square pointer-events-none z-10 select-none origin-top-left animate-sway-slow">
      <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="50%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="jullanarFlowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#422006" />
          </linearGradient>
          <filter id="naturalShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="4" stdDeviation="3" floodOpacity="0.55" floodColor="#011b0e" />
          </filter>
        </defs>
        
        {/* Branch stems */}
        <path d="M0,0 Q65,15 130,45 T230,110" stroke="url(#stemGrad)" strokeWidth="5.5" strokeLinecap="round" filter="url(#naturalShadow)" />
        <path d="M90,28 Q140,55 170,115" stroke="url(#stemGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M45,12 Q55,65 85,125" stroke="url(#stemGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Pomegranate Flower (Jullanar) */}
        <g transform="translate(170, 115)" filter="url(#naturalShadow)">
          {/* Petals */}
          <path d="M0,0 C-12,-22 -32,-16 -26,0 C-32,16 -12,22 0,0" fill="url(#jullanarFlowerGrad)" />
          <path d="M0,0 C22,-12 32,-32 0,-26 C-16,-32 -22,-12 0,0" fill="url(#jullanarFlowerGrad)" />
          <path d="M0,0 C26,12 16,32 0,26 C-16,22 -12,12 0,0" fill="url(#jullanarFlowerGrad)" />
          <path d="M0,0 C-16,22 -32,32 -22,42 C-6,37 12,22 0,0" fill="url(#jullanarFlowerGrad)" />
          <path d="M0,0 C12,-26 32,-22 26,-6 C22,12 12,16 0,0" fill="url(#jullanarFlowerGrad)" />
          
          {/* Golden Pistil and Stamens */}
          <circle cx="0" cy="0" r="4.5" fill="#eab308" />
          <line x1="0" y1="0" x2="-6" y2="-6" stroke="#facc15" strokeWidth="1.2" />
          <line x1="0" y1="0" x2="6" y2="-9" stroke="#facc15" strokeWidth="1.2" />
          <line x1="0" y1="0" x2="-9" y2="4" stroke="#facc15" strokeWidth="1.2" />
          <line x1="0" y1="0" x2="9" y2="8" stroke="#facc15" strokeWidth="1.2" />
          <circle cx="-6" cy="-6" r="1.2" fill="#fbbf24" />
          <circle cx="6" cy="-9" r="1.2" fill="#fbbf24" />
          <circle cx="-9" cy="4" r="1.2" fill="#fbbf24" />
          <circle cx="9" cy="8" r="1.2" fill="#fbbf24" />
        </g>

        {/* Leaves along branch */}
        <path d="M45,12 Q65,-8 95,2 Q80,22 45,12 Z" fill="url(#leafGrad1)" filter="url(#naturalShadow)" />
        <path d="M130,45 Q160,30 180,50 Q155,70 130,45 Z" fill="url(#leafGrad2)" filter="url(#naturalShadow)" />
        <path d="M90,28 Q120,12 140,32 Q115,48 90,28 Z" fill="url(#leafGrad1)" />
        <path d="M190,75 Q220,68 230,88 Q205,103 190,75 Z" fill="url(#leafGrad1)" />
        <path d="M65,42 Q55,78 80,93 Q90,63 65,42 Z" fill="url(#leafGrad2)" />
      </svg>
    </div>
  );
}

// 3. Top-Right Cascading Branch
export function TopRightBranch() {
  return (
    <div className="absolute top-0 right-0 w-[38%] max-w-[300px] aspect-square pointer-events-none z-10 select-none origin-top-right animate-sway-reverse">
      <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="50%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="leafGrad4" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="stemGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#422006" />
          </linearGradient>
          <filter id="naturalShadowRight" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="-1" dy="4" stdDeviation="3" floodOpacity="0.55" floodColor="#011b0e" />
          </filter>
        </defs>
        
        {/* Branch stems */}
        <path d="M300,0 Q235,12 170,42 T70,105" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" filter="url(#naturalShadowRight)" />
        <path d="M220,28 Q170,55 140,115" stroke="url(#stemGrad)" strokeWidth="3" strokeLinecap="round" />

        {/* Leaves along branch */}
        <path d="M260,10 Q240,-10 210,0 Q225,20 260,10 Z" fill="url(#leafGrad3)" filter="url(#naturalShadowRight)" />
        <path d="M180,42 Q150,27 130,47 Q155,67 180,42 Z" fill="url(#leafGrad4)" filter="url(#naturalShadowRight)" />
        <path d="M220,28 Q190,12 170,32 Q195,48 220,28 Z" fill="url(#leafGrad3)" />
        <path d="M110,72 Q80,67 70,87 Q95,102 110,72 Z" fill="url(#leafGrad3)" />
        <path d="M235,42 Q245,78 220,93 Q210,63 235,42 Z" fill="url(#leafGrad4)" />
      </svg>
    </div>
  );
}

// 4. Bottom-Right Creeping Branch with Hanging Ripe Pomegranates (ثمار الرمان)
export function BottomRightBranch() {
  return (
    <div className="absolute bottom-0 right-0 w-[44%] max-w-[340px] aspect-square pointer-events-none z-10 select-none origin-bottom-right animate-sway-slow">
      <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGradCreep" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="60%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="pomegranateGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="20%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <linearGradient id="pomegranateGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="25%" stopColor="#ea580c" />
            <stop offset="70%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#5c0707" />
          </linearGradient>
          <linearGradient id="stemCreep" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#713f12" />
            <stop offset="100%" stopColor="#422006" />
          </linearGradient>
          <filter id="creepShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="-2" dy="-3" stdDeviation="4" floodOpacity="0.6" floodColor="#011b0e" />
          </filter>
        </defs>
        
        {/* Creeping woody stem */}
        <path d="M300,300 Q230,230 170,200 T50,150" stroke="url(#stemCreep)" strokeWidth="5.5" strokeLinecap="round" filter="url(#creepShadow)" />
        <path d="M210,220 Q150,180 110,120" stroke="url(#stemCreep)" strokeWidth="3" strokeLinecap="round" />

        {/* Big hanging pomegranate */}
        <g transform="translate(175, 130)" filter="url(#creepShadow)">
          <path d="M-4,12 L0,0" stroke="url(#stemCreep)" strokeWidth="3" />
          <circle cx="0" cy="-18" r="23" fill="url(#pomegranateGrad1)" />
          {/* Crown/sepal on top of pomegranate */}
          <path d="M-10,-40 L-15,-48 L-3,-44 L5,-49 L11,-40 L0,-36 Z" fill="url(#pomegranateGrad1)" />
          {/* Shiny highlights */}
          <ellipse cx="-8" cy="-24" rx="6" ry="3" fill="#ffffff" opacity="0.3" transform="rotate(-35, -8, -24)" />
        </g>

        {/* Smaller hanging pomegranate */}
        <g transform="translate(110, 120)" filter="url(#creepShadow)">
          <path d="M-2.5,9 L0,0" stroke="url(#stemCreep)" strokeWidth="2.2" />
          <circle cx="0" cy="-13" r="16" fill="url(#pomegranateGrad2)" />
          {/* Crown/sepal */}
          <path d="M-7,-28 L-11,-34 L-2,-31 L4,-35 L8,-28 L0,-25 Z" fill="url(#pomegranateGrad2)" />
        </g>

        {/* Leaves crawling up */}
        <path d="M210,220 Q180,240 160,210 Q190,190 210,220 Z" fill="url(#leafGradCreep)" filter="url(#creepShadow)" />
        <path d="M130,170 Q100,190 80,160 Q110,140 130,170 Z" fill="url(#leafGradCreep)" />
        <path d="M240,200 Q230,160 200,175 Q210,210 240,200 Z" fill="url(#leafGradCreep)" />
        <path d="M90,180 Q60,200 45,175 Q75,155 90,180 Z" fill="url(#leafGradCreep)" />
      </svg>
    </div>
  );
}

// 5. Bottom-Left Creeping Leafy Branch
export function BottomLeftBranch() {
  return (
    <div className="absolute bottom-0 left-0 w-[35%] max-w-[260px] aspect-square pointer-events-none z-10 select-none origin-bottom-left animate-sway-reverse">
      <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGradCreepLeft" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="60%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="stemCreepLeft" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#713f12" />
            <stop offset="100%" stopColor="#422006" />
          </linearGradient>
          <filter id="creepShadowLeft" x="-10%" y="-15%" width="120%" height="130%">
            <feDropShadow dx="1" dy="-3" stdDeviation="3.5" floodOpacity="0.5" floodColor="#011b0e" />
          </filter>
        </defs>
        
        {/* Creeping stem */}
        <path d="M0,300 Q60,240 120,210 T240,160" stroke="url(#stemCreepLeft)" strokeWidth="4.5" strokeLinecap="round" filter="url(#creepShadowLeft)" />
        <path d="M80,230 Q140,190 180,130" stroke="url(#stemCreepLeft)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Leaves crawling */}
        <path d="M80,230 Q110,250 130,220 Q100,200 80,230 Z" fill="url(#leafGradCreepLeft)" filter="url(#creepShadowLeft)" />
        <path d="M160,180 Q190,200 210,170 Q180,150 160,180 Z" fill="url(#leafGradCreepLeft)" filter="url(#creepShadowLeft)" />
        <path d="M50,210 Q60,170 90,185 Q80,220 50,210 Z" fill="url(#leafGradCreepLeft)" />
        <path d="M120,160 Q130,120 160,135 Q150,170 120,160 Z" fill="url(#leafGradCreepLeft)" />
      </svg>
    </div>
  );
}

// 6. Unified Background Component
export default function BotanicalThemeBackground() {
  const fireflies = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const size = Math.random() * 4 + 2; // 2px to 6px
      const left = Math.random() * 100; // 0% to 100%
      const delay = Math.random() * 18; // 0s to 18s
      const duration = Math.random() * 15 + 15; // 15s to 30s
      const opacity = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
      return (
        <div
          key={i}
          className="absolute rounded-full particle-gold pointer-events-none z-1"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            opacity: opacity,
            bottom: '-20px',
            animation: `float-particle ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      );
    });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
      {/* Self-contained CSS Styles */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg); }
        }
        @keyframes sway-reverse {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-1.2deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(110vh) translateX(0) scale(0.6); opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.85; }
          100% { transform: translateY(-20vh) translateX(40px) scale(1.3); opacity: 0; }
        }
        @keyframes subtle-mist {
          0%, 100% { opacity: 0.25; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.45; transform: scale(1.15) translate(30px, -20px); }
        }
        @keyframes subtle-mist-alt {
          0%, 100% { opacity: 0.3; transform: scale(1.2) translate(0, 0); }
          50% { opacity: 0.15; transform: scale(0.95) translate(-35px, 25px); }
        }
        .animate-sway-slow {
          animation: sway 15s ease-in-out infinite;
        }
        .animate-sway-reverse {
          animation: sway-reverse 18s ease-in-out infinite;
        }
        .particle-gold {
          background: radial-gradient(circle, rgba(254,240,138,0.95) 0%, rgba(217,119,6,0.3) 60%, rgba(217,119,6,0) 100%);
          box-shadow: 0 0 10px rgba(234,179,8,0.5);
        }
        .mist-layer-1 {
          background: radial-gradient(circle at 40% 40%, rgba(16,73,38,0.28) 0%, rgba(3,10,5,0) 70%);
          animation: subtle-mist 25s ease-in-out infinite;
        }
        .mist-layer-2 {
          background: radial-gradient(circle at 70% 60%, rgba(22,101,52,0.2) 0%, rgba(3,10,5,0) 75%);
          animation: subtle-mist-alt 32s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Deep Emerald Ambient Radial Gradient Background Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#051f0f_0%,#031006_55%,#010301_100%)] z-0" />

      {/* 2. Layered Subtle Animated Fog/Mist */}
      <div className="absolute inset-0 mist-layer-1 pointer-events-none z-0" />
      <div className="absolute inset-0 mist-layer-2 pointer-events-none z-0" />

      {/* 3. Moorish Arches Outline */}
      <AncientArches />

      {/* 4. Natural Botanical Branch Frames (4 Corners) */}
      <TopLeftBranch />
      <TopRightBranch />
      <BottomRightBranch />
      <BottomLeftBranch />

      {/* 5. Gold Dust / Fireflies */}
      {fireflies}
    </div>
  );
}
