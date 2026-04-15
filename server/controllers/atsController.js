import { analyzeATS } from '../services/aiService.js';
import { saveATSReport, getUserATSReports } from '../services/firebaseService.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * POST /api/ats/check
 * Accepts resume file + job description, analyzes with AI, stores result.
 * Can receive either a file upload (multipart) or resumeText in body.
 */
export async function checkATS(req, res) {
  try {
    let resumeText = req.body.resumeText || req.body.resume_text || '';
    const jobDescription = req.body.job_description || req.body.jobDescription || '';
    const action = req.body.action || 'score';

    // If a file was uploaded, extract text from it
    if (req.file && !resumeText) {
      try {
        const pdfData = await pdf(req.file.buffer);
        resumeText = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        return res.status(400).json({ error: 'Failed to parse PDF file.' });
      }
    }

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text or file is required.' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    const result = await analyzeATS(resumeText, jobDescription, action);

    // Save to Firestore
    const reportId = await saveATSReport(req.user.uid, {
      score: result.score,
      suggestions: result.suggestions || result.missingKeywords || [],
      result,
      action,
    });

    res.json({ reportId, result });
  } catch (error) {
    console.error('ATS check error:', error);
    res.status(500).json({ error: 'Failed to analyze resume.' });
  }
}

/**
 * GET /api/ats/history
 * Returns all ATS reports for the authenticated user.
 */
export async function getATSHistory(req, res) {
  try {
    const reports = await getUserATSReports(req.user.uid);
    res.json({ reports });
  } catch (error) {
    console.error('Get ATS history error:', error);
    res.status(500).json({ error: 'Failed to fetch ATS history.' });
  }
}
