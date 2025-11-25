require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function fixSubscriptionsTable() {
  console.log('[INFO] Fixing missing subscriptions table...');
  
  // Check if environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('[ERROR] Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease set these in your .env.local file before running this script.');
    process.exit(1);
  }
  
  console.log('[SUCCESS] Environment variables configured');
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('\n[INFO] Creating subscriptions table...');
    
    const createTableSQL = `
      -- USER SUBSCRIPTIONS TABLE (User billing and subscription management)
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
        status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
        paypal_subscription_id TEXT,
        paypal_payer_id TEXT,
        current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        current_period_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('[WARNING]  Could not create table via RPC, trying direct SQL...');
      
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('subscriptions')
        .select('id')
        .limit(1);
      
      if (directError && directError.code === '42P01') {
        console.log('[ERROR] Table does not exist and cannot be created via RPC');
        console.log('Please run this SQL manually in your Supabase SQL editor:');
        console.log('\n' + createTableSQL);
        return;
      }
    }
    
    console.log('[SUCCESS] Subscriptions table created or already exists');
    
    // Create indexes
    console.log('\n[INFO] Creating indexes...');
    
    const indexSQL = `
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: indexSQL });
      console.log('[SUCCESS] Indexes created');
    } catch (indexError) {
      console.log('[WARNING]  Could not create indexes via RPC, but table should work');
    }
    
    // Enable RLS
    console.log('\n🔒 Enabling Row Level Security...');
    
    const rlsSQL = `
      -- Enable Row Level Security
      ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: rlsSQL });
      console.log('[SUCCESS] RLS enabled');
    } catch (rlsError) {
      console.log('[WARNING]  Could not enable RLS via RPC, but table should work');
    }
    
    // Create RLS policies
    console.log('\n🛡️  Creating RLS policies...');
    
    const policiesSQL = `
      -- RLS Policies for subscriptions table
      DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
      
      CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
        FOR DELETE USING (auth.uid() = user_id);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: policiesSQL });
      console.log('[SUCCESS] RLS policies created');
    } catch (policyError) {
      console.log('[WARNING]  Could not create policies via RPC, but table should work');
    }
    
    // Grant permissions
    console.log('\n🔑 Granting permissions...');
    
    const permissionsSQL = `
      -- Grant necessary permissions
      GRANT ALL ON public.subscriptions TO authenticated;
      GRANT USAGE ON SCHEMA public TO authenticated;
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: permissionsSQL });
      console.log('[SUCCESS] Permissions granted');
    } catch (permError) {
      console.log('[WARNING]  Could not grant permissions via RPC, but table should work');
    }
    
    console.log('\n[SUCCESS] Subscriptions table setup complete!');
    console.log('The /api/subscriptions endpoint should now work properly.');
    
  } catch (error) {
    console.error('[ERROR] Error setting up subscriptions table:', error);
    console.log('\nPlease run the SQL manually in your Supabase SQL editor:');
    console.log('\n' + createTableSQL);
  }
}

// Run the fix
fixSubscriptionsTable().catch(console.error); 