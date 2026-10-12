import React, { useId } from 'react';

/**
 * Color themes for the 3D tactile keycap/cushion badge surrounding each icon.
 * Provides a raised 3D physical bevel (bottom lip), glossy top specular reflection,
 * ambient colored drop shadow, and active/hover 3D depth.
 */
const BADGE_THEMES = {
  emerald: {
    base: 'bg-gradient-to-b from-emerald-50 via-emerald-100/95 to-emerald-200/95 border-t border-x border-white/95 border-b-[3px] border-b-emerald-500/80 shadow-[0_6px_12px_-2px_rgba(16,185,129,0.34),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700 border-t border-x border-emerald-200/90 border-b-[3px] border-b-emerald-950 shadow-[0_6px_14px_-2px_rgba(6,78,59,0.6),inset_0_2px_3px_rgba(255,255,255,0.55)]'
  },
  amber: {
    base: 'bg-gradient-to-b from-amber-50 via-amber-100/95 to-amber-200/95 border-t border-x border-white/95 border-b-[3px] border-b-amber-500/85 shadow-[0_6px_12px_-2px_rgba(245,158,11,0.36),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 border-t border-x border-amber-100/90 border-b-[3px] border-b-amber-900 shadow-[0_6px_14px_-2px_rgba(180,83,9,0.55),inset_0_2px_3px_rgba(255,255,255,0.6)]'
  },
  sky: {
    base: 'bg-gradient-to-b from-sky-50 via-sky-100/95 to-sky-200/95 border-t border-x border-white/95 border-b-[3px] border-b-sky-500/80 shadow-[0_6px_12px_-2px_rgba(14,165,233,0.34),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-sky-300 via-sky-500 to-sky-700 border-t border-x border-sky-200/90 border-b-[3px] border-b-sky-950 shadow-[0_6px_14px_-2px_rgba(3,105,161,0.55),inset_0_2px_3px_rgba(255,255,255,0.55)]'
  },
  violet: {
    base: 'bg-gradient-to-b from-violet-50 via-violet-100/95 to-violet-200/95 border-t border-x border-white/95 border-b-[3px] border-b-violet-500/80 shadow-[0_6px_12px_-2px_rgba(139,92,246,0.34),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-violet-300 via-violet-500 to-violet-700 border-t border-x border-violet-200/90 border-b-[3px] border-b-violet-950 shadow-[0_6px_14px_-2px_rgba(109,40,217,0.55),inset_0_2px_3px_rgba(255,255,255,0.55)]'
  },
  rose: {
    base: 'bg-gradient-to-b from-rose-50 via-rose-100/95 to-rose-200/95 border-t border-x border-white/95 border-b-[3px] border-b-rose-500/80 shadow-[0_6px_12px_-2px_rgba(244,63,94,0.32),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-rose-300 via-rose-500 to-rose-700 border-t border-x border-rose-200/90 border-b-[3px] border-b-rose-950 shadow-[0_6px_14px_-2px_rgba(190,18,60,0.55),inset_0_2px_3px_rgba(255,255,255,0.55)]'
  },
  slate: {
    base: 'bg-gradient-to-b from-white via-slate-100 to-slate-200/95 border-t border-x border-white border-b-[3px] border-b-slate-400/95 shadow-[0_6px_12px_-2px_rgba(100,116,139,0.3),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 border-t border-x border-slate-300/80 border-b-[3px] border-b-slate-950 shadow-[0_6px_14px_-2px_rgba(15,23,42,0.55),inset_0_2px_3px_rgba(255,255,255,0.45)]'
  },
  lime: {
    base: 'bg-gradient-to-b from-lime-50 via-lime-100/95 to-emerald-200/95 border-t border-x border-white/95 border-b-[3px] border-b-emerald-500/85 shadow-[0_6px_12px_-2px_rgba(101,163,13,0.34),0_2px_4px_rgba(15,23,42,0.1),inset_0_2px_3px_rgba(255,255,255,1)]',
    active: 'bg-gradient-to-b from-lime-300 via-emerald-500 to-emerald-700 border-t border-x border-lime-200/90 border-b-[3px] border-b-emerald-950 shadow-[0_6px_14px_-2px_rgba(21,128,61,0.55),inset_0_2px_3px_rgba(255,255,255,0.55)]'
  }
};

