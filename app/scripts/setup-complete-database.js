const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupCompleteDatabase() {
  console.log('[INFO] Setting up complete Neurolint database...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  try {
    // Step 1: Create all tables
    console.log('\n[INFO] Step 1: Creating all tables...');
    
    const createTablesSQL = `
      -- ========================================
      -- NEUROLINT COMPLETE DATABASE SETUP
      -- ========================================
      
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

      -- 7. TEAMS TABLE (Team collaboration)
      CREATE TABLE IF NOT EXISTS public.teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 8. TEAM MEMBERS TABLE (Team membership)
      CREATE TABLE IF NOT EXISTS public.team_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );

      -- 9. TEAM INVITATIONS TABLE (Team invitations)
      CREATE TABLE IF NOT EXISTS public.team_invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
        inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        invitee_email TEXT NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 10. COLLABORATION SESSIONS TABLE (Real-time collaboration)
      CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        document_content TEXT,
        filename TEXT,
        language TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        participant_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT FALSE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 11. COLLABORATION PARTICIPANTS TABLE (Session participants)
      CREATE TABLE IF NOT EXISTS public.collaboration_participants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        user_name TEXT NOT NULL,
        user_color TEXT DEFAULT '#3B82F6',
        role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        left_at TIMESTAMP WITH TIME ZONE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, user_id)
      );

      -- 12. COLLABORATION COMMENTS TABLE (Session comments)
      CREATE TABLE IF NOT EXISTS public.collaboration_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT,
        line_number INTEGER,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 13. PROJECT SUBSCRIPTIONS TABLE (Project billing)
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

      -- 14. PROJECT USAGE TABLE (Project usage tracking)
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

      -- 15. BILLING CYCLES TABLE (Billing history)
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

      -- 16. WEBHOOKS TABLE (Webhook configurations)
      CREATE TABLE IF NOT EXISTS public.webhooks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT[] DEFAULT '{}',
        secret TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 17. WEBHOOK EVENTS TABLE (Webhook event history)
      CREATE TABLE IF NOT EXISTS public.webhook_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        response_status INTEGER,
        response_body TEXT,
        attempts INTEGER DEFAULT 0,
        next_retry TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 18. INTEGRATIONS TABLE (Third-party integrations)
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

      -- 19. INTEGRATION RUNS TABLE (Integration execution history)
      CREATE TABLE IF NOT EXISTS public.integration_runs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
        status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        result JSONB DEFAULT '{}'::jsonb,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 20. FIX HISTORY TABLE (Code fix history)
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
    `;

    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (tablesError) {
      console.error('[ERROR] Error creating tables:', tablesError.message);
      throw tablesError;
    }
    console.log('[SUCCESS] All tables created successfully');

    // Step 2: Create indexes
    console.log('\n[INFO] Step 2: Creating indexes...');
    
    const createIndexesSQL = `
      -- Profiles indexes
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
      CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

      -- Analysis history indexes
      CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_history_timestamp ON public.analysis_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_analysis_history_filename ON public.analysis_history(filename);

      -- Projects indexes
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_last_analyzed ON public.projects(last_analyzed DESC);

      -- User settings indexes
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

      -- API keys indexes
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

      -- Usage logs indexes
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp DESC);

      -- Teams indexes
      CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_email ON public.team_invitations(invitee_email);

      -- Collaboration indexes
      CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_user_id ON public.collaboration_sessions(host_user_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_is_active ON public.collaboration_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session_id ON public.collaboration_participants(session_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user_id ON public.collaboration_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_is_active ON public.collaboration_participants(is_active);
      CREATE INDEX IF NOT EXISTS idx_collaboration_comments_session_id ON public.collaboration_comments(session_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_comments_user_id ON public.collaboration_comments(user_id);

      -- Billing indexes
      CREATE INDEX IF NOT EXISTS idx_project_subscriptions_project_id ON public.project_subscriptions(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_subscriptions_user_id ON public.project_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_project_usage_project_id ON public.project_usage(project_id);
      CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON public.billing_cycles(user_id);
      CREATE INDEX IF NOT EXISTS idx_billing_cycles_cycle_start ON public.billing_cycles(cycle_start DESC);

      -- Webhook indexes
      CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON public.webhook_events(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

      -- Integration indexes
      CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);
      CREATE INDEX IF NOT EXISTS idx_integration_runs_integration_id ON public.integration_runs(integration_id);

      -- Fix history indexes
      CREATE INDEX IF NOT EXISTS idx_fix_history_user_id ON public.fix_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_fix_history_project_id ON public.fix_history(project_id);
      CREATE INDEX IF NOT EXISTS idx_fix_history_created_at ON public.fix_history(created_at DESC);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    if (indexesError) {
      console.error('[ERROR] Error creating indexes:', indexesError.message);
      throw indexesError;
    }
    console.log('[SUCCESS] All indexes created successfully');

    // Step 3: Enable Row Level Security
    console.log('\n🔒 Step 3: Enabling Row Level Security...');
    
    const enableRLSSQL = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_usage ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.fix_history ENABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    if (rlsError) {
      console.error('[ERROR] Error enabling RLS:', rlsError.message);
      throw rlsError;
    }
    console.log('[SUCCESS] Row Level Security enabled for all tables');

    // Step 4: Create RLS Policies
    console.log('\n🛡️  Step 4: Creating RLS policies...');
    
    const createPoliciesSQL = `
      -- Profiles policies
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (id::uuid = auth.uid()::uuid);

      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (id::uuid = auth.uid()::uuid);

      DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
      CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT WITH CHECK (id::uuid = auth.uid()::uuid);

      -- Analysis history policies
      DROP POLICY IF EXISTS "Users can manage own analysis history" ON public.analysis_history;
      CREATE POLICY "Users can manage own analysis history" ON public.analysis_history
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Projects policies
      DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
      CREATE POLICY "Users can manage own projects" ON public.projects
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- User settings policies
      DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
      CREATE POLICY "Users can manage own settings" ON public.user_settings
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- API keys policies
      DROP POLICY IF EXISTS "Users can manage own API keys" ON public.api_keys;
      CREATE POLICY "Users can manage own API keys" ON public.api_keys
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Usage logs policies
      DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can view own usage logs" ON public.usage_logs
        FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

      DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
        FOR INSERT WITH CHECK (user_id::uuid = auth.uid()::uuid);

      -- Teams policies (fixed to avoid infinite recursion)
      DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
      CREATE POLICY "Users can view teams they are members of" ON public.teams
        FOR SELECT USING (
          owner_id::uuid = auth.uid()::uuid OR
          id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id::uuid = auth.uid()::uuid
          )
        );

      DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
      CREATE POLICY "Team owners can update their teams" ON public.teams
        FOR UPDATE USING (owner_id::uuid = auth.uid()::uuid);

      DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
      CREATE POLICY "Team owners can delete their teams" ON public.teams
        FOR DELETE USING (owner_id::uuid = auth.uid()::uuid);

      DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
      CREATE POLICY "Users can create teams" ON public.teams
        FOR INSERT WITH CHECK (owner_id::uuid = auth.uid()::uuid);

      -- Team members policies (fixed to avoid infinite recursion)
      DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
      CREATE POLICY "Team members can view team membership" ON public.team_members
        FOR SELECT USING (
          user_id::uuid = auth.uid()::uuid OR
          team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id::uuid = auth.uid()::uuid
          )
        );

      DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
      CREATE POLICY "Team owners can manage team members" ON public.team_members
        FOR ALL USING (
          team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id::uuid = auth.uid()::uuid
          )
        );

      -- Team invitations policies
      DROP POLICY IF EXISTS "Users can manage team invitations" ON public.team_invitations;
      CREATE POLICY "Users can manage team invitations" ON public.team_invitations
        FOR ALL USING (
          inviter_id::uuid = auth.uid()::uuid OR
          team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id::uuid = auth.uid()::uuid
          )
        );

      -- Collaboration sessions policies
      DROP POLICY IF EXISTS "Users can view sessions they participate in" ON public.collaboration_sessions;
      CREATE POLICY "Users can view sessions they participate in" ON public.collaboration_sessions
        FOR SELECT USING (
          host_user_id::uuid = auth.uid()::uuid OR
          is_public = TRUE OR
          id IN (
            SELECT session_id FROM public.collaboration_participants 
            WHERE user_id::uuid = auth.uid()::uuid
          )
        );

      DROP POLICY IF EXISTS "Session hosts can manage their sessions" ON public.collaboration_sessions;
      CREATE POLICY "Session hosts can manage their sessions" ON public.collaboration_sessions
        FOR ALL USING (host_user_id::uuid = auth.uid()::uuid);

      -- Collaboration participants policies (fixed to avoid infinite recursion)
      DROP POLICY IF EXISTS "Participants can view session participants" ON public.collaboration_participants;
      CREATE POLICY "Participants can view session participants" ON public.collaboration_participants
        FOR SELECT USING (
          user_id::uuid = auth.uid()::uuid OR
          session_id IN (
            SELECT id FROM public.collaboration_sessions 
            WHERE host_user_id::uuid = auth.uid()::uuid OR is_public = TRUE
          )
        );

      DROP POLICY IF EXISTS "Session hosts can manage participants" ON public.collaboration_participants;
      CREATE POLICY "Session hosts can manage participants" ON public.collaboration_participants
        FOR ALL USING (
          session_id IN (
            SELECT id FROM public.collaboration_sessions 
            WHERE host_user_id::uuid = auth.uid()::uuid
          )
        );

      DROP POLICY IF EXISTS "Users can manage their own participation" ON public.collaboration_participants;
      CREATE POLICY "Users can manage their own participation" ON public.collaboration_participants
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Collaboration comments policies
      DROP POLICY IF EXISTS "Participants can view session comments" ON public.collaboration_comments;
      CREATE POLICY "Participants can view session comments" ON public.collaboration_comments
        FOR SELECT USING (
          session_id IN (
            SELECT id FROM public.collaboration_sessions 
            WHERE host_user_id::uuid = auth.uid()::uuid OR is_public = TRUE
          ) OR
          session_id IN (
            SELECT session_id FROM public.collaboration_participants 
            WHERE user_id::uuid = auth.uid()::uuid
          )
        );

      DROP POLICY IF EXISTS "Participants can create comments" ON public.collaboration_comments;
      CREATE POLICY "Participants can create comments" ON public.collaboration_comments
        FOR INSERT WITH CHECK (
          user_id::uuid = auth.uid()::uuid AND
          session_id IN (
            SELECT session_id FROM public.collaboration_participants 
            WHERE user_id::uuid = auth.uid()::uuid AND is_active = TRUE
          )
        );

      DROP POLICY IF EXISTS "Comment authors can update their comments" ON public.collaboration_comments;
      CREATE POLICY "Comment authors can update their comments" ON public.collaboration_comments
        FOR UPDATE USING (user_id::uuid = auth.uid()::uuid);

      -- Project subscriptions policies
      DROP POLICY IF EXISTS "Users can manage own project subscriptions" ON public.project_subscriptions;
      CREATE POLICY "Users can manage own project subscriptions" ON public.project_subscriptions
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Project usage policies
      DROP POLICY IF EXISTS "Users can manage own project usage" ON public.project_usage;
      CREATE POLICY "Users can manage own project usage" ON public.project_usage
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Billing cycles policies
      DROP POLICY IF EXISTS "Users can view own billing cycles" ON public.billing_cycles;
      CREATE POLICY "Users can view own billing cycles" ON public.billing_cycles
        FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

      -- Webhooks policies
      DROP POLICY IF EXISTS "Users can manage own webhooks" ON public.webhooks;
      CREATE POLICY "Users can manage own webhooks" ON public.webhooks
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Webhook events policies
      DROP POLICY IF EXISTS "Users can view own webhook events" ON public.webhook_events;
      CREATE POLICY "Users can view own webhook events" ON public.webhook_events
        FOR SELECT USING (
          webhook_id IN (
            SELECT id FROM public.webhooks 
            WHERE user_id::uuid = auth.uid()::uuid
          )
        );

      -- Integrations policies
      DROP POLICY IF EXISTS "Users can manage own integrations" ON public.integrations;
      CREATE POLICY "Users can manage own integrations" ON public.integrations
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);

      -- Integration runs policies
      DROP POLICY IF EXISTS "Users can view own integration runs" ON public.integration_runs;
      CREATE POLICY "Users can view own integration runs" ON public.integration_runs
        FOR SELECT USING (
          integration_id IN (
            SELECT id FROM public.integrations 
            WHERE user_id::uuid = auth.uid()::uuid
          )
        );

      -- Fix history policies
      DROP POLICY IF EXISTS "Users can manage own fix history" ON public.fix_history;
      CREATE POLICY "Users can manage own fix history" ON public.fix_history
        FOR ALL USING (user_id::uuid = auth.uid()::uuid);
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (policiesError) {
      console.error('[ERROR] Error creating policies:', policiesError.message);
      throw policiesError;
    }
    console.log('[SUCCESS] All RLS policies created successfully');

    // Step 5: Create triggers
    console.log('\n⚡ Step 5: Creating triggers...');
    
    const createTriggersSQL = `
      -- Update timestamp trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for all tables with updated_at columns
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
      CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_analysis_history_updated_at ON public.analysis_history;
      CREATE TRIGGER update_analysis_history_updated_at 
        BEFORE UPDATE ON public.analysis_history 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
      CREATE TRIGGER update_projects_updated_at 
        BEFORE UPDATE ON public.projects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
      CREATE TRIGGER update_user_settings_updated_at 
        BEFORE UPDATE ON public.user_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;
      CREATE TRIGGER update_api_keys_updated_at 
        BEFORE UPDATE ON public.api_keys 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
      CREATE TRIGGER update_teams_updated_at 
        BEFORE UPDATE ON public.teams 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON public.team_invitations;
      CREATE TRIGGER update_team_invitations_updated_at 
        BEFORE UPDATE ON public.team_invitations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_collaboration_sessions_updated_at ON public.collaboration_sessions;
      CREATE TRIGGER update_collaboration_sessions_updated_at 
        BEFORE UPDATE ON public.collaboration_sessions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_collaboration_comments_updated_at ON public.collaboration_comments;
      CREATE TRIGGER update_collaboration_comments_updated_at 
        BEFORE UPDATE ON public.collaboration_comments 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_project_subscriptions_updated_at ON public.project_subscriptions;
      CREATE TRIGGER update_project_subscriptions_updated_at 
        BEFORE UPDATE ON public.project_subscriptions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_project_usage_updated_at ON public.project_usage;
      CREATE TRIGGER update_project_usage_updated_at 
        BEFORE UPDATE ON public.project_usage 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
      CREATE TRIGGER update_webhooks_updated_at 
        BEFORE UPDATE ON public.webhooks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
      CREATE TRIGGER update_integrations_updated_at 
        BEFORE UPDATE ON public.integrations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: triggersError } = await supabase.rpc('exec_sql', { sql: createTriggersSQL });
    if (triggersError) {
      console.error('[ERROR] Error creating triggers:', triggersError.message);
      throw triggersError;
    }
    console.log('[SUCCESS] All triggers created successfully');

    // Step 6: Enable real-time for collaboration tables
    console.log('\n🔄 Step 6: Enabling real-time...');
    
    const enableRealtimeSQL = `
      ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
      ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_participants;
      ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_comments;
      ALTER PUBLICATION supabase_realtime ADD TABLE teams;
      ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
    `;

    const { error: realtimeError } = await supabase.rpc('exec_sql', { sql: enableRealtimeSQL });
    if (realtimeError) {
      console.log('[WARNING]  Warning: Could not enable real-time (this is normal for new databases):', realtimeError.message);
    } else {
      console.log('[SUCCESS] Real-time enabled for collaboration tables');
    }

    console.log('\n[SUCCESS] Database setup completed successfully!');
    console.log('\n[INFO] Summary of created tables:');
    console.log('   • profiles (user profiles and subscriptions)');
    console.log('   • analysis_history (analysis results)');
    console.log('   • projects (user projects)');
    console.log('   • user_settings (dashboard preferences)');
    console.log('   • api_keys (API key management)');
    console.log('   • usage_logs (API usage tracking)');
    console.log('   • teams (team collaboration)');
    console.log('   • team_members (team membership)');
    console.log('   • team_invitations (team invitations)');
    console.log('   • collaboration_sessions (real-time sessions)');
    console.log('   • collaboration_participants (session participants)');
    console.log('   • collaboration_comments (session comments)');
    console.log('   • project_subscriptions (project billing)');
    console.log('   • project_usage (usage tracking)');
    console.log('   • billing_cycles (billing history)');
    console.log('   • webhooks (webhook configurations)');
    console.log('   • webhook_events (webhook history)');
    console.log('   • integrations (third-party integrations)');
    console.log('   • integration_runs (integration history)');
    console.log('   • fix_history (code fix history)');
    
    console.log('\n[INFO] All tables include:');
    console.log('   • Proper indexes for performance');
    console.log('   • Row Level Security (RLS) enabled');
    console.log('   • RLS policies for data protection');
    console.log('   • Automatic timestamp updates');
    console.log('   • Real-time subscriptions (where applicable)');

  } catch (error) {
    console.error('[ERROR] Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupCompleteDatabase(); 