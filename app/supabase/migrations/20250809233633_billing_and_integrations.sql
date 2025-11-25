-- ========================================
-- NEUROLINT BILLING AND INTEGRATIONS MIGRATION
-- ========================================
-- This migration creates billing, webhook, and integration tables
-- Optimized for Vercel deployment with timeout considerations

-- 1. PROJECT SUBSCRIPTIONS TABLE (Project billing)
CREATE TABLE IF NOT EXISTS public.project_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'professional', 'business', 'enterprise')),
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'suspended', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- 2. PROJECT USAGE TABLE (Project usage tracking)
CREATE TABLE IF NOT EXISTS public.project_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_month TEXT NOT NULL,
  monthly_fix_count INTEGER DEFAULT 0,
  total_fix_count INTEGER DEFAULT 0,
  last_fix_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, current_month)
);

-- 3. BILLING CYCLES TABLE (Billing history)
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  plan TEXT NOT NULL,
  fixes_used INTEGER DEFAULT 0,
  fixes_limit INTEGER DEFAULT -1,
  cost_usd DECIMAL(10,4) DEFAULT 0.0000,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'billed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WEBHOOKS TABLE (Webhook configurations - Vercel optimized)
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  timeout_seconds INTEGER DEFAULT 10, -- Vercel function timeout consideration
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WEBHOOK EVENTS TABLE (Webhook event history)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER DEFAULT 0, -- Track processing time for Vercel optimization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INTEGRATIONS TABLE (Third-party integrations)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. INTEGRATION RUNS TABLE (Integration execution history)
CREATE TABLE IF NOT EXISTS public.integration_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  execution_time_ms INTEGER DEFAULT 0, -- Track execution time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FIX HISTORY TABLE (Code fix history)
CREATE TABLE IF NOT EXISTS public.fix_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_code TEXT NOT NULL,
  fixed_code TEXT NOT NULL,
  layers_applied INTEGER[] DEFAULT '{}',
  issues_fixed JSONB DEFAULT '[]',
  execution_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_project_id ON public.project_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_user_id ON public.project_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_usage_project_id ON public.project_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON public.billing_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_cycle_start ON public.billing_cycles(cycle_start DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON public.webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_next_retry ON public.webhook_events(next_retry) WHERE next_retry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integration_runs_integration_id ON public.integration_runs(integration_id);

CREATE INDEX IF NOT EXISTS idx_fix_history_user_id ON public.fix_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fix_history_project_id ON public.fix_history(project_id);
CREATE INDEX IF NOT EXISTS idx_fix_history_created_at ON public.fix_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fix_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own project subscriptions" ON public.project_subscriptions
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own project usage" ON public.project_usage
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can view own billing cycles" ON public.billing_cycles
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage own webhooks" ON public.webhooks
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can view own webhook events" ON public.webhook_events
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM public.webhooks 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can manage own integrations" ON public.integrations
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can view own integration runs" ON public.integration_runs
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM public.integrations 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can manage own fix history" ON public.fix_history
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

-- Create triggers for updated_at columns
CREATE TRIGGER update_project_subscriptions_updated_at 
  BEFORE UPDATE ON public.project_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_usage_updated_at 
  BEFORE UPDATE ON public.project_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at 
  BEFORE UPDATE ON public.webhooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at 
  BEFORE UPDATE ON public.integrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle webhook retries (Vercel optimized)
CREATE OR REPLACE FUNCTION process_webhook_retries()
RETURNS void AS $$
BEGIN
  -- Update webhook events that need retrying
  UPDATE public.webhook_events 
  SET 
    attempts = attempts + 1,
    next_retry = CASE 
      WHEN attempts < 3 THEN NOW() + (retry_delay_seconds || ' seconds')::interval
      ELSE NULL
    END
  WHERE 
    next_retry <= NOW() 
    AND attempts < 3
    AND response_status IS NULL OR response_status >= 400;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for webhook retries (if using pg_cron)
-- This helps with Vercel timeout issues by processing retries in the background
-- SELECT cron.schedule('webhook-retries', '*/30 * * * *', 'SELECT process_webhook_retries();');
