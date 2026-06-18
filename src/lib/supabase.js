import { createClient } from '@supabase/supabase-js'

// Anon key is safe to expose — RLS policies control access
export const supabase = createClient(
  'https://ahecfusgkzzjpbxgvjmh.supabase.co',
  'sb_publishable_8g5OMOHCxhWTTAzvP4On4A_TC-sh19O'
)
