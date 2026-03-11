import { createClient } from '@supabase/supabase-js'

// For Lovable projects with Supabase integration, these values are automatically provided
// If running locally, you would need to set these in your environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Fallback for development - you can temporarily use demo credentials
// In production with Lovable+Supabase integration, these will be automatically configured
const defaultUrl = 'https://demo.supabase.co'
const defaultKey = 'demo-key'

export const supabase = createClient(
  supabaseUrl !== 'https://your-project.supabase.co' ? supabaseUrl : defaultUrl,
  supabaseAnonKey !== 'your-anon-key' ? supabaseAnonKey : defaultKey
)