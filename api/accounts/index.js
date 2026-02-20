const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Debug: Log what we received
  console.log('API Request:', req.method);
  console.log('Auth header present:', !!req.headers.authorization);

  // Get user from token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token length:', token.length);
  
  // Verify token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError) {
    console.log('Auth error:', authError.message);
    return res.status(401).json({ error: 'Invalid token: ' + authError.message });
  }
  
  if (!user) {
    console.log('No user found');
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  console.log('User authenticated:', user.email);

  if (req.method === 'GET') {
    // Get all connected accounts for user
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Don't return actual tokens, just provider info
    const accounts = data.map(acc => ({
      id: acc.id,
      provider: acc.provider,
      connected_at: acc.created_at
    }));

    return res.json({ accounts });
  }

  if (req.method === 'POST') {
    const { provider, provider_user_id, access_token, refresh_token, expires_at } = req.body;

    // Store the connected account
    const { data, error } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: user.id,
        provider,
        provider_user_id,
        access_token,  // In production, encrypt this!
        refresh_token,
        expires_at
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ 
      account: {
        id: data.id,
        provider: data.provider,
        connected_at: data.created_at
      }
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'Account disconnected' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
