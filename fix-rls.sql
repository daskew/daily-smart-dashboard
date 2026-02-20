-- Re-enable RLS with proper policies
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.connected_accounts;

-- Create policies using auth.uid()
CREATE POLICY "Users can view own accounts" 
  ON public.connected_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" 
  ON public.connected_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" 
  ON public.connected_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" 
  ON public.connected_accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- Same for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);
