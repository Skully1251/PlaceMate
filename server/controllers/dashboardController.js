import { getDashboardStats, getAllUserProgress } from '../services/firebaseService.js';

/**
 * GET /api/dashboard
 * Returns aggregated stats for the authenticated user's dashboard.
 */
export async function getDashboard(req, res) {
  try {
    const stats = await getDashboardStats(req.user.uid);

    // Calculate total pending (we need the full company data count)
    // For now, just return totalSolved; client can compute pending from local data
    res.json({
      totalInterviews: stats.totalInterviews,
      avgScore: stats.avgScore,
      recentInterviews: stats.recentInterviews,
      latestATSScore: stats.latestATSScore,
      latestATSSuggestions: stats.latestATSSuggestions,
      totalSolved: stats.totalSolved,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
}
