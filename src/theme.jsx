// ── SHARED DESIGN TOKENS (PLN SIMLITBANG Material design system) ──────────
// Extracted into its own module so App.jsx and KurvaSAnalysis.jsx can both
// import theme/COLORS/Icon WITHOUT a circular dependency.
// (App.jsx imports KurvaSAnalysis.jsx, so KurvaSAnalysis.jsx must NOT import
// these values back from './App' — that caused
// "Cannot access 'theme' before initialization".)
import React from 'react';

export const theme = {
  bg: '#f8f9ff',
  bgGradient: `radial-gradient(ellipse at 15% 0%, rgba(0,130,202,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(255,215,0,0.05) 0%, transparent 55%)`,
  sidebar: '#ffffff',
  sidebarBorder: '#bfc7d2',
  header: 'rgba(248,249,255,0.82)',
  card: 'rgba(255,255,255,0.85)',
  cardBorder: '#E2E8F0',
  cardHover: 'rgba(255,255,255,1)',
  input: '#eff4ff',
  inputHover: '#e5eeff',
  inputFocus: 'rgba(0,130,202,0.08)',
  selectBg: '#ffffff',
  text: '#0b1c30',
  textMuted: 'rgba(11,28,48,0.62)',
  textFaint: 'rgba(11,28,48,0.35)',
  textLabel: '#404851',
  textSubtle: 'rgba(11,28,48,0.65)',
  border: '#E2E8F0',
  borderLight: '#bfc7d2',
  rowHover: 'rgba(0,130,202,0.06)',
  infoRowHover: 'rgba(0,130,202,0.06)',
  tooltipBg: 'rgba(255,255,255,0.98)',
  spinnerTrack: 'rgba(0,0,0,0.1)',
  navActive: 'rgba(0,130,202,0.10)',
  navActiveBorder: '#0082CA',
  navHover: '#eff4ff',
  errorBg: 'rgba(186,26,26,0.08)',
  errorBorder: 'rgba(186,26,26,0.25)',
};

export const COLORS = {
  primary: '#0082CA',
  accent: '#FFD700',
  tertiary: '#38BDF8',
  success: '#22C55E',
  danger: '#BA1A1A',
  info: '#38BDF8',
  neutral: '#64748B',
};

// Material Symbols icon helper
export const Icon = ({ name, size = 20, fill = false, style = {} }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400`, ...style }}>{name}</span>
);