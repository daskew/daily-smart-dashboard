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

  console.log('Gmail API called');
  
  // Get user from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No auth header');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token present:', !!token);
  
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
    const gmail = google.gmail({ version: 'v1', auth })

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
