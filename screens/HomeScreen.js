import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, GRAD, shared } from '../theme';

const CHIPS = ['React Developer','Python Developer','Data Structures','DBMS Concepts','Operating Systems','Computer Networks'];
const DIFFS = [
  { label: 'Easy',   emoji: '🟢', activeClass: 'easy'   },
  { label: 'Medium', emoji: '🟡', activeClass: 'medium' },
  { label: 'Hard',   emoji: '🔴', activeClass: 'hard'   },
];

export default function HomeScreen({ navigation }) {
  const [role,       setRole]       = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  // Fade-in + slide-up on mount
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // Floating orb
  const orbAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const orbTranslate = orbAnim.interpolate({ inputRange: [0,1], outputRange: [0, -22] });

  const handleStart = () => {
    if (!role.trim()) { Alert.alert('Enter a role', 'e.g. React Developer, DBMS, OS'); return; }
    navigation.navigate('Question', { role: role.trim(), difficulty });
  };

  const diffColors = { Easy: GRAD.easy, Medium: GRAD.medium, Hard: GRAD.hard };
  const diffBorders = { Easy: C.green, Medium: C.amber, Hard: C.red };
  const diffTextColors = { Easy: C.green, Medium: C.amber, Hard: C.red };

  return (
    <ScrollView style={shared.scroll} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">

      {/* Background orbs */}
      <Animated.View style={[s.orb1, { transform: [{ translateY: orbTranslate }] }]} pointerEvents="none" />
      <Animated.View style={[s.orb2, { transform: [{ translateY: orbTranslate }] }]} pointerEvents="none" />

      {/* Header */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={s.taglineBadge}>
          <Text style={s.taglineText}>🎙  AI VOICE INTERVIEW</Text>
        </LinearGradient>
        <Text style={s.title}>Crack Your{'\n'}Interview</Text>
        <Text style={s.subtitle}>Practice your knowledge. Get instant AI feedback.</Text>
      </Animated.View>

      {/* Stats */}
      <Animated.View style={[s.statsRow, { opacity: fadeAnim }]}>
        {[['10','Questions'],['AI','Feedback'],['Free','Forever']].map(([val, label]) => (
          <View key={label} style={s.statBox}>
            <Text style={s.statVal}>{val}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Input card */}
      <Animated.View style={[shared.card, { opacity: fadeAnim }]}>
        <Text style={shared.cardLabel}>Job Role / Topic</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. React Developer, DBMS..."
          placeholderTextColor={C.hint}
          value={role}
          onChangeText={text => { setRole(text); }}
        />

        <Text style={s.chipSection}>Quick Pick</Text>
        <View style={s.chipsRow}>
          {CHIPS.map(item => (
            <TouchableOpacity
              key={item}
              style={[s.chip, role === item && s.chipActive]}
              onPress={() => setRole(item)}
            >
              <Text style={[s.chipText, role === item && s.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={shared.cardLabel}>Difficulty</Text>
        <View style={s.diffRow}>
          {DIFFS.map(d => {
            const isActive = difficulty === d.label;
            return (
              <TouchableOpacity
                key={d.label}
                style={[s.diffBtn, isActive && { borderColor: diffBorders[d.label] }]}
                onPress={() => setDifficulty(d.label)}
                activeOpacity={0.8}
              >
                {isActive
                  ? <LinearGradient colors={diffColors[d.label]} style={s.diffInner}>
                      <Text style={s.diffEmoji}>{d.emoji}</Text>
                      <Text style={[s.diffLabel, { color: diffTextColors[d.label] }]}>{d.label}</Text>
                    </LinearGradient>
                  : <View style={s.diffInner}>
                      <Text style={s.diffEmoji}>{d.emoji}</Text>
                      <Text style={[s.diffLabel, { color: C.hint }]}>{d.label}</Text>
                    </View>
                }
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Start button */}
      <TouchableOpacity onPress={handleStart} activeOpacity={0.87} style={s.startWrap}>
        <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={s.startBtn}>
          <Text style={s.startText}>🎙  Start Interview</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ alignItems: 'center', marginTop: 6 }}>
        <Text style={{ color: C.hint, fontSize: 13 }}>📋  Past Sessions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  // Orbs
  orb1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -80,
  },
  orb2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#EC4899', opacity: 0.10, top: 200, left: -80,
  },

  // Header
  taglineBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  taglineText:  { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontFamily: 'Syne_800ExtraBold', fontSize: 42, color: C.text, lineHeight: 50, marginBottom: 10 },
  subtitle: { fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 22 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 16, alignItems: 'center' },
  statVal: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: '#A78BFA', marginBottom: 2 },
  statLabel: { fontSize: 11, color: C.muted },

  // Input
  input: {
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 18,
  },

  // Chips
  chipSection: { fontSize: 11, color: C.hint, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.purpleBg, borderColor: C.purple },
  chipText: { color: C.muted, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#A78BFA', fontWeight: '700' },

  // Difficulty
  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  diffInner: { paddingVertical: 12, alignItems: 'center' },
  diffEmoji: { fontSize: 18, marginBottom: 4 },
  diffLabel: { fontSize: 12, fontWeight: '700' },

  // Start button
  startWrap: { borderRadius: 16, overflow: 'hidden', shadowColor: C.purple, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 10, marginBottom: 16 },
  startBtn: { paddingVertical: 20, alignItems: 'center' },
  startText: { color: '#fff', fontFamily: 'Syne_800ExtraBold', fontSize: 17, letterSpacing: 0.3 },
});