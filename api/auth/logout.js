const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Get the access token from the request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Logged out successfully' });
};
