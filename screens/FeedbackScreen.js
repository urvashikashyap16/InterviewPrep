import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, GRAD, shared, scoreColor, gradeInfo } from '../theme';

// ── API CONFIG ────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';

// ── FALLBACK if API fails ─────────────────────────────────────────────────────
function fallbackFeedback(answer) {
  const wc = answer.trim().split(/\s+/).filter(Boolean).length;
  if (answer === '(Skipped)') return { score: 0, feedback: 'You skipped this question.', strengths: 'N/A', improvement: 'Try to attempt all questions.' };
  if (wc < 10) return { score: 3, feedback: 'Too brief. Add more detail.', strengths: 'Attempted the question.', improvement: 'Expand with an example or explanation.' };
  if (wc < 30) return { score: 6, feedback: 'Covers the basics well!', strengths: 'Good starting point.', improvement: 'Add a concrete example to score higher.' };
  return { score: 8, feedback: 'Well answered! Clear and detailed.', strengths: 'Good explanation and detail.', improvement: 'Link it to a personal project for 10/10.' };
}

// Evaluate a single answer via Gemini API
async function evaluateAnswer(question, answer, role, difficulty) {
  if (answer === '(Skipped)') return fallbackFeedback(answer);
  try {
    const res = await fetch(`${API_URL}/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, role, difficulty }),
    });
    const data = await res.json();
    if (data.score !== undefined) return data;
    throw new Error('Invalid response');
  } catch (err) {
    console.log('Eval API error, using fallback:', err.message);
    return fallbackFeedback(answer);
  }
}

export default function FeedbackScreen({ route, navigation }) {
  const { role, difficulty, answers } = route.params;

  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [progress,  setProgress]  = useState(0);   // 0-100 evaluation progress
  const [expanded,  setExpanded]  = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    evaluateAll();
  }, []);

  // Evaluate all answers one by one with a small delay to avoid rate limits
  const evaluateAll = async () => {
    const results = [];
    for (let i = 0; i < answers.length; i++) {
      const { question, answer } = answers[i];
      const feedback = await evaluateAnswer(question, answer, role, difficulty);
      results.push({ question, answer, ...feedback });
      setProgress(Math.round(((i + 1) / answers.length) * 100));
      // Wait 4 seconds between calls to stay within free tier (15 req/min)
      if (i < answers.length - 1) await new Promise(r => setTimeout(r, 4000));
    }
    setResults(results);
    setLoading(false);
    saveSession(results);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const saveSession = async (r) => {
    try {
      const avg = Math.round(r.reduce((s, x) => s + x.score, 0) / r.length);
      const session = {
        id: Date.now().toString(), role, difficulty,
        date: new Date().toLocaleDateString('en-IN'), avgScore: avg, results: r,
      };
      const existing = await AsyncStorage.getItem('sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.unshift(session);
      await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
    } catch (e) { console.log(e); }
  };

  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadScreen}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={s.loadText}>AI is evaluating your answers...</Text>
        <Text style={s.loadSub}>{progress}% complete · takes ~40 seconds</Text>
        {/* Progress bar */}
        <View style={s.evalProgressBg}>
          <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }}
            style={[s.evalProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  }

  const { emoji, label, grad, color } = gradeInfo(avg);

  return (
    <ScrollView style={shared.scroll} contentContainerStyle={shared.content}>

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginBottom: 20 }}>
        <Text style={shared.backBtn}>← Home</Text>
      </TouchableOpacity>

      {/* Score hero */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient colors={grad} style={s.scoreCard}>
          <Text style={s.scoreEmoji}>{emoji}</Text>
          <Text style={[s.scoreGrade, { color }]}>{label}</Text>
          <Text style={s.scoreNum}>{avg}<Text style={s.scoreDenom}>/10</Text></Text>
          <Text style={s.scoreMeta}>{role} · {difficulty}</Text>
        </LinearGradient>

        {/* Bar chart */}
        <View style={s.barChart}>
          {results.map((r, i) => {
            const sc = scoreColor(r.score);
            return (
              <View key={i} style={s.barWrap}>
                <Text style={[s.barVal, { color: sc }]}>{r.score}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { height: `${r.score * 10}%`, backgroundColor: sc }]} />
                </View>
                <Text style={s.barQ}>Q{i + 1}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      <Text style={shared.sectionTitle}>Question Breakdown</Text>

      {results.map((item, i) => {
        const sc = scoreColor(item.score);
        const isOpen = expanded === i;
        return (
          <Animated.View key={i} style={[s.feedCard, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={s.feedHeader}
              onPress={() => setExpanded(isOpen ? -1 : i)}
              activeOpacity={0.75}
            >
              <View style={[s.scoreCircle, { backgroundColor: sc + '22' }]}>
                <Text style={[s.scoreCircleText, { color: sc }]}>{item.score}</Text>
              </View>
              <Text style={s.feedQ} numberOfLines={isOpen ? 5 : 1}>{item.question}</Text>
              <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={s.feedBody}>
                <Text style={s.feedBodyLabel}>🗣 Your Answer</Text>
                <Text style={s.feedAnswer}>
                  {item.answer === '(Skipped)' ? '— Skipped —' : item.answer}
                </Text>
                <View style={s.divider} />
                <Text style={s.feedBodyLabel}>✅ Strengths</Text>
                <Text style={s.feedStrengths}>{item.strengths || 'N/A'}</Text>
                <View style={s.divider} />
                <Text style={s.feedBodyLabel}>🤖 AI Feedback</Text>
                <Text style={s.feedFeedback}>{item.feedback}</Text>
                <View style={s.divider} />
                <Text style={s.feedBodyLabel}>📈 How to Improve</Text>
                <Text style={s.feedImprovement}>{item.improvement || 'N/A'}</Text>
              </View>
            )}
          </Animated.View>
        );
      })}

      <TouchableOpacity onPress={() => navigation.navigate('Question', { role, difficulty })} activeOpacity={0.87} style={s.retryWrap}>
        <LinearGradient colors={GRAD.question} style={s.retryBtn}>
          <Text style={s.retryText}>🔁  Retry This Topic</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.87} style={s.homeWrap}>
        <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={s.homeBtn}>
          <Text style={s.homeBtnText}>🏠  Back to Home</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ alignItems: 'center', marginTop: 4 }}>
        <Text style={{ color: C.hint, fontSize: 13 }}>📋 View All Sessions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loadScreen:      { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  loadText:        { color: C.text, fontSize: 16, fontFamily: 'Syne_700Bold', marginTop: 8 },
  loadSub:         { color: C.muted, fontSize: 13 },
  evalProgressBg:  { width: '100%', height: 6, backgroundColor: C.surface2, borderRadius: 6, marginTop: 16, overflow: 'hidden' },
  evalProgressFill:{ height: 6, borderRadius: 6 },

  scoreCard:  { borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 16 },
  scoreEmoji: { fontSize: 44, marginBottom: 10 },
  scoreGrade: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, marginBottom: 8 },
  scoreNum:   { fontFamily: 'Syne_800ExtraBold', fontSize: 64, color: C.text, lineHeight: 70 },
  scoreDenom: { fontFamily: 'Syne_700Bold', fontSize: 28, color: C.muted },
  scoreMeta:  { color: C.muted, fontSize: 13, marginTop: 6 },

  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingTop: 16, paddingHorizontal: 10, paddingBottom: 12, marginBottom: 24, gap: 4 },
  barWrap:  { alignItems: 'center', gap: 5, flex: 1 },
  barVal:   { fontSize: 11, fontWeight: '700' },
  barBg:    { width: '100%', maxWidth: 24, height: 70, backgroundColor: C.surface2, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:  { width: '100%', borderRadius: 6 },
  barQ:     { fontSize: 10, color: C.muted },

  feedCard:        { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden' },
  feedHeader:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  scoreCircle:     { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  scoreCircleText: { fontSize: 16, fontFamily: 'Syne_700Bold' },
  feedQ:           { flex: 1, color: '#D1D5DB', fontSize: 13, lineHeight: 20 },
  chevron:         { color: C.hint, fontSize: 11 },
  feedBody:        { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.border },
  feedBodyLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.purple, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  feedAnswer:      { color: C.muted, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  feedFeedback:    { color: '#D1D5DB', fontSize: 14, lineHeight: 22 },
  feedStrengths:   { color: C.green, fontSize: 14, lineHeight: 22 },
  feedImprovement: { color: C.amber, fontSize: 14, lineHeight: 22 },
  divider:         { height: 1, backgroundColor: C.border, marginVertical: 8 },

  retryWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: C.purple, marginBottom: 12 },
  retryBtn:  { paddingVertical: 16, alignItems: 'center' },
  retryText: { color: '#C4B5FD', fontFamily: 'Syne_700Bold', fontSize: 15 },
  homeWrap:  { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  homeBtn:   { paddingVertical: 18, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontFamily: 'Syne_700Bold', fontSize: 15 },
});