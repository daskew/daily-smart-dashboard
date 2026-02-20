const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Debug: Log environment (don't log actual values)
  console.log('SUPABASE_URL set:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY set:', !!process.env.SUPABASE_ANON_KEY);
  
  // Get user from token
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'none');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 20));
  
  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.log('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token: ' + authError.message });
    }
    
    if (!user) {
      console.log('No user found');
      return res.status(401).json({ error: 'Invalid token - no user' });
    }
    
    console.log('User authenticated:', user.email);
    
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
  } catch (err) {
    console.log('Exception:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
