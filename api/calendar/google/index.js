const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

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
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Get user from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get Google connected account for this user
  const { data: accounts, error: accountError } = await supabase
    .from('connected_accounts')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .limit(1);

  if (accountError || !accounts || accounts.length === 0) {
    return res.status(401).json({ error: 'Google account not connected' });
  }

  const googleToken = accounts[0].access_token;
  
  if (!googleToken) {
    return res.status(401).json({ error: 'No Google token found' });
  }

  const tokens = decodeTokens(googleToken);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid Google tokens' });
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