const ICON_DEFAULT_THEME = {
  dashboard: 'emerald',
  farms: 'lime',
  'new-analysis': 'amber',
  'image-analysis': 'violet',
  climate: 'sky',
  yield: 'emerald',
  recommendations: 'amber',
  history: 'sky',
  research: 'violet',
  notifications: 'amber',
  help: 'sky',
  settings: 'slate',
  home: 'emerald',
  features: 'violet',
  'how-it-works': 'amber',
  workspace: 'sky',
  about: 'slate',
  login: 'slate',
  register: 'emerald',
  voice: 'emerald',
  sun: 'amber',
  user: 'slate',
  logout: 'rose',
  menu: 'slate',
  close: 'rose'
};

const SIZE_CLASSES = {
  xs: { box: 'w-6 h-6 rounded-lg', svg: 'w-4 h-4' },
  sm: { box: 'w-7 h-7 rounded-xl', svg: 'w-4.5 h-4.5' },
  md: { box: 'w-8 h-8 rounded-xl', svg: 'w-5 h-5' },
  lg: { box: 'w-10 h-10 rounded-2xl', svg: 'w-6 h-6' },
  xl: { box: 'w-11 h-11 rounded-2xl', svg: 'w-7 h-7' }
};

/**
 * 3D Sculpted Mango Brand Logo with multi-stop radial lighting,
 * 3D drop-extrusion shadow, curved glossy highlight, and 3D leaf.
 */
