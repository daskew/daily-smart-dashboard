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
    const calendar = google.calendar({ version: 'v3', auth });

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end
    }));

    res.json({ events });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: error.message });
  }
};
