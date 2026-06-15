import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { C, GRAD, shared } from '../theme';

// ── API CONFIG ────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';

// ── FALLBACK QUESTIONS (used if API call fails) ───────────────────────────────
const FALLBACK = {
  'React Developer': [
    'What is the difference between state and props in React?',
    'Explain the useEffect hook and when would you use it.',
    'What is the Virtual DOM and how does React use it?',
    'What are React keys and why are they important in lists?',
    'How does the Context API differ from prop drilling?',
    'What is the difference between controlled and uncontrolled components?',
    'Explain React.memo and when you would use it.',
    'What are custom hooks and why are they useful?',
    'What is the difference between useMemo and useCallback?',
    'How does React handle forms and validation?',
    'What is code splitting in React and how do you implement it?',
    'Explain the React component lifecycle.',
    'What is the difference between React.lazy and Suspense?',
    'How does error boundary work in React?',
    'What are portals in React and when would you use them?',
  ],
  'Python Developer': [
    'What is the difference between a list and a tuple in Python?',
    'Explain Python decorators with an example.',
    'What is a generator function and how does it differ from a normal function?',
    'How does memory management work in Python?',
    'What is the Global Interpreter Lock (GIL)?',
    'Explain list comprehensions and when to use them.',
    'What is the difference between deep copy and shallow copy?',
    'How does exception handling work in Python?',
    'What are Python context managers and the with statement?',
    'Explain the difference between args and kwargs.',
    'What are Python virtual environments and why are they used?',
    'Explain object-oriented programming concepts in Python.',
    'What is the difference between multiprocessing and multithreading in Python?',
    'How does Python handle file I/O operations?',
    'What are lambda functions and when should you use them?',
  ],
  'Data Structures': [
    'Explain the difference between a stack and a queue.',
    'What is a binary search tree and what are its properties?',
    'What is the time complexity of searching in a hash table?',
    'Explain how merge sort works.',
    'What is the difference between BFS and DFS?',
    'What is a linked list and how does it differ from an array?',
    'Explain what a heap data structure is and its use cases.',
    'What is dynamic programming and when do you use it?',
    'What is the difference between a tree and a graph?',
    'Explain the concept of recursion with an example.',
    'What is a trie and what are its applications?',
    'Explain the concept of hashing and collision resolution.',
    'What is a segment tree and when is it used?',
    'Explain the sliding window technique.',
    'What is the difference between greedy algorithms and dynamic programming?',
  ],
  'DBMS Concepts': [
    'What are the ACID properties in database transactions?',
    'Explain the difference between primary key and foreign key.',
    'What is database normalization and why is it important?',
    'Explain the difference between SQL JOIN types.',
    'What is database indexing and how does it improve performance?',
    'What is the difference between DELETE, TRUNCATE and DROP?',
    'Explain what a stored procedure is.',
    'What is a deadlock in databases and how is it prevented?',
    'What is the difference between OLTP and OLAP?',
    'Explain the concept of transactions and rollback.',
    'What is a view in SQL and when would you use it?',
    'Explain the difference between clustered and non-clustered indexes.',
    'What is database sharding?',
    'What are triggers in SQL?',
    'Explain the difference between SQL and NoSQL databases.',
  ],
  'Operating Systems': [
    'What is the difference between a process and a thread?',
    'Explain how virtual memory works.',
    'What is deadlock and what are the four conditions for it?',
    'Explain the difference between paging and segmentation.',
    'What is a context switch?',
    'What are the different CPU scheduling algorithms?',
    'What is the difference between internal and external fragmentation?',
    'Explain semaphores and how they prevent race conditions.',
    'What is thrashing in operating systems?',
    'What is the difference between a monolithic and microkernel architecture?',
    'Explain the concept of inter-process communication.',
    'What is a page fault and how is it handled?',
    'Explain the banker algorithm for deadlock avoidance.',
    'What is the difference between preemptive and non-preemptive scheduling?',
    'What are system calls and how do they work?',
  ],
  'Computer Networks': [
    'What is the OSI model and its 7 layers?',
    'What is the difference between TCP and UDP?',
    'Explain how DNS works.',
    'What is subnetting and why is it used?',
    'What happens when you type a URL in the browser?',
    'What is the difference between HTTP and HTTPS?',
    'Explain the concept of IP addressing and classes.',
    'What is ARP and how does it work?',
    'What is the difference between a hub, switch and router?',
    'Explain the three-way handshake in TCP.',
    'What is NAT and why is it used?',
    'Explain the concept of DHCP.',
    'What is the difference between IPv4 and IPv6?',
    'What is a firewall and how does it work?',
    'Explain the concept of VPN and how it provides security.',
  ],
};

function getFallback(role) {
  return FALLBACK[role] || [
    `Explain the core concept of ${role} in simple terms.`,
    `What are common challenges in ${role}?`,
    `Describe a real-world application of ${role}.`,
    `What best practices do you follow in ${role}?`,
    `How would you approach a difficult problem in ${role}?`,
    `What tools or frameworks are commonly used in ${role}?`,
    `How do you stay updated with trends in ${role}?`,
    `Describe a project where you applied ${role} concepts.`,
    `What are the biggest mistakes beginners make in ${role}?`,
    `How would you explain ${role} to a non-technical person?`,
  ];
}

const TOTAL = 10;

