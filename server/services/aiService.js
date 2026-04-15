import Groq from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Helper: send a chat completion request and parse JSON from the response.
 */
async function chatCompletion(messages, maxTokens = 4096) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || '';
}

/**
 * Extract JSON from a string that may contain markdown fences.
 */
function extractJSON(text) {
  // Try to find JSON in code fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  // Try direct JSON parse
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  // Try array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }
  throw new Error('No valid JSON found in AI response');
}

// ──────────────────────────────────────────────────────────────
// INTERVIEW
// ──────────────────────────────────────────────────────────────

/**
 * Generate interview questions based on type and context.
 * @param {string} type - 'resume' | 'dsa' | 'hr' | 'combined'
 * @param {object} context - { resumeText, jobRole, difficulty }
 * @returns {object} { questions: [...] }
 */
export async function generateInterviewQuestions(type, context = {}) {
  const prompts = {
    resume: `You are an expert technical interviewer. Based on the following resume, generate 5 targeted interview questions that probe the candidate's experience, projects, and skills mentioned in their resume for the role of "${context.jobRole || 'Software Engineer'}".

Resume:
${context.resumeText || 'No resume provided.'}

Return ONLY a JSON object: { "questions": ["question1", "question2", ...] }`,

    dsa: `Generate 3 data structures and algorithms coding problems suitable for a ${context.difficulty === 'intern' ? 'medium' : 'medium-hard'} level ${context.difficulty === 'intern' ? 'internship' : 'SDE'} interview.

Return ONLY a JSON object:
{
  "questions": [
    { "title": "Problem Title", "description": "Detailed description with examples and constraints", "difficulty": "Medium" }
  ]
}`,

    hr: `You are an expert HR interviewer. Generate 5 behavioral interview questions that assess soft skills, teamwork, leadership, conflict resolution, and cultural fit.

Return ONLY a JSON object: { "questions": ["question1", "question2", ...] }`,

    combined: `You are conducting a full-loop interview. Generate questions for 3 rounds:
1. Resume Round (3 questions about experience and projects)
2. DSA Round (2 coding problems)
3. Behavioral Round (3 HR/soft-skill questions)

The candidate's role: "${context.jobRole || 'Software Engineer'}"
${context.resumeText ? `Resume: ${context.resumeText.substring(0, 2000)}` : ''}

Return ONLY a JSON object:
{
  "rounds": {
    "resume": { "questions": ["q1", "q2", "q3"] },
    "dsa": { "questions": [{ "title": "...", "description": "...", "difficulty": "..." }, ...] },
    "behavioral": { "questions": ["q1", "q2", "q3"] }
  }
}`
  };

  const messages = [
    { role: 'system', content: 'You are a professional technical interviewer. Always respond with valid JSON only.' },
    { role: 'user', content: prompts[type] || prompts.hr }
  ];

  const raw = await chatCompletion(messages);
  return extractJSON(raw);
}

/**
 * Evaluate interview answers and return scores + feedback.
 */
export async function evaluateInterview(type, questions, answers, context = {}) {
  const prompt = `You are an expert interviewer evaluating a candidate's responses.

Interview Type: ${type}
Job Role: ${context.jobRole || 'Software Engineer'}

Questions and Answers:
${questions.map((q, i) => `Q${i + 1}: ${typeof q === 'object' ? q.title || q : q}\nA${i + 1}: ${answers[i] || 'No answer provided'}`).join('\n\n')}

Evaluate each answer considering:
1. Correctness and depth of knowledge
2. Communication clarity
3. Problem-solving approach
4. Practical relevance

Return ONLY a JSON object:
{
  "score": <number 0-100>,
  "feedback": "Overall feedback paragraph",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "advice": ["advice1", "advice2"],
  "questionFeedback": [
    { "question": "...", "score": <0-100>, "feedback": "..." }
  ]
}`;

  const messages = [
    { role: 'system', content: 'You are a professional interviewer. Respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  const raw = await chatCompletion(messages);
  return extractJSON(raw);
}

// ──────────────────────────────────────────────────────────────
// ATS ANALYSIS
// ──────────────────────────────────────────────────────────────

/**
 * Analyze a resume against a job description.
 * @param {string} resumeText - Extracted text from resume PDF
 * @param {string} jobDescription - Target job description
 * @param {string} action - 'analysis' | 'gaps' | 'score'
 */
export async function analyzeATS(resumeText, jobDescription, action = 'score') {
  const prompts = {
    score: `Analyze the following resume against the job description and provide an ATS compatibility score.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a JSON object:
{
  "score": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "profileSummary": "Brief summary of how well the profile matches",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`,

    analysis: `Provide a detailed professional analysis of how the following resume matches the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a JSON object:
{
  "score": <number 0-100>,
  "overallAssessment": "Detailed paragraph about overall fit",
  "sectionAnalysis": {
    "experience": "Analysis of experience section",
    "skills": "Analysis of skills alignment",
    "education": "Analysis of education relevance",
    "projects": "Analysis of projects relevance"
  },
  "suggestions": ["suggestion1", "suggestion2"]
}`,

    gaps: `Identify all gaps, missing keywords, and areas where the following resume falls short compared to the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a JSON object:
{
  "score": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceGaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`
  };

  const messages = [
    { role: 'system', content: 'You are an expert ATS (Applicant Tracking System) analyst. Respond with valid JSON only.' },
    { role: 'user', content: prompts[action] || prompts.score }
  ];

  const raw = await chatCompletion(messages, 4096);
  return extractJSON(raw);
}

// ──────────────────────────────────────────────────────────────
// RESUME GENERATION
// ──────────────────────────────────────────────────────────────

/**
 * Generate a LaTeX resume from user profiles and job description.
 */
export async function generateResume({ github, linkedin, codolio, email, jobDesc, repos }) {
  const prompt = `You are an expert ATS-friendly resume generator.
Given the following user details:
- GitHub: ${github}
- LinkedIn: ${linkedin}
- Codolio: ${codolio}
- Email: ${email}
- Job Description: ${jobDesc}
- Selected Repositories: ${JSON.stringify(repos)}

Generate a clean, professional, ATS-friendly LaTeX resume. Use a standard article class without custom fonts.
Include sections for Contact Info, Experience/Projects (based on the repos), and Skills (inferred from job description and repos).
DO NOT use markdown code blocks in the output, just return the raw LaTeX code directly.
Ensure the LaTeX code compiles successfully.`;

  const messages = [
    { role: 'system', content: 'You are an expert resume writer. Generate clean LaTeX code.' },
    { role: 'user', content: prompt }
  ];

  let latex = await chatCompletion(messages, 8192);

  // Clean up markdown wrapping if present
  if (latex.startsWith('```latex')) {
    latex = latex.replace(/```latex\n?/, '').replace(/```$/, '');
  } else if (latex.startsWith('```')) {
    latex = latex.replace(/```\n?/, '').replace(/```$/, '');
  }

  return latex.trim();
}

// ──────────────────────────────────────────────────────────────
// CHAT (for ongoing interview conversation)
// ──────────────────────────────────────────────────────────────

/**
 * Continue an interview chat conversation.
 */
export async function chatInterview(history) {
  // Convert Gemini-style history to Groq/OpenAI-style messages
  const messages = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : msg.role,
    content: msg.parts?.[0]?.text || msg.content || '',
  }));

  const raw = await chatCompletion(messages, 2000);
  return raw;
}
