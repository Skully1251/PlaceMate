import { generateResume } from '../services/aiService.js';
import { saveResume, getLatestResume } from '../services/firebaseService.js';

/**
 * POST /api/resume/generate
 * Body: { github, linkedin, codolio, email, jobDesc, repos }
 */
export async function generateResumeHandler(req, res) {
  try {
    const { github, linkedin, codolio, email, jobDesc, repos } = req.body;

    if (!github || !linkedin || !jobDesc) {
      return res.status(400).json({ error: 'GitHub, LinkedIn, and job description are required.' });
    }

    const startTime = Date.now();
    const latexContent = await generateResume({ github, linkedin, codolio, email, jobDesc, repos });
    const timeTakenMs = Date.now() - startTime;

    // Save to Firestore
    const resumeId = await saveResume(req.user.uid, {
      content: latexContent,
      github,
      linkedin,
    });

    res.json({
      resumeId,
      latex: latexContent,
      timeTakenMs,
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({ error: 'Failed to generate resume.' });
  }
}

/**
 * GET /api/resume
 * Returns the latest generated resume for the authenticated user.
 */
export async function getResume(req, res) {
  try {
    const resume = await getLatestResume(req.user.uid);
    if (!resume) {
      return res.status(404).json({ error: 'No resume found. Generate one first.' });
    }
    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume.' });
  }
}
