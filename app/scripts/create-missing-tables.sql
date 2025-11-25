-- ========================================
-- CREATE MISSING COLLABORATION TABLES
-- ========================================
-- Run this script in your Supabase SQL Editor

-- 1. Create collaboration_analyses table
CREATE TABLE IF NOT EXISTS public.collaboration_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  input_code TEXT NOT NULL,
  output_code TEXT NOT NULL,
  layers_executed INTEGER[] DEFAULT '{}',
  dry_run BOOLEAN DEFAULT FALSE,
  execution_time INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT FALSE,
  analysis_results JSONB DEFAULT '{}'::jsonb,
  triggered_by UUID,
  triggered_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_session_id ON public.collaboration_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_triggered_by ON public.collaboration_analyses(triggered_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_created_at ON public.collaboration_analyses(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.collaboration_analyses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Participants can view session analyses" ON public.collaboration_analyses;
CREATE POLICY "Participants can view session analyses" ON public.collaboration_analyses
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

DROP POLICY IF EXISTS "Participants can create analyses" ON public.collaboration_analyses;
CREATE POLICY "Participants can create analyses" ON public.collaboration_analyses
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid AND is_active = TRUE
    )
  );

-- 5. Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_collaboration_analyses_updated_at ON public.collaboration_analyses;
CREATE TRIGGER update_collaboration_analyses_updated_at 
  BEFORE UPDATE ON public.collaboration_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable real-time for collaboration analyses
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_analyses;

-- 7. Verify table creation
SELECT 'collaboration_analyses table created successfully' as status; 