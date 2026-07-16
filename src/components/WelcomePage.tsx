import React, { useState } from 'react';
import { 
  Sparkles, 
  Feather, 
  ShieldCheck, 
  HelpCircle, 
  Globe,
  User,
  AlertTriangle
} from 'lucide-react';

interface WelcomePageProps {
  onSignInWithGoogle: () => void;
  onSignInAnonymously: () => void;
  isDarkMode: boolean;
  unauthorizedDomainError: string | null;
  popupClosedError: boolean;
  error: string | null;
  isSigningIn?: boolean;
}

// 1. Classical Writing Feather SVG Component
function GoldenFeather() {
  return (
    <svg className="w-14 h-14 md:w-16 md:h-16 text-[#dfba6b] animate-feather-float" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="featherGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3db" />
          <stop offset="30%" stopColor="#f3d393" />
          <stop offset="70%" stopColor="#dfba6b" />
          <stop offset="100%" stopColor="#a37f37" />
        </linearGradient>
        <filter id="goldGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Feather vanes and barbs */}
      <path 
        d="M75,25 C62,38 48,56 34,80 C36,75 39,66 45,59 C41,61 36,65 32,69 C36,58 42,49 50,42 C45,45 40,49 35,53 C41,42 49,33 59,25 C54,28 48,32 44,36 C50,26 59,19 70,14 C72,13 74,14 74,16 C74,17 73,20 75,25 Z" 
        fill="url(#featherGold)" 
        filter="url(#goldGlow)"
      />
      {/* Central hollow shaft / rachis */}
      <path 
        d="M76,14 C56,34 36,58 20,88" 
        stroke="url(#featherGold)" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

// 2. Faint Andalusian / Moorish Stone Arches Component
function AncientArches() {
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

// 3. Top-Left Cascading Branch with Pomegranate Flower (Jullanar)
function TopLeftBranch() {
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

// 4. Top-Right Cascading Branch
function TopRightBranch() {
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

// 5. Bottom-Right Creeping Branch with Hanging Ripe Pomegranates (ثمار الرمان)
function BottomRightBranch() {
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
          {/* Crown/sepal on top of pomegranate (at top/pointing up-right) */}
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

// 6. Bottom-Left Creeping Leafy Branch
function BottomLeftBranch() {
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

export default function WelcomePage({
  onSignInWithGoogle,
  onSignInAnonymously,
  isDarkMode,
  unauthorizedDomainError,
  popupClosedError,
  error,
  isSigningIn = false
}: WelcomePageProps) {
  const [showHelperModal, setShowHelperModal] = useState(popupClosedError || !!error || !!unauthorizedDomainError);

  // Automatically trigger help modal if there is a blocking error
  React.useEffect(() => {
    if (popupClosedError || error || unauthorizedDomainError) {
      setShowHelperModal(true);
    }
  }, [popupClosedError, error, unauthorizedDomainError]);

  // Generate slow drifting gold particles (fireflies/gold dust)
  const fireflies = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const size = Math.random() * 4 + 2; // 2px to 6px
      const left = Math.random() * 100; // 0% to 100%
      const delay = Math.random() * 20; // 0s to 20s
      const duration = Math.random() * 16 + 18; // 18s to 34s
      const opacity = Math.random() * 0.45 + 0.35; // 0.35 to 0.8
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden bg-[#030a05] text-white font-sans" dir="rtl">
      
      {/* 1. Self-contained hardware-accelerated CSS animations */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg); }
        }
        @keyframes sway-reverse {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-1.2deg); }
        }
        @keyframes feather-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1.5deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(110vh) translateX(0) scale(0.6); opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.85; }
          100% { transform: translateY(-20vh) translateX(45px) scale(1.3); opacity: 0; }
        }
        @keyframes subtle-mist {
          0%, 100% { opacity: 0.25; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.45; transform: scale(1.15) translate(30px, -20px); }
        }
        @keyframes subtle-mist-alt {
          0%, 100% { opacity: 0.3; transform: scale(1.2) translate(0, 0); }
          50% { opacity: 0.15; transform: scale(0.95) translate(-35px, 25px); }
        }
        @keyframes fade-in-entrance {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-sway-slow {
          animation: sway 15s ease-in-out infinite;
        }
        .animate-sway-reverse {
          animation: sway-reverse 18s ease-in-out infinite;
        }
        .animate-feather-float {
          animation: feather-float 6.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in-entrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
        .luxury-text-shine {
          background: linear-gradient(135deg, #fffcf0 0%, #ffeed1 20%, #dfba6b 50%, #cba355 80%, #997424 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* 2. Full-Screen Deep Emerald Radial Gradient Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#051f0f_0%,#031006_55%,#010301_100%)] z-0" />

      {/* 3. Layered Subtle Animated Fog/Mist */}
      <div className="absolute inset-0 mist-layer-1 pointer-events-none z-0" />
      <div className="absolute inset-0 mist-layer-2 pointer-events-none z-0" />

      {/* 4. Elegant Moorish Arches Outline */}
      <AncientArches />

      {/* 5. Natural Botanical Branch Frames (4 Corners) */}
      <TopLeftBranch />
      <TopRightBranch />
      <BottomRightBranch />
      <BottomLeftBranch />

      {/* 6. Gold Dust / Fireflies drifting up */}
      {fireflies}

      {/* 7. Centered Main Interface Content with smooth entrance animation */}
      <div className="z-10 flex flex-col items-center max-w-xl px-4 select-none animate-fade-in relative">
        
        {/* Shimmering Golden Feather Logo */}
        <div className="mb-5 md:mb-6 cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-300">
          <GoldenFeather />
        </div>
        
        {/* Calligraphic Title */}
        <h1 className="text-4xl md:text-5xl lg:text-5xl font-black font-serif tracking-normal mb-5 select-none leading-tight luxury-text-shine drop-shadow-[0_2px_15px_rgba(223,186,107,0.22)]">
          صانع الشعر العربي
        </h1>

        {/* Traditional Descriptive Tagline */}
        <p className="text-sm md:text-[15px] text-[#e8fbf0]/85 font-serif max-w-sm md:max-w-md leading-relaxed mb-9 select-none font-medium">
          منصة كلاسيكية ذكية لنظم الشعر العربي
          <br className="hidden sm:inline" />
          الفصيح الموزون وتحليل تفعيلات الخليل
        </p>

        {/* Google Authentication Trigger Button */}
        <div className="w-full max-w-[290px] md:max-w-[310px] mb-8 relative group">
          {/* Subtle gold outer blur highlight on hover */}
          <div className="absolute inset-0 bg-[#dfba6b]/15 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <button
            onClick={onSignInWithGoogle}
            disabled={isSigningIn}
            className={`w-full py-3.5 px-6 rounded-2xl bg-white text-gray-800 font-sans font-bold text-sm md:text-base border border-gray-100 shadow-xl transition-all duration-300 flex items-center justify-center gap-3 select-none active:scale-[0.97] active:translate-y-[1.5px] cursor-pointer ${
              isSigningIn ? 'opacity-80' : 'hover:bg-gray-50'
            }`}
            id="welcome-google-signin-btn"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1a472a] border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs text-[#1a472a] font-serif">جاري الدخول...</span>
              </div>
            ) : (
              <>
                {/* Official Google G-Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="tracking-wide">تسجيل الدخول باستخدام Google</span>
              </>
            )}
          </button>
        </div>

        {/* Divider matching reference image */}
        <div className="w-full max-w-[240px] flex items-center justify-center gap-4 mb-8 select-none">
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#dfba6b]/20 to-[#dfba6b]/10" />
          <span className="text-xs font-serif font-medium text-[#e8fbf0]/35 select-none">أو</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#dfba6b]/20 to-[#dfba6b]/10" />
        </div>

        {/* Secure Trust Badge (تجربة آمنة وسريعة) */}
        <div className="flex items-center justify-center gap-2 py-1 px-3.5 rounded-full bg-white/5 border border-white/10 text-[11px] md:text-xs text-[#e8fbf0]/75 select-none backdrop-blur-xs">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-medium tracking-wide">تجربة آمنة وسريعة</span>
        </div>

        {/* Floating helper info button for users experiencing issues (e.g., iframe popup blocks) */}
        {(popupClosedError || error || unauthorizedDomainError) && (
          <button 
            onClick={() => setShowHelperModal(true)}
            className="mt-6 text-[10px] text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1.5 font-sans mx-auto hover:underline cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>هل تواجه مشكلة؟ انقر هنا للمساعدة والبدائل الفورية</span>
          </button>
        )}
      </div>

      {/* 8. Elegant Glassmorphism Fallback Modal (to bypass IFrame Google Sign-In blocks) */}
      {showHelperModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-right">
          <div className="w-full max-w-md bg-[#09140d]/95 border border-[#dfba6b]/35 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            {/* Corner ornamentation accent */}
            <div className="absolute top-0 left-0 w-12 h-12 bg-[radial-gradient(ellipse_at_top_left,rgba(223,186,107,0.2),transparent)]" />
            
            <h3 className="font-serif font-black text-lg text-[#dfba6b] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>بوابة الدعم الفني وتجاوز عقبات الدخول</span>
            </h3>

            {unauthorizedDomainError && (
              <div className="text-xs leading-relaxed text-red-200 bg-red-950/40 border border-red-500/20 p-4 rounded-xl mb-4 font-sans">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>عذراً، النطاق غير مصرح به:</strong>
                    <p className="mt-1 font-mono text-white/90 bg-black/20 p-1 rounded select-all">{unauthorizedDomainError}</p>
                    <p className="mt-1.5 text-[11px] text-red-300/80">يرجى إضافته إلى نطاقات Firebase المسموح بها في الإعدادات أو التواصل مع مطور المنصة.</p>
                  </div>
                </div>
              </div>
            )}

            {popupClosedError && (
              <div className="space-y-4 font-sans">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl leading-relaxed">
                  ⚠️ <strong>تنبيه الإطار (IFrame):</strong> تم كشف حظر أو إغلاق نافذة تسجيل دخول Google المنبثقة بواسطة متصفحك أو بيئة المعاينة.
                </div>
                <p className="text-xs leading-relaxed text-gray-300">
                  لقد قمنا بتوفير حلين فوريين للدخول لتضمن عدم ضياع تجربتك الإبداعية:
                </p>
                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      onSignInAnonymously();
                      setShowHelperModal(false);
                    }}
                    className="w-full py-2.5 px-4 bg-[#1a472a] hover:bg-[#205733] text-[#dfba6b] font-serif font-black text-xs rounded-xl shadow-md border border-[#dfba6b]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#dfba6b]" />
                    الخيار الأول: دخول فوري فائق السهولة (كشاعر ضيف)
                  </button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-serif font-bold text-xs rounded-xl shadow-md border border-white/10 text-center transition-all flex items-center justify-center gap-2"
                  >
                    <Globe className="w-3.5 h-3.5 text-white" />
                    الخيار الثاني: فتح المنصة في نافذة مستقلة
                  </a>
                </div>
              </div>
            )}

            {error && !popupClosedError && !unauthorizedDomainError && (
              <div className="text-xs leading-relaxed text-red-200 bg-red-950/40 border border-red-500/20 p-4 rounded-xl mb-4 font-sans flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>حدث خطأ أثناء المصادقة:</strong>
                  <p className="mt-1 text-red-300/90">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2.5">
              <button
                onClick={() => {
                  onSignInAnonymously();
                  setShowHelperModal(false);
                }}
                className="flex-1 py-2 bg-transparent text-gray-300 hover:text-[#dfba6b] text-xs font-serif font-bold text-center border border-dashed border-gray-700 hover:border-[#dfba6b]/30 rounded-xl transition-all cursor-pointer"
              >
                الدخول كضيف وتجاوز العقبة
              </button>
              <button
                onClick={() => setShowHelperModal(false)}
                className="py-2 px-4 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded-xl border border-white/5 cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Developer Signature at very bottom */}
      <div className="absolute bottom-4 text-[9px] text-[#e8fbf0]/25 font-sans pointer-events-none tracking-wider select-none">
        منصة صانع الشعر العربي © ٢٠٢٦
      </div>
    </div>
  );
}
