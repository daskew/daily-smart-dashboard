const { Client } = require('@microsoft/microsoft-graph-client');

const config = {
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  authority: 'https://login.microsoftonline.com/common',
  scopes: [
    'User.Read',
    'Mail.Read',
    'Calendars.Read'
  ]
};

// Generate auth URL
function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    response_mode: 'query',
    scope: config.scopes.join(' ')
  });
  return `${config.authority}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Exchange code for tokens
async function getTokens(code) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch(`${config.authority}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  return response.json();
}

// Get authenticated Graph client
function getAuthenticatedClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

module.exports = {
  getAuthUrl,
  getTokens,
  getAuthenticatedClient
};
