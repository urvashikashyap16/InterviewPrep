require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const Groq    = require('groq-sdk');

const app  = express();
app.use(cors());
app.use(express.json());

// ── Groq setup ────────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Helper: call Groq and parse JSON safely ───────────────────────────────────
async function askGroq(prompt) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',   // fast + free model on Groq
    messages: [
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Always respond with valid JSON only. No markdown, no extra text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const text  = response.choices[0]?.message?.content || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE 1: POST /generate-questions
//  Body:    { role: "React Developer", difficulty: "Medium", count: 10 }
//  Returns: { questions: ["Q1", "Q2", ...] }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/generate-questions', async (req, res) => {
  const { role, difficulty, count = 10 } = req.body;

  if (!role) return res.status(400).json({ error: 'role is required' });

  const prompt = `
Generate exactly ${count} interview questions for the role or topic: "${role}".
Difficulty level: ${difficulty}.

Rules:
- Questions must be specific to "${role}"
- Easy = basic definitions, Medium = conceptual + applied, Hard = deep dive + problem solving
- No duplicate questions
- Each question must be a single clear sentence

Respond ONLY with this JSON (no extra text):
{
  "questions": [
    "Question 1?",
    "Question 2?"
  ]
}
`;

  try {
    const data = await askGroq(prompt);
    res.json({ questions: data.questions.slice(0, count) });
  } catch (err) {
    console.error('Error generating questions:', err.message);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE 2: POST /evaluate-answer
//  Body:    { question, answer, role, difficulty }
//  Returns: { score, feedback, strengths, improvement }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/evaluate-answer', async (req, res) => {
  const { question, answer, role, difficulty } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'question and answer are required' });
  }

  if (answer === '(Skipped)') {
    return res.json({
      score: 0,
      feedback: 'You skipped this question. Try to attempt all questions next time!',
      strengths: 'N/A',
      improvement: 'Attempt the question even if unsure — partial answers still get evaluated.',
    });
  }

  const prompt = `
You are evaluating a candidate's interview answer.

Role: ${role}
Difficulty: ${difficulty}
Question: "${question}"
Answer: "${answer}"

Scoring guide:
- 0-2: No answer or completely wrong
- 3-4: Very basic, major gaps
- 5-6: Covers concept but lacks depth
- 7-8: Good answer with clear understanding
- 9-10: Excellent — detailed, example given, practical insight

Respond ONLY with this JSON (no extra text):
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": "<what the candidate did well>",
  "improvement": "<one specific suggestion to improve>"
}
`;

  try {
    const data = await askGroq(prompt);
    res.json({
      score:       Math.min(10, Math.max(0, Number(data.score))),
      feedback:    data.feedback    || 'No feedback available.',
      strengths:   data.strengths   || 'N/A',
      improvement: data.improvement || 'N/A',
    });
  } catch (err) {
    console.error('Error evaluating answer:', err.message);
    res.status(500).json({ error: 'Failed to evaluate answer.' });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'Interview Prep API is running ✅',
    routes: ['/generate-questions', '/evaluate-answer'],
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log('  POST http://localhost:' + PORT + '/generate-questions');
  console.log('  POST http://localhost:' + PORT + '/evaluate-answer\n');
});