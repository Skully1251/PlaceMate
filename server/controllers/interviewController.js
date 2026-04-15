import { generateInterviewQuestions, evaluateInterview, chatInterview } from '../services/aiService.js';
import { saveInterview, getUserInterviews } from '../services/firebaseService.js';

/**
 * POST /api/interview/save-result
 * Body: { type, score, strengths, weaknesses, advice, overallScore, rounds }
 * Saves a completed interview result (from voice interview flow) to Firestore.
 */
export async function saveResult(req, res) {
  try {
    const { type, score, strengths, weaknesses, advice, overallScore, rounds } = req.body;

    const finalScore = score || overallScore || 0;
    const interviewType = type || 'voice';

    const interviewId = await saveInterview(req.user.uid, {
      type: interviewType,
      questions: [],
      answers: [],
      score: finalScore,
      feedback: rounds ? JSON.stringify(rounds) : '',
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      advice: advice || [],
    });

    res.json({ interviewId, saved: true });
  } catch (error) {
    console.error('Save result error:', error);
    res.status(500).json({ error: 'Failed to save interview result.' });
  }
}

/**
 * POST /api/interview/start
 * Body: { type, resumeText, jobRole, difficulty }
 * Generates interview questions using AI.
 */
export async function startInterview(req, res) {
  try {
    const { type, resumeText, jobRole, difficulty } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Interview type is required.' });
    }

    const validTypes = ['resume', 'dsa', 'hr', 'combined'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const result = await generateInterviewQuestions(type, { resumeText, jobRole, difficulty });
    res.json({ type, ...result });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
}

/**
 * POST /api/interview/submit
 * Body: { type, questions, answers, jobRole }
 * Evaluates answers and stores the interview record.
 */
export async function submitInterview(req, res) {
  try {
    const { type, questions, answers, jobRole } = req.body;

    if (!type || !questions || !answers) {
      return res.status(400).json({ error: 'type, questions, and answers are required.' });
    }

    const evaluation = await evaluateInterview(type, questions, answers, { jobRole });

    // Save to Firestore
    const interviewId = await saveInterview(req.user.uid, {
      type,
      questions,
      answers,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      advice: evaluation.advice,
    });

    res.json({
      interviewId,
      ...evaluation,
    });
  } catch (error) {
    console.error('Submit interview error:', error);
    res.status(500).json({ error: 'Failed to evaluate interview.' });
  }
}

/**
 * GET /api/interview/history
 * Returns all interviews for the authenticated user.
 */
export async function getHistory(req, res) {
  try {
    const interviews = await getUserInterviews(req.user.uid);
    res.json({ interviews });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch interview history.' });
  }
}

/**
 * POST /api/interview/chat
 * Body: { history }
 * Continues an interview conversation (for voice interview mode).
 */
export async function chat(req, res) {
  try {
    const { history } = req.body;

    if (!history) {
      return res.status(400).json({ error: 'Chat history is required.' });
    }

    const message = await chatInterview(history);
    res.json({ message });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
}
