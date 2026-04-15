import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { markQuestionSolved, unmarkQuestionSolved, getUserProgress } from '../services/firebaseService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load company prep data once at startup
let companyData = {};
try {
  const dataPath = resolve(__dirname, '..', 'data', 'companyPrepData.json');
  companyData = JSON.parse(readFileSync(dataPath, 'utf8'));
  console.log('✅ Company prep data loaded');
} catch (error) {
  console.error('⚠️  Failed to load company prep data:', error.message);
}

/**
 * GET /api/company/topics
 * Returns all topics with company counts and question counts.
 */
export async function getTopics(req, res) {
  try {
    const topics = Object.keys(companyData).map(topic => {
      const tData = companyData[topic];
      const companies = Object.keys(tData.companies || {});
      const totalQuestions = companies.reduce(
        (acc, c) => acc + (tData.companies[c]?.length || 0), 0
      );
      return {
        name: topic,
        desc: tData.desc,
        icon: tData.icon,
        numCompanies: companies.length,
        numQuestions: totalQuestions,
      };
    });
    res.json({ topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics.' });
  }
}

/**
 * GET /api/company/:topic/companies
 * Returns all companies under a topic.
 */
export async function getCompanies(req, res) {
  try {
    const { topic } = req.params;
    const topicData = companyData[topic];

    if (!topicData) {
      return res.status(404).json({ error: `Topic "${topic}" not found.` });
    }

    const companies = Object.keys(topicData.companies || {}).map(company => ({
      name: company,
      questionCount: topicData.companies[company]?.length || 0,
    }));

    res.json({ topic, companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies.' });
  }
}

/**
 * GET /api/company/:topic/:company
 * Returns questions from static JSON, annotated with user's solved status.
 */
export async function getQuestions(req, res) {
  try {
    const { topic, company } = req.params;
    const topicData = companyData[topic];

    if (!topicData) {
      return res.status(404).json({ error: `Topic "${topic}" not found.` });
    }

    const questions = topicData.companies?.[company];
    if (!questions) {
      return res.status(404).json({ error: `Company "${company}" not found under "${topic}".` });
    }

    // Get user's progress for this topic+company
    const { solvedIds } = await getUserProgress(req.user.uid, topic, company);
    const solvedSet = new Set(solvedIds);

    const annotated = questions.map((q, i) => {
      const qId = `${topic}-${company}-${q.name}`;
      return {
        ...q,
        id: qId,
        index: i,
        solved: solvedSet.has(qId),
      };
    });

    res.json({
      topic,
      company,
      questions: annotated,
      totalCount: questions.length,
      solvedCount: solvedIds.length,
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
}

/**
 * POST /api/company/solve
 * Body: { topic, company, questionId }
 */
export async function solveQuestion(req, res) {
  try {
    const { topic, company, questionId } = req.body;

    if (!topic || !company || !questionId) {
      return res.status(400).json({ error: 'topic, company, and questionId are required.' });
    }

    const result = await markQuestionSolved(req.user.uid, { topic, company, questionId });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Solve question error:', error);
    res.status(500).json({ error: 'Failed to mark question as solved.' });
  }
}

/**
 * POST /api/company/unsolve
 * Body: { topic, company, questionId }
 */
export async function unsolveQuestion(req, res) {
  try {
    const { topic, company, questionId } = req.body;

    if (!topic || !company || !questionId) {
      return res.status(400).json({ error: 'topic, company, and questionId are required.' });
    }

    const result = await unmarkQuestionSolved(req.user.uid, { topic, company, questionId });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Unsolve question error:', error);
    res.status(500).json({ error: 'Failed to unmark question.' });
  }
}

/**
 * GET /api/company/progress/:topic/:company
 * Returns solved count and solved question IDs.
 */
export async function getProgress(req, res) {
  try {
    const { topic, company } = req.params;
    const progress = await getUserProgress(req.user.uid, topic, company);

    // Get total from static data
    const totalCount = companyData[topic]?.companies?.[company]?.length || 0;

    res.json({
      topic,
      company,
      ...progress,
      totalCount,
      pendingCount: totalCount - progress.solvedCount,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
}
