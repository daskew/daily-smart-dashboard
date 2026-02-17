const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const googleAuth = require('../auth/google');

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
    // In production, store tokens securely (encrypted in DB or cookies)
    req.session.googleTokens = tokens;
    res.redirect('/?auth=google');
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Get recent emails
router.get('/emails', async (req, res) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const auth = googleAuth.getAuthenticatedClient(req.session.googleTokens);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20
    });

    // Get full message details
    const messages = await Promise.all(
      (response.data.messages || []).slice(0, 10).asyncMap(async (msg) => {
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

// Logout
router.get('/logout', (req, res) => {
  req.session.googleTokens = null;
  res.redirect('/');
});

module.exports = router;
