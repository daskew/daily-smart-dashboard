const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Debug: Log environment (don't log actual values)
  console.log('API Request:', req.method);
  console.log('SUPABASE_URL set:', !!process.env.SUPABASE_URL);
  
  // Get user from token
  const authHeader = req.headers.authorization;
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token length:', token.length);
  
  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.log('Auth error:', authError.message);
      return res.status(401).json({ error: 'Invalid token: ' + authError.message });
    }
    
    if (!user) {
      console.log('No user found');
      return res.status(401).json({ error: 'Invalid token - no user' });
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

      console.log('Found accounts:', data?.length || 0);

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

      console.log('Saving account for user:', user.id, 'provider:', provider);

      // Store the connected account
      const { data, error } = await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          provider,
          provider_user_id,
          access_token,
          refresh_token,
          expires_at
        })
        .select()
        .single();

      if (error) {
        console.log('Insert error:', error.message);
        return res.status(400).json({ error: error.message });
      }

      console.log('Account saved:', data.id);

      return res.json({ 
        account: {
          id: data.id,
          provider: data.provider,
          connected_at: data.created_at
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.log('Exception:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
