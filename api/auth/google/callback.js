const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://daily-smart-dashboard.vercel.app/auth/google/callback';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return res.redirect('/?error=supabase_not_configured');
  }

  if (!clientId || !clientSecret) {
    console.error('Missing OAuth credentials');
    return res.redirect('/?error=missing_credentials');
  }
  
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get the user from the session cookie/state
    // For now, we'll redirect with tokens and let the frontend handle storage
    // In a full implementation, we'd use the Supabase session here
    
    // Encode tokens as base64
    const encoded = Buffer.from(JSON.stringify(tokens)).toString('base64');
    
    // Redirect back to home with token - user will need to be logged in first
    res.redirect(`/?auth=google&token=${encodeURIComponent(encoded)}`);
  } catch (error) {
    console.error('Auth error:', error.message);
    res.redirect('/?error=auth_failed');
  }
};