export default function QuestionScreen({ route, navigation }) {
  const { role, difficulty } = route.params;

  const [questions,  setQuestions]  = useState([]);
  const [index,      setIndex]      = useState(0);
  const [answer,     setAnswer]     = useState('');
  const [answers,    setAnswers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiError,   setApiError]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchQuestions(); }, []);

  // Fetch questions from Gemini via backend
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, difficulty, count: TOTAL }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setApiError(false);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.log('API error, using fallback:', err.message);
      setQuestions(getFallback(role));
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && questions.length > 0) readQuestion(questions[index]);
  }, [index, loading, questions]);

  useEffect(() => { return () => Speech.stop(); }, []);

  const animateCardIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  useEffect(() => { if (!loading) animateCardIn(); }, [loading]);

  const readQuestion = (text) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-IN', rate: 0.88, pitch: 1.0,
      onDone:  () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleNext = () => {
    if (!answer.trim()) { Alert.alert('No answer', 'Please type your answer first.'); return; }
    submitAnswer(answer.trim());
  };

  const handleSkip = () => submitAnswer('(Skipped)');

  const submitAnswer = (ans) => {
    Speech.stop();
    const updated = [...answers, { question: questions[index], answer: ans }];
    setAnswers(updated);
    setAnswer('');
    if (index + 1 < TOTAL) { setIndex(index + 1); animateCardIn(); }
    else navigation.navigate('Feedback', { role, difficulty, answers: updated });
  };

  const progress  = (index / TOTAL) * 100;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  if (loading) {
    return (
      <View style={s.loadScreen}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={s.loadText}>Generating questions with AI...</Text>
        <Text style={s.loadSub}>Generating questions for {role}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={shared.scroll} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">

        <View style={shared.topBar}>
          <TouchableOpacity onPress={() => { Speech.stop(); navigation.goBack(); }}>
            <Text style={shared.backBtn}>← Exit</Text>
          </TouchableOpacity>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText} numberOfLines={1}>{role}</Text>
          </View>
          <Text style={s.counter}>{index + 1}/{TOTAL}</Text>
        </View>

        {/* Show banner if API failed and using fallback */}
        {apiError && (
          <View style={s.fallbackBanner}>
            <Text style={s.fallbackText}>⚠️ Using offline questions — backend not reachable</Text>
          </View>
        )}

        <View style={shared.progressBg}>
          <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }}
            style={[s.progressFill, { width: `${progress}%` }]} />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient colors={GRAD.question} style={s.qCard}>
            <View style={s.qCardTop}>
              <Text style={s.qLabel}>Question {index + 1}</Text>
              <TouchableOpacity onPress={() => readQuestion(questions[index])} style={s.rereadBtn}>
                <Text style={s.rereadText}>{isSpeaking ? '🔊 Reading...' : '🔊 Read aloud'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.qText}>{questions[index]}</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={s.answerLabel}>Your Answer</Text>
        <TextInput
          style={s.answerInput}
          multiline
          placeholder="Type your answer here..."
          placeholderTextColor={C.hint}
          value={answer}
          onChangeText={setAnswer}
          textAlignVertical="top"
        />
        <Text style={s.wordCount}>{wordCount} words</Text>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.87} style={s.nextWrap}>
          <LinearGradient colors={GRAD.primary} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={s.nextBtn}>
            <Text style={s.nextText}>
              {index + 1 === TOTAL ? '🏁  Finish & Get Feedback' : 'Next Question →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ color: C.hint, fontSize: 13 }}>Skip this question</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loadScreen: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:   { color: C.text, fontSize: 16, fontFamily: 'Syne_700Bold', marginTop: 8 },
  loadSub:    { color: C.muted, fontSize: 13 },

  fallbackBanner: { backgroundColor: '#2d1f04', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: C.amber },
  fallbackText:   { color: C.amber, fontSize: 12, textAlign: 'center' },

  roleBadge:     { backgroundColor: '#1A0A3E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#3D1A7A', maxWidth: 180 },
  roleBadgeText: { color: '#C4B5FD', fontSize: 12, fontWeight: '600' },
  counter:       { color: C.muted, fontSize: 14, fontFamily: 'Syne_700Bold' },
  progressFill:  { height: 5, borderRadius: 5 },

  qCard:      { borderRadius: 20, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: '#3D1A7A' },
  qCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  qLabel:     { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: '#A78BFA', textTransform: 'uppercase' },
  rereadBtn:  { backgroundColor: '#2D1560', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#3D1A7A' },
  rereadText: { color: '#C4B5FD', fontSize: 12, fontWeight: '600' },
  qText:      { fontFamily: 'Syne_700Bold', fontSize: 18, color: C.text, lineHeight: 28 },

  answerLabel: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  answerInput: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: '#2A1F50', borderRadius: 16, padding: 16, color: C.text, fontSize: 15, minHeight: 140, lineHeight: 24 },
  wordCount:   { color: C.hint, fontSize: 11, textAlign: 'right', marginTop: 6, marginBottom: 22 },

  nextWrap: { borderRadius: 16, overflow: 'hidden', shadowColor: C.purple, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10, marginBottom: 12 },
  nextBtn:  { paddingVertical: 18, alignItems: 'center' },
  nextText: { color: '#fff', fontFamily: 'Syne_700Bold', fontSize: 16 },
});