const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ 
      message: 'Check your email for confirmation link',
      user: data.user 
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
