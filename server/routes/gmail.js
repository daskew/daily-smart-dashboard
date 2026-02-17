const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const googleAuth = require('../auth/google');

// Simple encrypted cookie helpers (base64 for demo - use proper encryption in prod)
function encodeTokens(tokens) {
  return Buffer.from(JSON.stringify(tokens)).toString('base64');
}

function decodeTokens(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

// Initiate Google OAuth
router.get('/login', (req, res) => {
  const url = googleAuth.getAuthUrl();
  res.redirect(url);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await googleAuth.getTokens(code);
    const encoded = encodeTokens(tokens);
    res.cookie('google_tokens', encoded, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    res.redirect('/?auth=google');
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Get recent emails
router.get('/emails', async (req, res) => {
  const encoded = req.cookies?.google_tokens;
  if (!encoded) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const tokens = decodeTokens(encoded);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const auth = googleAuth.getAuthenticatedClient(tokens);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    if (!response.data.messages) {
      return res.json({ emails: [] });
    }

    const messages = await Promise.all(
      response.data.messages.slice(0, 10).map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id
        });
        const headers = full.data.payload.headers;
        return {
          id: msg.id,
          subject: headers.find(h => h.name === 'Subject')?.value,
          from: headers.find(h => h.name === 'From')?.value,
          date: headers.find(h => h.name === 'Date')?.value,
          snippet: full.data.snippet
        };
      })
    );

    res.json({ emails: messages });
  } catch (error) {
    console.error('Gmail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check auth status
router.get('/status', (req, res) => {
  const encoded = req.cookies?.google_tokens;
  res.json({ authenticated: !!encoded });
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('google_tokens');
  res.redirect('/');
});

module.exports = router;
