import { StyleSheet, Platform } from 'react-native';

// ── COLORS ──────────────────────────────────────────────────
export const C = {
  bg:       '#07080F',
  surface:  '#0F1020',
  surface2: '#161830',
  border:   '#1E2040',
  text:     '#F0F2FF',
  muted:    '#6B7280',
  hint:     '#374151',
  purple:   '#7C3AED',
  pink:     '#EC4899',
  green:    '#10B981',
  amber:    '#F59E0B',
  red:      '#EF4444',
  purpleDim:'#A78BFA',
  purpleBg: '#2D1B69',
  pinkBg:   '#4C0519',
};

// ── GRADIENTS ───────────────────────────────────────────────
export const GRAD = {
  primary:  [C.purple, C.pink],              // main CTA
  question: ['#1A0A3E', '#2D1560'],          // question card
  easy:     ['#022c1e', '#065F46'],
  medium:   ['#2d1f04', '#78350F'],
  hard:     ['#2d0a0a', '#7F1D1D'],
  excellent:['#022c1e', '#065F46'],
  good:     ['#2d1f04', '#78350F'],
  average:  ['#1E1B4B', '#2D2A6E'],
  poor:     ['#2D0B3E', '#4C0519'],
};

// ── SCORE COLOR ──────────────────────────────────────────────
export function scoreColor(s) {
  if (s >= 7) return C.green;
  if (s >= 4) return C.amber;
  return C.red;
}

// ── GRADE INFO ───────────────────────────────────────────────
export function gradeInfo(avg) {
  if (avg >= 8) return { emoji:'🏆', label:'Excellent!',      grad: GRAD.excellent, color: C.green  };
  if (avg >= 6) return { emoji:'👍', label:'Good Job!',       grad: GRAD.good,      color: C.amber  };
  if (avg >= 4) return { emoji:'📚', label:'Keep Practicing', grad: GRAD.average,   color: C.purpleDim };
  return           { emoji:'💪', label:'Never Give Up!',      grad: GRAD.poor,      color: C.pink   };
}

// ── SHARED STYLES ─────────────────────────────────────────────
export const shared = StyleSheet.create({
  // Responsive container — centers content on web, full-width on phone
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    width: '100%',
    maxWidth: 640,                   // cap width on web/tablets
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'web' ? 48 : 55,
    paddingBottom: 50,
  },

  // Cards
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backBtn: {
    color: C.purpleDim,
    fontSize: 14,
    fontWeight: '600',
  },

  // Section title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Progress bar
  progressBg: {
    height: 5,
    backgroundColor: C.surface2,
    borderRadius: 5,
    marginBottom: 24,
    overflow: 'hidden',
  },
});