export function MangoLogo3D({ size = 'md', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const dims =
    size === 'lg'
      ? 'w-11 h-11 rounded-2xl'
      : size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : 'w-10 h-10 rounded-xl';
  const svgDims = size === 'lg' ? 'w-7.5 h-7.5' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <div
      className={`relative ${dims} bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 flex items-center justify-center border-t border-x border-white border-b-[3.5px] border-b-amber-500/90 shadow-[0_10px_20px_-4px_rgba(245,158,11,0.45),0_3px_6px_rgba(180,83,9,0.22),inset_0_2px_4px_rgba(255,255,255,1)] group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Top glossy glass reflection */}
      <div className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent" />
      <svg className={`${svgDims} relative z-10 drop-shadow-[0_2px_3px_rgba(180,83,9,0.35)]`} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${uid}-mangoBody`} cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#9A3412" />
          </radialGradient>
          <linearGradient id={`${uid}-mangoLeaf`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
        </defs>
        {/* 3D Base Extrusion */}
        <path d="M16 6.5C11.5 6.5 6.5 9.8 6.5 17C6.5 25 13.5 29.5 16 29.5C18.5 29.5 25.5 25 25.5 17C25.5 9.8 20.5 6.5 16 6.5Z" fill="#78350F" opacity="0.35" />
        {/* Sculpted Mango Body */}
        <path d="M16 5C11.5 5 6.5 8.5 6.5 15.8C6.5 24 13.5 28.5 16 28.5C18.5 28.5 25.5 24 25.5 15.8C25.5 8.5 20.5 5 16 5Z" fill={`url(#${uid}-mangoBody)`} />
        {/* Specular 3D Highlight Curve */}
        <path d="M10.5 11C9.2 13.5 9.2 17.2 10.5 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />
        <circle cx="12" cy="9.5" r="1.3" fill="white" opacity="0.75" />
        {/* Stem */}
        <path d="M17.2 5.2C17.2 3 15.8 1.8 14.2 2" stroke="#14532D" strokeWidth="2.4" strokeLinecap="round" />
        {/* 3D Leaf with Ridge */}
        <path d="M16.8 5.2C20.5 3.2 24.8 4.2 26 7.2C22.5 8.2 18.5 7.5 16.8 5.2Z" fill={`url(#${uid}-mangoLeaf)`} />
        <path d="M17.5 5.4C20.2 5.2 22.8 5.8 24.8 6.8" stroke="#BBF7D0" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  );
}

/**
 * Renders a 3D multi-layered SVG artwork for each navigation icon type.
 */
function render3DSvg(name, svgClass, uid) {
  switch (name) {
    case 'dashboard':
    case 'workspace':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-d1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id={`${uid}-d2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id={`${uid}-d3`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>
          {/* 3D Extrusion Shadow Layer */}
          <rect x="3" y="4.5" width="7.5" height="8.5" rx="2.2" fill="#064E3B" opacity="0.38" />
          <rect x="13.5" y="4.5" width="7.5" height="5.5" rx="2.2" fill="#78350F" opacity="0.38" />
          <rect x="13.5" y="13" width="7.5" height="8.5" rx="2.2" fill="#064E3B" opacity="0.38" />
          <rect x="3" y="16" width="7.5" height="5.5" rx="2.2" fill="#0C4A6E" opacity="0.38" />
          {/* Top 3D Blocks */}
          <rect x="3" y="3" width="7.5" height="8.5" rx="2.2" fill={`url(#${uid}-d1)`} />
          <rect x="13.5" y="3" width="7.5" height="5.5" rx="2.2" fill={`url(#${uid}-d2)`} />
          <rect x="13.5" y="11.5" width="7.5" height="8.5" rx="2.2" fill={`url(#${uid}-d1)`} />
          <rect x="3" y="14.5" width="7.5" height="5.5" rx="2.2" fill={`url(#${uid}-d3)`} />
          {/* Specular Top Rim Highlights */}
          <path d="M4.8 4.2H8.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
          <path d="M15.2 4.2H19.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M15.2 12.7H19.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
          <path d="M4.8 15.7H8.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    case 'home':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-roof`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <path d="M5 12.5V20.5C5 21.3 5.7 22 6.5 22H17.5C18.3 22 19 21.3 19 20.5V12.5" fill="#064E3B" opacity="0.38" />
          <path d="M5 11V19C5 19.8 5.7 20.5 6.5 20.5H17.5C18.3 20.5 19 19.8 19 19V11L12 5L5 11Z" fill={`url(#${uid}-wall)`} />
          <rect x="10" y="13.5" width="4" height="7" rx="1.2" fill="#FEF3C7" />
          <path d="M2.8 11.8L11.1 4.1C11.6 3.6 12.4 3.6 12.9 4.1L21.2 11.8" stroke={`url(#${uid}-roof)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 10.5L12 3.8L19.5 10.5" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
        </svg>
      );

    case 'farms':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-tc1`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="55%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </radialGradient>
            <radialGradient id={`${uid}-tc2`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="60%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#14532D" />
            </radialGradient>
          </defs>
          <rect x="15" y="14" width="2.6" height="6.5" rx="1" fill="#78350F" />
          <rect x="8.2" y="13.5" width="3" height="7.5" rx="1.2" fill="#92400E" />
          <circle cx="16.3" cy="11" r="5" fill={`url(#${uid}-tc2)`} />
          <circle cx="9.7" cy="11.5" r="5.5" fill="#064E3B" opacity="0.28" />
          <circle cx="9.7" cy="10" r="5.8" fill={`url(#${uid}-tc1)`} />
          <circle cx="8" cy="10.5" r="1.2" fill="#FBBF24" />
          <circle cx="11.5" cy="8.8" r="1.2" fill="#F59E0B" />
          <circle cx="16.8" cy="10.2" r="1.1" fill="#FBBF24" />
          <path d="M6.8 7.2C7.6 6.2 8.8 5.7 10 5.7" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    case 'new-analysis':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-orb`} cx="35%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="13.2" r="9" fill="#78350F" opacity="0.38" />
          <circle cx="12" cy="11.8" r="9" fill={`url(#${uid}-orb)`} />
          <path d="M7.2 7.5C8.5 6 10.3 5.2 12.2 5.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <path d="M12 8.5V16.5M8 12.5H16" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" opacity="0.4" />
          <path d="M12 7.8V15.8M8 11.8H16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );

    case 'image-analysis':
    case 'features':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-sp1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#581C87" />
            </linearGradient>
            <linearGradient id={`${uid}-sp2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <path d="M11 3.8L13.2 9.5L19 11.7L13.2 13.9L11 19.6L8.8 13.9L3 11.7L8.8 9.5L11 3.8Z" fill="#3B0764" opacity="0.35" />
          <path d="M11 2.5L13.3 8.3L19.1 10.6L13.3 12.9L11 18.7L8.7 12.9L2.9 10.6L8.7 8.3L11 2.5Z" fill={`url(#${uid}-sp1)`} />
          <path d="M11 4.8L12.2 8.8L16.2 10.6L12.2 11.8L11 15.8L9.8 11.8L5.8 10.6L9.8 8.8L11 4.8Z" fill="#F3E8FF" opacity="0.6" />
          <path d="M18.5 14L19.5 16.8L22.2 17.8L19.5 18.8L18.5 21.5L17.5 18.8L14.8 17.8L17.5 16.8L18.5 14Z" fill={`url(#${uid}-sp2)`} />
        </svg>
      );

    case 'climate':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-sun`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <linearGradient id={`${uid}-cld`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          <circle cx="9" cy="9" r="5" fill={`url(#${uid}-sun)`} />
          <path d="M9 2.2V3.5M3.8 4.2L4.8 5.2M2.2 9H3.5M14.2 4.2L13.2 5.2" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.5 20.2H17.8C20.1 20.2 21.8 18.5 21.8 16.3C21.8 14.3 20.3 12.7 18.4 12.5C17.8 9.8 15.4 8 12.6 8C9.6 8 7.2 10.2 6.8 13.1C5.2 13.5 4 15 4 16.7C4 18.7 6 20.2 8.5 20.2Z" fill="#0369A1" opacity="0.32" />
          <path d="M8.5 19H17.8C20.1 19 21.8 17.3 21.8 15.1C21.8 13.1 20.3 11.5 18.4 11.3C17.8 8.6 15.4 6.8 12.6 6.8C9.6 6.8 7.2 9 6.8 11.9C5.2 12.3 4 13.8 4 15.5C4 17.5 6 19 8.5 19Z" fill={`url(#${uid}-cld)`} stroke="#38BDF8" strokeWidth="0.8" />
          <path d="M9.5 10.2C10.5 8.8 12.2 8.2 14 8.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'sun':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-sunf`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="13" r="6" fill="#78350F" opacity="0.28" />
          <circle cx="12" cy="12" r="6" fill={`url(#${uid}-sunf)`} />
          <circle cx="10.2" cy="10" r="1.4" fill="white" opacity="0.75" />
          <path d="M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5.3 5.3L6.8 6.8M17.2 17.2L18.7 18.7M18.7 5.3L17.2 6.8M6.8 17.2L5.3 18.7" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'yield':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-sl`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id={`${uid}-sr`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="20" rx="6.5" ry="2.2" fill="#78350F" />
          <ellipse cx="12" cy="19.4" rx="5.5" ry="1.6" fill="#92400E" />
          <path d="M12 19.5V9" stroke="#15803D" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M12 13.5C7 13.5 4.5 10.5 5 6.5C9 6.2 12 8.8 12 13.5Z" fill={`url(#${uid}-sl)`} />
          <path d="M6.8 8.2C8.5 8.5 10.2 9.8 11.2 11.8" stroke="#DCFCE7" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
          <path d="M12 11C16.8 11 19.5 8 19 4C15 3.8 12 6.5 12 11Z" fill={`url(#${uid}-sr)`} />
          <path d="M17.2 5.8C15.5 6.2 13.8 7.5 12.8 9.5" stroke="#DCFCE7" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
        </svg>
      );

    case 'recommendations':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-bulb`} cx="38%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="45%" stopColor="#FACC15" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>
          </defs>
          <rect x="9.2" y="17.5" width="5.6" height="3.2" rx="1.4" fill="#64748B" />
          <path d="M10.2 21.5H13.8" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 4.2C8.4 4.2 5.5 7.1 5.5 10.7C5.5 13.1 6.8 15.1 8.8 16.2L9.3 17.8H14.7L15.2 16.2C17.2 15.1 18.5 13.1 18.5 10.7C18.5 7.1 15.6 4.2 12 4.2Z" fill="#78350F" opacity="0.32" />
          <path d="M12 3C8.4 3 5.5 5.9 5.5 9.5C5.5 11.9 6.8 13.9 8.8 15L9.3 17H14.7L15.2 15C17.2 13.9 18.5 11.9 18.5 9.5C18.5 5.9 15.6 3 12 3Z" fill={`url(#${uid}-bulb)`} />
          <path d="M8.2 7.5C8.8 6 10.2 5 11.8 4.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        </svg>
      );

    case 'history':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-cf`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </radialGradient>
            <linearGradient id={`${uid}-cr`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="13.2" r="9" fill="#0C4A6E" opacity="0.35" />
          <circle cx="12" cy="11.8" r="9" fill={`url(#${uid}-cr)`} />
          <circle cx="12" cy="11.8" r="6.8" fill={`url(#${uid}-cf)`} />
          <path d="M12 8.2V11.8L14.6 13.4" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="11.8" r="1.3" fill="#F59E0B" />
        </svg>
      );

    case 'research':
    case 'how-it-works':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-cb`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#5B21B6" />
            </linearGradient>
            <linearGradient id={`${uid}-cc`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <path d="M9 2.5V5M15 2.5V5M9 19V21.5M15 19V21.5M2.5 9H5M2.5 15H5M19 9H21.5M19 15H21.5" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="5" y="6.2" width="14" height="14" rx="3.2" fill="#2E1065" opacity="0.4" />
          <rect x="5" y="4.8" width="14" height="14" rx="3.2" fill={`url(#${uid}-cb)`} />
          <rect x="8.5" y="8.3" width="7" height="7" rx="1.8" fill={`url(#${uid}-cc)`} />
          <path d="M6.8 6.5H12" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'notifications':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-bell`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="19.5" r="2.2" fill="#92400E" />
          <path d="M18 15.5V11C18 7.5 15.8 5 12 5C8.2 5 6 7.5 6 11V15.5L4.2 17.5H19.8L18 15.5Z" fill="#78350F" opacity="0.35" />
          <path d="M18 14.5V10C18 6.5 15.8 4 12 4C8.2 4 6 6.5 6 10V14.5L4.2 16.8C3.9 17.2 4.2 17.8 4.7 17.8H19.3C19.8 17.8 20.1 17.2 19.8 16.8L18 14.5Z" fill={`url(#${uid}-bell)`} />
          <circle cx="12" cy="3.2" r="1.5" fill="#F59E0B" />
          <path d="M8.5 9.5C8.5 7.5 9.8 6 11.5 5.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        </svg>
      );

    case 'help':
    case 'about':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-hlp`} cx="35%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="55%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="13.2" r="9" fill="#082F49" opacity="0.38" />
          <circle cx="12" cy="11.8" r="9" fill={`url(#${uid}-hlp)`} />
          <path d="M7.5 7.2C8.8 5.8 10.5 5 12.4 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
          {name === 'about' ? (
            <>
              <path d="M12 11.2V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="8" r="1.4" fill="#FDE047" />
            </>
          ) : (
            <>
              <path d="M9.8 9.2C9.8 7.9 10.8 7 12.1 7C13.4 7 14.3 7.9 14.3 9.1C14.3 10.1 13.6 10.7 12.7 11.2C12.1 11.6 11.8 12.1 11.8 12.9" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
              <circle cx="11.9" cy="16" r="1.3" fill="#FDE047" />
            </>
          )}
        </svg>
      );

    case 'settings':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-gr`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <path d="M12 3.5L13.8 5.2L16.3 4.6L17.2 7L19.6 7.9L19 10.4L20.7 12.2L19 14L19.6 16.5L17.2 17.4L16.3 19.8L13.8 19.2L12 20.9L10.2 19.2L7.7 19.8L6.8 17.4L4.4 16.5L5 14L3.3 12.2L5 10.4L4.4 7.9L6.8 7L7.7 4.6L10.2 5.2L12 3.5Z" fill={`url(#${uid}-gr)`} />
          <circle cx="12" cy="12.2" r="4.5" fill="#F8FAFC" />
          <circle cx="12" cy="12.2" r="2.3" fill="#0EA5E9" />
        </svg>
      );

    case 'voice':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`${uid}-spk`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <path d="M11 5.5L6.5 9H3.5C2.9 9 2.5 9.4 2.5 10V14C2.5 14.6 2.9 15 3.5 15H6.5L11 18.5C11.7 19 12.6 18.5 12.6 17.7V6.3C12.6 5.5 11.7 5 11 5.5Z" fill={`url(#${uid}-spk)`} />
          <path d="M15.8 9C16.8 10 17.3 11 17.3 12C17.3 13 16.8 14 15.8 15" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18.5 6.5C20.3 8.2 21.2 10 21.2 12C21.2 14 20.3 15.8 18.5 17.5" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'user':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id={`${uid}-uh`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <linearGradient id={`${uid}-ub`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="8.2" r="4.2" fill={`url(#${uid}-uh)`} />
          <path d="M5 19.5C5 16.2 8.1 14 12 14C15.9 14 19 16.2 19 19.5C19 20.3 18.3 21 17.5 21H6.5C5.7 21 5 20.3 5 19.5Z" fill={`url(#${uid}-ub)`} />
          <circle cx="10.8" cy="6.8" r="0.9" fill="white" opacity="0.75" />
        </svg>
      );

    case 'login':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <rect x="11" y="4" width="9" height="16" rx="2.5" fill="#475569" />
          <path d="M4 12H13.5M13.5 12L10 8.5M13.5 12L10 15.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'register':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <circle cx="10" cy="8" r="3.8" fill="#FDE047" />
          <path d="M4 19C4 16 6.7 14 10 14C13.3 14 16 16 16 19" fill="#A7F3D0" />
          <circle cx="18" cy="10" r="3.5" fill="#F59E0B" />
          <path d="M18 8.3V11.7M16.3 10H19.7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'logout':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="8.5" height="16" rx="2.5" fill="#F43F5E" />
          <path d="M10.5 12H20M20 12L16.8 8.8M20 12L16.8 15.2" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'menu':
      return (
        <svg className={svgClass} viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="5.5" width="17" height="3" rx="1.5" fill="#059669" />
          <rect x="3.5" y="10.8" width="13.5" height="3" rx="1.5" fill="#F59E0B" />
          <rect x="3.5" y="16.1" width="17" height="3" rx="1.5" fill="#0284C7" />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * 3D Tactile Navigation Icon Badge
 * Renders a sculpted 3D keycap container with top specular glass reflection,
 * bottom 3D bevel lip, ambient shadow, and multi-layered 3D SVG icon artwork.
 */
export default function NavIcon3D({
  name,
  active = false,
  size = 'sm',
  theme,
  className = ''
}) {
  const uid = useId().replace(/:/g, '');
  const resolvedThemeKey = theme || ICON_DEFAULT_THEME[name] || 'emerald';
  const badgeStyle = BADGE_THEMES[resolvedThemeKey] || BADGE_THEMES.emerald;
  const sizeSpec = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <div
      className={`relative ${sizeSpec.box} flex items-center justify-center shrink-0 select-none transition-all duration-200 ${
        active ? badgeStyle.active : badgeStyle.base
      } group-hover:-translate-y-0.5 group-hover:scale-105 group-active:translate-y-0 ${className}`}
    >
      {/* Top glossy 3D dome reflection */}
      <div className="pointer-events-none absolute inset-x-1 top-0.5 h-[42%] rounded-t-lg bg-gradient-to-b from-white/75 to-transparent" />
      <div className="relative z-10 flex items-center justify-center drop-shadow-[0_1.5px_2px_rgba(15,23,42,0.25)]">
        {render3DSvg(name, sizeSpec.svg, uid)}
      </div>
    </div>
  );
}
