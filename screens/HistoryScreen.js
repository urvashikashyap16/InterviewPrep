import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, GRAD, shared, scoreColor } from '../theme';

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);

  useFocusEffect(
    useCallback(() => { loadSessions(); }, [])
  );

  const loadSessions = async () => {
    try {
      const data = await AsyncStorage.getItem('sessions');
      setSessions(data ? JSON.parse(data) : []);
    } catch (e) { console.log(e); }
  };

  const clearHistory = async () => {
    const confirmed = window.confirm
      ? window.confirm('Clear all history? This cannot be undone.')
      : true;
    if (confirmed) {
      await AsyncStorage.removeItem('sessions');
      setSessions([]);
    }
  };

  const diffEmoji = (d) => d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴';

  return (
    <ScrollView style={shared.scroll} contentContainerStyle={shared.content}>

      {/* Top bar */}
      <View style={shared.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={shared.backBtn}>← Back</Text>
        </TouchableOpacity>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={{ color: C.red, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
          </TouchableOpacity>
        )}      </View>

      <Text style={s.title}>Your Sessions</Text>
      <Text style={s.subtitle}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} completed</Text>

      {/* Empty state */}
      {sessions.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🎙</Text>
          <Text style={s.emptyTitle}>No sessions yet</Text>
          <Text style={s.emptySubtitle}>Complete your first interview to see your results here.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.87} style={s.emptyBtnWrap}>
            <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Start Practicing →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Session list */}
      {sessions.map((session, i) => {
        const sc = scoreColor(session.avgScore);
        return (
          <View key={session.id || i} style={s.sessionCard}>
            <View style={s.cardTop}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.sessionRole}>{session.role}</Text>
                <Text style={s.sessionMeta}>
                  {diffEmoji(session.difficulty)} {session.difficulty}  ·  {session.date}
                </Text>
              </View>
              {/* Score ring */}
              <View style={[s.ring, { borderColor: sc }]}>
                <Text style={[s.ringScore, { color: sc }]}>{session.avgScore}</Text>
                <Text style={s.ringDenom}>/10</Text>
              </View>
            </View>

            {/* Q-by-Q dots */}
            {session.results && (
              <View style={s.dotRow}>
                {session.results.map((r, j) => {
                  const dc = scoreColor(r.score);
                  return (
                    <View key={j} style={s.dotItem}>
                      <View style={[s.dot, { backgroundColor: dc }]} />
                      <Text style={[s.dotLabel, { color: dc }]}>{r.score}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title:    { fontFamily: 'Syne_800ExtraBold', fontSize: 30, color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.muted, marginBottom: 28 },

  // Empty
  empty:       { alignItems: 'center', marginTop: 50 },
  emptyEmoji:  { fontSize: 52, marginBottom: 14 },
  emptyTitle:  { fontFamily: 'Syne_700Bold', fontSize: 20, color: C.text, marginBottom: 8 },
  emptySubtitle: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 260, marginBottom: 24 },
  emptyBtnWrap:{ borderRadius: 14, overflow: 'hidden' },
  emptyBtn:    { paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText:{ color: '#fff', fontFamily: 'Syne_700Bold', fontSize: 14 },

  // Session card
  sessionCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sessionRole: { fontFamily: 'Syne_700Bold', fontSize: 16, color: C.text, marginBottom: 4 },
  sessionMeta: { fontSize: 13, color: C.muted },
  ring:        { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  ringScore:   { fontFamily: 'Syne_800ExtraBold', fontSize: 19, lineHeight: 21 },
  ringDenom:   { fontSize: 10, color: C.muted },
  dotRow:  { flexDirection: 'row', gap: 12 },
  dotItem: { alignItems: 'center', gap: 3 },
  dot:     { width: 10, height: 10, borderRadius: 5 },
  dotLabel:{ fontSize: 10, fontWeight: '700' },
});