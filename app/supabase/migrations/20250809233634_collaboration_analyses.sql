-- ========================================
-- NEUROLINT COLLABORATION ANALYSES MIGRATION
-- ========================================
-- This migration creates the collaboration_analyses table for storing analysis results

-- 1. COLLABORATION ANALYSES TABLE (Analysis results for collaboration sessions)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_session_id ON public.collaboration_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_triggered_by ON public.collaboration_analyses(triggered_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_created_at ON public.collaboration_analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.collaboration_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "Participants can create analyses" ON public.collaboration_analyses
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid AND is_active = TRUE
    )
  );

-- Create trigger for updated_at column
CREATE TRIGGER update_collaboration_analyses_updated_at 
  BEFORE UPDATE ON public.collaboration_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for collaboration analyses
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_analyses; 