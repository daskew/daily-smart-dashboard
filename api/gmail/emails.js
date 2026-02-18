const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://daily-smart-dashboard.vercel.app/auth/google/callback'
  );
}

function decodeTokens(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  // Get token from query string (temporary approach)
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const tokens = decodeTokens(token);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const auth = getOAuth2Client();
    auth.setCredentials(tokens);
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
};
