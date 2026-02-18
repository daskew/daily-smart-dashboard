// Supabase client configuration
// Set these environment variables in Vercel:
// SUPABASE_URL - Your Supabase project URL
// SUPABASE_ANON_KEY - Your Supabase anon key

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = require('@supabase/supabase-js');

function createClient() {
  return supabase.createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = {
  createClient,
  supabaseUrl,
  supabaseAnonKey
};
