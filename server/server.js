import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import route modules
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import atsRoutes from './routes/ats.js';
import resumeRoutes from './routes/resume.js';
import companyRoutes from './routes/company.js';
import dashboardRoutes from './routes/dashboard.js';

// Initialize Express App
const app = express();
const port = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Legacy Backward-Compatible Routes ──
// These keep the existing frontend interview components working
// (they call /api/chat, /api/dsa/*, /api/resume/generate directly)
import { chatInterview } from './services/aiService.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { history } = req.body;
    if (!history) return res.status(400).json({ error: 'Chat history is required.' });
    const message = await chatInterview(history);
    res.json({ message });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to get response from AI model.' });
  }
});

app.post('/api/dsa/question', async (req, res) => {
  try {
    const { difficulty } = req.body;
    const difficultyLevel = difficulty === 'intern' ? 'medium' : 'medium-hard';
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a technical interviewer. Respond with valid JSON only.' },
        { role: 'user', content: `Generate a single data structures and algorithms coding problem suitable for a ${difficultyLevel} level interview.\n\nReturn ONLY a JSON object:\n{\n  "title": "Problem Title",\n  "description": "Detailed problem description with examples, constraints, and input/output format",\n  "difficulty": "${difficultyLevel}"\n}` }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });
    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json({ question: JSON.parse(jsonMatch[0]) });
    } else {
      res.json({ question: { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', difficulty: difficultyLevel } });
    }
  } catch (error) {
    console.error('Error in /api/dsa/question:', error);
    res.status(500).json({ error: 'Failed to generate DSA question.' });
  }
});

app.post('/api/dsa/evaluate', async (req, res) => {
  try {
    const { question, code, language, explanation } = req.body;
    if (!question || !code || !language || !explanation) return res.status(400).json({ error: 'All fields are required.' });
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a technical interviewer. Respond with valid JSON only.' },
        { role: 'user', content: `Evaluate this DSA solution:\n\nProblem: ${question.title}\nDescription: ${question.description}\nCode (${language}): ${code}\nExplanation: ${explanation}\n\nReturn ONLY JSON: { "score": <0-100>, "strengths": [...], "weaknesses": [...], "advice": [...] }` }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });
    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json({ feedback: JSON.parse(jsonMatch[0]) });
    } else {
      res.status(500).json({ error: 'Failed to parse feedback.' });
    }
  } catch (error) {
    console.error('Error in /api/dsa/evaluate:', error);
    res.status(500).json({ error: 'Failed to evaluate DSA solution.' });
  }
});

// ── 404 Handler ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start Server ──
app.listen(port, () => {
  console.log(`\n🚀 PlaceMate API Server running on http://localhost:${port}`);
  console.log(`   Health check: http://localhost:${port}/api/health`);
  console.log(`   Routes: auth, interview, ats, resume, company, dashboard\n`);
});