import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

// GET /api/github/:username/repos — proxy to GitHub API
router.get('/:username/repos', async (req, res) => {
  try {
    const { username } = req.params;

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'C2S-VLSI-Portal',
        },
      }
    );

    if (response.status === 404) {
      return res.status(404).json({ success: false, error: 'GitHub user not found.' });
    }

    if (response.status === 403) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : 'unknown';
      return res.status(429).json({
        success: false,
        error: `GitHub API rate limit exceeded. Resets at ${resetTime}.`,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `GitHub API error: ${response.statusText}`,
      });
    }

    const repos = await response.json();

    const formattedRepos = repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
    }));

    res.json({ success: true, data: formattedRepos });
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GitHub repos.' });
  }
});

export default router;
