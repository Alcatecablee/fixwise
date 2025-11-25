-- ========================================
-- NEUROLINT INITIAL SCHEMA MIGRATION
-- ========================================
-- This migration creates all core tables for Neurolint

-- 1. PROFILES TABLE (User profiles and subscription data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 1)) STORED,
  last_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 2)) STORED,
  avatar_url TEXT,
  email_confirmed BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'professional', 'business', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'suspended', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_id TEXT,
  payment_method TEXT DEFAULT 'card',
  usage JSONB DEFAULT '{"remainingFixes": -1, "remainingAnalyzes": -1, "lastReset": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ANALYSIS HISTORY TABLE (Store analysis results)
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result JSONB NOT NULL,
  layers INTEGER[] DEFAULT '{}',
  execution_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROJECTS TABLE (User project management)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
  description TEXT DEFAULT '',
  files JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed TIMESTAMP WITH TIME ZONE
);

-- 4. USER SETTINGS TABLE (Dashboard preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  default_layers INTEGER[] DEFAULT '{}',
  auto_save BOOLEAN DEFAULT TRUE,
  notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  email_notifications BOOLEAN DEFAULT TRUE,
  webhook_notifications BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  collaboration_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. API KEYS TABLE (User API key management)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USAGE LOGS TABLE (Track API usage)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  files_processed INTEGER DEFAULT 0,
  layers_used INTEGER[] DEFAULT '{}',
  execution_time_ms INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0.000000,
  credits_used INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_timestamp ON public.analysis_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_filename ON public.analysis_history(filename);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_analyzed ON public.projects(last_analyzed DESC);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own analysis history" ON public.analysis_history
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (user_id::uuid = auth.uid()::uuid);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_history_updated_at 
  BEFORE UPDATE ON public.analysis_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON public.user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON public.api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
