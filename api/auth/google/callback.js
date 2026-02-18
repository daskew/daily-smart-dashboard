const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://daily-smart-dashboard.vercel.app/auth/google/callback'
  );
}

// Simple encoding (base64) - use proper encryption in production
function encodeTokens(tokens) {
  return Buffer.from(JSON.stringify(tokens)).toString('base64');
}

module.exports = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/?error=no_code');
  }
  
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    const encoded = encodeTokens(tokens);
    
    // Redirect back to home with token in query string (for now - use cookies in production)
    res.redirect(`/?auth=google&token=${encodeURIComponent(encoded)}`);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/?error=auth_failed');
  }
};
