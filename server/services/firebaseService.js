import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

const FieldValue = admin.firestore.FieldValue;

// ──────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────

export async function createUser(uid, { name, email }) {
  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    return existing.data();
  }
  const userData = {
    name: name || email?.split('@')[0] || 'User',
    email: email || '',
    createdAt: FieldValue.serverTimestamp(),
  };
  await userRef.set(userData);
  return userData;
}

export async function getUser(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ──────────────────────────────────────────────────────────────
// INTERVIEWS
// ──────────────────────────────────────────────────────────────

export async function saveInterview(userId, data) {
  const ref = await db.collection('interviews').add({
    userId,
    type: data.type,
    questions: data.questions || [],
    answers: data.answers || [],
    score: data.score || 0,
    feedback: data.feedback || '',
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    advice: data.advice || [],
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getUserInterviews(userId) {
  const snapshot = await db.collection('interviews')
    .where('userId', '==', userId)
    .get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort in-memory to avoid requiring a composite index
  docs.sort((a, b) => {
    const aTime = a.createdAt?._seconds || 0;
    const bTime = b.createdAt?._seconds || 0;
    return bTime - aTime;
  });
  return docs.slice(0, 50);
}

// ──────────────────────────────────────────────────────────────
// ATS REPORTS
// ──────────────────────────────────────────────────────────────

export async function saveATSReport(userId, data) {
  const ref = await db.collection('atsReports').add({
    userId,
    score: data.score || 0,
    suggestions: data.suggestions || [],
    result: data.result || {},
    action: data.action || 'score',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getUserATSReports(userId) {
  const snapshot = await db.collection('atsReports')
    .where('userId', '==', userId)
    .get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  docs.sort((a, b) => {
    const aTime = a.createdAt?._seconds || 0;
    const bTime = b.createdAt?._seconds || 0;
    return bTime - aTime;
  });
  return docs.slice(0, 20);
}

// ──────────────────────────────────────────────────────────────
// RESUMES
// ──────────────────────────────────────────────────────────────

export async function saveResume(userId, data) {
  const ref = await db.collection('resumes').add({
    userId,
    content: data.content || '',
    pdfUrl: data.pdfUrl || '',
    github: data.github || '',
    linkedin: data.linkedin || '',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getLatestResume(userId) {
  const snapshot = await db.collection('resumes')
    .where('userId', '==', userId)
    .get();
  if (snapshot.empty) return null;
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  docs.sort((a, b) => {
    const aTime = a.createdAt?._seconds || 0;
    const bTime = b.createdAt?._seconds || 0;
    return bTime - aTime;
  });
  return docs[0];
}

// ──────────────────────────────────────────────────────────────
// COMPANY PREP PROGRESS
// ──────────────────────────────────────────────────────────────

export async function markQuestionSolved(userId, { topic, company, questionId }) {
  // Check for duplicate
  const existing = await db.collection('progress')
    .where('userId', '==', userId)
    .where('topic', '==', topic)
    .where('company', '==', company)
    .where('questionId', '==', questionId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { alreadySolved: true, id: existing.docs[0].id };
  }

  const ref = await db.collection('progress').add({
    userId,
    topic,
    company,
    questionId,
    status: 'solved',
    solvedAt: FieldValue.serverTimestamp(),
  });

  return { alreadySolved: false, id: ref.id };
}

export async function unmarkQuestionSolved(userId, { topic, company, questionId }) {
  const snapshot = await db.collection('progress')
    .where('userId', '==', userId)
    .where('topic', '==', topic)
    .where('company', '==', company)
    .where('questionId', '==', questionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { wasRemoved: false };
  }

  await snapshot.docs[0].ref.delete();
  return { wasRemoved: true };
}

export async function getUserProgress(userId, topic, company) {
  const snapshot = await db.collection('progress')
    .where('userId', '==', userId)
    .where('topic', '==', topic)
    .where('company', '==', company)
    .get();

  const solvedIds = snapshot.docs.map(doc => doc.data().questionId);
  return { solvedIds, solvedCount: solvedIds.length };
}

export async function getAllUserProgress(userId) {
  const snapshot = await db.collection('progress')
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map(doc => doc.data());
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────────────────────────

export async function getDashboardStats(userId) {
  let totalInterviews = 0;
  let avgScore = 0;
  let recentInterviews = [];
  let latestATSScore = 0;
  let latestATSSuggestions = [];
  let totalSolved = 0;

  // Get interview stats
  try {
    const interviews = await db.collection('interviews')
      .where('userId', '==', userId)
      .get();
    const interviewData = interviews.docs.map(d => d.data());
    totalInterviews = interviewData.length;
    avgScore = totalInterviews > 0
      ? Math.round(interviewData.reduce((sum, i) => sum + (i.score || 0), 0) / totalInterviews)
      : 0;
    // Sort in-memory
    interviewData.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    recentInterviews = interviewData.slice(0, 5);
  } catch (err) {
    console.error('Dashboard: failed to fetch interviews:', err.message);
  }

  // Get latest ATS score (no orderBy to avoid composite index requirement)
  try {
    const atsSnapshot = await db.collection('atsReports')
      .where('userId', '==', userId)
      .get();
    if (!atsSnapshot.empty) {
      const atsDocs = atsSnapshot.docs.map(d => d.data());
      atsDocs.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
      const latestATS = atsDocs[0];
      latestATSScore = latestATS?.score || 0;
      latestATSSuggestions = latestATS?.suggestions || [];
    }
  } catch (err) {
    console.error('Dashboard: failed to fetch ATS reports:', err.message);
  }

  // Get solved questions count
  try {
    const progress = await db.collection('progress')
      .where('userId', '==', userId)
      .get();
    totalSolved = progress.size;
  } catch (err) {
    console.error('Dashboard: failed to fetch progress:', err.message);
  }

  return {
    totalInterviews,
    avgScore,
    recentInterviews,
    latestATSScore,
    latestATSSuggestions,
    totalSolved,
  };
}
