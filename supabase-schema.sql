-- Database schema for Daily Smart Dashboard
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create user_profiles table (links to auth.users)
create table public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create connected_accounts table (stores Google/MS tokens)
create table public.connected_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null, -- 'google', 'microsoft'
  provider_user_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.connected_accounts enable row level security;

-- Policies for user_profiles
create policy "Users can view own profile" 
  on public.user_profiles for select 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.user_profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.user_profiles for update 
  using (auth.uid() = id);

-- Policies for connected_accounts
create policy "Users can view own accounts" 
  on public.connected_accounts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own accounts" 
  on public.connected_accounts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own accounts" 
  on public.connected_accounts for update 
  using (auth.uid() = user_id);

create policy "Users can delete own accounts" 
  on public.connected_accounts for delete 
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
