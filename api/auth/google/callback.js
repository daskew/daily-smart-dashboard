const { google } = require('googleapis');

module.exports = async (req, res) => {
  const { code } = req.query;
  
  console.log('Callback hit, code present:', !!code);
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'NOT SET');
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://daily-smart-dashboard.vercel.app/auth/google/callback';
  
  if (!clientId || !clientSecret) {
    console.error('Missing OAuth credentials');
    return res.redirect('/?error=missing_credentials');
  }
  
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    // Encode tokens as base64
    const encoded = Buffer.from(JSON.stringify(tokens)).toString('base64');
    
    // Redirect back to home with token
    res.redirect(`/?auth=google&token=${encodeURIComponent(encoded)}`);
  } catch (error) {
    console.error('Auth error:', error.message);
    res.redirect('/?error=auth_failed');
  }
};
